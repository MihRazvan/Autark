# Autark Technical Architecture

**Preventing Frontend Injection Attacks Through Immutable Versioning and Multi-Party Verification**

---

## The Problem We're Solving

### Frontend Injection Attacks Are Real

In the Lazarus Group attack on Bybit/Safe (2025), the attack vector was simple but devastating:

1. Attacker compromises developer machine (malware, phishing)
2. Attacker pushes malicious code directly to main branch
3. CI/CD automatically triggers (trusted process)
4. Code deploys to production immediately (2-10 minutes)
5. ByBits' wallet drained

### Current "Solutions" Fail

**Traditional Web2 (Vercel/Netlify):**
```
Compromised dev → Push to main → Auto-deploy → Live in 2 min ❌
```
- Single point of failure
- No Multi-Party verification
- Immediate deployment

---

### Core Innovation

Slow down the deployment process and create an immutable audit trail through:

1. **Creating immutable versioned subdomains** - Each version locked forever via ENS fuses
2. **Preventing version waste** - Batched Safe transactions (atomic subdomain creation + content setting)
3. **Requiring multi-party approval** - Safe multisig checkpoint before deployment goes live

Signers can preview the deployment on IPFS (via the CID in the transaction data) before approving, adding a human verification checkpoint to the automated CI/CD pipeline.

### The Two-Layer Security Model

**Layer 1: Multi-Party Approval Checkpoint**
- Safe multisig requires threshold approval (e.g., 2 of 3, 3 of 5)
- Signers can preview deployment on IPFS (decode CID from transaction)
- Slows down automated CI/CD pipeline, forcing human review
- Prevents single compromised developer from deploying alone
- Distributes trust across `dev` team members

**Layer 2: Cryptographic Immutability**
- ENS `NameWrapper` burns fuses on subdomain
- Once deployed, **nobody** can change it (not even Safe signers)
- Attackers can't modify past deployments even if they compromise Safe later

---

## Architecture Overview

### The Complete Flow

```
Developer Machine (potentially compromised)
    ↓
Git Push to Main (no PR, no review yet)
    ↓
GitHub Actions CI/CD (automated build)
    ↓
AUTARK CLI:
    1. Build → IPFS (content-addressed storage)
    2. Generate CID (permanent address)
    3. Detect next version (v0, v1, v2...)
    4. Create Safe proposal (batched transaction)
    ↓
Safe Transaction Service (stores proposal)
    ↓
Multi-Party VERIFICATION ← This is where we slow down attacks!
    • Signers review proposal in Safe UI
    • Can decode CID from transaction data
    • Preview deployment on IPFS before approving
    • Approve or reject
    ↓
Safe Execution (once threshold reached)
    ↓
ENS NameWrapper Transaction (atomic):
    1. Create vX.domain.eth subdomain
    2. Set contenthash → IPFS CID
    3. Burn fuses (CANNOT_UNWRAP | CANNOT_SET_RESOLVER | PARENT_CANNOT_CONTROL)
    ↓
Deployment Live (permanently immutable)
    • Users access via: vX.domain.eth.limo
    • Content served from IPFS
    • Cannot be changed by anyone, ever
```

---

## How We Use Each Technology

### IPFS: Content-Addressed Storage

**Why IPFS?**
- **Content addressing**: Each build gets unique CID based on content hash
- **Distributed**: No single server to take down
- **Verifiable**: CID proves content integrity cryptographically
- **Permanent**: Cannot be deleted or modified

**Our Implementation:**
- Upload built frontend (dist/) via Storacha CLI
- Receive CID: `bafybeiabc123...`
- Encode CID to ENS contenthash format
- Set contenthash on ENS subdomain
- Users access via IPFS gateways or ENS gateways

**Why Storacha Specifically?**
- Simple CLI interface (`storacha up dist`)
- Guaranteed persistence (pins to Filecoin)
- Global CDN for fast access
- Free tier for developers

### ENS: Human-Readable Naming + Immutability

**Why ENS?**
- **Human-readable**: `v3.myapp.eth` instead of `bafybei...`
- **Blockchain-verified**: Ownership and contenthash on-chain
- **Supports IPFS**: Contenthash field points to IPFS CID
- **NameWrapper fuses**: Can burn permissions permanently

**Our Implementation:**
- Parent domain: `myapp.eth` (owned by user or Safe)
- Create versioned subdomains: `v0.myapp.eth`, `v1.myapp.eth`, `v2.myapp.eth`...
- Set contenthash on each subdomain to IPFS CID
- Burn fuses to make subdomain immutable:
  - `CANNOT_UNWRAP` - Can't unwrap back to registry
  - `CANNOT_SET_RESOLVER` - Can't change resolver (contenthash locked)
  - `PARENT_CANNOT_CONTROL` - Parent can't revoke subdomain

**Why `NameWrapper` Fuses?**

