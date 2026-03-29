import test from 'node:test'
import assert from 'node:assert/strict'

import {
  extractStorachaCid,
  formatStorachaUploadError,
} from '../../lib/ipfs/upload.js'

test('storacha: extract CID from CLI output', () => {
  const output = [
    '- Reading files',
    '  2 files 11.6KB',
    '- Storing',
    'bafybeicawvbubougvdwqkl4pznpynn3y26zmqzat2bfmo5wvebyqdbd6m4',
  ].join('\n')

  assert.equal(
    extractStorachaCid(output),
    'bafybeicawvbubougvdwqkl4pznpynn3y26zmqzat2bfmo5wvebyqdbd6m4'
  )
})

test('storacha: format missing current space error', () => {
  const error = {
    message: 'Command failed: storacha up "dist"',
    stderr: "Error: missing current space: use createSpace() or setCurrentSpace()",
  }

  const formatted = formatStorachaUploadError(error)

  assert.match(formatted, /no current space is selected/i)
  assert.match(formatted, /storacha space ls/i)
  assert.match(formatted, /storacha space use <did>/i)
})

test('storacha: format not logged in error', () => {
  const error = {
    message: 'Command failed: storacha up "dist"',
    stderr: 'Error: not logged in',
  }

  const formatted = formatStorachaUploadError(error)

  assert.match(formatted, /not authenticated/i)
  assert.match(formatted, /storacha login <your-email>/i)
})

