# CI/CD Setup Guide

This guide explains how to set up automated deployments using GitHub Actions for your ENS + IPFS + Safe deployment workflow.

## Overview

The CI/CD workflow automates your original vision:

```
Git Push → GitHub Actions → Build → IPFS Upload → Safe Proposal →
Human Review → Threshold Approval → ENS Subdomain Creation → Permanent Lock
```

## Prerequisites

1. GitHub repository for your frontend project
2. Safe multisig wallet configured
3. Storacha account for IPFS uploads
4. Sepolia or Mainnet RPC URL

## Setup Steps

### 1. Configure GitHub Secrets

Go to your repository Settings → Secrets and variables → Actions, and add these secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SEPOLIA_RPC_URL` | Alchemy/Infura RPC endpoint | `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY` |
| `SAFE_ADDRESS` | Your Safe multisig address | `0xA5ED8dd265c8e9154FaBf8E66Cb3aF16002261A3` |
| `SEPOLIA_ENS_DOMAIN` | ENS parent domain on Sepolia | `myproject.eth` |
| `SEPOLIA_OWNER_PK` | Safe signer private key | `0xfd4e02...` |
| `SAFE_API_KEY` | Safe Transaction Service API key | `sk_live_abc123...` |
| `STORACHA_TOKEN` | (Optional) Storacha auth token | Get from `storacha token` |

**Security Note:** The `SEPOLIA_OWNER_PK` is only used to *propose* transactions to Safe. It cannot execute transactions alone (requires threshold approvals).

### 2. Install Workflow

Copy the workflow file to your project:

```bash
mkdir -p .github/workflows
cp path/to/autark/.github/workflows/deploy.yml .github/workflows/
```

### 3. Customize Workflow

Edit `.github/workflows/deploy.yml` to match your project:

```yaml
# Change the build command if needed
- name: Build project
  run: npm run build  # or: npm run build:prod, etc.

# Update the build output directory
- name: Deploy to ENS + IPFS
  run: |
    npm run cli -- deploy dist --network sepolia  # Change 'dist' to your build directory
```

### 4. Deployment Modes

The tool auto-detects the deployment mode based on who owns the parent domain:

#### Safe-Owns-Parent Mode (Recommended)

**When:** Safe owns `rome.eth` directly

**Flow:**
1. GitHub Actions builds project
2. Uploads to IPFS
3. Creates **batched** Safe transaction:
   - Transaction 1: Create subdomain `v0.rome.eth`
   - Transaction 2: Set contenthash to IPFS CID
4. Both transactions submitted to Safe as single proposal
5. Team reviews and approves
6. Subdomain only created after approval ✅
7. No wasted subdomains if rejected ✅

**Advantages:**
- Atomic: Both operations succeed or fail together
- No wasted subdomains
- Matches original vision

#### Personal-Owns-Parent Mode (Legacy)

**When:** Personal wallet owns `rome.eth`

**Flow:**
1. GitHub Actions builds project
2. Uploads to IPFS
3. Creates subdomain immediately (personal wallet)
4. Proposes contenthash to Safe
5. Team reviews and approves contenthash only

**Disadvantages:**
- If Safe rejects, subdomain exists but is empty
- Version number wasted

### 5. Testing the Workflow

#### Test Locally First

```bash
# Dry run to preview
npm run deploy -- --dry-run

# Real deployment
npm run deploy
```

#### Test on GitHub

1. Push to a test branch:
```bash
git checkout -b test-ci
git push origin test-ci
```

2. Modify workflow to trigger on your test branch:
```yaml
on:
  push:
    branches:
      - test-ci  # Add this temporarily
```

3. Push a commit and watch Actions tab

### 6. Production Deployment

Once tested, merge to main:

```bash
git checkout main
git merge test-ci
git push origin main
```

GitHub Actions will:
1. Build your project
2. Upload to IPFS
3. Create Safe proposal
4. Post comment on commit with Safe URL

Then:
1. Go to Safe UI (link in commit comment)
2. Review the proposal
3. Approve with threshold signers
4. Execute transaction
5. Your site is live at `vX.rome.eth`!

## Workflow Customization

### Change Trigger Events

Deploy only on tags:
```yaml
on:
  push:
    tags:
      - 'v*'
```

Deploy on pull request merge:
```yaml
on:
  pull_request:
    types: [closed]
    branches:
      - main
```

### Add Environment-Specific Deployments

```yaml
jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    steps:
      - run: autark deploy dist --ens-domain staging.rome.eth

  deploy-production:
    if: github.ref == 'refs/heads/main'
    steps:
      - run: autark deploy dist --ens-domain rome.eth
```

### Add Slack/Discord Notifications

```yaml
- name: Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "🚀 New deployment proposal for ${{ github.sha }}"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

## Monitoring

### View Deployment Status

- **GitHub Actions**: Repository → Actions tab
- **Safe Proposals**: https://app.safe.global/transactions/queue?safe=sep:YOUR_SAFE_ADDRESS
- **ENS Status**: `npm run status`

### Debugging Failed Deployments

1. Check GitHub Actions logs
2. Look for error in deployment step
3. Common issues:
   - Storacha not authenticated: Add `STORACHA_TOKEN` secret
   - RPC rate limit: Use Alchemy/Infura with API key
   - Wrong network: Check `--network` flag matches Safe network

## Security Best Practices

1. **Never commit private keys** - Use GitHub Secrets only
2. **Use Safe signer key** - Not the Safe address itself
3. **Require threshold approvals** - Prevents single-point-of-failure
4. **Enable branch protection** - Require PR reviews before main
5. **Audit workflow changes** - Review `.github/workflows/` in PRs

## Example: Complete Setup

```bash
# 1. Setup autark in your project
cd my-frontend-app
npm install -g autark

# 2. Add deploy script to package.json
{
  "scripts": {
    "deploy": "autark deploy dist"
  }
}

# 3. Copy workflow file
mkdir -p .github/workflows
curl -o .github/workflows/deploy.yml \
  https://raw.githubusercontent.com/MihRazvan/ETHRome_hackathon/main/.github/workflows/deploy.yml

# 4. Configure secrets in GitHub UI
# (See step 1 above)

# 5. Test locally
npm run build
npm run deploy -- --dry-run

# 6. Push to main
git add .
git commit -m "Add automated deployments"
git push origin main

# 7. Watch deployment in Actions tab
# 8. Approve in Safe UI
# 9. Done! 🎉
```

## Troubleshooting

### Workflow doesn't trigger

- Check branch name matches workflow trigger
- Verify workflow file is in `.github/workflows/`
- Check GitHub Actions is enabled (Settings → Actions)

### Storacha upload fails

```bash
# Test Storacha locally
storacha login
storacha up ./dist

# Get token for CI
storacha token

# Add to GitHub Secrets as STORACHA_TOKEN
```

### Safe transaction fails

- Verify Safe address matches network
- Check signer has enough ETH for gas
- Confirm Safe threshold is correct
- Check parent domain fuses are burned

## Next Steps

- [Safe Transaction Service API](https://docs.safe.global/safe-core-api/available-services)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [ENS Developer Docs](https://docs.ens.domains/)
