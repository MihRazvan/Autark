/**
 * Safe batch deployment - creates subdomain + sets contenthash in single Safe transaction
 */

import { encodeFunctionData, parseAbi, type Address, type Hex } from 'viem'
import { normalize, namehash } from 'viem/ens'
import { NAME_WRAPPER_ADDRESS } from './namewrapper/wrapper.js'
import { FUSES } from './namewrapper/fuses.js'
import { PUBLIC_RESOLVER_ADDRESS } from './ens.js'
import { encodeContenthash } from './contenthash-encode.js'
import { ENSError } from '../errors.js'
import type { Logger } from '../logger.js'

const wrapperAbi = parseAbi([
  'function setSubnodeRecord(bytes32 parentNode, string calldata label, address owner, address resolver, uint64 ttl, uint32 fuses, uint64 expiry) external returns (bytes32)',
])

const resolverAbi = parseAbi([
  'function setContenthash(bytes32 node, bytes calldata hash) external',
])

export interface SafeBatchDeployParams {
  parentDomain: string
  subdomain: string
  safeAddress: Address
  cid: string
  chainId: number
  expiryTimestamp: number
}

export interface SafeBatchResult {
  createSubdomainData: Hex
  setContenthashData: Hex
  subdomainFqdn: string
  metadata: SafeTransactionMetadata
}

export interface SafeTransactionMetadata {
  name: string
  description: string
}

/**
 * Encode batched Safe transactions for subdomain creation + contenthash setting
 * Returns transaction data that can be submitted to Safe Transaction Service
 */
export async function encodeSafeBatchDeploy(
  params: SafeBatchDeployParams,
  logger: Logger
): Promise<SafeBatchResult> {
  const { parentDomain, subdomain, safeAddress, cid, chainId, expiryTimestamp } = params

  // Build subdomain FQDN
  const label = `v${subdomain}`
  const subdomainFqdn = `${label}.${parentDomain}`

  logger.log(`Encoding Safe batch transactions for ${subdomainFqdn}...`)

  // 1. Encode createSubdomain transaction
  const parentNode = namehash(normalize(parentDomain))
  const subdomainNode = namehash(normalize(subdomainFqdn))
  const resolverAddress = PUBLIC_RESOLVER_ADDRESS[chainId === 11155111 ? 'sepolia' : 'mainnet'] as Address

  // Fuses: CANNOT_UNWRAP | CANNOT_SET_RESOLVER | PARENT_CANNOT_CONTROL
  const fuses =
    FUSES.CANNOT_UNWRAP |
    FUSES.CANNOT_SET_RESOLVER |
    FUSES.PARENT_CANNOT_CONTROL

  const createSubdomainData = encodeFunctionData({
    abi: wrapperAbi,
    functionName: 'setSubnodeRecord',
    args: [
      parentNode,
      label,
      safeAddress, // owner = Safe itself
      resolverAddress,
      BigInt(0), // ttl
      fuses,
      BigInt(expiryTimestamp),
    ],
  })

  logger.log(`  ✓ Encoded createSubdomain transaction`)

  // 2. Encode setContenthash transaction
  const contenthashBytes = encodeContenthash(cid)

  const setContenthashData = encodeFunctionData({
    abi: resolverAbi,
    functionName: 'setContenthash',
    args: [subdomainNode, contenthashBytes],
  })

  logger.log(`  ✓ Encoded setContenthash transaction`)

  // 3. Build metadata for Safe UI
  const metadata: SafeTransactionMetadata = {
    name: `Deploy ${subdomainFqdn}`,
    description: `Atomically create subdomain ${subdomainFqdn} and set IPFS contenthash to ${cid}`,
  }

  return {
    createSubdomainData,
    setContenthashData,
    subdomainFqdn,
    metadata,
  }
}

/**
 * Submit batched transactions to Safe Transaction Service
 */
export async function submitToSafeService(
  safeAddress: Address,
  chainId: number,
  batchResult: SafeBatchResult,
  signerPrivateKey: `0x${string}`,
  logger: Logger,
  options?: {
    rpcUrl?: string
    safeApiKey?: string
  }
): Promise<string> {
  const spinner = logger.spinner('Submitting batch to Safe Transaction Service...')
  spinner.start()

  try {
    // In Safe SDK v6+, we need to import from the correct locations
    const { default: SafeApiKit } = await import('@safe-global/api-kit')
    const { default: Safe } = await import('@safe-global/protocol-kit')
    const { ethers } = await import('ethers')

    // Setup RPC URL
    const rpcUrl =
      options?.rpcUrl ||
      (chainId === 11155111
        ? process.env.SEPOLIA_RPC_URL
        : process.env.MAINNET_RPC_URL)

    if (!rpcUrl) {
      throw new Error('RPC URL not configured')
    }

    // Create ethers signer for getting address
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const signer = new ethers.Wallet(signerPrivateKey, provider)

    // Create Safe API Kit instance
    const safeApiKey = options?.safeApiKey || process.env.SAFE_API_KEY
    if (!safeApiKey) {
      throw new Error('SAFE_API_KEY not configured. Get one at https://developer.safe.global')
    }

    const safeApiKit = new SafeApiKit({
      chainId: BigInt(chainId),
      apiKey: safeApiKey,
    })

    // Create Safe Protocol Kit instance (v6+ uses RPC URL directly)
    const protocolKit = await Safe.init({
      provider: rpcUrl,
      signer: signerPrivateKey,
      safeAddress,
    })

    // Build multi-send transaction
    const nameWrapperAddress = NAME_WRAPPER_ADDRESS[chainId] as Address
    const resolverAddress = PUBLIC_RESOLVER_ADDRESS[chainId === 11155111 ? 'sepolia' : 'mainnet'] as Address

    const transactions = [
      {
        to: nameWrapperAddress,
        data: batchResult.createSubdomainData,
        value: '0',
      },
      {
        to: resolverAddress,
        data: batchResult.setContenthashData,
        value: '0',
      },
    ]

    const safeTransaction = await protocolKit.createTransaction({
      transactions,
    })

    const safeTxHash = await protocolKit.getTransactionHash(safeTransaction)
    const signature = await protocolKit.signHash(safeTxHash)

    // Submit to Safe Transaction Service
    await safeApiKit.proposeTransaction({
      safeAddress,
      safeTransactionData: safeTransaction.data,
      safeTxHash,
      senderAddress: await signer.getAddress(),
      senderSignature: signature.data,
    })

    spinner.succeed('Batch transaction submitted to Safe')

    return safeTxHash
  } catch (error: any) {
    spinner.fail()
    throw new ENSError(`Failed to submit to Safe: ${error.message}`)
  }
}

/**
 * Get Safe Transaction Service URL for a transaction
 */
export function getSafeServiceUrl(
  safeAddress: Address,
  safeTxHash: string,
  chainId: number
): string {
  const networkPrefix = chainId === 11155111 ? 'sepolia.' : ''
  return `https://app.safe.global/${networkPrefix}safe/${safeAddress}/transactions/queue?id=multisig_${safeAddress}_${safeTxHash}`
}
