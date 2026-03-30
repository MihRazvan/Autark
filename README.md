# AUTARK
<img width="1920" height="360" alt="ETHRome25banner" src="https://github.com/user-attachments/assets/f0cc3bed-8418-47c3-b59f-f311ea959580" />

Autark is a crypto-anarchic `DevSecOps` framework for more secure, and self-sovereign frontend deployments; embracing immutable, decentralized, and multi-party-verified frontend governance through Safe + ENS + IPFS.

[Demo](https://www.youtube.com/watch?v=-pGsHpUI0J0) | [Quickstart](https://github.com/MihRazvan/Autark/blob/main/docs/QUICKSTART.md) | [Architecture (Short)](https://github.com/MihRazvan/Autark/blob/main/docs/ARCHITECTURE-SHORT.md) | [Docs Index](https://github.com/MihRazvan/Autark/blob/main/docs/README.md) | [Submission](https://taikai.network/ethrome/hackathons/2025/projects/cmgx4r1we02d112kkxt8y1sxi/idea) | [Safe DAO Proposal](https://forum.safe.global/t/grant-proposal-supporting-autark-a-secure-self-sovereign-frontend-deployment-framework-built-on-safe/6799)

---

# Problem First!

Modern `DevOps` pipelines have become too automated, too centralized, and too trusting.

A single compromised developer or **CI/CD** token can silently push malicious frontend code to production — within minutes — across millions of users. Here, the weakest link remains the deployment pipeline.

<img width="1679" height="584" alt="Frame 4 (2)" src="https://github.com/user-attachments/assets/eaa5cbef-2670-4834-9e93-618d539868c0" />

**AUTARK** exists to contribute to fixing this.

It reintroduces multi-party verification, cryptographic immutability, and decentralized governance into the deployment lifecycle. We are turning `DevOps` into `DevSecOps`, and `DevSecOps` into a **meta-governance layer for frontends**.

> **AUTARK** enforces a new rule where nothing goes live without consensus, and once live, new (as well as previous) version lives forever.

---

# Overview

Autark [/ô′tär″k/] derived from [autarky](https://en.wikipedia.org/wiki/Autarky), meaning self-sufficiency; is a crypto-anarchic  framework for frontend deployments.

It transforms how teams ship code by introducing a meta-governance layer for frontends. A trustless, multi-sig process that enforces security at the developer layer while preserving decentralization.

## Core Principles

1. **ENFORCE BETTER**
*Every deployment passes through explicit multi-party verification, and immutable cryptographic sealing.*

2. **REJECT CENTRALIZED GATEKEEPERS**
*No single-point of failure, no opaque CI/CD pipelines.*

3. **META-GOVERNANCE LAYER FOR FRONTENDS**
*A decentralized review `dev` board encoded through Safe multisig decides what becomes production.*

4. **CRUCIAL PART OF THE  PIPELINE**
*Autark integrates directly into **GitHub Actions**, enforcing multi-sig approval checkpoints before any code can go live.*

---

# How it Works?

Autark replaces “trust” with verifiable processes and cryptographic finality:
<img width="1522" height="595" alt="Frame 5" src="https://github.com/user-attachments/assets/1a392867-b64e-4e12-a3b5-78fd9ee26788" />

> Each release becomes an immutable record, and an auditable artifact of a more secure frontend versioning deployment.

Explore: concise [Architecture (Short)](https://github.com/MihRazvan/Autark/blob/main/docs/ARCHITECTURE-SHORT.md) and [legacy docs archive](https://github.com/MihRazvan/Autark/tree/main/docs/_legacy).

---

# Quickstart

``` console
npm install -g autark
autark init
autark deploy dist
```

Explore: concise [Quickstart](https://github.com/MihRazvan/Autark/blob/main/docs/QUICKSTART.md).

---

# Tech Stack

| Component    | Technology                     | Purpose                                |
| ------------ | ------------------------------ | -------------------------------------- |
| Governance   | **Safe Multisig**              | Threshold approval and meta-governance |
| Immutability | **ENS NameWrapper**            | Fuse-burned version locking            |
| Storage      | **IPFS + Storacha**            | Verifiable decentralized hosting       |
| Automation   | **Git Hooks + GitHub Actions** | DevSecOps enforcement layer            |
| Language     | **Node.js / TypeScript**       | CLI and automation scripting           |

> [Autarky](https://en.wikipedia.org/wiki/Autarky) in code: build sovereign software, enforce your `devops` security.

---

Built at [ETHRome](https://www.ethrome.org/) 2025.
