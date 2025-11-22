# Step-by-Step Vercel Deployment Guide

Complete walkthrough for deploying your Korean Commerce App to Vercel.

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] Code pushed to GitHub (repository created)
- [ ] Production Supabase project created
- [ ] Production Stripe account (or test keys for testing)
- [ ] Your environment variables ready:
  - Supabase URL
  - Supabase Anon Key
  - Stripe Publishable Key

---

## 🚀 Step 1: Push Code to GitHub

**If you haven't already:**

1. **Open terminal/PowerShell** in your project directory:
   ```powershell
   cd C:\Users\kima0\Downloads\korean-commerce-app
   ```

2. **Initialize Git** (if not already done):
   ```bash
   git init
   ```

3. **Add all files**:
   ```bash
   git add .
   ```

4. **Commit**:
   ```bash
   git commit -m "Initial commit: Korean Commerce App"
   ```

5. **Create a new repository on GitHub**:
   - Go to https://github.com/new
   - Name it: `korean-commerce-app` (or your preferred name)
   - Choose **Public** or **Private**
   - **Don't** initialize with README (you already have one)
   - Click **Create repository**

6. **Link and push**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/korean-commerce-app.git
   git branch -M main
   git push -u origin main
   ```

Replace `YOUR_USERNAME` with your GitHub username.

---

## 🌐 Step 2: Sign Up / Login to Vercel

1. **Go to Vercel**: https://vercel.com
2. **Click "Sign Up"** (or "Log In" if you have an account)
3. **Choose "Continue with GitHub"** (recommended - easiest)
4. **Authorize Vercel** to access your GitHub account
5. You'll be redirected to the Vercel dashboard

---

## 📦 Step 3: Import Your Project

1. **In Vercel Dashboard**, click **"Add New..."** button (top right)
2. **Select "Project"**
3. **You'll see your GitHub repositories** - find `korean-commerce-app`
4. **Click "Import"** next to your repository

---

## ⚙️ Step 4: Configure Project Settings

Vercel should auto-detect Vite, but verify these settings:

### Framework Preset
- Should show: **"Vite"** (auto-detected)
- If not, select **"Vite"** from the dropdown

### Build Settings
- **Framework Preset**: `Vite`
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (should be auto-filled)
- **Output Directory**: `dist` (should be auto-filled)
- **Install Command**: `npm install` (should be auto-filled)

### Environment Variables
**⚠️ IMPORTANT: Set these BEFORE deploying!**

Click **"Environment Variables"** section and add:

1. **VITE_SUPABASE_URL**
   - Value: `https://axebuotlssslcnxtixqq.supabase.co` (or your production URL)
   - Select: ✅ Production, ✅ Preview, ✅ Development

2. **VITE_SUPABASE_ANON_KEY**
   - Value: Your Supabase anon key (starts with `eyJ...`)
   - Select: ✅ Production, ✅ Preview, ✅ Development

3. **VITE_STRIPE_PUBLISHABLE_KEY**
   - Value: Your Stripe publishable key
     - Test: `pk_test_...` (for testing)
     - Live: `pk_live_...` (for production)
   - Select: ✅ Production, ✅ Preview, ✅ Development

**Click "Save"** after adding each variable.

---

## 🚀 Step 5: Deploy

1. **Click the big "Deploy" button** (bottom of the page)
2. **Wait for build** (~2-3 minutes)
   - You'll see build logs in real-time
   - Watch for any errors
3. **Build complete!** ✅
   - You'll see: "Congratulations! Your project has been deployed"
   - Your app URL: `https://korean-commerce-app-xxxxx.vercel.app`

---

## ✅ Step 6: Verify Deployment

1. **Click "Visit"** or open your deployment URL
2. **Test the app**:
   - [ ] App loads correctly
   - [ ] Can navigate between pages
   - [ ] "Skip login (test)" works
   - [ ] No console errors (check browser DevTools)

### Common Issues:

**Blank page?**
- Check browser console for errors
- Verify environment variables are set correctly
- Check Vercel build logs for errors

**404 errors?**
- Normal - your app uses client-side routing
- Try navigating using the app's navigation buttons

**API errors?**
- Verify Supabase URL and keys are correct
- Check Supabase project is active

---

## 🔄 Step 7: Automatic Deployments (Already Set Up!)

**Good news:** Vercel automatically deploys on every push to GitHub!

- **Push to `main` branch** → Production deployment
- **Create Pull Request** → Preview deployment
- **Every commit** → New deployment

**To update your app:**
1. Make changes locally
2. Commit: `git commit -m "Your changes"`
3. Push: `git push`
4. Vercel automatically builds and deploys!

---

## 🔧 Step 8: Update Environment Variables (If Needed)

**To change environment variables later:**

1. Go to your project in Vercel dashboard
2. Click **"Settings"** tab
3. Click **"Environment Variables"** (left sidebar)
4. Edit or add variables
5. **Redeploy** (Vercel will prompt you)

---

## 🌍 Step 9: Custom Domain (Optional)

**To use your own domain:**

1. In Vercel dashboard → **Settings** → **Domains**
2. Enter your domain: `yourdomain.com`
3. Follow DNS instructions:
   - Add a CNAME record pointing to Vercel
   - Or add A records (Vercel will show IPs)
4. Wait for DNS propagation (~5-30 minutes)
5. Vercel automatically provisions SSL certificate

---

## 📊 Step 10: Monitor Your Deployment

**Vercel Dashboard shows:**
- ✅ Build status
- 📊 Analytics (traffic, performance)
- 🔍 Function logs
- ⚠️ Error tracking

**Check these regularly:**
- **Deployments** tab: See all deployments
- **Analytics** tab: Monitor traffic
- **Logs** tab: Debug issues

---

## 🐛 Troubleshooting

### Build Fails

**Check build logs:**
1. Go to **Deployments** tab
2. Click on failed deployment
3. Check **"Build Logs"** for errors

**Common fixes:**
- Missing dependencies → Check `package.json`
- Environment variable errors → Verify all variables are set
- Build timeout → Contact Vercel support (rare)

### App Doesn't Load

**Check:**
1. Browser console (F12) for errors
2. Vercel function logs
3. Environment variables are correct
4. Supabase project is active

### Environment Variables Not Working

**Verify:**
1. Variables are set in Vercel dashboard
2. Variable names start with `VITE_` (required for Vite)
3. Selected for correct environments (Production/Preview/Development)
4. Redeploy after adding variables

---

## 🎉 Success!

Once deployed, your app is:
- ✅ Live on the internet
- ✅ Accessible worldwide
- ✅ Automatically deploying on every push
- ✅ Using HTTPS (secure)
- ✅ Fast (CDN-powered)

**Your app URL format:**
- Production: `https://korean-commerce-app.vercel.app`
- Preview: `https://korean-commerce-app-git-branch.vercel.app`

---

## 📝 Quick Reference

### Update Your App:
```bash
git add .
git commit -m "Update description"
git push
# Vercel automatically deploys!
```

### View Deployments:
- Go to Vercel dashboard → Your project → Deployments

### View Logs:
- Vercel dashboard → Your project → Logs

### Update Environment Variables:
- Vercel dashboard → Settings → Environment Variables

---

## 🆘 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Check build logs** in Vercel dashboard for specific errors

---

**You're all set! Your app is now live on Vercel! 🚀**

