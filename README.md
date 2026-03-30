# AUTARK

Autark is a DevSecOps framework for more secure, self-sovereign frontend deployments, combining Safe multisig governance, ENS versioning, and IPFS storage into a verifiable release flow.

**Project Summary:** [SUMMARY.md](./SUMMARY.md)

[Demo](https://youtu.be/Xw10ulcNK7M) | [Quickstart](./docs/QUICKSTART.md) | [User Flow](./docs/USER-FLOW.md) | [Git Hooks](./docs/GIT-HOOKS.md) | [Technical Architecture](./docs/TECHNICAL-ARCHITECTURE.md) | [Architecture (Short)](./docs/ARCHITECTURE-SHORT.md) | [Docs Index](./docs/README.md) | [Safe DAO Proposal](https://forum.safe.global/t/grant-proposal-supporting-autark-a-secure-self-sovereign-frontend-deployment-framework-built-on-safe/6799)

---

## Problem First

Modern deployment pipelines are fast, centralized, and often trusted too blindly.

A single compromised developer machine, CI token, or deployment credential can push malicious frontend code to production in minutes. For onchain applications, that means the frontend becomes the weakest link, even when the smart contracts are sound.

Autark exists to slow that attack path down and make every release auditable.

It introduces:

- multi-party approval before a deployment goes live
- immutable, versioned ENS releases instead of mutable overwrite-in-place deploys
- content-addressed IPFS storage that can be independently verified

> Nothing goes live without consensus, and every approved version remains available as an immutable artifact.

---

## Overview

Autark adds a governance layer to frontend deployment.

A release is built, uploaded to IPFS, mapped to a versioned ENS subdomain, and gated by Safe multisig approval before execution. In the recommended mode, subdomain creation and contenthash assignment are bundled into a single Safe transaction so the release is atomic.

### Core Principles

1. **Enforce Better**  
   Every deployment passes through explicit review and cryptographic sealing.

2. **Reject Single Points of Failure**  
   No single developer, machine, or CI token should be able to ship production frontend code alone.

3. **Version, Don’t Overwrite**  
   Each release becomes a permanent `vN.parent.eth` record instead of mutating one live address invisibly.

4. **Keep Governance Close to the App**  
   Frontend deployment is part of application security, not a separate convenience layer.

---

## How It Works

Autark replaces implicit trust with a verifiable release flow:

1. Build static frontend output
2. Upload the build to IPFS via Storacha
3. Detect the next versioned ENS subdomain
4. Create a Safe proposal
5. Review and approve with threshold signers
6. Execute the transaction and publish the immutable release

In the Safe-owned-parent mode, Autark batches:

- `setSubnodeRecord` on ENS NameWrapper
- `setContenthash` on the Public Resolver

That means the version is created and pointed to the IPFS CID atomically.

Explore the detailed flow in [User Flow](./docs/USER-FLOW.md) and the system design in [Technical Architecture](./docs/TECHNICAL-ARCHITECTURE.md).

---

## Quickstart

```bash
npm install -g autark
autark init
autark deploy dist
```

For the full setup path, including Storacha auth, ENS configuration, channels, and auto-deploy hooks, see [Quickstart](./docs/QUICKSTART.md).

---

## Documentation

Autark now ships with an active docs set on `genesis`:

- [Quickstart](./docs/QUICKSTART.md)
- [User Flow](./docs/USER-FLOW.md)
- [Git Hooks](./docs/GIT-HOOKS.md)
- [Technical Architecture](./docs/TECHNICAL-ARCHITECTURE.md)
- [Architecture (Short)](./docs/ARCHITECTURE-SHORT.md)
- [Docs Index](./docs/README.md)

Older long-form hackathon docs remain available in [docs/_legacy](./docs/_legacy/).

---

## Tech Stack

| Component | Technology | Purpose |
| --- | --- | --- |
| Governance | **Safe Multisig** | Threshold approval and release governance |
| Immutability | **ENS NameWrapper** | Fuse-burned, versioned subdomains |
| Storage | **IPFS + Storacha** | Content-addressed decentralized hosting |
| Automation | **Git Hooks / CLI** | Deployment workflow automation |
| Language | **Node.js / TypeScript** | CLI and release tooling |

---

## What We Shipped For PL Genesis

This hackathon pass updated the original project into the current `0.1.2` implementation.

### Product and CLI updates

- added `promote` for moving mutable channels to immutable versions
- added `rollback` as an explicit alias for channel rollback flows
- added `channels` to inspect channel state and create missing channel subdomains via Safe proposals
- improved `setup` so git hooks can run a custom build command before deploy

### Deployment and infra updates

- standardized on `autark` config naming while keeping backward compatibility for legacy config names
- improved Storacha CLI integration and error handling for login and space-selection failures
- removed the unused native Storacha provider path to keep one clear upload implementation
- removed the vulnerable Safe starter kit dependency and moved runtime Safe handling to `protocol-kit` + `api-kit`
- fixed the published CLI entrypoint so the globally installed `autark` binary works correctly

### Demo and documentation updates

- updated the example site for the PL Genesis demo flow
- restored active docs for user flow, git hooks, and technical architecture on the `genesis` branch
- removed old hackathon submission references from the main project entry points

Autark is now published at version `0.1.2`.

---

Built for the PL Genesis hackathon.
