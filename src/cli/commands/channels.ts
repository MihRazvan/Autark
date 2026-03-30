/**
 * Channels command - Inspect mutable channel subdomains and their targets
 */

import { createPublicClient, encodeFunctionData, http, parseAbi, type Address } from 'viem'
import { namehash, normalize } from 'viem/ens'
import { sepolia, mainnet } from 'viem/chains'
import { Logger } from '../../lib/logger.js'
import { loadConfig, type Config } from '../../lib/config.js'
import { PUBLIC_RESOLVER_ADDRESS } from '../../lib/ens/ens.js'
import { detectNextVersion, getSubdomainInfo } from '../../lib/ens/version.js'
import { getContenthash } from '../../lib/ens/contenthash.js'
import { NAME_WRAPPER_ADDRESS } from '../../lib/ens/namewrapper/wrapper.js'
import { FUSES } from '../../lib/ens/namewrapper/fuses.js'
import { initSafeClient, sendSafeTransaction, getSafeTransactionUrl } from '../../lib/safe/client.js'
import { ConfigError } from '../../lib/errors.js'

const DEFAULT_CHANNELS = ['live', 'staging', 'canary'] as const
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60

const wrapperAbi = parseAbi([
  'function setSubnodeRecord(bytes32 parentNode, string label, address owner, address resolver, uint64 ttl, uint32 fuses, uint64 expiry) external returns (bytes32)',
])

export interface ChannelsOptions extends Partial<Config> {
  channels?: string
  create?: string | boolean
  dryRun?: boolean
  resolveVersions?: boolean
}

function parseChannelList(raw?: string): string[] {
  const values = raw
    ? raw.split(',').map(v => v.trim()).filter(Boolean)
    : [...DEFAULT_CHANNELS]

  return [...new Set(values)]
}

function toFqdn(channel: string, parentDomain: string): string {
  if (channel.includes('.')) return channel
  return `${channel}.${parentDomain}`
}

function resolveCreateChannels(options: ChannelsOptions): string[] {
  if (typeof options.create === 'string') {
    return parseChannelList(options.create)
  }

  return parseChannelList(options.channels)
}

function getDirectLabel(domain: string, parentDomain: string): string {
  const suffix = `.${parentDomain}`
  if (!domain.endsWith(suffix)) {
    throw new ConfigError(
      `Channel "${domain}" is outside parent domain "${parentDomain}". ` +
      `Use direct children like "live" or "live.${parentDomain}".`
    )
  }

  const label = domain.slice(0, -suffix.length)
  if (!label || label.includes('.')) {
    throw new ConfigError(
      `Channel "${domain}" is not a direct child of "${parentDomain}". ` +
      `Only one-label channels are supported by --create.`
    )
  }

  return label
}

/**
 * List mutable channels and their current content targets
 */
