# User Flow

This document describes the current Autark release flow as implemented on the `genesis` branch.

## Core Release Flow

### 1. Prepare the frontend build

A frontend project outputs static files such as:

- `dist/`
- `build/`
- `out/`

Autark operates on the final static output directory.

### 2. Upload the build to IPFS

Autark uploads the build directory to IPFS through the local Storacha CLI.

Result:

- a CID is returned
- that CID becomes the content-addressed reference for the release

### 3. Detect the next immutable version

Autark scans the parent ENS domain and determines the next available versioned subdomain:

- `v0.parent.eth`
- `v1.parent.eth`
- `v2.parent.eth`

### 4. Build the deployment plan

Autark prepares the required ENS and Safe transaction data:

- create the next subdomain
- set the resolver contenthash to the uploaded CID
- apply the intended fuse policy

### 5. Create the Safe proposal

Autark submits the transaction through Safe.

There are two modes:

#### Safe-owned-parent mode

Recommended mode.

Autark submits one batched Safe proposal that:

1. creates the immutable versioned subdomain
2. sets the contenthash to the uploaded IPFS CID

This is atomic and avoids wasting version numbers on rejected proposals.

#### Personal-owned-parent mode

Compatibility mode.

Autark:

1. creates the subdomain directly from the personal owner wallet
2. creates a Safe proposal for the contenthash update

### 6. Review and approve

Signers review the proposal in Safe.

At this stage they can verify:

- the intended domain
- the Safe transaction contents
- the IPFS CID
- the commit metadata printed by the CLI

### 7. Execute

After threshold approval, the Safe transaction is executed.

The release becomes available through:

- the direct IPFS gateway
- ENS gateways like `.limo` / `.link`
- the immutable versioned ENS subdomain

## Mutable Channel Flow

Autark also supports mutable channels such as:

- `live.parent.eth`
- `staging.parent.eth`
- `canary.parent.eth`

These channels point to immutable `vN.parent.eth` releases.

### Promote flow

```bash
autark promote --to v3 --channel live --ens-domain parent.eth
```

This creates a Safe proposal that updates the `live` channel contenthash to the contenthash already stored on `v3.parent.eth`.

### Rollback flow

```bash
autark rollback --to v2 --channel live --ens-domain parent.eth
```

This is the same operation, but framed explicitly as rollback.

### Inspect channels

```bash
autark channels --ens-domain parent.eth
```

Autark lists the configured channels, their ownership, contenthash, and matching immutable version when possible.

## Auto-Deploy Flow

Autark can install a `pre-push` git hook.

When enabled, a push to the configured branch will:

1. run the configured build command
2. verify the build output directory exists
3. call `autark deploy <buildDir>`
4. block the push if deployment fails

For details, see [Git Hooks](./GIT-HOOKS.md).
