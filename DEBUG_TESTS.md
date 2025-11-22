# Debugging Failed E2E Tests

> **See also:** [`FIXING_TEST_FAILURES.md`](./FIXING_TEST_FAILURES.md) for a comprehensive step-by-step guide on addressing test failures.

## Quick Diagnostic Steps

If all your tests are failing, follow these steps to identify the issue:

### Step 1: Check if App Loads Manually

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser:** Go to `http://localhost:5173`

3. **What to check:**
   - ✅ Do you see the landing page?
   - ✅ Do you see "Join local group buys & errands together"?
   - ✅ Do you see the "Skip login (test)" button?

### Step 2: Test Manual Flow

1. **Click "Skip login (test)" button**
   - ✅ Does the page change?
   - ✅ Do you see "Demo Tester" in the top navbar?
   - ✅ Do you see role badges (CUSTOMER, VENDOR, HELPER)?

2. **Check bottom navigation**
   - ✅ Do you see a bottom nav bar with buttons?
   - ✅ Is there a "Group Buys" button?

3. **Click "Group Buys" button**
   - ✅ Does it navigate to Group Buys page?
   - ✅ Do you see "Group Buy Marketplace" heading?

### Step 3: Check Browser Console

1. **Open DevTools:** Press `F12`
2. **Go to Console tab**
3. **Look for red errors**

**Common errors to look for:**
- `Cannot read property 'X' of undefined`
- `Failed to fetch` (Supabase-related)
- `Supabase connection error`
- `Module not found`
- `Maximum update depth exceeded` (React/Zustand issue)
- `checkAuthStatus is not a function`
- `useUserActions is not a function`

**Errors you can IGNORE (these are harmless):**
- ✅ `ERR_BLOCKED_BY_CLIENT` for `r.stripe.com` - This is just an ad blocker blocking Stripe analytics
- ✅ `You may test your Stripe.js integration over HTTP` - Normal warning for development
- ✅ Stripe-related fetch errors if you haven't set up Stripe yet
- ✅ Multiple `ERR_BLOCKED_BY_CLIENT` messages - Just ad blocker doing its job

### Step 4: Check Network Tab

1. **Open DevTools:** Press `F12`
2. **Go to Network tab**
3. **Refresh the page**
4. **Look for failed requests (red)**

**What to check:**
- Are Supabase API calls failing?
- Are there 404 errors?
- Are there CORS errors?

## Common Issues & Fixes

### Issue 1: "Demo Tester" Not Appearing

**Symptoms:**
- Click "Skip login (test)" but no user info appears
- Navbar still shows "Login / Sign Up" button

**Possible Causes:**
- Demo user function not working
- State management issue
- React not re-rendering

**Fix:**
- Check browser console for errors
- Verify `setDemoUser` function is being called
- Check if Zustand store is updating

### Issue 2: "Group Buys" Button Not Visible

**Symptoms:**
- Demo user is set, but no bottom navigation
- Can't click "Group Buys" button

**Possible Causes:**
- Bottom nav only shows when user is logged in
- User state not persisting
- CSS hiding the nav

**Fix:**
- Check if `user` is truthy in BottomNavigation component
- Verify user state is set correctly
- Check browser console for errors

### Issue 3: App Not Loading

**Symptoms:**
- Blank page
- White screen
- Console errors

**Possible Causes:**
- Missing environment variables
- Supabase not configured
- JavaScript errors

**Fix:**
- Check `.env` file exists and has correct values
- Verify Supabase URL and keys are correct
- Fix any console errors

## Running Tests with UI Mode

To see what's happening during tests:

```bash
npm run test:e2e:ui
```

This opens an interactive interface where you can:
- Watch tests run in real-time
- See what the browser is doing
- Pause and inspect elements
- See screenshots of failures

## What to Share for Help

If you need help fixing the tests, share:

1. **Browser Console Screenshot:**
   - Press `F12` → Console tab
   - Screenshot any red errors

2. **Test Failure Details:**
   - Click on a failed test in the report
   - Screenshot the error message
   - Screenshot the failure screenshot

3. **Manual Test Results:**
   - Does the app load manually?
   - Does "Skip login" work?
   - Does "Group Buys" button appear?

4. **Environment Info:**
   - Is `npm run dev` running?
   - What's in your `.env` file? (hide sensitive keys)
   - Any error messages in terminal?

## Next Steps

Once you've gathered this information:
1. Share the details
2. I'll help identify the exact issue
3. I'll fix the code or guide you through setup
4. Tests should pass after fixes

Remember: **You don't need to fix code yourself!** Just share what you find and I'll help fix it.

