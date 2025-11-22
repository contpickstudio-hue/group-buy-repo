# Fixing Vercel Build Error: "Failed to resolve /src/main.jsx"

## Problem
Vercel build fails with: `Failed to resolve /src/main.jsx from /vercel/path0/index.html`

## Root Cause
The `src/` folder or `main.jsx` file wasn't pushed to GitHub, or Vercel's root directory is misconfigured.

## Solution Steps

### Step 1: Verify Files Are Committed Locally

Check if `src/main.jsx` is tracked by Git:

```powershell
# In PowerShell, navigate to project
cd C:\Users\kima0\Downloads\korean-commerce-app

# Check Git status (if Git is installed)
git status

# Or manually verify the file exists:
Test-Path "src\main.jsx"
```

### Step 2: Ensure All Files Are Committed

If Git is available, make sure all files are committed:

```bash
# Add all files (including src folder)
git add .

# Check what will be committed
git status

# Commit if needed
git commit -m "Ensure src folder is included"

# Push to GitHub
git push
```

### Step 3: Verify Files Are in GitHub

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/korean-commerce-app`
2. Navigate to the `src` folder
3. Verify `main.jsx` exists
4. Verify `index.html` exists in the root

**If `src/` folder is missing from GitHub:**
- The files weren't pushed correctly
- Re-add and push them (see Step 2)

### Step 4: Check Vercel Root Directory Setting

1. Go to Vercel Dashboard → Your Project → **Settings** → **General**
2. Scroll to **Root Directory**
3. **Leave it empty** (should be `./` or blank)
4. **Do NOT** set it to a subdirectory

### Step 5: Verify Vercel Build Settings

In Vercel Dashboard → Your Project → **Settings** → **General**:

- **Framework Preset**: `Vite` (should auto-detect)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Root Directory**: `./` (empty/blank)

### Step 6: Redeploy

1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger auto-deploy

## Alternative: Manual File Check

If you can't use Git, manually verify your GitHub repository has:

```
korean-commerce-app/
├── index.html          ← Must exist
├── package.json        ← Must exist
├── vite.config.js      ← Must exist
├── vercel.json         ← Should exist (we just created it)
└── src/
    └── main.jsx        ← MUST EXIST (this is what's missing!)
```

## Quick Test: Verify Local Build

Before deploying, verify the build works locally:

```powershell
npm run build
```

If this works locally but fails on Vercel, the issue is:
- Files not in GitHub, OR
- Vercel root directory misconfigured

## Still Not Working?

If the build still fails after following these steps:

1. **Check Vercel Build Logs**:
   - Go to failed deployment
   - Click "View Build Logs"
   - Look for file listing - does it show `src/` folder?

2. **Try Manual Root Directory**:
   - In Vercel Settings → General
   - Set **Root Directory** to: `.` (just a dot)
   - Save and redeploy

3. **Verify .gitignore**:
   - Make sure `.gitignore` doesn't exclude `src/`
   - Check that `src/` is not in `.gitignore`

4. **Create a test commit**:
   ```bash
   # Add a comment to src/main.jsx to force a change
   git add src/main.jsx
   git commit -m "Force include src folder"
   git push
   ```

## Expected Result

After fixing, Vercel build should:
- ✅ Install dependencies successfully
- ✅ Find `index.html` in root
- ✅ Resolve `/src/main.jsx` correctly
- ✅ Build successfully
- ✅ Deploy to production