This is the **key to immutability**. Once fuses are burned:
- Subdomain owner (Safe) cannot change contenthash
- Parent domain owner cannot revoke subdomain
- Nobody can unwrap or modify the subdomain
- **Cryptographically enforced permanence**

Even if an attacker compromises the Safe later, they cannot modify existing versions. They can only deploy new versions (v4, v5...), which go through the same review process.

### Safe: Threshold-Based Governance

**Why Safe?**
- **Multisig**: Requires M of N signers (e.g., 2 of 3, 3 of 5, etc.)
- **Transaction batching**: Multiple operations in one transaction
- **Off-chain coordination**: Safe Transaction Service stores proposals
- **Well-tested**: Battle-tested infrastructure used by major protocols

**Our Implementation:**
- Safe owns parent domain (Safe-owns-parent mode)
- Autark creates batched Safe transaction:
  1. Create subdomain (setSubnodeRecord on NameWrapper)
  2. Set contenthash (setContenthash on PublicResolver)
- Both operations happen atomically (all or nothing)
- Signers review proposal in Safe UI
- Once threshold met, anyone can execute

**Why Batched Transactions?**

**Without batching (Personal-owns-parent mode):**
```
1. Personal wallet creates subdomain v2.myapp.eth ✓
2. Safe proposal to set contenthash
3. If rejected → v2 is wasted (subdomain exists but no content)
```

**With batching (Safe-owns-parent mode):**
```
1. Safe proposal creates subdomain + sets contenthash (atomic)
2. If rejected → v2 never created (no wasted versions)
```

This prevents version pollution from rejected proposals.

---

## Two Deployment Modes Explained

### Mode 1: Safe-Owns-Parent (Recommended)

**Setup:**
- Transfer parent domain to Safe
- Burn CANNOT_UNWRAP fuse on parent

**How It Works:**
1. Autark detects Safe owns parent domain
2. Creates batched transaction (createSubdomain + setContenthash)
3. Submits to Safe Transaction Service
4. Signers approve
5. Execute → Both operations happen together

**Advantages:**
- ☑ Atomic deployment (all or nothing)
- ☑ No wasted versions if rejected
- ☑ Full governance over entire domain
- ☑ Cleaner version history

**Trade-offs:**
- Requires transferring domain to Safe (scary for some users)
- All operations require Safe approval (slower)

### Mode 2: Personal-Owns-Parent

**Setup:**
- Keep parent domain in personal wallet

**How It Works:**
1. Autark detects personal wallet owns parent
2. Personal wallet creates subdomain immediately
3. Autark creates Safe proposal to set contenthash
4. Signers approve
5. Execute → Contenthash set

**Advantages:**
- ☑ Don't need to transfer domain to Safe
- ☑ Can create subdomains quickly

**Our Recommendation:** Safe-owns-parent for production (better governance, cleaner versions).

---

## Key Design Decisions

### 1. Why Versioned Subdomains Instead of Updating One Domain?

**Problem with single domain:**
```
myapp.eth → v1 content
User bookmarks myapp.eth
myapp.eth → v2 content (updated)
User's bookmark now points to different content!
```

**Solution with versions:**
```
v0.myapp.eth → v0 content (immutable forever)
v1.myapp.eth → v1 content (immutable forever)
v2.myapp.eth → v2 content (immutable forever)

Users who want v1 can always access v1
Users who want latest can use myapp.eth → points to latest
```

