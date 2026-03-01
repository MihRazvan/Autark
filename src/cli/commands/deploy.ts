/**
 * Deploy command - Main deployment workflow
 */

import { createPublicClient, http, type Address } from 'viem'
import { sepolia, mainnet } from 'viem/chains'
import { Logger } from '../../lib/logger.js'
import { loadConfig, validateDeployConfig, type Config } from '../../lib/config.js'
import { uploadToIPFS, getIPFSUrls } from '../../lib/ipfs/upload.js'
import { calculateBuildHash, formatHash, formatSize } from '../../lib/hash/build.js'
import { getFullCommitInfo, isWorkingDirectoryClean } from '../../lib/git/commit.js'
import { detectNextVersion, buildFullDomain, getSubdomainInfo } from '../../lib/ens/version.js'
import { createDeploymentPlan } from '../../lib/ens/deploy.js'
import { createSubdomainDirect } from '../../lib/ens/execute.js'
import { checkParentFuses, burnParentFuses } from '../../lib/ens/fuses-check.js'
import { initSafeClient, sendSafeTransaction, getSafeTransactionUrl } from '../../lib/safe/client.js'
import { generateSafeDescription } from '../../lib/safe/metadata.js'
import { encodeSafeBatchDeploy, submitToSafeService, getSafeServiceUrl } from '../../lib/ens/safe-batch-deploy.js'
import { DeployError, GitError } from '../../lib/errors.js'
import * as readline from 'readline/promises'

export interface DeployOptions extends Partial<Config> {
  directory: string
  skipGitCheck?: boolean
  dryRun?: boolean
  safeOwnsParent?: boolean
}

/**
 * Main deploy command
 */
