# Technical Architecture

This document describes the current Autark implementation as of version `0.1.2`.

## Goal

Autark protects frontend deployments by inserting a governance checkpoint before publication and by making approved releases immutable.

## Main Components

### 1. CLI layer

Entry point:

- `src/cli/index.ts`

Main commands:

- `deploy`
- `status`
- `setup`
- `promote`
- `rollback`
- `channels`

### 2. Config layer

Config is merged with priority:

1. CLI flags
2. environment variables
3. config file

Implementation:

- `src/lib/config.ts`

Current canonical config names are:

- `autark.config.yaml`
- `autark.config.yml`
- `autark.config.json`

Legacy `secure-deploy.*` names remain supported for backward compatibility.

### 3. IPFS upload layer

Implementation:

- `src/lib/ipfs/upload.ts`

Autark currently uses the local Storacha CLI, not a native in-process Storacha SDK flow.

That means the runtime assumptions are:

- Storacha CLI is installed
- the user is authenticated
- an active Storacha space is selected

### 4. ENS layer

Key modules:

- `src/lib/ens/version.ts`
- `src/lib/ens/deploy.ts`
- `src/lib/ens/execute.ts`
- `src/lib/ens/fuses-check.ts`
- `src/lib/ens/safe-batch-deploy.ts`

Responsibilities:

- detect next `vN` release
- build contenthash data for IPFS
- detect ownership mode for parent domain
- create subdomains and set resolver contenthash
- enforce NameWrapper fuse rules

## Deployment Modes

### Safe-owned-parent mode

Recommended mode.

The Safe owns the wrapped parent domain.

Autark creates one batched Safe proposal that:

- creates the next versioned subdomain
- sets the contenthash to the uploaded CID

This is the cleanest mode because rejected proposals do not waste immutable version numbers.

### Personal-owned-parent mode

Compatibility mode.

The personal wallet owns the parent domain.

Autark:

- creates the subdomain directly
- then creates a Safe proposal for the contenthash update

## Mutable Channel Architecture

Autark separates immutable releases from mutable entrypoints.

Immutable releases:

- `v0.parent.eth`
- `v1.parent.eth`
- `v2.parent.eth`

Mutable channels:

- `live.parent.eth`
- `staging.parent.eth`
- `canary.parent.eth`

Implemented through:

- `src/cli/commands/promote.ts`
- `src/cli/commands/channels.ts`

This allows:

- promotion of a reviewed immutable release to a stable channel
- rollback of a stable channel to an older immutable release
- inspection and creation of channel subdomains through Safe proposals

## Safe Integration

Key runtime modules:

- `src/lib/safe/client.ts`
- `src/lib/ens/safe-batch-deploy.ts`

Current implementation uses:

- `@safe-global/protocol-kit`
- `@safe-global/api-kit`

The vulnerable starter kit dependency was removed in the `0.1.2` line.

Behavior:

- threshold `1`: execute immediately
- threshold `>1`: propose transaction in the Safe Transaction Service

## Git Hook Integration

Implemented in:

- `src/cli/commands/setup.ts`

Autark can install a pre-push hook that:

- runs a custom build command
- validates the build output directory
- triggers `autark deploy`
- blocks the push if deployment fails

## Security Properties

Autark provides the following technical guarantees when used in the recommended path:

- no single developer can ship a production frontend alone
- every approved release has an IPFS CID and an ENS record
- immutable versioned subdomains remain available after deployment
- channel promotion and rollback are explicit governance actions
- previous versions remain auditable and addressable

## Limitations

- Safe Sepolia indexing can be slow and is external to this repo
- Storacha authentication and space selection are handled outside the CLI runtime
- older scripts under `src/test` and `src/core` still exist as experimental utilities and are not the main supported interface
