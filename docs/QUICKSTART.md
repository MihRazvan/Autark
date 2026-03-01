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

## Auto Deploy Hook (Optional)

```bash
npm run cli -- setup
```

This installs `.git/hooks/pre-push` to trigger deploy proposals on a selected branch.

## Legacy docs

Older long-form hackathon docs are archived in `docs/_legacy/`.
