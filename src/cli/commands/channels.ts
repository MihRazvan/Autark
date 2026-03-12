/**
 * Channels command - Inspect mutable channel subdomains and their targets
 */

import { createPublicClient, http, type Address } from 'viem'
import { sepolia, mainnet } from 'viem/chains'
import { Logger } from '../../lib/logger.js'
import { loadConfig, type Config } from '../../lib/config.js'
import { PUBLIC_RESOLVER_ADDRESS } from '../../lib/ens/ens.js'
import { detectNextVersion, getSubdomainInfo } from '../../lib/ens/version.js'
import { getContenthash } from '../../lib/ens/contenthash.js'

const DEFAULT_CHANNELS = ['live', 'staging', 'canary'] as const

export interface ChannelsOptions extends Partial<Config> {
  channels?: string
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

    const channelInputs = parseChannelList(options.channels)
    const channelDomains = channelInputs.map(ch => toFqdn(ch, config.ensDomain!))

    logger.section('Configuration')
    logger.table({
      'Network': config.network,
      'Parent Domain': config.ensDomain,
      'Channels': channelDomains.join(', '),
      'Resolve Versions': options.resolveVersions !== false,
    })
    logger.newline()

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