export async function channelsCommand(options: ChannelsOptions): Promise<void> {
  const logger = new Logger({ quiet: options.quiet, debug: options.debug })

  logger.header('AUTARK')
  logger.newline()

  try {
    const config = loadConfig(options)

    if (!config.ensDomain || !config.rpcUrl) {
      logger.error('Missing required config: ensDomain and rpcUrl')
      logger.log('Set via --ens-domain and --rpc-url or config file')
      process.exit(1)
    }

    const chain = config.network === 'mainnet' ? mainnet : sepolia
    const publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    })
    const resolverAddress = PUBLIC_RESOLVER_ADDRESS[config.network] as Address
    const createMode = options.create !== undefined && options.create !== false

    const channelInputs = createMode
      ? resolveCreateChannels(options)
      : parseChannelList(options.channels)
    const channelDomains = channelInputs.map(ch => toFqdn(ch, config.ensDomain!))

    logger.section('Configuration')
    logger.table({
      'Network': config.network,
      'Parent Domain': config.ensDomain,
      'Channels': channelDomains.join(', '),
      'Create Missing': createMode,
      'Dry Run': options.dryRun || false,
      'Resolve Versions': options.resolveVersions !== false,
    })
    logger.newline()

    let safeClient: any | undefined
    if (createMode) {
      if (!config.safeAddress || !config.ownerPrivateKey || !config.safeApiKey) {
        throw new ConfigError(
          'Missing required configuration for --create: safeAddress, ownerPrivateKey, safeApiKey\n' +
          'Provide via CLI flags, environment variables, or config file.'
        )
      }

      const parentInfo = await getSubdomainInfo(config.ensDomain, publicClient, chain.id)
      if (!parentInfo.exists) {
        throw new ConfigError(`Parent domain is not wrapped or does not exist: ${config.ensDomain}`)
      }
      if (parentInfo.owner.toLowerCase() !== config.safeAddress.toLowerCase()) {
        throw new ConfigError(
          `Parent domain owner is not your configured Safe.\n` +
          `  Parent owner: ${parentInfo.owner}\n` +
          `  Config Safe:  ${config.safeAddress}\n` +
          `Transfer parent domain ownership to Safe before using --create.`
        )
      }

      logger.section('Create Preconditions')
      logger.success(`Parent domain is Safe-owned: ${config.ensDomain}`)
      logger.log(`  Safe: ${config.safeAddress}`)
      logger.newline()

      if (!options.dryRun) {
        safeClient = await initSafeClient({
          safeAddress: config.safeAddress as Address,
          signerPrivateKey: config.ownerPrivateKey as `0x${string}`,
          rpcUrl: config.rpcUrl,
          apiKey: config.safeApiKey,
        })
      }
    }

    const versionByContenthash = new Map<string, string>()

    if (options.resolveVersions !== false) {
      logger.section('Version Index')
      const { existing } = await detectNextVersion(config.ensDomain, publicClient, chain.id)

      for (const versionLabel of existing) {
        const versionDomain = `${versionLabel}.${config.ensDomain}`
        const versionContent = await getContenthash(versionDomain, resolverAddress, publicClient)
        if (versionContent.type !== 'empty') {
          versionByContenthash.set(versionContent.contenthash.toLowerCase(), versionDomain)
        }
      }

      logger.log(`Indexed versions: ${existing.length}`)
      logger.newline()
    }

    logger.section('Channels')

    for (const channelDomain of channelDomains) {
      logger.log(channelDomain)

      const info = await getSubdomainInfo(channelDomain, publicClient, chain.id)
      if (!info.exists) {
        logger.warn('  Missing / not wrapped')

        if (createMode) {
          const channelLabel = getDirectLabel(channelDomain, config.ensDomain)
          const parentNode = namehash(normalize(config.ensDomain))
          const expiry = Math.floor(Date.now() / 1000) + ONE_YEAR_SECONDS

          const mutableChannelFuses = FUSES.CANNOT_UNWRAP | FUSES.CAN_EXTEND_EXPIRY

          const createSubnodeData = encodeFunctionData({
            abi: wrapperAbi,
            functionName: 'setSubnodeRecord',
            args: [
              parentNode,
              channelLabel,
              config.safeAddress as Address,
              resolverAddress,
              BigInt(0),
              mutableChannelFuses,
              BigInt(expiry),
            ],
          })

          if (options.dryRun) {
            logger.log(`  [dry-run] Would create channel: ${channelDomain}`)
            logger.log(`  [dry-run] Fuses: ${mutableChannelFuses}`)
            logger.log(`  [dry-run] Expiry: ${new Date(expiry * 1000).toISOString()}`)
            logger.log(`  [dry-run] To: ${NAME_WRAPPER_ADDRESS[chain.id] as Address}`)
          } else {
            const txResult = await sendSafeTransaction(safeClient, {
              to: NAME_WRAPPER_ADDRESS[chain.id] as Address,
              value: '0',
              data: createSubnodeData,
            })

            logger.success('  Safe proposal created for channel creation')
            if (txResult.safeTxHash) {
              logger.log(`    Safe TX Hash: ${txResult.safeTxHash}`)
            }
            logger.log(`    Safe UI: ${getSafeTransactionUrl(config.safeAddress as Address, chain.id)}`)
          }
        }

        logger.newline()
        continue
      }

      logger.log(`  Owner: ${info.owner}`)
      logger.log(`  Fuses: ${info.fuses}`)
      logger.log(`  Expiry: ${new Date(Number(info.expiry) * 1000).toISOString()}`)

      const content = await getContenthash(channelDomain, resolverAddress, publicClient)
      if (content.type === 'empty') {
        logger.warn('  Contenthash: empty')
        logger.newline()
        continue
      }

      logger.log(`  Contenthash: ${content.contenthash}`)
      logger.log(`  Type: ${content.type.toUpperCase()}`)
      if (content.cid) {
        logger.log(`  CID: ${content.cid}`)
      }

      if (options.resolveVersions !== false) {
        const matchedVersion = versionByContenthash.get(content.contenthash.toLowerCase())
        if (matchedVersion) {
          logger.success(`  Points to version: ${matchedVersion}`)
        } else {
          logger.log('  Points to: custom content (no matching vN found)')
        }
      }

      logger.newline()
    }
  } catch (error: any) {
    logger.error('Failed to list channels')
    logger.error(error.message || 'Unknown error')
    process.exit(1)
  }
}
