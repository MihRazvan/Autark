/**
 * Safe multisig client wrapper
 */

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

/**
 * Create and initialize Safe client
 */
export async function initSafeClient(config: SafeClientConfig) {
  if (!config.apiKey) {
    throw new SafeError(
      'Safe API key is required. Get one at: https://developer.safe.global'
    )
  }

  try {
    const { createSafeClient } = await import('@safe-global/sdk-starter-kit')

    const client = await createSafeClient({
      provider: config.rpcUrl,
      signer: config.signerPrivateKey,
      safeAddress: config.safeAddress,
      apiKey: config.apiKey,
    })

    return client
  } catch (error: any) {
    throw new SafeError(`Failed to initialize Safe client: ${error.message}`)
  }
}

/**
 * Send transaction through Safe
 * For threshold=1, this will execute immediately
 * For threshold>1, this will propose and require approvals in UI
 */
export async function sendSafeTransaction(
  client: any,
  transaction: SafeTransaction
): Promise<SafeTransactionResult> {
  try {
    // Use send() which handles both immediate execution (threshold=1)
    // and creating proposals (threshold>1)
    const result = await client.send({
      transactions: [transaction],
    })

    return {
      safeTxHash: result?.transactions?.safeTxHash || result?.safeTxHash,
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
