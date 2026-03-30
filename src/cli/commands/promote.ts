/**
 * Promote command - Point mutable channel domain to an immutable version via Safe
 */

import { createPublicClient, encodeFunctionData, http, parseAbi, type Address } from 'viem'
import { normalize, namehash } from 'viem/ens'
import { sepolia, mainnet } from 'viem/chains'
import { Logger } from '../../lib/logger.js'
import { loadConfig, type Config } from '../../lib/config.js'
import { PUBLIC_RESOLVER_ADDRESS } from '../../lib/ens/ens.js'
import { getSubdomainInfo } from '../../lib/ens/version.js'
import { getContenthash } from '../../lib/ens/contenthash.js'
import { initSafeClient, sendSafeTransaction, getSafeTransactionUrl } from '../../lib/safe/client.js'
import { ConfigError, DeployError } from '../../lib/errors.js'
import { getIPFSUrls } from '../../lib/ipfs/upload.js'

const resolverAbi = parseAbi([
  'function setContenthash(bytes32 node, bytes contenthash)',
])

export interface PromoteOptions extends Partial<Config> {
  to: string
  channel?: string
  dryRun?: boolean
}

function resolveDomain(input: string, ensDomain?: string, kind: 'channel' | 'target' = 'target'): string {
  if (input.includes('.')) return input

  if (!ensDomain) {
    throw new ConfigError(
      `Missing ensDomain for ${kind} resolution. ` +
      `Provide --ens-domain, config value, or pass fully qualified domain names.`
    )
  }

  return `${input}.${ensDomain}`
}

/**
 * Promote immutable version to mutable channel by updating channel contenthash
 */
