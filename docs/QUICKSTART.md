# Quickstart

## Prerequisites

- Node.js `>= 20.10.0`
- Storacha CLI installed and authenticated
- Wrapped ENS parent domain on the target network
- Safe multisig configured

## Install

```bash
npm install
npm run build
```

## Configure

Create `.env` in the project root:

```bash
DEPLOY_NETWORK=sepolia
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
SEPOLIA_ENS_DOMAIN=your-domain.eth
SAFE_ADDRESS=0x...
SAFE_API_KEY=sk_...
SEPOLIA_OWNER_PK=0x...
```

Optionally create `autark.config.yaml` via:

```bash
npm run cli -- init
```

## Deploy

```bash
npm run cli -- deploy dist
```

Common flags:

```bash
npm run cli -- deploy dist --network sepolia --dry-run
```

## Check Status

```bash
npm run cli -- status
npm run cli -- status --subdomain v0.your-domain.eth
```

## Promote A Version To A Stable Channel

Create a Safe proposal to point `live.your-domain.eth` to an immutable version:

```bash
npm run cli -- promote --to v2 --channel live --ens-domain your-domain.eth
```

`live.your-domain.eth` must already exist as a wrapped subdomain and be owned by your Safe.

Rollback is the same command, pointing `live` back to an older version:

```bash
npm run cli -- promote --to v1 --channel live --ens-domain your-domain.eth
```

## Auto Deploy Hook (Optional)

```bash
npm run cli -- setup
# or pass an explicit build command for custom output dirs
npm run cli -- setup --branch staging --build-command "npm run build"
```

This installs `.git/hooks/pre-push` to trigger deploy proposals on a selected branch.

## Legacy docs

Older long-form hackathon docs are archived in `docs/_legacy/`.
