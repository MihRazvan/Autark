import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { loadConfig } from '../../lib/config.js'
import { createProgram } from '../../cli/index.js'

const CONFIG_ENV_KEYS = [
  'DEPLOY_NETWORK',
  'SEPOLIA_RPC_URL',
  'MAINNET_RPC_URL',
  'SEPOLIA_ENS_DOMAIN',
  'ENS_DOMAIN',
  'SAFE_ADDRESS',
  'SAFE_API_KEY',
  'SEPOLIA_OWNER_ADDRESS',
  'SEPOLIA_OWNER_PK',
  'KEY',
  'PROOF',
  'GITHUB_TOKEN',
  'GITHUB_REPO',
] as const

type EnvSnapshot = Record<string, string | undefined>

function snapshotEnv(): EnvSnapshot {
  const snapshot: EnvSnapshot = {}
  for (const key of CONFIG_ENV_KEYS) snapshot[key] = process.env[key]
  return snapshot
}

function restoreEnv(snapshot: EnvSnapshot): void {
  for (const key of CONFIG_ENV_KEYS) {
    const value = snapshot[key]
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
}

function clearConfigEnv(): void {
  for (const key of CONFIG_ENV_KEYS) {
    delete process.env[key]
  }
}

test('smoke: loadConfig reads canonical autark.config.yaml', () => {
  const env = snapshotEnv()
  const cwd = process.cwd()
  const tempDir = mkdtempSync(join(tmpdir(), 'autark-config-smoke-'))

  try {
    clearConfigEnv()

    writeFileSync(
      join(tempDir, 'autark.config.yaml'),
      [
        'network: sepolia',
        'rpcUrl: https://rpc.example',
        'ensDomain: smoke.eth',
        'safeAddress: \"0x1111111111111111111111111111111111111111\"',
        'ownerPrivateKey: \"0x2222222222222222222222222222222222222222222222222222222222222222\"',
        'safeApiKey: smoke-key',
      ].join('\n')
    )

    process.chdir(tempDir)
    const config = loadConfig({})

    assert.equal(config.ensDomain, 'smoke.eth')
    assert.equal(config.rpcUrl, 'https://rpc.example')
    assert.equal(config.network, 'sepolia')
    assert.equal(config.safeApiKey, 'smoke-key')
  } finally {
    process.chdir(cwd)
    restoreEnv(env)
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('smoke: config priority is CLI > env > file', () => {
  const env = snapshotEnv()
  const cwd = process.cwd()
  const tempDir = mkdtempSync(join(tmpdir(), 'autark-priority-smoke-'))

  try {
    clearConfigEnv()

    writeFileSync(
      join(tempDir, 'autark.config.yaml'),
      [
        'network: sepolia',
        'rpcUrl: https://file.example',
        'ensDomain: file.eth',
      ].join('\n')
    )

    process.env.SEPOLIA_ENS_DOMAIN = 'env.eth'
    process.chdir(tempDir)

    const config = loadConfig({ ensDomain: 'cli.eth' })
    assert.equal(config.ensDomain, 'cli.eth')
    assert.equal(config.rpcUrl, 'https://file.example')
  } finally {
    process.chdir(cwd)
    restoreEnv(env)
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('smoke: CLI deploy flags map to expected option keys', async () => {
  let capturedDeployOptions: Record<string, unknown> | undefined

  const program = createProgram({
    deploy: async (opts) => {
      capturedDeployOptions = opts as unknown as Record<string, unknown>
    },
    status: async () => {},
    init: async () => {},
    setup: async () => {},
    promote: async () => {},
  })

  await program.parseAsync(
    [
      'node',
      'autark',
      'deploy',
      'dist',
      '--ens-domain',
      'mapped.eth',
      '--safe-address',
      '0x3333333333333333333333333333333333333333',
      '--owner-private-key',
      '0x4444444444444444444444444444444444444444444444444444444444444444',
      '--rpc-url',
      'https://rpc.mapping.example',
      '--safe-api-key',
      'mapping-key',
      '--network',
      'sepolia',
      '--dry-run',
      '--skip-git-check',
      '--quiet',
    ],
    { from: 'node' }
  )

  assert.ok(capturedDeployOptions)
  assert.equal(capturedDeployOptions?.directory, 'dist')
  assert.equal(capturedDeployOptions?.ensDomain, 'mapped.eth')
  assert.equal(capturedDeployOptions?.safeAddress, '0x3333333333333333333333333333333333333333')
  assert.equal(capturedDeployOptions?.ownerPrivateKey, '0x4444444444444444444444444444444444444444444444444444444444444444')
  assert.equal(capturedDeployOptions?.rpcUrl, 'https://rpc.mapping.example')
  assert.equal(capturedDeployOptions?.safeApiKey, 'mapping-key')
  assert.equal(capturedDeployOptions?.network, 'sepolia')
  assert.equal(capturedDeployOptions?.dryRun, true)
  assert.equal(capturedDeployOptions?.skipGitCheck, true)
  assert.equal(capturedDeployOptions?.quiet, true)
})

test('smoke: CLI promote flags map to expected option keys', async () => {
  let capturedPromoteOptions: Record<string, unknown> | undefined

  const program = createProgram({
    deploy: async () => {},
    status: async () => {},
    init: async () => {},
    setup: async () => {},
    promote: async (opts) => {
      capturedPromoteOptions = opts as unknown as Record<string, unknown>
    },
  })

  await program.parseAsync(
    [
      'node',
      'autark',
      'promote',
      '--to',
      'v2',
      '--channel',
      'live',
      '--ens-domain',
      'mapped.eth',
      '--safe-address',
      '0x3333333333333333333333333333333333333333',
      '--owner-private-key',
      '0x4444444444444444444444444444444444444444444444444444444444444444',
      '--rpc-url',
      'https://rpc.mapping.example',
      '--safe-api-key',
      'mapping-key',
      '--network',
      'sepolia',
      '--dry-run',
      '--quiet',
    ],
    { from: 'node' }
  )

  assert.ok(capturedPromoteOptions)
  assert.equal(capturedPromoteOptions?.to, 'v2')
  assert.equal(capturedPromoteOptions?.channel, 'live')
  assert.equal(capturedPromoteOptions?.ensDomain, 'mapped.eth')
  assert.equal(capturedPromoteOptions?.safeAddress, '0x3333333333333333333333333333333333333333')
  assert.equal(capturedPromoteOptions?.ownerPrivateKey, '0x4444444444444444444444444444444444444444444444444444444444444444')
  assert.equal(capturedPromoteOptions?.rpcUrl, 'https://rpc.mapping.example')
  assert.equal(capturedPromoteOptions?.safeApiKey, 'mapping-key')
  assert.equal(capturedPromoteOptions?.network, 'sepolia')
  assert.equal(capturedPromoteOptions?.dryRun, true)
  assert.equal(capturedPromoteOptions?.quiet, true)
})
