# Deployment Guide

Complete guide to deploying your Korean Community Commerce app to production.

## 📋 Pre-Deployment Checklist

Before deploying, ensure you've completed:

- [ ] All features tested and working locally
- [ ] Production Supabase project created
- [ ] Production Stripe account set up
- [ ] Environment variables prepared
- [ ] Production build tested locally
- [ ] Domain name ready (optional)

---

## 🚀 Step 1: Set Up Production Environment

### 1.1 Create Production Supabase Project

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Create a new project** (or use existing):
   - Click "New Project"
   - Choose a name (e.g., "korean-commerce-prod")
   - Select a region closest to your users
   - Set a strong database password
   - Wait for project to initialize (~2 minutes)

3. **Get Production Credentials**:
   - Go to **Settings** → **API**
   - Copy your **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - Copy your **anon/public key** (starts with `eyJ...`)

4. **Set Up Database**:
   - Go to **SQL Editor**
   - Copy and paste the contents of `supabase-setup.sql`
   - Click **Run** to create all tables and policies

5. **Enable Real-time** (if not already enabled):
   - Go to **Database** → **Replication**
   - Enable replication for: `products`, `orders`, `errands`, `applications`, `messages`

6. **Configure Authentication**:
   - Go to **Authentication** → **Providers**
   - Enable **Email** provider
   - Configure **Google OAuth** (if using):
     - Add your production OAuth credentials
     - Set redirect URL: `https://yourdomain.com/auth/callback`

### 1.2 Set Up Production Stripe Account

1. **Switch to Live Mode**:
   - Go to Stripe Dashboard: https://dashboard.stripe.com
   - Toggle from "Test mode" to **"Live mode"**

2. **Get Production Keys**:
   - Go to **Developers** → **API keys**
   - Copy your **Publishable key** (starts with `pk_live_...`)
   - Copy your **Secret key** (starts with `sk_live_...`) - keep this secure!

3. **Configure Webhooks** (for payment events):
   - Go to **Developers** → **Webhooks**
   - Click **Add endpoint**
   - Endpoint URL: `https://yourdomain.com/api/stripe-webhook` (if you add webhook handling)
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### 1.3 Deploy Supabase Edge Function

Deploy your payment function to production:

```bash
# Make sure you're in the project directory
cd C:\Users\kima0\Downloads\korean-commerce-app

# Link to production project (replace with your production project ref)
npx supabase link --project-ref YOUR_PRODUCTION_PROJECT_REF

# Set production Stripe secret key
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_SECRET_KEY

# Deploy the function
npx supabase functions deploy create-payment-intent
```

---

## 🏗️ Step 2: Test Production Build Locally

Before deploying, test your production build:

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

This will:
- Create optimized production files in `dist/` folder
- Start a preview server at `http://localhost:4173`
- Let you test the production build before deploying

**Test Checklist**:
- [ ] App loads correctly
- [ ] Authentication works
- [ ] Navigation works
- [ ] Pages render without errors
- [ ] Check browser console for errors

---

## 🌐 Step 3: Choose Deployment Platform

### Option A: Vercel (Recommended - Easiest)

**Why Vercel?**
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Easy environment variable management
- ✅ Automatic deployments from Git
- ✅ Great performance (CDN)

**Steps**:

1. **Install Vercel CLI** (optional, can use web interface):
   ```bash
   npm install -g vercel
   ```

2. **Deploy via Web Interface**:
   - Go to https://vercel.com
   - Sign up/login with GitHub/GitLab/Bitbucket
   - Click **"Add New Project"**
   - Import your repository
   - Configure:
     - **Framework Preset**: Vite
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
     - **Install Command**: `npm install`

3. **Set Environment Variables**:
   - In Vercel dashboard → **Settings** → **Environment Variables**
   - Add these variables:
     ```
     VITE_SUPABASE_URL=https://your-production-project.supabase.co
     VITE_SUPABASE_ANON_KEY=your-production-anon-key
     VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-production-key
     ```
   - Select **Production**, **Preview**, and **Development** environments
   - Click **Save**

4. **Deploy**:
   - Click **Deploy**
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at `https://your-project.vercel.app`

5. **Custom Domain** (Optional):
   - Go to **Settings** → **Domains**
   - Add your custom domain
   - Follow DNS configuration instructions

### Option B: Netlify

**Steps**:

1. **Go to Netlify**: https://www.netlify.com
2. **Sign up/login** with GitHub/GitLab/Bitbucket
3. **Add New Site** → **Import an existing project**
4. **Configure**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. **Set Environment Variables**:
   - Go to **Site settings** → **Environment variables**
   - Add the same variables as Vercel
6. **Deploy**: Click **Deploy site**

### Option C: GitHub Pages

**Steps**:

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script to `package.json`**:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d dist"
   }
   ```

3. **Update `vite.config.js`** (if exists):
   ```js
   export default {
     base: '/your-repo-name/', // Replace with your GitHub repo name
   }
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

### Option D: Other Platforms

