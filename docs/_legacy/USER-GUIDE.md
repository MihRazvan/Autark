# Autark User Guide

**Complete Step-by-Step Guide from Installation to Deployment**

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Setting Up ENS](#setting-up-ens)
4. [Setting Up Safe](#setting-up-safe)
5. [Project Configuration](#project-configuration)
6. [First Deployment](#first-deployment)
7. [Setting Up Git Hooks](#setting-up-git-hooks)
8. [Daily Workflow](#daily-workflow)
9. [Setting Up CI/CD](#setting-up-cicd)
10. [Managing Deployments](#managing-deployments)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### What You Need

Before starting, ensure you have:

- **Node.js** (v20.10.0 or higher)
- **npm** (comes with Node.js)
- **Ethereum wallet** with some testnet ETH (for Sepolia) or mainnet ETH
- **Email address** (for Storacha)
- **Git** (for version control and hooks)
- **GitHub account** (optional, for CI/CD)

### Getting Testnet ETH

For testing on Sepolia:

1. Go to a Sepolia faucet:
   - [https://sepoliafaucet.com](https://sepoliafaucet.com)
   - [https://www.alchemy.com/faucets/ethereum-sepolia](https://www.alchemy.com/faucets/ethereum-sepolia)
   - [https://faucet.quicknode.com/ethereum/sepolia](https://faucet.quicknode.com/ethereum/sepolia)

2. Enter your wallet address

3. Receive 0.5 ETH (usually enough for ~20 deployments)

### Recommended Tools

- **MetaMask** - Browser wallet extension
- **Ledger/Trezor** - Hardware wallet (for production Safe)
- **VS Code** - Code editor
- **IPFS Desktop** - Optional, for local IPFS node

---

## Installation

### Step 1: Install Node.js

**macOS:**
```bash
# Using Homebrew
brew install node@20

# Or download from nodejs.org
open https://nodejs.org
```

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Fedora
sudo dnf install nodejs
```

**Windows:**
```powershell
# Download installer from nodejs.org
# Or use Chocolatey
choco install nodejs-lts
```

**Verify installation:**
```bash
node --version
# v20.10.0 or higher

npm --version
# 10.0.0 or higher
```

### Step 2: Install Autark CLI

**Global installation (recommended):**
```bash
npm install -g autark
```

**Verify installation:**
```bash
autark --version
# 0.1.0

autark --help
```

**Output:**
```
          _____                    _____                _____                    _____                    _____                    _____          
         /\    \                  /\    \              /\    \                  /\    \                  /\    \                  /\    \         
        /::\    \                /::\____\            /::\    \                /::\    \                /::\    \                /::\____\        
       /::::\    \              /:::/    /            \:::\    \              /::::\    \              /::::\    \              /:::/    /        
      /::::::\    \            /:::/    /              \:::\    \            /::::::\    \            /::::::\    \            /:::/    /         
     /:::/\:::\    \          /:::/    /                \:::\    \          /:::/\:::\    \          /:::/\:::\    \          /:::/    /          
    /:::/__\:::\    \        /:::/    /                  \:::\    \        /:::/__\:::\    \        /:::/__\:::\    \        /:::/____/           
   /::::\   \:::\    \      /:::/    /                   /::::\    \      /::::\   \:::\    \      /::::\   \:::\    \      /::::\    \           
  /::::::\   \:::\    \    /:::/    /      _____        /::::::\    \    /::::::\   \:::\    \    /::::::\   \:::\    \    /::::::\____\________  
 /:::/\:::\   \:::\    \  /:::/____/      /\    \      /:::/\:::\    \  /:::/\:::\   \:::\    \  /:::/\:::\   \:::\____\  /:::/\:::::::::::\    \ 
/:::/  \:::\   \:::\____\|:::|    /      /::\____\    /:::/  \:::\____\/:::/  \:::\   \:::\____\/:::/  \:::\   \:::|    |/:::/  |:::::::::::\____\
\::/    \:::\  /:::/    /|:::|____\     /:::/    /   /:::/    \::/    /\::/    \:::\  /:::/    /\::/   |::::\  /:::|____|\::/   |::|~~~|~~~~~     
 \/____/ \:::\/:::/    /  \:::\    \   /:::/    /   /:::/    / \/____/  \/____/ \:::\/:::/    /  \/____|:::::\/:::/    /  \/____|::|   |          
          \::::::/    /    \:::\    \ /:::/    /   /:::/    /                    \::::::/    /         |:::::::::/    /         |::|   |          
           \::::/    /      \:::\    /:::/    /   /:::/    /                      \::::/    /          |::|\::::/    /          |::|   |          
           /:::/    /        \:::\__/:::/    /    \::/    /                       /:::/    /           |::| \::/____/           |::|   |          
          /:::/    /          \::::::::/    /      \/____/                       /:::/    /            |::|  ~|                 |::|   |          
         /:::/    /            \::::::/    /                                    /:::/    /             |::|   |                 |::|   |          
        /:::/    /              \::::/    /                                    /:::/    /              \::|   |                 \::|   |          
        \::/    /                \::/____/                                     \::/    /                \:|   |                  \:|   |          
         \/____/                  ~~                                            \/____/                  \|___|                   \|___|          
                                                                                                                                                  

Decentralized • Immutable • Trustless                          v0.1.0

Usage: autark [options] [command]

Deploy frontends with Safe multisig + immutable ENS versioning

Options:
  -V, --version                 output the version number
  -h, --help                    display help for command

Commands:
  deploy [options] <directory>  Deploy a directory to IPFS and ENS via Safe
  status [options]              Check deployment status
  init                          Initialize configuration file
  setup [options]               Setup git hooks for automatic deployment
  help [command]                display help for command
```

### Step 3: Install Storacha CLI

```bash
npm install -g @storacha/client
```

**Verify installation:**
```bash
storacha --version
# 7.0.0 or higher
```

### Step 4: Authenticate with Storacha

```bash
storacha login your-email@example.com
```

**What happens:**
1. You'll see: "Check your email for a verification link"
2. Open your email
3. Click the verification link
4. You'll see: "Successfully verified!"
5. Return to terminal

**Verify authentication:**
```bash
storacha whoami
# your-email@example.com
```

---

## Setting Up ENS

### Option A: Register New Domain

#### Step 1: Go to ENS Manager

```bash
open https://app.ens.domains
```

#### Step 2: Connect Wallet

1. Click "Connect"
2. Select MetaMask (or your wallet)
3. Approve connection

#### Step 3: Search for Domain

1. Enter desired name (e.g., "myproject")
2. Click "Search"
3. Check availability

**If available:**
- Shows price (0.005+ ETH/year based on length)
- Shows "Available"

**If taken:**
- Shows "Unavailable"
- Try different name

#### Step 4: Register Domain

1. Click "Request to Register"
2. Confirm transaction (costs gas)
3. Wait 1 minute (prevents front-running)
4. Click "Register"
5. Set registration duration (1-10 years)
6. Confirm transaction (costs ETH + gas)
7. Wait for confirmation

**Result:**
- You own `myproject.eth`
- Shown in "My Names"

#### Step 5: Wrap Domain

**Why?** Wrapping enables fuses for immutability.

1. Click on your domain
2. Click "Wrap"
3. Confirm transaction
4. Wait for confirmation

**Verify:**
- Domain shows "Wrapped" badge
- NameWrapper is now the owner

### Option B: Use Existing Domain

If you already own an ENS domain:

#### Step 1: Check if Wrapped

1. Go to https://app.ens.domains
2. Connect wallet
3. Click "My Names"
4. Click your domain

**Check:**
- "Wrapped" badge present? → Continue to Step 3
- No "Wrapped" badge? → Go to Step 2

#### Step 2: Wrap Domain

1. Click "Wrap" or "Upgrade"
2. Confirm transaction
3. Wait for confirmation

#### Step 3: Transfer to Safe (for Safe-owns-parent mode)

**Only do this if you want Safe to own the parent domain** (see [Deployment Modes](#deployment-modes))

1. Click "Transfer"
2. Enter Safe address (from Safe setup below)
3. Confirm transaction
4. Wait for confirmation

**Verify:**
- Owner shows Safe address
- You can still manage via Safe UI

### Deployment Modes

**Safe-owns-parent (Recommended):**
- Safe owns the parent domain
- Creates subdomains and sets contenthash in one transaction
- No wasted versions if proposals rejected
- Best for teams

**Personal-owns-parent:**
- You own the parent domain
- Create subdomain first, then Safe sets contenthash
- Faster for solo developers
- Wasted versions if proposals rejected

**Our recommendation:** Transfer domain to Safe for production.

---

## Setting Up Safe

### Step 1: Go to Safe

```bash
open https://app.safe.global
```

### Step 2: Create New Safe

1. Click "Create Safe"
2. Select network:
   - **Sepolia** for testing (free testnet ETH)
   - **Mainnet** for production (costs real ETH)

### Step 3: Name Your Safe

1. Enter name (e.g., "MyProject Deployments")
2. Click "Next"

### Step 4: Add Signers

**For solo testing:**
- Add just your wallet
- Threshold: 1 of 1

**For team (recommended):**

1. Add signer addresses:
   ```
   Owner 1: 0x1234... (You)
   Owner 2: 0x5678... (Team member)
   Owner 3: 0x9abc... (Team member)
   ```

2. Set threshold e.g.: 2 of 3
   - Requires 2 signatures to execute
   - Prevents single person from deploying malicious updates

3. Click "Next"

### Step 5: Review and Deploy

1. Review settings:
   - Network: Sepolia
   - Owners: 3
   - Threshold: 2
   - Estimated fee: ~0.01 ETH

2. Click "Create"
3. Confirm transaction in wallet
4. Wait for confirmation (~30 seconds)

**Result:**
- Safe created!
- Safe address: `0xA5E...61A3`
- **Copy this address** - you'll need it

### Step 6: Fund Safe (Optional)

If Safe will execute transactions (not just propose):

```bash
# Send some ETH to Safe address
# Via MetaMask or your wallet
```

**How much?**
- Testnet: 0.1 ETH (plenty for testing)
- Mainnet: 0.05 ETH (covers ~20 deployments)

### Step 7: Get Safe API Key

1. Go to [https://developer.safe.global](https://developer.safe.global)
2. Click "Sign Up" or "Log In"
3. Create new API key:
   - Name: "MyProject Deployments"
   - Click "Create"
4. Copy API key: `sk_live_abc123def456...`
5. **Save securely** - you'll need it

---

## Project Configuration

### Step 1: Navigate to Your Project

```bash
cd /path/to/your/frontend/project
```

**Example:**
```bash
cd ~/projects/my-react-app
```

### Step 2: Initialize Autark Config

```bash
autark init
```

**Interactive prompts:**

```
? ENS parent domain: myproject.eth
? Safe address: 0xA5E...61A3
? Network (mainnet/sepolia): sepolia
? RPC URL: https://sepolia.infura.io/v3/YOUR_KEY
```

**Getting RPC URL:**

**Option 1: Public RPC (free, rate-limited)**
```
https://ethereum-sepolia-rpc.publicnode.com
```

**Option 2: Infura (free tier)**
1. Go to https://infura.io
2. Sign up
3. Create new project
4. Copy Sepolia endpoint:
   ```
   https://sepolia.infura.io/v3/abc123def456...
   ```

**Option 3: Alchemy (free tier)**
1. Go to https://alchemy.com
2. Sign up
3. Create new app (Sepolia)
4. Copy HTTPS endpoint

**Result:**

Creates `secure-deploy.config.yaml`:
```yaml
network: sepolia
rpcUrl: https://sepolia.infura.io/v3/abc123...
ensDomain: myproject.eth
safeAddress: 0xA5ED8dd265c8e9154FaBf8E66Cb3aF16002261A3
safeApiKey: sk_live_abc123def456...
ownerPrivateKey: 0xabc123def456...
```

### Step 3: Create .env File

```bash
# Create .env file
touch .env
```

**Edit .env:**
```bash
# Network RPC
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/abc123...

# Safe configuration
SAFE_ADDRESS=0xA5ED8dd265c8e9154FaBf8E66Cb3aF16002261A3
SAFE_API_KEY=sk_live_abc123def456...

# ENS domain
SEPOLIA_ENS_DOMAIN=myproject.eth

# Private key (one of the Safe signers)
SEPOLIA_OWNER_PK=0xabc123def456...
```

**Getting your private key:**

**MetaMask:**
1. Click account icon → Account Details
2. Click "Show private key"
3. Enter password
4. Copy private key

**⚠️ Security Warning:**
- Never commit `.env` to git
- Use different key for testnet vs mainnet
- Consider hardware wallet for mainnet Safe signers

### Step 4: Update .gitignore

```bash
echo ".env" >> .gitignore
echo "secure-deploy.config.yaml" >> .gitignore
```

**Verify:**
```bash
git status
# .env should NOT appear in untracked files
```

### Step 5: Verify Configuration

```bash
autark status
```

**Expected output:**
```
├─ Configuration ────────────────────────────────────────────────────┤
[i] Network: sepolia
[i] Parent domain: myproject.eth
[i] Safe address: 0xA5ED...61A3
[i] RPC URL: https://sepolia.infura.io/v3/***

├─ ENS Parent Domain ────────────────────────────────────────────────┤
[+] Status: Active
[i] Owner: 0xA5ED...61A3 (Safe)
[i] Wrapped: Yes
[i] Fuses burned: CANNOT_UNWRAP
```

---

## First Deployment

### Step 1: Build Your Frontend

**React / Create React App:**
```bash
npm run build
# Output: build/
```

**Next.js:**
```bash
npm run build
# Output: out/
```

**Vite:**
```bash
npm run build
# Output: dist/
```

**Vue.js:**
```bash
npm run build
# Output: dist/
```

**Verify build directory:**
```bash
ls -la dist/
# Should contain index.html, assets/, etc.
```

### Step 2: Deploy

```bash
autark deploy dist
```

**Replace `dist` with your build directory:**
- React: `build`
- Next.js: `out`
- Vite: `dist`
- Vue: `dist`

### Step 3: Watch the Deployment

**Output:**
```
          _____                    _____                _____                    _____                    _____                    _____          
         /\    \                  /\    \              /\    \                  /\    \                  /\    \                  /\    \         
        /::\    \                /::\____\            /::\    \                /::\    \                /::\    \                /::\____\        
       /::::\    \              /:::/    /            \:::\    \              /::::\    \              /::::\    \              /:::/    /        
      /::::::\    \            /:::/    /              \:::\    \            /::::::\    \            /::::::\    \            /:::/    /         
     /:::/\:::\    \          /:::/    /                \:::\    \          /:::/\:::\    \          /:::/\:::\    \          /:::/    /          
    /:::/__\:::\    \        /:::/    /                  \:::\    \        /:::/__\:::\    \        /:::/__\:::\    \        /:::/____/           
   /::::\   \:::\    \      /:::/    /                   /::::\    \      /::::\   \:::\    \      /::::\   \:::\    \      /::::\    \           
  /::::::\   \:::\    \    /:::/    /      _____        /::::::\    \    /::::::\   \:::\    \    /::::::\   \:::\    \    /::::::\____\________  
 /:::/\:::\   \:::\    \  /:::/____/      /\    \      /:::/\:::\    \  /:::/\:::\   \:::\    \  /:::/\:::\   \:::\____\  /:::/\:::::::::::\    \ 
/:::/  \:::\   \:::\____\|:::|    /      /::\____\    /:::/  \:::\____\/:::/  \:::\   \:::\____\/:::/  \:::\   \:::|    |/:::/  |:::::::::::\____\
\::/    \:::\  /:::/    /|:::|____\     /:::/    /   /:::/    \::/    /\::/    \:::\  /:::/    /\::/   |::::\  /:::|____|\::/   |::|~~~|~~~~~     
 \/____/ \:::\/:::/    /  \:::\    \   /:::/    /   /:::/    / \/____/  \/____/ \:::\/:::/    /  \/____|:::::\/:::/    /  \/____|::|   |          
          \::::::/    /    \:::\    \ /:::/    /   /:::/    /                    \::::::/    /         |:::::::::/    /         |::|   |          
           \::::/    /      \:::\    /:::/    /   /:::/    /                      \::::/    /          |::|\::::/    /          |::|   |          
           /:::/    /        \:::\__/:::/    /    \::/    /                       /:::/    /           |::| \::/____/           |::|   |          
          /:::/    /          \::::::::/    /      \/____/                       /:::/    /            |::|  ~|                 |::|   |          
         /:::/    /            \::::::/    /                                    /:::/    /             |::|   |                 |::|   |          
        /:::/    /              \::::/    /                                    /:::/    /              \::|   |                 \::|   |          
        \::/    /                \::/____/                                     \::/    /                \:|   |                  \:|   |          
         \/____/                  ~~                                            \/____/                  \|___|                   \|___|          
                                                                                                                                                  

├─ Configuration ────────────────────────────────────────────────────┤
[i] Network: sepolia
[i] Parent domain: myproject.eth
[i] Safe address: 0xA5ED...61A3

├─ IPFS Upload ──────────────────────────────────────────────────────┤
[>  ] Uploading to IPFS via Storacha...
```

**Wait ~30 seconds** (depending on build size)

```
[+] Uploaded to IPFS: bafybeiabc123de...qr678
[i] Size: 2.4 MB
[i] Gateway: https://bafybeiabc123...ipfs.w3s.link
```

**Click the gateway link** to verify your app is on IPFS!

```
├─ ENS Detection ────────────────────────────────────────────────────┤
[i] Checking parent domain ownership...
[+] Mode: Safe-owns-parent (batched deployment)
[i] Next version: v0
[i] Full domain: v0.myproject.eth

├─ Safe Transaction ─────────────────────────────────────────────────┤
[>  ] Creating batched Safe transaction...
[+] Batched transaction created
[i] Operations:
    1. Create subdomain v0.myproject.eth
    2. Set contenthash to IPFS CID

[>  ] Submitting to Safe Transaction Service...
[+] Proposal submitted to Safe

╔════════════════════════════════════════════════════════════════════╗
║                   DEPLOYMENT PROPOSAL CREATED                      ║
╚════════════════════════════════════════════════════════════════════╝

[i] Safe TX Hash: 0xabc123def456...
[i] View in Safe UI: https://app.safe.global/transactions/queue?safe=sep:0xA5ED...

Next Steps:
1. Open Safe UI: https://app.safe.global
2. Review proposal
3. Collect required signatures (2 of 3)
4. Execute transaction
5. Access deployment: https://v0.myproject.eth.limo
```

### Step 4: Approve in Safe UI

**Click the Safe UI link** or go to [https://app.safe.global](https://app.safe.global)

1. **Connect wallet** (must be a Safe signer)

2. **Select your Safe**
   - Click on "MyProject Deployments"

3. **Go to Transactions**
   - Click "Transactions" in sidebar
   - Click "Queue" tab

4. **See your proposal:**
   ```
   Autark Deployment: v0.myproject.eth

   Batch Transaction (2 operations)
   Signatures: 0 / 2
   ```

5. **Click proposal** to view details

6. **Review carefully:**
   - Target contracts (NameWrapper, PublicResolver)
   - Function calls (setSubnodeRecord, setContenthash)
   - Parameters (subdomain name, CID)

7. **Click "Confirm"**
   - MetaMask popup appears
   - Click "Sign" (free, just a signature)
   - Confirmed! (1 / 2 signatures)

### Step 5: Get Second Signature (if threshold > 1)

**If your Safe threshold is 1:**
- Skip to Step 6 (execute immediately)

**If your Safe threshold is 2 or more:**

1. **Notify other signers**
   - Send them Safe UI link
   - Or they can check their Safe UI

2. **Signer 2 connects wallet**

3. **Signer 2 navigates to proposal**

4. **Signer 2 reviews and confirms**
   - Click "Confirm"
   - Sign with wallet
   - Confirmed! (2 / 2 signatures)

5. **Threshold reached!**
   - "Execute" button now appears

### Step 6: Execute Transaction

1. **Click "Execute"**
   - Anyone can execute once threshold is met
   - Usually one of the signers does it

2. **Review gas estimation**
   - Estimated gas: ~250,000
   - Fee: ~0.0075 ETH (on Sepolia, free testnet ETH)

3. **Confirm transaction**
   - MetaMask popup
   - Click "Confirm"
   - Transaction submitted!

4. **Wait for confirmation**
   - Usually 15-30 seconds
   - Watch status in Safe UI
   - "Success" badge appears

**Congratulations! Your first deployment is live!**

### Step 7: Access Your Deployment

**ENS Gateway (.limo):**
```bash
open https://v0.myproject.eth.limo
```

**ENS Gateway (.link):**
```bash
open https://v0.myproject.eth.link
```

**IPFS Gateway:**
```bash
open https://bafybeiabc123...ipfs.w3s.link
```

**Note:** ENS gateways may take 5-15 minutes to propagate. If not working immediately, use IPFS gateway.

### Step 8: Verify Immutability

```bash
autark status --subdomain v0.myproject.eth
```

**Output:**
```
├─ ENS Subdomain: v0.myproject.eth ─────────────────────────────────┤
[+] Status: Active
[i] Owner: 0xA5ED...61A3 (Safe)
[i] Resolver: 0x8FAD...7dD (Public Resolver)
[i] Contenthash: ipfs://bafybeiabc123...
[i] Fuses burned:
    ✓ CANNOT_UNWRAP
    ✓ CANNOT_SET_RESOLVER
    ✓ PARENT_CANNOT_CONTROL
[i] Expiry: 2050-01-01

├─ Verification ─────────────────────────────────────────────────────┤
[+] Subdomain is IMMUTABLE (fuses burned)
[+] Content cannot be changed
[+] Deployment is PERMANENT
```

**What this means:**
1. Nobody can change the contenthash (not even Safe)
2. Nobody can change the resolver
3. Nobody can unwrap the domain
4. Parent cannot revoke the subdomain
5. This deployment will exist forever

---

## Setting Up Git Hooks

### Why Git Hooks?

Automate deployments when you push to specific branches:

```bash
git push origin staging
# ↓
# Automatically triggers deployment
# ↓
# Creates Safe proposal
# ↓
# You approve in Safe UI
# ✓ Live!
```

### Step 1: Run Setup

```bash
autark setup
```

**Interactive prompts:**

```
? Which branch should trigger deployments? staging
? Build output directory? dist
```

**What happens:**
- Creates `.git/hooks/pre-push` file
- Makes it executable
- Configures for your branch and build directory

### Step 2: Verify Hook

```bash
cat .git/hooks/pre-push
```

**Output:**
```bash
#!/bin/bash
# autark pre-push hook

branch=$(git symbolic-ref --short HEAD 2>/dev/null)
DEPLOY_BRANCH="staging"

if [[ "$branch" == "$DEPLOY_BRANCH" ]]; then
  echo "[>  ] autark: Auto-deploying $branch branch..."
  autark deploy dist

  if [ $? -ne 0 ]; then
    echo "[-] Deployment failed. Push cancelled."
    exit 1
  fi

  echo "[+] Deployment proposal created!"
fi
```

### Step 3: Test Hook

**Create staging branch:**
```bash
git checkout -b staging
```

**Make a change:**
```bash
echo "// Test change" >> src/App.js
```

**Commit:**
```bash
git add .
git commit -m "Test auto-deploy"
```

**Push (triggers hook):**
```bash
git push origin staging
```

**What happens:**

```
[>  ] autark: Auto-deploying staging branch...

          _____                    _____                _____                    _____                    _____                    _____          
         /\    \                  /\    \              /\    \                  /\    \                  /\    \                  /\    \         
        /::\    \                /::\____\            /::\    \                /::\    \                /::\    \                /::\____\        
       /::::\    \              /:::/    /            \:::\    \              /::::\    \              /::::\    \              /:::/    /        
      /::::::\    \            /:::/    /              \:::\    \            /::::::\    \            /::::::\    \            /:::/    /         
     /:::/\:::\    \          /:::/    /                \:::\    \          /:::/\:::\    \          /:::/\:::\    \          /:::/    /          
    /:::/__\:::\    \        /:::/    /                  \:::\    \        /:::/__\:::\    \        /:::/__\:::\    \        /:::/____/           
   /::::\   \:::\    \      /:::/    /                   /::::\    \      /::::\   \:::\    \      /::::\   \:::\    \      /::::\    \           
  /::::::\   \:::\    \    /:::/    /      _____        /::::::\    \    /::::::\   \:::\    \    /::::::\   \:::\    \    /::::::\____\________  
 /:::/\:::\   \:::\    \  /:::/____/      /\    \      /:::/\:::\    \  /:::/\:::\   \:::\    \  /:::/\:::\   \:::\____\  /:::/\:::::::::::\    \ 
/:::/  \:::\   \:::\____\|:::|    /      /::\____\    /:::/  \:::\____\/:::/  \:::\   \:::\____\/:::/  \:::\   \:::|    |/:::/  |:::::::::::\____\
\::/    \:::\  /:::/    /|:::|____\     /:::/    /   /:::/    \::/    /\::/    \:::\  /:::/    /\::/   |::::\  /:::|____|\::/   |::|~~~|~~~~~     
 \/____/ \:::\/:::/    /  \:::\    \   /:::/    /   /:::/    / \/____/  \/____/ \:::\/:::/    /  \/____|:::::\/:::/    /  \/____|::|   |          
          \::::::/    /    \:::\    \ /:::/    /   /:::/    /                    \::::::/    /         |:::::::::/    /         |::|   |          
           \::::/    /      \:::\    /:::/    /   /:::/    /                      \::::/    /          |::|\::::/    /          |::|   |          
           /:::/    /        \:::\__/:::/    /    \::/    /                       /:::/    /           |::| \::/____/           |::|   |          
          /:::/    /          \::::::::/    /      \/____/                       /:::/    /            |::|  ~|                 |::|   |          
         /:::/    /            \::::::/    /                                    /:::/    /             |::|   |                 |::|   |          
        /:::/    /              \::::/    /                                    /:::/    /              \::|   |                 \::|   |          
        \::/    /                \::/____/                                     \::/    /                \:|   |                  \:|   |          
         \/____/                  ~~                                            \/____/                  \|___|                   \|___|          
                                                                                                                                                  

├─ Configuration ────────────────────────────────────────────────────┤
[i] Network: sepolia
...

╔════════════════════════════════════════════════════════════════════╗
║                   DEPLOYMENT PROPOSAL CREATED                      ║
╚════════════════════════════════════════════════════════════════════╝

[+] Deployment proposal created!
    Approve in Safe UI to complete deployment.

Enumerating objects: 5, done.
...
To github.com:yourname/yourrepo.git
   abc123..def456  staging -> staging
```

**Success!** Deployment created automatically when pushing.

### Customizing Git Hooks

**Multiple deployment branches:**

Edit `.git/hooks/pre-push`:

```bash
DEPLOY_BRANCHES="staging main production"

if [[ "$DEPLOY_BRANCHES" =~ (^|[[:space:]])$branch($|[[:space:]]) ]]; then
  # Deploy...
fi
```

**Different build directories per branch:**

```bash
if [[ "$branch" == "staging" ]]; then
  BUILD_DIR="dist"
elif [[ "$branch" == "production" ]]; then
  BUILD_DIR="build-prod"
fi

autark deploy $BUILD_DIR
```

**Run tests before deploy:**

```bash
echo "[>  ] Running tests..."
npm test

if [ $? -ne 0 ]; then
  echo "[-] Tests failed. Deploy cancelled."
  exit 1
fi

autark deploy dist
```

---

## Daily Workflow

### Typical Development Cycle

```
┌─────────────────┐
│  1. Develop     │  Make changes to your app
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Test Locally│  npm run dev, verify changes
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. Build       │  npm run build
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. Commit      │  git commit -m "Add feature"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. Push        │  git push origin staging
└────────┬────────┘  (auto-deploys via git hook)
         │
         ▼
┌─────────────────┐
│  6. Review      │  Check Safe UI for proposal
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  7. Approve     │  Sign with required threshold
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  8. Execute     │  Execute transaction
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  9. Verify      │  Visit v{N}.myproject.eth.limo
└─────────────────┘
```

### Example: Adding a New Feature

**Monday: Start Feature**
```bash
git checkout -b feature/new-dashboard
# Develop feature...
npm run dev
# Test locally...
```

**Tuesday: Continue Development**
```bash
# More development...
git commit -m "WIP: dashboard UI"
```

**Wednesday: Ready to Deploy**
```bash
# Finish feature
git commit -m "Complete dashboard feature"

# Merge to staging
git checkout staging
git merge feature/new-dashboard

# Build
npm run build

# Verify build locally
npx serve dist
open http://localhost:3000

# Push (auto-deploys)
git push origin staging
```

**Output:**
```
[>  ] autark: Auto-deploying staging branch...
...
╔════════════════════════════════════════════════════════════════════╗
║                   DEPLOYMENT PROPOSAL CREATED                      ║
╚════════════════════════════════════════════════════════════════════╝

[i] Safe TX Hash: 0xabc...
[i] Next version: v3
[i] View: https://app.safe.global/...

[+] Deployment proposal created!
```

**Wednesday Evening: Team Review**
```bash
# Share with team
# "Hey team, v3 proposal is ready for review in Safe UI"
# "Added new dashboard feature, please approve"
```

**Thursday Morning: Approve & Execute**

1. You (Signer 1) approve via Safe UI
2. Team member (Signer 2) approves
3. You execute transaction
4. Wait 30 seconds for confirmation

**Thursday: Feature Live**
```bash
open https://v3.myproject.eth.limo
# New dashboard visible!

# Notify users
# "v3 is live with new dashboard!"
# "Access: https://v3.myproject.eth.limo"
```

### Handling Urgent Fixes

**Critical bug found in production:**

```bash
# 1. Checkout hotfix branch
git checkout -b hotfix/critical-bug

# 2. Fix bug
# ... edit code ...

# 3. Test thoroughly
npm run dev
npm test

# 4. Build
npm run build

# 5. Deploy immediately (skip git hook)
autark deploy dist --network mainnet

# 6. Notify all signers urgently
# "URGENT: Critical bug fix - v4 proposal needs immediate approval"

# 7. All signers approve ASAP
# 8. Execute
# 9. Verify fix
open https://v4.myproject.eth.limo

# 10. Commit and push after deploy
git commit -m "Fix critical bug"
git push origin hotfix/critical-bug
```

---

## Setting Up CI/CD

### GitHub Actions

#### Step 1: Create Workflow File

```bash
mkdir -p .github/workflows
touch .github/workflows/deploy.yml
```

#### Step 2: Edit Workflow

**File: `.github/workflows/deploy.yml`**

```yaml
name: Autark Deployment

on:
  push:
    branches:
      - main
      - staging
  pull_request:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Install Autark
        run: npm install -g autark

      - name: Install Storacha
        run: npm install -g @storacha/client

      - name: Setup Storacha
        run: |
          mkdir -p ~/.storacha
          echo "${{ secrets.STORACHA_DELEGATION }}" | base64 -d > ~/.storacha/delegation.car

      - name: Deploy
        run: autark deploy dist --network sepolia
        env:
          SEPOLIA_RPC_URL: ${{ secrets.SEPOLIA_RPC_URL }}
          SAFE_ADDRESS: ${{ secrets.SAFE_ADDRESS }}
          SEPOLIA_ENS_DOMAIN: ${{ secrets.SEPOLIA_ENS_DOMAIN }}
          SEPOLIA_OWNER_PK: ${{ secrets.SEPOLIA_OWNER_PK }}
          SAFE_API_KEY: ${{ secrets.SAFE_API_KEY }}
```

#### Step 3: Setup Storacha for CI

**On your local machine:**

```bash
# Create delegation for CI
storacha delegation create \
  --can 'store/*' \
  --expiration '2025-12-31' \
  --output delegation.car

# Base64 encode
cat delegation.car | base64 > delegation.b64

# Copy contents
cat delegation.b64
# Copy output to clipboard
```

#### Step 4: Add GitHub Secrets

1. Go to your GitHub repo
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret:

**Secrets to add:**

| Name | Value | Example |
|------|-------|---------|
| `SEPOLIA_RPC_URL` | Your RPC endpoint | `https://sepolia.infura.io/v3/abc123...` |
| `SAFE_ADDRESS` | Your Safe address | `0xA5ED8dd265c8e9154FaBf8E66Cb3aF16002261A3` |
| `SEPOLIA_ENS_DOMAIN` | Your ENS domain | `myproject.eth` |
| `SEPOLIA_OWNER_PK` | Private key of Safe signer | `0xabc123...` |
| `SAFE_API_KEY` | Safe API key | `sk_live_abc123...` |
| `STORACHA_DELEGATION` | Base64 encoded delegation | (paste contents of delegation.b64) |

#### Step 5: Test CI/CD

```bash
# Make a change
echo "// CI test" >> src/App.js

# Commit
git add .
git commit -m "Test CI/CD deployment"

# Push
git push origin main
```

**What happens:**

1. GitHub Actions triggers
2. Workflow runs:
   - Installs dependencies
   - Runs tests
   - Builds app
   - Uploads to IPFS
   - Creates Safe proposal
3. Check Actions tab in GitHub
4. See deployment log
5. Approve in Safe UI
6. Execute
7. Live!

#### Step 6: View Workflow Status

1. Go to GitHub repo
2. Click "Actions" tab
3. See workflow run
4. Click to view logs

**Successful deployment:**
```
✅ Checkout code
✅ Setup Node.js
✅ Install dependencies
✅ Run tests
✅ Build
✅ Install Autark
✅ Install Storacha
✅ Setup Storacha
✅ Deploy

Deployment proposal created!
Safe TX Hash: 0xabc123...
```

---

## Managing Deployments

### Viewing All Versions

```bash
autark status
```

**Output:**
```
├─ Configuration ────────────────────────────────────────────────────┤
[i] Network: sepolia
[i] Parent domain: myproject.eth

├─ Deployed Versions ────────────────────────────────────────────────┤
[i] Total versions: 5

v0.myproject.eth
  ├─ Owner: 0xA5ED...61A3 (Safe)
  ├─ Contenthash: ipfs://bafybei123...
  ├─ Status: Active, Immutable
  └─ URL: https://v0.myproject.eth.limo

v1.myproject.eth
  ├─ Owner: 0xA5ED...61A3 (Safe)
  ├─ Contenthash: ipfs://bafybei456...
  ├─ Status: Active, Immutable
  └─ URL: https://v1.myproject.eth.limo

v2.myproject.eth
  ├─ Owner: 0xA5ED...61A3 (Safe)
  ├─ Contenthash: ipfs://bafybei789...
  ├─ Status: Active, Immutable
  └─ URL: https://v2.myproject.eth.limo

v3.myproject.eth
  ├─ Owner: 0xA5ED...61A3 (Safe)
  ├─ Contenthash: ipfs://bafybeiabc...
  ├─ Status: Active, Immutable
  └─ URL: https://v3.myproject.eth.limo

v4.myproject.eth
  ├─ Owner: 0xA5ED...61A3 (Safe)
  ├─ Contenthash: ipfs://bafybeidef...
  ├─ Status: Active, Immutable
  └─ URL: https://v4.myproject.eth.limo
```

### Checking Specific Version

```bash
autark status --subdomain v3.myproject.eth
```

**Output:**
```
├─ ENS Subdomain: v3.myproject.eth ─────────────────────────────────┤
[+] Status: Active
[i] Owner: 0xA5ED...61A3 (Safe)
[i] Resolver: 0x8FAD...7dD (Public Resolver)
[i] Contenthash: ipfs://bafybeiabc123def456ghi789jkl012mno345pqr678
[i] Fuses burned:
    ✓ CANNOT_UNWRAP
    ✓ CANNOT_SET_RESOLVER
    ✓ PARENT_CANNOT_CONTROL
[i] Expiry: 2050-01-01

├─ Access URLs ──────────────────────────────────────────────────────┤
[i] ENS Gateway (.limo): https://v3.myproject.eth.limo
[i] ENS Gateway (.link): https://v3.myproject.eth.link
[i] IPFS Gateway: https://bafybeiabc123...ipfs.w3s.link
[i] IPFS Direct: ipfs://bafybeiabc123...

├─ IPFS Content ─────────────────────────────────────────────────────┤
[i] CID: bafybeiabc123def456ghi789jkl012mno345pqr678
[i] Size: 2.4 MB
[i] Files: 42

├─ Verification ─────────────────────────────────────────────────────┤
[+] Subdomain is IMMUTABLE (fuses burned)
[+] Content cannot be changed
[+] Deployment is PERMANENT
```

### Comparing Versions

```bash
# Download two versions
ipfs get bafybei123... -o v0/
ipfs get bafybei456... -o v1/

# Diff directories
diff -r v0/ v1/
```

### Rolling Back (Deploying Old CID)

**Scenario:** v4 has a bug, want to deploy v3's content as v5

```bash
# 1. Get v3's CID
autark status --subdomain v3.myproject.eth
# CID: bafybeiabc123...

# 2. Deploy that CID as v5
# (Feature coming soon - currently need to rebuild)

# Workaround: Download v3 and redeploy
ipfs get bafybeiabc123... -o rollback/
autark deploy rollback/
```

---

## Troubleshooting

### Issue: "Storacha CLI not found"

**Error:**
```
Storacha CLI not found. Install with: npm install -g @storacha/client
```

**Solution:**
```bash
npm install -g @storacha/client
storacha login your-email@example.com
```

### Issue: "Parent domain not wrapped"

**Error:**
```
Parent owner (on-chain): 0x0000000000000000000000000000000000000000
```

**Solution:**
```bash
# 1. Go to ENS Manager
open https://app.ens.domains

# 2. Select your domain
# 3. Click "Wrap"
# 4. Confirm transaction
# 5. Retry deployment
```

### Issue: "Cannot burn fuses - Unauthorised"

**Error:**
```
Failed to burn parent fuses: 0xb455aae8 (Unauthorised)
```

**Cause:** Safe owns domain, but personal wallet tried to burn fuses

**Solution:**

Burn fuses via Safe:

1. Go to [https://app.safe.global](https://app.safe.global)
2. Select your Safe
3. New Transaction → Contract Interaction
4. Enter details:
   ```
   Contract: 0x0635513f179D50A207757E05759CbD106d7dFcE8 (NameWrapper)
   Function: setFuses
   Parameters:
     node: [use namehash tool to get hash of myproject.eth]
     ownerControlledFuses: 1
   ```
5. Create proposal
6. Approve with threshold
7. Execute
8. Retry deployment

**Get namehash:**
```bash
# Use online tool
open https://namehash.online

# Or install ethers
npm install -g ethers

# Run in node
node -e "const ethers = require('ethers'); console.log(ethers.utils.namehash('myproject.eth'))"
```

### Issue: "ENS gateway not loading"

**Symptom:** `https://v0.myproject.eth.limo` shows error or timeout

**Causes & Solutions:**

**1. Gateway propagation delay**
- ENS gateways cache DNS
- Can take 5-15 minutes
- **Solution:** Wait, or use IPFS gateway directly

**2. Testnet domain (Sepolia)**
- .limo/.link don't work for Sepolia
- **Solution:** Use IPFS gateway:
  ```
  https://bafybeiabc123...ipfs.w3s.link
  ```

**3. Contenthash not set**
- Deployment proposal not executed
- **Solution:** Check Safe UI, execute transaction

**4. Wrong contenthash encoding**
- Rare, but possible
- **Solution:** Verify contenthash:
  ```bash
  autark status --subdomain v0.myproject.eth
  # Check contenthash matches expected CID
  ```

### Issue: "Transaction underpriced"

**Error:**
```
Error: transaction underpriced
```

**Cause:** Network congestion, gas price too low

**Solution:**

**For manual tx:**
```bash
# Increase gas in MetaMask
# Click "Edit" on gas
# Set to "Aggressive" or higher
```

**For Safe tx:**
```bash
# Safe automatically handles gas
# Just retry execution
```

### Issue: "Safe proposal not appearing"

**Symptom:** Deployment succeeds, but no proposal in Safe UI

**Causes & Solutions:**

**1. Wrong Safe address**
```bash
# Verify Safe address
cat .env | grep SAFE_ADDRESS
# Should match Safe you're viewing in UI
```

**2. Wrong network**
```bash
# Verify network
cat secure-deploy.config.yaml
# Should match network in Safe UI (top right)
```

**3. Safe API delay**
- Usually propagates in <1 minute
- **Solution:** Refresh page, wait a bit

**4. API key issue**
```bash
# Check API key is valid
echo $SAFE_API_KEY
# Should start with sk_live_ or sk_test_
```

### Issue: "Build directory not found"

**Error:**
```
[-] Directory not found: dist
```

**Solution:**
```bash
# Build first
npm run build

# Check build directory
ls -la dist/

# If different directory, specify
autark deploy build  # for React
autark deploy out    # for Next.js
```

### Issue: "Private key invalid"

**Error:**
```
Error: Invalid private key
```

**Solution:**
```bash
# Ensure private key has 0x prefix
SEPOLIA_OWNER_PK=0xabc123...  # ✓ Correct
SEPOLIA_OWNER_PK=abc123...    # ✗ Wrong

# Ensure no quotes in .env
SEPOLIA_OWNER_PK=0xabc123...  # ✓ Correct
SEPOLIA_OWNER_PK="0xabc..."   # ✗ Wrong (in .env files)
```

### Issue: "Git hook not triggering"

**Symptom:** Push to staging, but deployment doesn't run

**Solutions:**

**1. Hook not executable**
```bash
chmod +x .git/hooks/pre-push
```

**2. Wrong branch**
```bash
# Check current branch
git branch
# Should be: * staging

# Or check hook config
cat .git/hooks/pre-push | grep DEPLOY_BRANCH
# Should match your branch
```

**3. Hook has error**
```bash
# Test hook manually
.git/hooks/pre-push

# Check for errors
# Fix any issues
```

### Getting Help

**Documentation:**
- [Technical Architecture](./TECHNICAL-ARCHITECTURE.md)
- [CI/CD Setup](./CI-CD-SETUP.md)
- [Git Hooks Guide](./GIT-HOOKS.md)

**Community:**
- GitHub Issues: https://github.com/yourorg/autark/issues
- ENS Support: https://discuss.ens.domains
- Safe Support: https://help.safe.global

**Tools:**
- ENS Manager: https://app.ens.domains
- Safe UI: https://app.safe.global
- IPFS Gateway: https://ipfs.io
- Etherscan: https://sepolia.etherscan.io

---

## Summary

**You've learned how to:**

☑ Install Autark and prerequisites
☑ Register and wrap ENS domains
☑ Create and configure Safe multisig
☑ Initialize project configuration
☑ Deploy your first frontend to IPFS + ENS
☑ Set up git hooks for auto-deployment
☑ Configure GitHub Actions CI/CD
☑ Manage and verify deployments
☑ Troubleshoot common issues

**Your workflow is now:**

```
Code → Commit → Push → Auto-Deploy → Review in Safe → Approve → Live!
```

**All deployments are:**
- Decentralized (IPFS)
- Immutable (burned fuses)
- Governed (Safe multisig)
- Permanent (versioned forever)

**Welcome to truly decentralized deployments!**

---

**Built at ETHRome 2025**