export async function promoteCommand(options: PromoteOptions): Promise<void> {
  const logger = new Logger({ quiet: options.quiet, debug: options.debug })

  logger.header('AUTARK')
  logger.newline()

  try {
    const config = loadConfig(options)

    if (!config.safeAddress || !config.ownerPrivateKey || !config.rpcUrl || !config.safeApiKey) {
      throw new ConfigError(
        'Missing required configuration: safeAddress, ownerPrivateKey, rpcUrl, safeApiKey\n' +
        'Provide via CLI flags, environment variables, or config file.'
      )
    }

    const chain = config.network === 'mainnet' ? mainnet : sepolia
    const publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    })

    const channelDomain = resolveDomain(options.channel || 'live', config.ensDomain, 'channel')
    const targetDomain = resolveDomain(options.to, config.ensDomain, 'target')
    const resolverAddress = PUBLIC_RESOLVER_ADDRESS[config.network] as Address

    logger.section('📋 Promotion Configuration')
    logger.table({
      'Network': config.network,
      'Safe Address': config.safeAddress,
      'Resolver': resolverAddress,
      'Channel': channelDomain,
      'Target': targetDomain,
    })
    logger.newline()

    logger.section('🔍 Step 1: Verify Target')
    const targetInfo = await getSubdomainInfo(targetDomain, publicClient, chain.id)

    if (!targetInfo.exists) {
      throw new ConfigError(`Target domain does not exist or is not wrapped: ${targetDomain}`)
    }

    const targetContenthash = await getContenthash(targetDomain, resolverAddress, publicClient)

    if (targetContenthash.type === 'empty') {
      throw new ConfigError(`Target domain has no contenthash set: ${targetDomain}`)
    }

    logger.success(`Target exists: ${targetDomain}`)
    logger.log(`  Owner: ${targetInfo.owner}`)
    logger.log(`  Contenthash: ${targetContenthash.contenthash}`)
    if (targetContenthash.cid) {
      logger.log(`  CID: ${targetContenthash.cid}`)
    }
    logger.newline()

    logger.section('🔍 Step 2: Verify Channel')
    const channelInfo = await getSubdomainInfo(channelDomain, publicClient, chain.id)

    if (!channelInfo.exists) {
      throw new ConfigError(
        `Channel domain does not exist or is not wrapped: ${channelDomain}\n` +
        `Create the channel subdomain first and set owner to your Safe: ${config.safeAddress}`
      )
    }

    if (channelInfo.owner.toLowerCase() !== config.safeAddress.toLowerCase()) {
      throw new ConfigError(
        `Channel owner is not your configured Safe.\n` +
        `  Channel owner: ${channelInfo.owner}\n` +
        `  Config Safe:   ${config.safeAddress}\n` +
        `Transfer channel ownership to Safe before promoting.`
      )
    }

    logger.success(`Channel verified: ${channelDomain}`)
    logger.log(`  Owner: ${channelInfo.owner}`)
    logger.newline()

    logger.section('🔍 Step 3: Current Channel State')
    const currentChannelContenthash = await getContenthash(channelDomain, resolverAddress, publicClient)
    if (currentChannelContenthash.type === 'empty') {
      logger.warn('Channel currently has no contenthash set')
    } else {
      logger.log(`Current contenthash: ${currentChannelContenthash.contenthash}`)
      if (currentChannelContenthash.cid) {
        logger.log(`  Current CID: ${currentChannelContenthash.cid}`)
      }
    }
    logger.newline()

    logger.section('📝 Step 4: Build Promotion Transaction')
    const channelNode = namehash(normalize(channelDomain))

    const setContenthashData = encodeFunctionData({
      abi: resolverAbi,
      functionName: 'setContenthash',
      args: [channelNode, targetContenthash.contenthash],
    })

    logger.success('Promotion transaction encoded')
    logger.log(`  Function: setContenthash(${channelDomain}, <target-contenthash>)`)
    logger.log(`  Data: ${setContenthashData.slice(0, 24)}...`)
    logger.newline()

    if (options.dryRun) {
      logger.section('🔍 DRY RUN - Preview')
      logger.log('Promotion proposal preview:')
      logger.log(`  Channel: ${channelDomain}`)
      logger.log(`  Target: ${targetDomain}`)
      logger.log(`  New contenthash: ${targetContenthash.contenthash}`)
      logger.newline()
      logger.log('Run without --dry-run to create the Safe proposal.')
      return
    }

    logger.section('✅ Step 5: Create Safe Proposal')
    const safeClient = await initSafeClient({
      safeAddress: config.safeAddress as Address,
      signerPrivateKey: config.ownerPrivateKey as `0x${string}`,
      rpcUrl: config.rpcUrl,
      apiKey: config.safeApiKey,
    })

    const spinner = logger.spinner('Submitting promotion transaction to Safe...')
    spinner.start()

    const result = await sendSafeTransaction(safeClient, {
      to: resolverAddress,
      value: '0',
      data: setContenthashData,
    })

    spinner.succeed('Promotion proposal submitted')
    logger.newline()

    logger.successBanner('PROMOTION PROPOSAL CREATED')
    logger.newline()
    logger.success(`Channel: ${channelDomain}`)
    logger.log(`  Target: ${targetDomain}`)
    logger.log(`  Safe TX Hash: ${result.safeTxHash || 'N/A'}`)
    logger.newline()

    logger.warn('⚠️  Action Required: Approve & Execute')
    logger.log(`  1. Open Safe UI: ${getSafeTransactionUrl(config.safeAddress as Address, chain.id)}`)
    logger.log(`  2. Review transaction: setContenthash(${channelDomain})`)
    logger.log(`  3. Approve and execute with threshold signers`)
    logger.newline()

    logger.log('After execution:')
    if (targetContenthash.cid) {
      const urls = getIPFSUrls(targetContenthash.cid, channelDomain)
      logger.log(`  ${urls[0]} ✅ (works immediately)`)
      for (let i = 1; i < urls.length; i++) {
        logger.log(`  ${urls[i]}`)
      }
    } else {
      logger.log(`  ${channelDomain} will point to ${targetDomain}'s contenthash.`)
    }
    logger.newline()
  } catch (error: any) {
    logger.error('Promotion failed')
    if (error instanceof DeployError) {
      logger.error(error.message)
      if (error.code) {
        logger.log(`  Error code: ${error.code}`)
      }
    } else {
      logger.error(error.message || 'Unknown error')
    }
    process.exit(1)
  }
}
