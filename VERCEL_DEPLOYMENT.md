# Vercel Deployment Guide

## Required Environment Variables

Set these in your Vercel project settings (Settings → Environment Variables):

### Required:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

### Optional:
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (for payments)
- `VITE_SENTRY_DSN` - Sentry DSN (for error tracking)
- `VITE_PLATFORM_FEE_PERCENT` - Platform fee percentage (default: 5)

## Deployment Steps

1. **Connect Repository to Vercel**
   - Go to Vercel Dashboard
   - Click "Add New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables listed above
   - Make sure to set them for Production, Preview, and Development environments

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

## Troubleshooting

### Build Fails
- Check that all environment variables are set
- Verify Node.js version (Vercel uses Node 18+ by default)
- Check build logs for specific errors

### JSON Import Errors
- The app uses JSON imports for translations - Vite handles these automatically
- If you see import errors, ensure `src/locales/*.json` files exist

### Routing Issues
- The `vercel.json` includes rewrites to handle client-side routing
- All routes redirect to `index.html` for proper SPA behavior

### Large Bundle Size Warning
- The build config includes code splitting to reduce bundle size
- Consider enabling Vercel's Edge Functions for API routes if needed

