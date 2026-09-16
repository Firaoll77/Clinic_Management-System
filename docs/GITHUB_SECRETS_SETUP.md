# GitHub Secrets Setup for CI/CD Pipeline

This document explains the required GitHub Secrets for the CI/CD pipeline.

## Required Secrets

### For Render (Backend Deployment)

1. **RENDER_DEPLOY_HOOK**
   - Go to: Render dashboard → Your backend service → Settings
   - Find the "Deploy Hook" section
   - Copy the deploy hook URL (looks like: `https://api.render.com/deploy/srv-xxxxx`)
   - Add to GitHub: Settings → Secrets → Actions → New repository secret
   - Secret name: `RENDER_DEPLOY_HOOK`
   - Secret value: (paste the deploy hook URL)

### For Vercel (Frontend Deployment)

**No secrets required if using Git integration:**
- Your frontend is deployed via Vercel's Git integration
- When you push to GitHub, Vercel automatically detects and deploys
- Make sure your Vercel project is connected to this GitHub repository
- Ensure automatic deployments are enabled for the master branch

**Optional: If you want manual Vercel deployment control:**
1. **VERCEL_TOKEN**
   - Get from: https://vercel.com/account/tokens
   - Create a new token with "Full Account" scope
   - Add to GitHub: Settings → Secrets → Actions → New repository secret

2. **VERCEL_ORG_ID**
   - Get from: Vercel dashboard → Settings → General
   - Copy the "Organization ID"
   - Add to GitHub: Settings → Secrets → Actions → New repository secret

3. **VERCEL_PROJECT_ID**
   - Get from: Vercel dashboard → Project Settings → General
   - Copy the "Project ID"
   - Add to GitHub: Settings → Secrets → Actions → New repository secret

## Setup Steps

1. Go to your GitHub repository: `Firaoll77/Clinic_Management-System`
2. Click on "Settings" tab
3. Click on "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add the secret name and value
6. Click "Add secret"

## How to Find Render Deploy Hook

1. Log in to your Render dashboard
2. Navigate to your backend service
3. Click on "Settings" tab
4. Scroll down to find "Deploy Hook" section
5. Copy the URL shown there
6. This URL is secret - only share it with trusted systems

## How It Works

- When you push to the master branch
- GitHub Actions runs tests and builds
- If tests pass, it triggers the Render deploy hook
- Render starts a new deployment of your backend
- Vercel automatically deploys the frontend via Git integration

## Testing

After adding the Render deploy hook secret:
1. Push a commit to the master branch
2. Go to GitHub Actions tab to see the workflow running
3. Check Render dashboard to see the deployment starting
4. Verify both frontend and backend are updated

Last tested: 2026-09-16
