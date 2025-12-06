# Vercel Deployment Checklist

## ✅ Fixed Issues

1. **Missing Locale Files** - Added all translation JSON files to git:
   - `src/locales/en.json`
   - `src/locales/ko.json`
   - `src/locales/zh.json`
   - `src/locales/hi.json`

2. **Vercel Configuration** - Updated `vercel.json` with:
   - SPA routing rewrites
   - Proper build settings

3. **Build Optimization** - Updated `vite.config.js` with:
   - Code splitting for better performance
   - Reduced bundle size warnings

## 📋 Pre-Deployment Steps

### 1. Commit All Changes
```bash
git add .
git commit -m "Add multilingual support, settings page, and fix Vercel deployment"
git push
```

### 2. Verify Files Are Committed
Make sure these files are in your repository:
- ✅ `src/locales/*.json` (all 4 language files)
- ✅ `src/utils/translations.js`
- ✅ `src/pages/SettingsPage.jsx`
- ✅ `src/pages/OnboardingPage.jsx`
- ✅ `src/pages/GroupBuyDetailPage.jsx`
- ✅ `vercel.json`
- ✅ `vite.config.js`

### 3. Set Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required:**
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key (safe to expose)

**Optional:**
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (safe to expose)
- `VITE_SENTRY_DSN` - Sentry DSN for error tracking

### 4. Verify Build Settings

In Vercel Dashboard → Your Project → Settings → General:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Node.js Version:** 18.x or higher

## 🚀 Deploy

1. Push your changes to GitHub
2. Vercel will automatically detect and deploy
3. Check build logs if deployment fails

## 🔍 Troubleshooting

### Build Fails with "Cannot find module"
- Check that all files are committed to git
- Verify locale JSON files exist in `src/locales/`
- Check build logs for specific missing file

### Environment Variable Errors
- Ensure all required variables are set in Vercel
- Check that variable names match exactly (case-sensitive)
- Verify variables are set for Production environment

### Routing Issues
- Verify `vercel.json` has rewrites configured
- Check that all routes redirect to `/index.html`

### JSON Import Errors
- Ensure `src/locales/*.json` files are committed
- Vite handles JSON imports automatically - no plugin needed

## 📝 Notes

- The locale JSON files were the main issue - they weren't tracked by git
- All `VITE_*` environment variables are safe to expose (they're public keys)
- Secret keys (like `STRIPE_SECRET_KEY`) should only be in Supabase Edge Functions, not Vercel

