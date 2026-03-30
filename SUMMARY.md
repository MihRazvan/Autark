# Project Summary

Autark is a DevSecOps framework for frontend deployments that replaces blind trust with multisig approval, immutable ENS versioning, and content-addressed IPFS releases. Instead of letting one developer, one CI token, or one deployment credential push code straight to production, Autark forces a governed release flow before anything goes live.

## The problem

Frontend deployment pipelines are still one of the weakest links in Web3 security. Even when smart contracts are secure, a compromised developer machine or CI/CD credential can push malicious frontend code to users in minutes. Traditional pipelines optimize for speed, but not for adversarial release governance.

## The solution

Autark introduces a security checkpoint before publication. A frontend build is uploaded to IPFS, mapped to a versioned ENS subdomain, and submitted as a Safe proposal before execution. Signers can review the intended release, verify the CID and commit context, and only then approve publication. The result is a deployment flow where every production version is explicit, auditable, and immutable.

## The Storacha integration

Storacha is the storage layer that makes each Autark release content-addressed and independently verifiable. Autark uploads the static build output to IPFS through the local Storacha CLI and receives a CID that becomes the release artifact. That CID is then written into ENS as the contenthash for the approved versioned subdomain. Because the deployment points to immutable IPFS content instead of a mutable web host, approved frontend versions remain permanent and inspectable after release.

## Architecture

Autark is built in Node.js and TypeScript as a CLI-first workflow. Safe handles governance, ENS NameWrapper handles immutable versioned subdomains and fuse policy, and Storacha provides IPFS-backed artifact storage. In the recommended mode, Autark creates one Safe proposal that atomically creates the next versioned subdomain and sets its resolver contenthash. Mutable channels like `live.parent.eth` can then be promoted or rolled back to immutable `vN.parent.eth` releases through additional Safe proposals.

## Track

Submitted for the PL Genesis hackathon. Continued as a solo project in the current `0.1.2` implementation.
