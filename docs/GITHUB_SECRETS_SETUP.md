# GitHub Secrets Setup for CI/CD Pipeline

This document explains the required GitHub Secrets for the CI/CD pipeline.

## Required Secrets

### For Vercel (Frontend Deployment)

1. **VERCEL_TOKEN**
   - Get from: https://vercel.com/account/tokens
   - Create a new token with "Full Account" scope
   - Add to GitHub: Settings → Secrets → New repository secret

2. **VERCEL_ORG_ID**
   - Get from: Vercel dashboard → Settings → General
   - Copy the "Organization ID"
   - Add to GitHub: Settings → Secrets → New repository secret

3. **VERCEL_PROJECT_ID**
   - Get from: Vercel dashboard → Project Settings → General
   - Copy the "Project ID"
   - Add to GitHub: Settings → Secrets → New repository secret

### For Render (Backend Deployment)

1. **RENDER_API_KEY**
   - Get from: https://dashboard.render.com/user/settings
   - Scroll to "API Keys" section
   - Create a new API key
   - Add to GitHub: Settings → Secrets → New repository secret

2. **RENDER_BACKEND_DEPLOY_HOOK**
   - Get from: Render dashboard → Your backend service → Settings
   - Look for "Manual Deploy" or "Deploy Hook" section
   - Copy the deploy hook URL
   - Add to GitHub: Settings → Secrets → New repository secret

## Setup Steps

1. Go to your GitHub repository: `Firaoll77/Clinic_Management-System`
2. Click on "Settings" tab
3. Click on "Secrets and variables" → "Actions"
4. Click "New repository secret" for each secret above
5. Add the secret name and value
6. Click "Add secret"

## Alternative: Vercel Git Integration

If you have Vercel connected to your GitHub repository, you can simplify the frontend deployment:

1. In Vercel dashboard, go to your project settings
2. Navigate to "Git" section
3. Ensure "Automatic Deployments" is enabled for the master branch
4. Remove the Vercel deployment step from the CI/CD pipeline if desired

## Testing

After adding secrets, push a commit to trigger the workflow and verify it works correctly.