export async function deployCommand(options: DeployOptions): Promise<void> {
  const logger = new Logger({ quiet: options.quiet, debug: options.debug })

  logger.header('AUTARK')
  logger.newline()

  try {
    // Load and validate config
    const config = loadConfig(options)
    validateDeployConfig(config)

    // Display configuration
    logger.section('📋 Configuration')
    logger.table({
      'Network': config.network,
      'Parent Domain': config.ensDomain!,
      'Safe Address': config.safeAddress!,
      'Build Directory': options.directory,
    })
    logger.newline()

    // Step 1: Calculate build hash
    logger.section('🔐 Step 1: Calculate Build Hash')
    const buildHash = calculateBuildHash(options.directory)
    logger.success(`Build hash: ${formatHash(buildHash.hash)}...`)
    logger.log(`  Files: ${buildHash.fileCount}, Size: ${formatSize(buildHash.totalSize)}`)
    logger.newline()

    // Step 2: Get Git commit info
    logger.section('🔖 Step 2: Git Commit Info')
    let commitInfo
    try {
      commitInfo = getFullCommitInfo(process.cwd())
      logger.success(`Commit: ${commitInfo.shortHash} - ${commitInfo.message.split('\n')[0]}`)
      logger.log(`  Author: ${commitInfo.author.name}`)
      if (commitInfo.url) {
        logger.log(`  URL: ${commitInfo.url}`)
      }

      // Warn if working directory is not clean
      if (!isWorkingDirectoryClean() && !options.skipGitCheck) {
        logger.warn('Working directory has uncommitted changes')
        logger.log('  Consider committing changes first or use --skip-git-check')
      }
    } catch (error) {
      if (error instanceof GitError) {
        logger.warn('Not a git repository - deployment will proceed without commit info')
      } else {
        throw error
      }
    }
    logger.newline()

    // Step 3: Upload to IPFS
    logger.section('📦 Step 3: Upload to IPFS')
    const ipfsResult = await uploadToIPFS(options.directory, logger)
    logger.log(`  CID: ${ipfsResult.cid}`)
    logger.log(`  URL: ${ipfsResult.url}`)
    logger.newline()

    // Step 4: Initialize clients
    logger.section('🔌 Step 4: Initialize Clients')
    const chain = config.network === 'mainnet' ? mainnet : sepolia
    const publicClient = createPublicClient({
      chain,
      transport: http(config.rpcUrl),
    })
    logger.success('Public client initialized')

    const safeClient = await initSafeClient({
      safeAddress: config.safeAddress!,
      signerPrivateKey: config.ownerPrivateKey!,
      rpcUrl: config.rpcUrl!,
      apiKey: config.safeApiKey,
    })
    logger.success('Safe client initialized')
    logger.newline()

    // Step 5: Detect next version
    logger.section('🔍 Step 5: Detect Next Version')
    const { version, existing } = await detectNextVersion(
      config.ensDomain!,
      publicClient,
      chain.id
    )

    if (existing.length > 0) {
      logger.log(`  Existing: ${existing.slice(-3).join(', ')}`)
    }
    logger.success(`Next version: v${version}`)

    const fullDomain = buildFullDomain(version, config.ensDomain!)
    logger.log(`  Full domain: ${fullDomain}`)
    logger.newline()

    // Step 6: Create deployment plan
    logger.section('📝 Step 6: Create Deployment Plan')
    const plan = createDeploymentPlan(
      config.ensDomain!,
      `v${version}`,
      ipfsResult.cid,
      config.safeAddress!,
      chain.id,
      config.network
    )
    logger.success('Deployment plan created')
    logger.log(`  Domain: ${plan.fullDomain}`)
    logger.log(`  CID: ${plan.cid}`)
    logger.log(`  Content-hash: ${plan.contentHash.slice(0, 20)}...`)
    logger.newline()

    // Generate enhanced metadata
    const metadata = generateSafeDescription({
      domain: fullDomain,
      cid: ipfsResult.cid,
      commit: commitInfo,
      buildHash,
      timestamp: new Date().toISOString(),
    })

    if (options.debug) {
      logger.section('📋 Safe Transaction Metadata')
      logger.log(metadata)
      logger.newline()
    }

    if (options.dryRun) {
      logger.section('🔍 DRY RUN - Preview')
      logger.log('')
      logger.log('This deployment would:')
      logger.log(`  1. Create subdomain: ${fullDomain}`)
      logger.log(`  2. Set content-hash to: ${ipfsResult.cid}`)
      logger.log(`  3. Apply immutable fuses`)
      logger.log('')
      logger.log('Preview URLs:')
      for (const url of getIPFSUrls(ipfsResult.cid, fullDomain)) {
        logger.log(`  ${url}`)
      }
      logger.newline()
      logger.log('Run without --dry-run to execute')
      return
    }

    // Step 7: Detect deployment mode (Safe-owns-parent or personal-owns-parent)
    logger.section('🔍 Step 7: Detect Deployment Mode')
    const parentInfo = await getSubdomainInfo(config.ensDomain!, publicClient, chain.id)

    // Debug logging
    if (options.debug) {
      logger.log(`  Parent owner (on-chain): ${parentInfo.owner}`)
      logger.log(`  Safe address (config): ${config.safeAddress}`)
      logger.log(`  Match: ${parentInfo.owner?.toLowerCase() === config.safeAddress?.toLowerCase()}`)
    }

    let safeOwnsParent = options.safeOwnsParent
    if (safeOwnsParent === undefined) {
      // Auto-detect: does Safe own the parent domain?
      safeOwnsParent = parentInfo.owner?.toLowerCase() === config.safeAddress?.toLowerCase()
    }

    if (safeOwnsParent) {
      logger.success('Mode: Safe-owns-parent (batched deployment)')
      logger.log(`  Parent owner: ${parentInfo.owner}`)
      logger.log('  Both transactions will be batched together')
    } else {
      logger.success('Mode: Personal-owns-parent (two-step deployment)')
      logger.log(`  Parent owner: ${parentInfo.owner}`)
      logger.log('  Subdomain creation first, then Safe sets contenthash')
    }
    logger.newline()

    // Step 8: Check parent fuses
    logger.section('🔍 Step 8: Check Parent Fuses')
    const fuseCheck = await checkParentFuses(config.ensDomain!, publicClient, chain.id)

    if (fuseCheck.needsBurn) {
      logger.warn('⚠️  Parent domain needs CANNOT_UNWRAP fuse burned')
      logger.log('')
      logger.log('This fuse enables permanent subdomain creation with immutable fuses.')
      logger.log('Once burned, this change is PERMANENT and IRREVERSIBLE.')
      logger.log('')
      logger.log('What this means:')
      logger.log('  ✅ You can create permanent, immutable subdomains')
      logger.log('  ✅ Subdomains can be locked with PARENT_CANNOT_CONTROL')
      logger.log('  ❌ You cannot unwrap the domain back to registry')
      logger.newline()

      if (safeOwnsParent) {
        // Safe owns parent - fuses must be burned via Safe transaction
        logger.error('Cannot burn fuses automatically - Safe owns the parent domain')
        logger.log('')
        logger.log('To burn fuses:')
        logger.log('  1. Go to Safe UI: ' + getSafeTransactionUrl(config.safeAddress!, chain.id))
        logger.log('  2. Create a transaction to NameWrapper.setFuses()')
        logger.log('  3. Burn CANNOT_UNWRAP fuse (value: 1)')
        logger.log('  4. Approve and execute with threshold signers')
        logger.log('')
        logger.log('Or manually via ENS Manager:')
        logger.log(`  https://app.ens.domains/${config.ensDomain}`)
        logger.newline()
        logger.error('Deployment cancelled - parent fuses must be burned first')
        process.exit(1)
      } else {
        // Personal wallet owns parent - can burn directly
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        })

        const answer = await rl.question('Burn CANNOT_UNWRAP fuse now? [y/N]: ')
        rl.close()

        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
          logger.error('Deployment cancelled - parent fuses must be burned first')
          logger.log('You can burn them manually with: npm run burn-parent-fuses -- --execute')
          process.exit(1)
        }

        const burnSpinner = logger.spinner('Burning CANNOT_UNWRAP fuse...')
        burnSpinner.start()

        const burnHash = await burnParentFuses(
          config.ensDomain!,
          config.ownerPrivateKey!,
          config.rpcUrl!,
          chain.id,
          publicClient
        )

        burnSpinner.succeed('CANNOT_UNWRAP fuse burned')
        logger.log(`  TX Hash: ${burnHash}`)
        logger.newline()
      }
    } else {
      logger.success('Parent domain has CANNOT_UNWRAP fuse burned')
      logger.newline()
    }

    // Step 9: Execute deployment
    logger.section('✅ Step 9: Execute Deployment')

    if (safeOwnsParent) {
      // SAFE-OWNS-PARENT MODE: Batched deployment
      logger.log('Batching createSubdomain + setContenthash into single Safe transaction...')
      logger.newline()

      const batchResult = await encodeSafeBatchDeploy(
        {
          parentDomain: config.ensDomain!,
          subdomain: version.toString(),
          safeAddress: config.safeAddress! as Address,
          cid: ipfsResult.cid,
          chainId: chain.id,
          expiryTimestamp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60), // 1 year
        },
        logger
      )
      logger.newline()

      const spinner = logger.spinner('Submitting batch to Safe Transaction Service...')
      spinner.start()

      const safeTxHash = await submitToSafeService(
        config.safeAddress! as Address,
        chain.id,
        batchResult,
        config.ownerPrivateKey!,
        logger,
        {
          rpcUrl: config.rpcUrl,
          safeApiKey: config.safeApiKey,
        }
      )

      spinner.succeed('Batch transaction submitted to Safe')
      logger.log(`  Safe TX Hash: ${safeTxHash}`)
      logger.newline()

      // Success!
      logger.successBanner('DEPLOYMENT PROPOSAL CREATED')
      logger.newline()
      logger.success(`Domain: ${fullDomain}`)
      logger.log(`  IPFS CID: ${ipfsResult.cid}`)
      if (commitInfo) {
        logger.log(`  Git Commit: ${commitInfo.shortHash}`)
      }
      logger.log(`  Build Hash: ${formatHash(buildHash.hash)}...`)
      logger.newline()

      logger.warn('⚠️  Action Required: Approve & Execute')
      logger.log('  1. Go to Safe UI: ' + getSafeServiceUrl(config.safeAddress! as Address, safeTxHash, chain.id))
      logger.log('  2. Review the batched transaction:')
      logger.log('     • Create subdomain: ' + fullDomain)
      logger.log('     • Set contenthash: ' + ipfsResult.cid)
      logger.log('  3. Approve and execute (requires threshold signatures)')
      logger.newline()

      logger.log('After execution, your site will be accessible at:')
      const urls = getIPFSUrls(ipfsResult.cid, fullDomain)
      logger.log(`  ${urls[0]} ✅ (works immediately)`)
      for (let i = 1; i < urls.length; i++) {
        logger.log(`  ${urls[i]}`)
      }
      logger.newline()

      logger.warn('⚠️  ENS Gateway Propagation')
      logger.log('  ENS gateways (*.eth.limo, *.eth.link) may take 5-15 minutes')
      logger.log('  to propagate after execution. Use IPFS gateway while waiting.')
      logger.newline()

    } else {
      // PERSONAL-OWNS-PARENT MODE: Two-step deployment
      logger.log('Two-step deployment: Subdomain creation, then Safe sets contenthash')
      logger.newline()

      // Transaction 1: Create subdomain (direct execution by parent owner)
      const spinner1 = logger.spinner('Creating subdomain (parent owner)...')
      spinner1.start()
      const subdomainHash = await createSubdomainDirect(
        plan,
        config.ownerPrivateKey!,
        config.rpcUrl!,
        chain.id,
        publicClient
      )
      spinner1.succeed(`Subdomain created: ${fullDomain}`)
      logger.log(`  TX Hash: ${subdomainHash}`)
      logger.newline()

      // Transaction 2: Set contenthash (via Safe)
      logger.log('Next step: Set contenthash via Safe')
      const spinner2 = logger.spinner('Proposing contenthash to Safe...')
      spinner2.start()
      const result2 = await sendSafeTransaction(safeClient, plan.setContenthashTx)
      spinner2.succeed(`Contenthash proposal created`)
      if (result2.safeTxHash) {
        logger.log(`  Safe TX Hash: ${result2.safeTxHash}`)
      }
      logger.newline()

      // Success!
      logger.successBanner('SUBDOMAIN CREATED')
      logger.newline()
      logger.success(`Subdomain: ${fullDomain}`)
      logger.log(`  Owner: ${config.safeAddress} (Safe)`)
      logger.log(`  IPFS CID: ${ipfsResult.cid}`)
      if (commitInfo) {
        logger.log(`  Git Commit: ${commitInfo.shortHash}`)
      }
      logger.log(`  Build Hash: ${formatHash(buildHash.hash)}...`)
      logger.newline()

      logger.warn('⚠️  Action Required: Set Contenthash')
      logger.log('  1. Go to Safe UI: ' + getSafeTransactionUrl(config.safeAddress!, chain.id))
      logger.log('  2. Review and approve contenthash transaction')
      logger.log('  3. Execute transaction')
      logger.newline()

      logger.log('Your site will be accessible at:')
      const urls = getIPFSUrls(ipfsResult.cid, fullDomain)
      logger.log(`  ${urls[0]} ✅ (works immediately)`)
      for (let i = 1; i < urls.length; i++) {
        logger.log(`  ${urls[i]}`)
      }
      logger.newline()

      logger.warn('⚠️  ENS Gateway Propagation')
      logger.log('  ENS gateways (*.eth.limo, *.eth.link) may take 5-15 minutes')
      logger.log('  to propagate. Use the IPFS gateway while waiting.')
      logger.newline()
    }

  } catch (error: any) {
    logger.error('Deployment failed')
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
