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

type ExecLikeError = Error & {
  stdout?: string | Buffer
  stderr?: string | Buffer
}

const CID_PATTERN = /(bafy[a-z0-9]{20,}|Qm[A-Za-z0-9]{44})/i

export function extractStorachaCid(output: string): string | null {
  const match = output.match(CID_PATTERN)
  return match?.[1] ?? null
}

function getErrorText(error: unknown): string {
  const execError = error as ExecLikeError
  const parts = [
    execError?.message,
    typeof execError?.stdout === 'string' ? execError.stdout : execError?.stdout?.toString(),
    typeof execError?.stderr === 'string' ? execError.stderr : execError?.stderr?.toString(),
  ].filter(Boolean)

  return parts.join('\n')
}

export function formatStorachaUploadError(error: unknown): string {
  const text = getErrorText(error)
  const normalized = text.toLowerCase()

  if (
    normalized.includes('missing current space') ||
    normalized.includes('setcurrentspace') ||
    normalized.includes('createSpace()'.toLowerCase()) ||
    normalized.includes('no space')
  ) {
    return [
      'Storacha CLI is authenticated, but no current space is selected.',
      'Run:',
      '  storacha space ls',
      '  storacha space use <did>',
      'Or create one with:',
      '  storacha space create autark',
    ].join('\n')
  }

  if (
    normalized.includes('not logged in') ||
    normalized.includes('unauthorized') ||
    normalized.includes('authentication') ||
    normalized.includes('login')
  ) {
    return [
      'Storacha CLI is not authenticated.',
      'Run:',
      '  storacha login <your-email>',
      '  storacha space use <did>',
    ].join('\n')
  }

  const firstLine = text.split('\n').map(line => line.trim()).find(Boolean)
  if (firstLine) {
    return `Upload failed: ${firstLine}`
  }

  return 'Upload failed: Storacha CLI returned an unknown error'
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
    const cid = extractStorachaCid(output)
    if (!cid) {
      spinner.fail()
      throw new IPFSError(
        'Upload finished, but no CID could be parsed from Storacha CLI output.\n' +
        'Run `storacha up <directory>` manually to inspect the current CLI output.'
      )
    }

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
    throw new IPFSError(formatStorachaUploadError(error))
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
