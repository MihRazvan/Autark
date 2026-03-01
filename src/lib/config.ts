/**
 * Configuration system with priority: CLI flags > env vars > config file
 */

import { cosmiconfigSync } from 'cosmiconfig'
import { z } from 'zod'
import type { Address, Hex } from 'viem'
import { ConfigError } from './errors.js'

// Configuration schema
export const ConfigSchema = z.object({
  // Network
  network: z.enum(['mainnet', 'sepolia', 'goerli']).default('sepolia'),
  rpcUrl: z.string().url().optional(),

  // ENS
  ensDomain: z.string().optional(),

  // Safe
  safeAddress: z.string().optional(),
  safeApiKey: z.string().optional(),

  // Owner/Signer
  ownerAddress: z.string().optional(),
  ownerPrivateKey: z.string().optional(),

  // Storacha
  storachaKey: z.string().optional(),
  storachaProof: z.string().optional(),

  // Git
  githubToken: z.string().optional(),
  githubRepo: z.string().optional(), // format: owner/repo

  // CLI options
  quiet: z.boolean().default(false),
  debug: z.boolean().default(false),
})

export type Config = z.infer<typeof ConfigSchema>

export interface DeployConfig extends Config {
  // Required for deployment
  ensDomain: string
  safeAddress: Address
  ownerPrivateKey: Hex
  rpcUrl: string
}

/**
 * Load configuration from multiple sources with priority:
 * 1. CLI flags (highest priority)
 * 2. Environment variables
 * 3. Config file (lowest priority)
 */
export function loadConfig(cliOptions: Partial<Config> = {}): Config {
  // Load from config file (lowest priority)
  const explorer = cosmiconfigSync('secure-deploy', {
    searchPlaces: [
      'secure-deploy.config.yaml',
      'secure-deploy.config.yml',
      'secure-deploy.config.js',
      'secure-deploy.config.json',
      '.secure-deployrc',
      '.secure-deployrc.yaml',
      '.secure-deployrc.yml',
      '.secure-deployrc.json',
      'autark.config.yaml',
      'autark.config.yml',
      'autark.config.js',
      'autark.config.json',
      '.autarkrc',
      '.autarkrc.yaml',
      '.autarkrc.yml',
      '.autarkrc.json',
      'package.json',
    ],
  })

  const result = explorer.search()
  const fileConfig = result?.config || {}

  // Load from environment variables (medium priority)
  const envConfig: Partial<Config> = {
    network: (process.env.DEPLOY_NETWORK as any) || undefined,
    rpcUrl: process.env.SEPOLIA_RPC_URL || process.env.MAINNET_RPC_URL || undefined,
    ensDomain: process.env.SEPOLIA_ENS_DOMAIN || process.env.ENS_DOMAIN || undefined,
    safeAddress: (process.env.SAFE_ADDRESS as Address) || undefined,
    safeApiKey: process.env.SAFE_API_KEY || undefined,
    ownerAddress: (process.env.SEPOLIA_OWNER_ADDRESS as Address) || undefined,
    ownerPrivateKey: (process.env.SEPOLIA_OWNER_PK as Hex) || undefined,
    storachaKey: process.env.KEY || undefined,
    storachaProof: process.env.PROOF || undefined,
    githubToken: process.env.GITHUB_TOKEN || undefined,
    githubRepo: process.env.GITHUB_REPO || undefined,
  }

  // Merge with priority: CLI > env > file
  const merged = {
    ...fileConfig,
    ...Object.fromEntries(
      Object.entries(envConfig).filter(([_, v]) => v !== undefined)
    ),
    ...Object.fromEntries(
      Object.entries(cliOptions).filter(([_, v]) => v !== undefined)
    ),
  }

  // Validate
  try {
    return ConfigSchema.parse(merged)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ConfigError(
        `Invalid configuration: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      )
    }
    throw error
  }
}

/**
 * Validate that all required fields for deployment are present
 */
export function validateDeployConfig(config: Config): asserts config is DeployConfig {
  const missing: string[] = []

  if (!config.ensDomain) missing.push('ensDomain')
  if (!config.safeAddress) missing.push('safeAddress')
  if (!config.ownerPrivateKey) missing.push('ownerPrivateKey')
  if (!config.rpcUrl) missing.push('rpcUrl')

  if (missing.length > 0) {
    throw new ConfigError(
      `Missing required configuration: ${missing.join(', ')}\n` +
        `Provide via CLI flags, environment variables, or config file.`
    )
  }
}
