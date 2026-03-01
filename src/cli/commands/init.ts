/**
 * Init command - Initialize configuration
 */

import { writeFileSync } from 'fs'
import { resolve } from 'path'
import { Logger } from '../../lib/logger.js'

/**
 * Init command - Create config file template
 */
export async function initCommand(): Promise<void> {
  const logger = new Logger()

  logger.header('🔧 Initialize AUTARK')
  logger.newline()

  const configTemplate = `# AUTARK Configuration
# You can also use environment variables or CLI flags

# Network Configuration
network: sepolia
rpcUrl: https://ethereum-sepolia-rpc.publicnode.com

# ENS Configuration
ensDomain: your-domain.eth

# Safe Multisig Configuration
safeAddress: 0x...
safeApiKey: your-safe-api-key

# Owner/Signer Configuration (for Safe operations)
ownerPrivateKey: 0x...

# Storacha Configuration (optional, uses CLI by default)
# storachaKey: ...
# storachaProof: ...

# GitHub Configuration (optional)
# githubToken: ghp_...
# githubRepo: owner/repo

# CLI Options
quiet: false
debug: false
`

  try {
    const configPath = resolve(process.cwd(), 'autark.config.yaml')
    writeFileSync(configPath, configTemplate)

    logger.success('Created config file: autark.config.yaml')
    logger.newline()

    logger.log('Next steps:')
    logger.log('  1. Edit the config file with your values')
    logger.log('  2. Or use environment variables (see .env.example)')
    logger.log('  3. Deploy with: autark deploy ./dist')
    logger.newline()

  } catch (error: any) {
    logger.error('Failed to create config file')
    logger.error(error.message)
    process.exit(1)
  }
}
