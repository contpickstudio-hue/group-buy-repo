# Korean Commerce App - Complete Setup Guide

This is your complete setup guide for the Korean Community Commerce application. Follow these steps in order to get everything working.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Supabase Configuration](#supabase-configuration)
4. [Stripe Payment Setup](#stripe-payment-setup)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [Real-time Features](#real-time-features)
8. [Testing Setup](#testing-setup)
9. [Running the Application](#running-the-application)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **npm** (comes with Node.js) or **yarn**
- **Git** installed
- A **Supabase account** ([Sign up](https://supabase.com))
- A **Stripe account** ([Sign up](https://stripe.com)) - for payments

---

## Initial Setup

### 1. Install Dependencies

**If you encounter peer dependency conflicts** (especially with React 19 and Stripe packages), use:

```bash
npm install --legacy-peer-deps
```

Otherwise, use:

```bash
npm install
```

**Note**: The `--legacy-peer-deps` flag tells npm to ignore peer dependency conflicts. This is safe to use here because React 19 is backward compatible with React 18 code, and Stripe packages work fine with React 19 despite their peer dependency declarations.

This installs all required packages including:
- React and Vite
- Supabase client
- Stripe payment libraries
- Testing frameworks (Vitest, Playwright)
- UI libraries (Tailwind CSS, Lucide React)

### 2. Verify Installation

```bash
npm run dev
```

If everything installed correctly, you should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Press `Ctrl+C` to stop the server.

---

## Supabase Configuration

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name**: Your project name
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"**
5. Wait for project to finish setting up (2-3 minutes)

### 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 3. Update Supabase Configuration

**Option A: Update the code directly** (Quick start)

Edit `src/services/supabaseService.js`:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

**Option B: Use environment variables** (Recommended for production)

1. Create `.env` file in root directory:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Update `src/services/supabaseService.js`:
```javascript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hvahurhyuqfieczyqvgr.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-fallback-key';
```

---

## Database Setup

### 1. Create Database Tables

**Easy Option**: Copy and paste the entire `supabase-setup.sql` file (in your project root) into Supabase SQL Editor and run it all at once. This creates all tables, policies, and enables real-time in one go.

**Or** follow the step-by-step instructions below:

In your Supabase dashboard, go to **SQL Editor** and run these SQL commands:

#### Products Table
```sql
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  region TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  deadline DATE,
  delivery_date DATE,
  vendor TEXT,
  target_quantity INTEGER DEFAULT 1,
  current_quantity INTEGER DEFAULT 0,
  image_color TEXT,
  image_data_url TEXT,
  owner_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Users can insert products" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

#### Orders Table
```sql
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  product_id BIGINT REFERENCES products(id),
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  quantity INTEGER DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  group_status TEXT DEFAULT 'open',
  fulfillment_status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  payment_intent_id TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid()::text = customer_email OR 
                    EXISTS (SELECT 1 FROM products WHERE products.id = orders.product_id AND products.owner_email = auth.uid()::text));

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

#### Errands Table
```sql
CREATE TABLE IF NOT EXISTS errands (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  region TEXT NOT NULL,
  budget DECIMAL(10, 2) DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'open',
  requester_email TEXT NOT NULL,
  assigned_helper_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE errands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Errands are viewable by everyone" ON errands
  FOR SELECT USING (true);

CREATE POLICY "Users can create errands" ON errands
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

#### Applications Table
```sql
CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  errand_id BIGINT REFERENCES errands(id),
  helper_email TEXT NOT NULL,
  offer_amount DECIMAL(10, 2),
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applications are viewable by requester and helper" ON applications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM errands WHERE errands.id = applications.errand_id AND errands.requester_email = auth.uid()::text) OR
    applications.helper_email = auth.uid()::text
  );
```

#### Messages Table
```sql
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  errand_id BIGINT REFERENCES errands(id),
  sender_email TEXT NOT NULL,
  receiver_email TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (
    sender_email = auth.uid()::text OR receiver_email = auth.uid()::text
  );
```

#### App State Table (for key-value storage)
```sql
CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own state" ON app_state
  FOR ALL USING (auth.role() = 'authenticated');
```

### 2. Enable Real-time (Optional but Recommended)

In Supabase SQL Editor, run:

```sql
-- Enable real-time for tables
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE errands;
ALTER PUBLICATION supabase_realtime ADD TABLE applications;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### 3. Set Up Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (already enabled by default)

#### Enable Google OAuth (Optional but Recommended)

**Step 1: Create Google OAuth Credentials**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project (or select an existing one):
   - Click the project dropdown at the top
   - Click **"New Project"**
   - Enter a project name (e.g., "Korean Commerce App")
   - Click **"Create"**
   - Wait for project creation, then select it

4. Enable Google+ API:
   - In the left sidebar, go to **"APIs & Services"** → **"Library"**
   - Search for **"Google+ API"** or **"Google Identity"**
   - Click on **"Google+ API"** or **"Google Identity Services API"**
   - Click **"Enable"**

5. Configure OAuth Consent Screen:
   - Go to **"APIs & Services"** → **"OAuth consent screen"**
   - Select **"External"** (unless you have a Google Workspace account)
   - Click **"Create"**
   - Fill in the required information:
     - **App name**: Your app name (e.g., "Korean Commerce App")
     - **User support email**: Your email
     - **Developer contact information**: Your email
   - Click **"Save and Continue"**
   - On **Scopes** page, click **"Save and Continue"** (default scopes are fine)
   - On **Test users** page, click **"Save and Continue"** (skip for now)
   - Review and click **"Back to Dashboard"**

6. Create OAuth 2.0 Credentials:
   - Go to **"APIs & Services"** → **"Credentials"**
   - Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
   - Select **"Web application"** as the application type
   - Give it a name (e.g., "Korean Commerce Web Client")
   - Add **Authorized redirect URIs**:
     ```
     https://axebuotlssslcnxtixqq.supabase.co/auth/v1/callback
     ```
     (Replace `axebuotlssslcnxtixqq` with your Supabase project reference if different)
   - Click **"Create"**
   - **IMPORTANT**: Copy both:
     - **Client ID** (looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
     - **Client Secret** (looks like: `GOCSPX-abcdefghijklmnopqrstuvwxyz`)
   - Keep these safe - you'll need them in the next step

**Step 2: Configure Google Provider in Supabase**

1. Go back to your Supabase dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and click on it
4. Toggle **"Enable Google provider"** to ON
5. Enter your credentials:
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret
6. Click **"Save"**

**Step 3: Test Google OAuth**

1. In your app, try signing in with Google
2. You should be redirected to Google's consent screen
3. After authorizing, you'll be redirected back to your app

**Troubleshooting Google OAuth:**

- **"Redirect URI mismatch"**: 
  - Make sure the redirect URI in Google Console exactly matches: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
  - Check for typos, trailing slashes, or http vs https

- **"OAuth consent screen not configured"**:
  - Complete the OAuth consent screen setup in Google Cloud Console
  - Make sure you've saved all steps

- **"Invalid client"**:
  - Double-check your Client ID and Client Secret are correct
  - Make sure you copied them from the right OAuth client

- **App still in testing mode**:
  - In Google Cloud Console → OAuth consent screen
  - Add test users (your email) if you haven't published the app
  - Or click **"Publish App"** to make it available to all users

**Note**: For production, make sure to:
- Publish your OAuth consent screen in Google Cloud Console
- Add your production domain to authorized domains
- Update redirect URIs if your domain changes

---

## Stripe Payment Setup

### 1. Create Stripe Account*********************************************************************

1. Go to [Stripe.com](https://stripe.com) and sign up
2. Complete account setup
3. Verify your email

### 2. Get Your Stripe API Keys

1. Log into [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (toggle in top right)
3. Go to **Developers** → **API keys**
4. Copy these keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal"

⚠️ **Important**: Never commit secret keys to git!

### 3. Set Up Environment Variables

Add to your `.env` file:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### 4. Install Supabase CLI

**⚠️ Important:** Supabase CLI cannot be installed globally via `npm install -g`. Use one of these methods:

#### Option A: Using Scoop (Recommended for Windows)

1. **Install Scoop** (if not already installed):
   ```powershell
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex
   ```

2. **Install Supabase CLI**:
   ```powershell
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

#### Option B: Using npm (Local Installation)

Install as a dev dependency in your project:
```bash
npm install --save-dev supabase
```

Then use it with `npx`:
```bash
npx supabase --version
npx supabase link --project-ref YOUR_PROJECT_REF
```

#### Option C: Direct Download (Windows)

1. Download the latest release from: https://github.com/supabase/cli/releases
2. Extract the `supabase.exe` file
3. Add it to your system PATH or place it in your project directory

**For this guide, we'll use Option B (npm local) since it's the simplest:**

### 5. Login to Supabase CLI

Before linking your project, you need to authenticate. You have two options:

#### Option A: Interactive Login (Recommended)

Run this command in your terminal:

```bash
# If using npm local installation:
npx supabase login

# If using Scoop or direct download:
supabase login
```

This will:
1. Open your browser automatically
2. Prompt you to log in to Supabase
3. Save your access token locally
4. Allow you to use Supabase CLI commands

#### Option B: Manual Access Token (Alternative)

If the interactive login doesn't work, you can set an access token manually:

1. **Get your access token:**
   - Go to: https://app.supabase.com/account/tokens
   - Click "Generate new token"
   - Copy the token

2. **Set it as an environment variable:**

   **Windows PowerShell:**
   ```powershell
   $env:SUPABASE_ACCESS_TOKEN="sbp_4c318f377e6a28a0445a0d607dab54535b8b4f04"
   ```

   **Windows Command Prompt:**
   ```cmd
   set SUPABASE_ACCESS_TOKEN=your_access_token_here
   ```

   **Linux/Mac:**
   ```bash
   export SUPABASE_ACCESS_TOKEN=your_access_token_here
   ```

   **Note:** This sets it for the current session only. To make it permanent, add it to your `.env` file or system environment variables.

### 6. Link Your Supabase Project

1. Get your project reference ID from Supabase dashboard URL:
   - URL format: `https://app.supabase.com/project/project/axebuotlssslcnxtixqq` 
   - Copy `axebuotlssslcnxtixqq`

2. Link the project:
```bash
# If using npm local installation (Option B):
npx supabase link --project-ref axebuotlssslcnxtixqq

# If using Scoop (Option A) or direct download (Option C):
supabase link --project-ref axebuotlssslcnxtixqq
```

### 7. Set Stripe Secret Key as Supabase Secret

```bash
# If using npm local installation:
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# If using Scoop or direct download:
supabase secrets set STRIPE_SECRET_KEY=sk_test_51RtzTpRgT4QZTE04CwcimMRdl4pXStjZtqDAq9I1OSELsnMLYTHmPxnED6xQ6K3BLHD8Qe8u2PNZH6FzVy3mJMy80016LEh6iK
```

Replace `sk_test_your_secret_key_here` with your actual Stripe secret key.

### 8. Deploy Payment Edge Function

**⚠️ Important:** Make sure you're in the project root directory (`korean-commerce-app`) before running this command!

```bash
# Navigate to your project directory first:
cd C:\Users\kima0\Downloads\korean-commerce-app

# Then deploy (if using npm local installation):
npx supabase functions deploy create-payment-intent

# If using Scoop or direct download:
supabase functions deploy create-payment-intent
```

**Common Issues:**
- **"Cannot find project ref"**: Run `npx supabase link --project-ref axebuotlssslcnxtixqq` first
- **"File not found"**: Make sure you're in the project root directory (where the `supabase` folder is located)
- **"Access token not provided"**: Set your access token: `$env:SUPABASE_ACCESS_TOKEN="sbp_4c318f377e6a28a0445a0d607dab54535b8b4f04"`

**Verify**: Check Supabase dashboard → **Edge Functions** to confirm `create-payment-intent` is listed.

#### How to Verify the Deployment:

1. **Go to your Supabase Dashboard:**
   - Open: https://app.supabase.com/project/axebuotlssslcnxtixqq

2. **Navigate to Edge Functions:**
   - In the left sidebar, click on **"Edge Functions"** (it's under the "Project" section)
   - Or go directly to: https://app.supabase.com/project/axebuotlssslcnxtixqq/functions

3. **What you should see:**
   - A list of deployed Edge Functions
   - You should see `create-payment-intent` in the list
   - It should show status as "Active" or "Deployed"
   - You may see details like:
     - Function name: `create-payment-intent`
     - Status: Active/Deployed
     - Last deployed: [timestamp]
     - Invoke URL: `https://axebuotlssslcnxtixqq.supabase.co/functions/v1/create-payment-intent`

4. **If you don't see it:**
   - Make sure the deployment command completed successfully
   - Check for any error messages in your terminal
   - Try deploying again: `npx supabase functions deploy create-payment-intent`

---

## Environment Variables

Create a `.env` file in the root directory with all your configuration:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Optional: Sentry Error Tracking (for production)
VITE_SENTRY_DSN=your-sentry-dsn-here

# Optional: Feature Flags
VITE_REALTIME_ENABLED=true
VITE_ENABLE_ERROR_REPORTING=true
```

**Important**: 
- Add `.env` to `.gitignore` (should already be there)
- Never commit `.env` files to version control
- Use different keys for development and production

---

## Real-time Features

Real-time features are already implemented and will work automatically once Supabase is configured.

### What's Included:
- ✅ Live product updates
- ✅ Real-time order status changes
- ✅ Instant errand notifications
- ✅ Live messaging
- ✅ Connection status indicators

### Configuration:
No additional setup needed! Real-time works automatically when:
- Supabase is configured correctly
- Real-time is enabled for tables (see Database Setup)
- User is authenticated

---

## Testing Setup

**⚠️ Important:** Always navigate to your project directory first before running any npm commands!

```powershell
# Navigate to project directory:
cd C:\Users\kima0\Downloads\korean-commerce-app
```

### Unit Tests

Tests are already configured. Run:

```bash
# Make sure you're in the project directory first!
cd C:\Users\kima0\Downloads\korean-commerce-app

# Run all tests
npm run test

# Run tests once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage

# Run with UI (requires @vitest/ui - already installed)
npm run test:ui
```

**Note:** If you get a "Cannot find dependency '@vitest/ui'" error, install it:
```bash
npm install --save-dev @vitest/ui@4.0.12 --legacy-peer-deps
```

### End-to-End Tests

E2E (End-to-End) tests simulate real user interactions with your app in a browser. They test complete workflows like logging in, navigating pages, and using features.

```bash
# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests (headless - no browser window)
npm run test:e2e

# Run with browser UI (interactive mode - recommended for debugging)
npm run test:e2e:ui

# Run in headed mode (see browser window)
npm run test:e2e:headed

# Run in debug mode (step through tests)
npm run test:e2e:debug
```

#### Understanding Test Results

When you run `npm run test:e2e`, Playwright opens a **test report page** showing:

**✅ Passes (Green):**
- Tests that completed successfully
- Your app is working correctly for those features
- No action needed

**❌ Fails (Red):**
- Tests that encountered errors
- Indicates something isn't working as expected
- You should investigate and fix these

#### What to Do with Failed Tests

1. **Click on a failed test** in the report to see:
   - What step failed
   - Error message
   - Screenshot at the point of failure
   - Video recording (if enabled)

2. **Use UI mode for better debugging:**
   ```bash
   npm run test:e2e:ui
   ```
   This opens an interactive interface where you can:
   - Watch tests run in real-time
   - See exactly what the browser is doing
   - Pause and inspect elements
   - Step through tests one by one

3. **Common reasons for failures:**

   **🔧 Configuration Issues (You need to fix setup, not code):**
   - **App not running**: Make sure `npm run dev` is running in another terminal
   - **Missing Supabase data**: Tests expect certain data in your database (products, users, etc.)
   - **Environment variables**: `.env` file not configured correctly
   - **Supabase not linked**: Run `npx supabase link --project-ref axebuotlssslcnxtixqq`

   **🐛 Actual Bugs (You may need to fix code):**
   - **App crashes**: JavaScript errors in browser console
   - **Features not working**: Buttons don't work, forms don't submit, etc.
   - **UI elements missing**: Components not rendering correctly

   **📝 Test Issues (You may need to update tests):**
   - **UI changes**: If you modified the UI structure, tests may need updating
   - **Timing issues**: Tests running too fast - may need wait conditions
   - **Test data**: Tests expecting specific data that doesn't exist

4. **Do I Need to Fix Code Myself?**

   **Usually NO - Most failures are setup issues:**
   - ✅ **Configuration problems**: Just need to complete setup steps
   - ✅ **Missing data**: Add test data to Supabase
   - ✅ **App not running**: Start the dev server

   **Sometimes YES - If there are actual bugs:**
   - ❌ **App crashes**: Need to fix JavaScript errors
   - ❌ **Features broken**: Need to fix broken functionality
   - ❌ **UI not working**: Need to fix component issues

   **Help Available:**
   - Share the error messages/screenshots and I can help identify the issue
   - Most setup issues can be resolved by following the setup guide
   - Actual bugs can be fixed together - just share what's failing!

5. **Quick Debugging Steps:**
   ```bash
   # 1. Make sure app is running
   npm run dev
   
   # 2. Check browser console for errors
   # Open http://localhost:5173 and check DevTools console
   
   # 3. Run tests with UI to see what's happening
   npm run test:e2e:ui
   
   # 4. Check Supabase dashboard for data
   # Make sure you have products/users if tests expect them
   ```

#### Test Coverage

Your E2E tests cover:
- ✅ **Authentication**: Login, signup, demo user
- ✅ **Navigation**: Page routing, bottom nav, menus
- ✅ **Group Buys**: Product display, search, filters, joining group buys

**Note**: Some tests may fail initially if:
- Supabase isn't fully configured
- Database tables don't have test data
- The app isn't running (`npm run dev`)

#### Troubleshooting: All Tests Failing

If **ALL** tests are failing (like all 16 Group Buys tests), this usually means a **setup issue**, not code bugs:

**Common Causes:**

1. **App Not Running Properly**
   - Check if `npm run dev` is running
   - Open `http://localhost:5173` in your browser manually
   - Check browser console for JavaScript errors (F12 → Console tab)
   - If you see errors, share them and I can help fix

2. **Demo User Not Setting**
   - The "Skip login (test)" button should set a demo user
   - If "Demo Tester" text doesn't appear, the demo user function may have an issue
   - Check browser console for errors when clicking the button

3. **Navigation Not Working**
   - Bottom navigation only shows when user is logged in
   - If "Group Buys" button isn't visible, the user might not be set correctly
   - Check if the bottom nav bar appears at the bottom of the screen

4. **React Errors**
   - Check browser console (F12) for red error messages
   - Common issues: missing environment variables, Supabase connection errors
   - Share any console errors and I can help fix them

**Quick Debug Steps:**

```bash
# 1. Make sure app is running
npm run dev

# 2. Open browser manually
# Go to http://localhost:5173

# 3. Open DevTools (F12)
# Check Console tab for errors

# 4. Try clicking "Skip login (test)" manually
# See if "Demo Tester" appears in navbar

# 5. Try clicking "Group Buys" button manually
# See if it navigates to the Group Buys page

# 6. Share any errors you see
```

**Most Likely Fix:**
- If you see console errors → Share them, I'll fix the code
- If app loads but buttons don't work → May need to check state management
- If nothing loads → Check `.env` file and Supabase configuration

**Remember:** You don't need to fix code yourself! Share the errors and I'll help fix them.

### Test Cards (Stripe)

When testing payments, use these test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

For all cards:
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

---

## Running the Application

### ⚠️ Important: Don't Open HTML File Directly!

**This is a React/Vite application** - you **cannot** just double-click the `index.html` file. It needs to run through a development server.

### Development Mode (Recommended for Testing)

1. **Open your terminal/command prompt** and navigate to the project directory:
   ```powershell
   cd C:\Users\kima0\Downloads\korean-commerce-app
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Wait for the server to start** - you'll see output like:
   ```
   VITE v7.x.x  ready in xxx ms

   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ```

4. **Open your browser** and go to: [http://localhost:5173](http://localhost:5173)

5. **The app should now load!** You should see the Korean Commerce App interface.

**To stop the server**: Press `Ctrl+C` in the terminal

### Troubleshooting: Blank Page

If you see a blank page:

1. **Check the terminal** - Are there any error messages?
2. **Check browser console** (F12 → Console tab) - Look for errors
3. **Make sure dependencies are installed**:
   ```bash
   npm install --legacy-peer-deps
   ```
4. **Restart the dev server**:
   - Stop it (Ctrl+C)
   - Run `npm run dev` again
5. **Check your `.env` file** - Make sure Supabase credentials are set
6. **Clear browser cache** - Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Production Build

```bash
npm run build
```

Output will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

---

## Quick Setup Checklist

Use this checklist to ensure everything is configured:

### Initial Setup
- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install` or `npm install --legacy-peer-deps` if conflicts)
- [ ] Dev server starts successfully (`npm run dev`)

### Supabase
- [ ] Supabase project created
- [ ] Database tables created (products, orders, errands, applications, messages, app_state)
- [ ] Row Level Security policies configured
- [ ] Real-time enabled for tables
- [ ] Authentication providers configured (Email, Google optional)
- [ ] Supabase URL and keys updated in code or `.env`

### Stripe Payments
- [ ] Stripe account created
- [ ] Stripe API keys obtained (publishable + secret)
- [ ] `.env` file created with `VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] Supabase CLI installed
- [ ] Supabase project linked
- [ ] Stripe secret key set in Supabase secrets
- [ ] Edge function deployed (`create-payment-intent`)

### Testing
- [ ] Unit tests run successfully (`npm run test:run`)
- [ ] E2E tests configured (`npx playwright install`)
- [ ] Test payment completed successfully

### Final Verification
- [ ] App loads without errors
- [ ] Can sign up/sign in
- [ ] Can view products/group buys
- [ ] Can join group buy and see checkout
- [ ] Payment form loads (even if payment fails, form should appear)
- [ ] Real-time updates work (create product in Supabase, see it appear)

---

## Troubleshooting

### Dependency Installation Errors

**Problem**: `npm install` fails with `ERESOLVE` errors, especially React/Stripe conflicts.

**Solutions**:
- ✅ Use `npm install --legacy-peer-deps` to bypass peer dependency conflicts
- ✅ Delete `node_modules` and `package-lock.json`, then reinstall
- ✅ Check Node.js version: `node --version` (should be 18+)
- ✅ If issues persist, try: `npm cache clean --force` then reinstall

### Error ID Appears (e.g., "mi8dv7f5")

**Problem**: You see an error ID in the browser or console.

**Solutions**:
1. **Check Browser Console** (F12 → Console tab):
   - Look for the actual error message (not just the ID)
   - Copy the full error message
   - Check for red error messages

2. **Common Causes**:
   - **Stripe Key Missing**: If you see Stripe errors, add your Stripe key to `.env`
   - **Supabase Connection**: Check if Supabase URL/key are correct
   - **Missing Dependencies**: Run `npm install --legacy-peer-deps`
   - **Port Already in Use**: Try `npm run dev -- --port 3000`

3. **Get Full Error Details**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for error messages (usually in red)
   - Copy the full error text, not just the ID

4. **Check Terminal Output**:
   - Look at the terminal where `npm run dev` is running
   - Check for any error messages there

### Blank Page When Opening HTML File

**Problem**: Opening `index.html` directly shows a blank page.

**Solution**: 
- ✅ **Don't open HTML files directly!** This is a React/Vite app that needs a dev server
- ✅ Run `npm run dev` instead (see "Running the Application" section above)
- ✅ Open the URL shown in terminal (usually http://localhost:5173)

### App Won't Start

**Problem**: `npm run dev` fails or shows errors.

**Solutions**:
- ✅ Check Node.js version: `node --version` (should be 18+)
- ✅ Delete `node_modules` and `package-lock.json`, then `npm install --legacy-peer-deps`
- ✅ Check for port conflicts (try different port: `npm run dev -- --port 3000`)
- ✅ Make sure you're in the project directory when running the command

### Supabase Connection Errors

**Problem**: "Failed to connect to Supabase" or authentication errors.

**Solutions**:
- ✅ Verify Supabase URL and anon key are correct
- ✅ Check Supabase project is active (not paused)
- ✅ Ensure Row Level Security policies allow your operations
- ✅ Check browser console for specific error messages
- ✅ Verify network connectivity

### Payment Form Not Showing

**Problem**: Checkout modal opens but payment form doesn't load.

**Solutions**:
- ✅ Check `VITE_STRIPE_PUBLISHABLE_KEY` is set in `.env`
- ✅ Restart dev server after adding `.env` file
- ✅ Verify key starts with `pk_test_` or `pk_live_`
- ✅ Check browser console for Stripe errors

### Payment Intent Creation Fails

**Problem**: Error when trying to process payment.

**Solutions**:
- ✅ Verify Supabase Edge Function is deployed
- ✅ Check `STRIPE_SECRET_KEY` is set in Supabase secrets
- ✅ Verify secret key starts with `sk_test_` or `sk_live_`
- ✅ Check Supabase function logs in dashboard
- ✅ Ensure you're using test keys in test mode

### Real-time Not Working

**Problem**: Changes don't appear without refresh.

**Solutions**:
- ✅ Verify real-time is enabled for tables (see Database Setup)
- ✅ Check Supabase project has real-time enabled (free tier has limits)
- ✅ Verify user is authenticated
- ✅ Check browser console for WebSocket errors
- ✅ Ensure network allows WebSocket connections

### Database Errors

**Problem**: "Table doesn't exist" or permission errors.

**Solutions**:
- ✅ Verify all tables are created (run SQL from Database Setup)
- ✅ Check Row Level Security policies
- ✅ Verify user is authenticated
- ✅ Check Supabase logs for specific errors

### Build Errors

**Problem**: `npm run build` fails.

**Solutions**:
- ✅ Check for TypeScript/ESLint errors: `npm run lint`
- ✅ Verify all environment variables are set
- ✅ Check for missing dependencies
- ✅ Review build output for specific errors

---

## Project Structure

```
korean-commerce-app/
├── src/
│   ├── components/          # React components
│   │   ├── CheckoutForm.jsx
│   │   ├── CheckoutModal.jsx
│   │   ├── ErrorBoundary.jsx
│   │   └── ...
│   ├── pages/              # Page components
│   │   ├── AuthPage.jsx
│   │   ├── GroupBuysPage.jsx
│   │   └── ...
│   ├── services/            # API services
│   │   ├── supabaseService.js
│   │   ├── paymentService.js
│   │   └── errorService.js
│   ├── stores/             # Zustand state management
│   │   ├── index.js
│   │   ├── userSlice.js
│   │   ├── productSlice.js
│   │   └── ...
│   └── hooks/              # Custom React hooks
│       └── useRealtime.js
├── supabase/
│   └── functions/          # Supabase Edge Functions
│       └── create-payment-intent/
├── e2e/                    # End-to-end tests
├── .env                    # Environment variables (create this)
├── package.json
└── vite.config.js
```

---

## Key Features Implemented

### ✅ Authentication
- Email/password sign up and sign in
- Google OAuth (optional)
- Role-based access (Customer, Vendor, Helper)
- Session management

### ✅ Group Buys
- Product listings with filters
- Join group buy functionality
- Payment integration with Stripe
- Real-time participant updates

### ✅ Errands
- Post errands
- Helper applications
- Status tracking
- Real-time notifications

### ✅ Payments
- Stripe integration
- Secure checkout flow
- Escrow functionality
- Payment status tracking

### ✅ Real-time Updates
- Live product updates
- Instant notifications
- Connection status indicators
- Auto-reconnection

### ✅ Error Handling
- Global error boundaries
- User-friendly error messages
- Error logging and tracking
- Retry mechanisms

---

## Next Steps

Once setup is complete:

1. **Test the application**: Sign up, create products, test payments
2. **Customize branding**: Update colors, logos, text in components
3. **Add more products**: Seed database with initial products
4. **Configure production**: Set up production Supabase and Stripe accounts
5. **Deploy**: See **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** for complete deployment instructions

---

## Getting Help

### Documentation
- **Supabase**: https://supabase.com/docs
- **Stripe**: https://stripe.com/docs
- **React**: https://react.dev
- **Vite**: https://vitejs.dev

### Support
- Check browser console for errors
- Review Supabase logs in dashboard
- Check Stripe dashboard for payment issues
- Review function logs in Supabase Edge Functions

---

## Security Checklist

Before going to production:

- [ ] Use production Supabase project
- [ ] Use production Stripe keys (`pk_live_` and `sk_live_`)
- [ ] Enable HTTPS (required for Stripe)
- [ ] Review Row Level Security policies
- [ ] Set up proper CORS settings
- [ ] Configure environment variables in hosting platform
- [ ] Enable error tracking (Sentry)
- [ ] Set up monitoring and alerts
- [ ] Review and test all authentication flows
- [ ] Test payment flows thoroughly

---

## 🎉 You're All Set!

Once you complete all steps above, your Korean Community Commerce app is ready to use. The application includes:

- ✅ Secure authentication
- ✅ Group buy marketplace
- ✅ Errand posting system
- ✅ Payment processing
- ✅ Real-time updates
- ✅ Mobile-responsive design
- ✅ Error handling
- ✅ Testing infrastructure

Happy coding! 🚀

