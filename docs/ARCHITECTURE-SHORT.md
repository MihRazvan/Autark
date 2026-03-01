# Architecture (Short)

Autark adds a governance gate to frontend deployments.

## Goal

Prevent single-actor frontend takeover by requiring Safe multisig approval before ENS content is updated.

## Deployment Pipeline

1. Build frontend output (`dist/`)
2. Upload output to IPFS via Storacha
3. Resolve next versioned ENS subdomain (`vN.parent.eth`)
4. Create Safe proposal:
- Safe-owns-parent: batch `setSubnodeRecord + setContenthash`
- Personal-owns-parent: create subdomain first, then Safe proposal for `setContenthash`
5. Multisig signers review and execute
6. Subdomain is immutable through NameWrapper fuses

## Security Properties

- Multi-party approval checkpoint (Safe threshold)
- Content-addressed artifacts (IPFS CID)
- Versioned immutable releases (`v0`, `v1`, ...)
- On-chain audit trail for release operations

## Key Modules

- CLI entry: `src/cli/index.ts`
- Main deploy flow: `src/cli/commands/deploy.ts`
- Config merge/validation: `src/lib/config.ts`
- IPFS upload: `src/lib/ipfs/upload.ts`
- ENS version and planning: `src/lib/ens/version.ts`, `src/lib/ens/deploy.ts`
- Safe integration: `src/lib/safe/client.ts`, `src/lib/ens/safe-batch-deploy.ts`

## Notes

- The current repo also contains legacy experimental scripts under `src/test`, `src/core`, and `src/providers`.
- Long-form architecture and hackathon docs are archived in `docs/_legacy/`.
