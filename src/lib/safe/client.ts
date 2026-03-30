/**
 * Safe multisig client wrapper
 */

import { Wallet } from 'ethers'
import type { Address, Hex } from 'viem'
import { SafeError } from '../errors.js'

export interface SafeClientConfig {
  safeAddress: Address
  signerPrivateKey: Hex
  rpcUrl: string
  apiKey?: string
}

export interface SafeTransaction {
  to: Address
  value: string
  data: Hex
}

export interface SafeTransactionResult {
  safeTxHash?: string
  txServiceUrl?: string
  success: boolean
}

export interface SafeClientInstance {
  protocolKit: any
  apiKit: any
  safeAddress: Address
  signerAddress: Address
  threshold: number
}

/**
 * Create and initialize Safe client
 */
export async function initSafeClient(config: SafeClientConfig): Promise<SafeClientInstance> {
  if (!config.apiKey) {
    throw new SafeError(
      'Safe API key is required. Get one at: https://developer.safe.global'
    )
  }

  try {
    const { default: Safe } = await import('@safe-global/protocol-kit')
    const { default: SafeApiKit } = await import('@safe-global/api-kit')

    const protocolKit = await Safe.init({
      provider: config.rpcUrl,
      signer: config.signerPrivateKey,
      safeAddress: config.safeAddress,
    })

    const apiKit = new SafeApiKit({
      apiKey: config.apiKey,
      chainId: await protocolKit.getChainId(),
    })

    return {
      protocolKit,
      apiKit,
      safeAddress: config.safeAddress,
      signerAddress: new Wallet(config.signerPrivateKey).address as Address,
      threshold: await protocolKit.getThreshold(),
    }
  } catch (error: any) {
    throw new SafeError(`Failed to initialize Safe client: ${error.message}`)
  }
}

/**
 * Send transaction through Safe.
 * For threshold=1, this executes immediately.
 * For threshold>1, this creates a proposal in the Safe Transaction Service.
 */
export async function sendSafeTransaction(
  client: SafeClientInstance,
  transaction: SafeTransaction
): Promise<SafeTransactionResult> {
  try {
    const safeTransaction = await client.protocolKit.createTransaction({
      transactions: [transaction],
    })

    const safeTxHash = await client.protocolKit.getTransactionHash(safeTransaction)

    if (client.threshold <= 1) {
      const signedTransaction = await client.protocolKit.signTransaction(safeTransaction)
      await client.protocolKit.executeTransaction(signedTransaction)

      return {
        safeTxHash,
        success: true,
      }
    }

    const signature = await client.protocolKit.signHash(safeTxHash)

    await client.apiKit.proposeTransaction({
      safeAddress: client.safeAddress,
      safeTransactionData: safeTransaction.data,
      safeTxHash,
      senderAddress: client.signerAddress,
      senderSignature: signature.data,
    })

    return {
      safeTxHash,
      success: true,
    }
  } catch (error: any) {
    throw new SafeError(`Safe transaction failed: ${error.message}`)
  }
}

/**
 * Get Safe transaction URL for viewing in UI
 */
export function getSafeTransactionUrl(
  safeAddress: Address,
  chainId: number = 11155111
): string {
  const chainPrefix = chainId === 11155111 ? 'sep' : 'eth'
  return `https://app.safe.global/transactions/queue?safe=${chainPrefix}:${safeAddress}`
}