- **Railway**: https://railway.app
- **Render**: https://render.com
- **Cloudflare Pages**: https://pages.cloudflare.com
- **AWS Amplify**: https://aws.amazon.com/amplify/

---

## ⚙️ Step 4: Configure Production Environment Variables

Regardless of platform, set these environment variables:

### Required Variables

```
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key-here
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-production-publishable-key
```

### Optional Variables

```
VITE_SENTRY_DSN=your-sentry-dsn (for error tracking)
VITE_REALTIME_ENABLED=true
VITE_ENABLE_ERROR_REPORTING=true
```

**Important**: 
- Use **production** keys (not test keys)
- Never commit these to Git
- Set them in your hosting platform's dashboard

---

## 🔒 Step 5: Security Checklist

Before going live:

- [ ] **Use production Supabase project** (not development)
- [ ] **Use production Stripe keys** (`pk_live_` and `sk_live_`)
- [ ] **HTTPS enabled** (automatic on Vercel/Netlify)
- [ ] **Review RLS policies** in Supabase
- [ ] **Set up CORS** in Supabase (if needed)
- [ ] **Environment variables** set in hosting platform
- [ ] **Error tracking** configured (Sentry)
- [ ] **Test authentication flows** in production
- [ ] **Test payment flows** with real cards (use Stripe test mode first)
- [ ] **Review Supabase logs** for any errors
- [ ] **Set up monitoring/alerts** (optional)

---

## 🧪 Step 6: Post-Deployment Testing

After deployment, test thoroughly:

### Functional Tests

- [ ] **Homepage loads** correctly
- [ ] **Authentication**:
  - [ ] Sign up works
  - [ ] Sign in works
  - [ ] Google OAuth works (if enabled)
  - [ ] Logout works
- [ ] **Group Buys**:
  - [ ] Products display correctly
  - [ ] Filters work
  - [ ] Join group buy works
  - [ ] Payment flow works
- [ ] **Errands**:
  - [ ] Post errand works
  - [ ] Applications work
  - [ ] Messaging works
- [ ] **Navigation**:
  - [ ] All pages accessible
  - [ ] Mobile navigation works
  - [ ] Responsive design works

### Performance Tests

- [ ] **Page load time** < 3 seconds
- [ ] **Images optimized** and loading quickly
- [ ] **No console errors** in browser
- [ ] **Mobile performance** is good

### Security Tests

- [ ] **HTTPS** is enforced
- [ ] **No sensitive data** in client-side code
- [ ] **Authentication** required for protected routes
- [ ] **Payment data** handled securely (Stripe)

---

## 📊 Step 7: Monitoring & Analytics

### Set Up Error Tracking (Sentry)

1. **Create Sentry account**: https://sentry.io
2. **Create a new project** (React)
3. **Get your DSN**
4. **Add to environment variables**: `VITE_SENTRY_DSN=your-dsn`
5. **Redeploy** your app

### Set Up Analytics (Optional)

- **Google Analytics**: Add tracking code
- **Vercel Analytics**: Built-in if using Vercel
- **Supabase Analytics**: Available in dashboard

### Monitor

- **Supabase Dashboard**: Check logs, database usage
- **Stripe Dashboard**: Monitor payments, webhooks
- **Hosting Platform**: Check build logs, performance

---

## 🔄 Step 8: Continuous Deployment

### Set Up Automatic Deployments

Most platforms support automatic deployments:

1. **Connect your Git repository**
2. **Configure**:
   - **Branch to deploy**: `main` or `master`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
3. **Every push to main** will trigger a new deployment

### Deployment Workflow

```
1. Make changes locally
2. Test locally (npm run dev)
3. Commit and push to Git
4. Platform automatically builds and deploys
5. Test production site
6. Monitor for errors
```

---

## 🐛 Troubleshooting

### Build Fails

- Check build logs in hosting platform
- Ensure all dependencies are in `package.json`
- Check for TypeScript/ESLint errors: `npm run lint`

### Environment Variables Not Working

- Verify variables are set in hosting platform
- Check variable names (must start with `VITE_`)
- Redeploy after adding variables

### Supabase Connection Issues

- Verify production Supabase URL and key
- Check Supabase project is active
- Review Supabase logs for errors

### Stripe Payment Issues

- Verify production Stripe keys are set
- Check Stripe dashboard for payment logs
- Ensure HTTPS is enabled (required for Stripe)

### App Not Loading

- Check browser console for errors
- Verify build completed successfully
- Check hosting platform status page
- Review deployment logs

---

## 📝 Quick Reference

### Build Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run E2E tests
```

### Important URLs

- **Supabase Dashboard**: https://app.supabase.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Netlify Dashboard**: https://app.netlify.com

---

## 🎉 You're Live!

Once deployed, your app is accessible to users worldwide. Remember to:

1. **Monitor** for errors and issues
2. **Update** regularly with new features
3. **Backup** your database regularly
4. **Scale** as your user base grows

**Congratulations on deploying your Korean Community Commerce app!** 🚀

---

## Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vitejs.dev/guide/static-deploy.html

