/**
 * IPFS upload functionality using Storacha CLI
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { IPFSError } from '../errors.js'
import type { Logger } from '../logger.js'

export interface IPFSUploadResult {
  cid: string
  size: number
  url: string
}

/**
 * Upload directory to IPFS via Storacha CLI
 */
export async function uploadToIPFS(
  directory: string,
  logger: Logger
): Promise<IPFSUploadResult> {
  if (!existsSync(directory)) {
    throw new IPFSError(`Directory not found: ${directory}`)
  }

  const spinner = logger.spinner('Uploading to IPFS via Storacha...')
  spinner.start()

  try {
    // Check if storacha CLI is available
    try {
      execSync('which storacha', { stdio: 'pipe' })
    } catch {
      spinner.fail()
      throw new IPFSError(
        'Storacha CLI not found. Install with: npm install -g @storacha/cli'
      )
    }

    // Upload
    const output = execSync(`storacha up "${directory}"`, {
      encoding: 'utf-8',
      stdio: 'pipe',
    })

    // Extract CID from output
    const match = output.match(/bafy[a-z0-9]+/i)
    if (!match) {
      spinner.fail()
      throw new IPFSError('Failed to extract CID from Storacha output')
    }

    const cid = match[0]

    // Try to get size (best effort)
    let size = 0
    try {
      const sizeOutput = execSync(`du -sk "${directory}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      })
      const sizeStr = sizeOutput.split('\t')[0]
      size = sizeStr ? parseInt(sizeStr) * 1024 : 0 // Convert KB to bytes
    } catch {
      // Size calculation failed, continue anyway
    }

    spinner.succeed(`Uploaded to IPFS: ${cid}`)

    return {
      cid,
      size,
      url: `https://w3s.link/ipfs/${cid}`,
    }
  } catch (error: any) {
    spinner.fail()
    if (error instanceof IPFSError) {
      throw error
    }
    throw new IPFSError(`Upload failed: ${error.message}`)
  }
}

/**
 * Get IPFS gateway URLs for a CID
 * Returns 4 gateways in priority order
 */
export function getIPFSUrls(cid: string, ensDomain?: string): string[] {
  const urls: string[] = []

  // 1. Storacha gateway (fastest, works immediately)
  urls.push(`https://w3s.link/ipfs/${cid}`)

  // 2-3. ENS gateways (if domain provided, may take 5-15min to propagate)
  if (ensDomain) {
    urls.push(`https://${ensDomain}.limo`)
    urls.push(`https://${ensDomain}.link`)
  }

  // 4. Public IPFS gateway (reliable fallback)
  urls.push(`https://ipfs.io/ipfs/${cid}`)

  return urls
}