**Additional benefits:**
- Rollback capability (point myapp.eth to older version)
- Audit trail (every version preserved)
- Security (compromised Safe can't change old versions)
- Testing (deploy v2, test, then update myapp.eth pointer)

### 2. Why IPFS Instead of Arweave/Other Storage?

**Considered:**
- Arweave (permanent storage, pay once)
- Traditional CDN (fast, centralized)
- Self-hosted IPFS (free, but need to maintain nodes)

**Chose IPFS + Storacha because:**
- ☑ ENS native support (contenthash field designed for IPFS)
- ☑ Storacha handles pinning/persistence
- ☑ Free tier sufficient for most projects
- ☑ Multiple gateways available (.limo, .link, w3s.link)
- ☑ Mature ecosystem and tooling

**Future:** Could add Arweave as alternative storage option.

### 3. Why ENS Fuses Instead of Smart Contract Locks?

**Considered:**
- Custom smart contract with time locks
- Multi-sig with social consensus
- Snapshot voting for updates

**Chose ENS fuses because:**
- ☑ Native to ENS (no additional contracts)
- ☑ Cryptographically enforced (not social consensus)
- ☑ Battle-tested (ENS NameWrapper live on mainnet)
- ☑ Cannot be bypassed (even by Safe signers)
- ☑ Gas efficient (one-time burn)

**Trade-off:** Fuses are permanent (by design). Cannot undo once burned.

### 4. Why Auto-Detection of Deployment Mode?

**Could have required user to specify:**
```bash
autark deploy dist
```

**Instead, we auto-detect:**
```typescript
const parentOwner = await getParentDomainOwner(ensDomain)
if (parentOwner === safeAddress) {
  // Use batched mode
} else {
  // Use two-step mode
}
```

**Why:**
- ☑ Less user error
- ☑ Clearer UX (tool "just works")
- ☑ Can't accidentally use wrong mode

---

## Security Model

### What We Protect Against

**☑ Compromised Developer Machine**
- Attacker pushes malicious code
- CI/CD builds and uploads to IPFS
- Safe proposal created
- Requires threshold approval (can't deploy alone)
- **Result:** Attack slowed down, requires compromising multiple signers

**☑ Fast Automated Deployments**
- Traditional CI/CD: Push → Live in 2 minutes
- Our tool: Push → IPFS → Safe proposal → Wait for approvals
- **Result:** Human checkpoint in the automated pipeline

**☑ Post-Deployment Tampering**
- Attacker compromises Safe after deployment
- Tries to change v3.myapp.eth contenthash
- Fuses prevent modification (transaction reverts)
- **Result:** Past deployments remain safe

**☑ Accidental Wrong Deployment**
- Developer accidentally merges breaking change
- Safe signers review, spot the issue
- Reject deployment
- **Result:** Bad code never goes live


### Defense in Depth

**Layer 1: Human Checkpoint**
- Safe multisig requires threshold approval
- Signers can preview deployment on IPFS before approving
- Slows down automated pipeline, forcing manual review

**Layer 2: Threshold Requirement**
- Requires multiple approvals (2 of 3, 3 of 5, etc.)
- Attacker must compromise multiple signers
- Reduces single point of failure

**Layer 3: Cryptographic Immutability**
- ENS fuses burned on subdomain
- Cannot be changed even by Safe signers
- Protects past deployments from future compromises

**Layer 4: Audit Trail**
- All versions preserved forever
- Can compare v3 vs v4 to spot malicious changes
- On-chain record of all deployments

**Layer 5: Versioning**
- Each deployment is separate subdomain
- Bad deployment doesn't overwrite good one
- Can always rollback by updating pointer

---

## Why This Approach Works

### The Fundamental Problem with Automated Security

**Traditional approach:** Try to detect malicious code automatically
- Static analysis
- Dependency scanning
- Behavioral analysis

**Why it fails:** Attackers can evade automated detection
- Obfuscation
- Time bombs (malicious code activates later)
- Supply chain (malicious dependency looks legitimate)

### Our Approach: Slow Down + Lock Down

Instead of trying to detect attacks automatically, we:

1. **Slow down the deployment pipeline** with human approval requirement
2. **Require multiple humans** to agree (threshold)
3. **Lock the decision cryptographically** so it can't be changed later

**This works because:**
- Gives time for team to notice suspicious activity
- Multiple approvals required (attacker must compromise multiple signers)
- Immutability protects against future compromises
- Versioning preserves audit trail

### The Trade-Off: Security vs. Velocity

**Traditional CI/CD:**
- Push to main → Live in 2 minutes
- Maximum velocity
- Zero security checkpoints

**Our system:**
- Push to main → Safe proposal → Human review → Approve → Execute
- Minimum 10-30 minutes (realistic: hours if signers not online)
- **Trade velocity for security**

**Who this is for:**
- ☑ Financial dApps (Uniswap, Aave, etc.)
- ☑ DAO frontends (where funds are at stake)
- ☑ Critical infrastructure (bridges, multisigs)
- x Rapid prototyping / hobby projects
- x Applications where speed > security

---

## Future Enhancements

### Post-Hackathon Roadmap

**Phase 1: Build Verification**
- Multiple parties build independently
- Compare build hashes (must match)
- Consensus requirement (3/5 builders agree)
- Prevents compromised build pipeline

**Phase 2: Time Delays**
- On-chain time lock after approval
- 6-24 hour emergency stop window
- Can cancel if attack discovered
- Additional safety layer

**Phase 3: Enhanced Context in Safe UI**
- Custom Safe App showing decoded transaction data
- Display Git commit info, file diff links
- Preview iframe of IPFS deployment
- Warning banners for unusual patterns

---

## Conclusion

Autark addresses a **critical gap** in Web3 frontend security: fully automated CI/CD pipelines allow compromised developers to deploy malicious frontends in minutes.

**Our contribution:**

1. **Human approval checkpoint** - Slows down automated deployment, requires threshold approval
2. **Atomic deployments** - Batched Safe transactions prevent wasted versions
3. **Cryptographic immutability** - ENS fuses lock deployments permanently
4. **Audit trail** - Every version preserved and verifiable

**The key insight:** Don't try to automate attack detection (computers can't beat sophisticated attackers). Instead, slow down the pipeline with a human approval checkpoint, require multiple signers, and lock decisions permanently on-chain.

**For teams deploying critical frontends** (DeFi, DAOs, bridges), this trades deployment velocity for security - adding a human verification checkpoint that prevents single compromised developers from deploying malicious code.

---

**Built at ETHRome 2025 Hackathon**
