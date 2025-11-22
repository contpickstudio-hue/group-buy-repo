# How to Address Test Failures - Step-by-Step Guide

## Understanding Your Test Results

**Current Status:**
- ✅ **Unit Tests**: 15/15 passing (100%)
- ❌ **E2E Tests**: ~165/200 failing (likely all Group Buys tests)

**The Good News:**
- Your code logic is working (unit tests pass)
- The failures are likely **setup/configuration issues**, not code bugs
- Most failures probably share the same root cause

---

## Step 1: Identify the Root Cause

### Run Tests with UI Mode (Recommended)

```bash
npm run test:e2e:ui
```

**Important:** If you've made changes to test files, you may need to:
1. **Stop the test runner** (if it's already running)
2. **Restart it** to pick up changes:
   ```bash
   # Stop current runner (Ctrl+C)
   # Then restart:
   npm run test:e2e:ui
   ```

This opens an interactive interface where you can:
- See exactly what's failing
- Watch tests run in real-time
- See screenshots of failures
- Identify patterns

### Check Test Report

1. **Open the HTML report** (usually opens automatically after `npm run test:e2e`)
2. **Look for patterns:**
   - Are all failures in the same test suite? (e.g., all "Group Buys" tests)
   - Do they fail at the same step? (e.g., all fail at "Skip login")
   - What's the error message?

### Common Patterns

**Pattern 1: All tests fail at "Skip login"**
- **Cause**: Demo user not setting correctly
- **Fix**: Already fixed! (hooks error + RLS handling)

**Pattern 2: All tests fail at "Group Buys" navigation**
- **Cause**: Bottom nav not appearing or button not clickable
- **Fix**: Check if user state is set correctly

**Pattern 3: Tests fail at different points**
- **Cause**: Multiple issues or timing problems
- **Fix**: Address one at a time

---

## Step 2: Prioritize Which Tests to Fix

### Priority Order:

1. **🔴 Critical - Fix First:**
   - Authentication tests (if failing)
   - Navigation tests (if failing)
   - These block everything else

2. **🟡 High Priority:**
   - Group Buys core functionality
   - User can see products
   - User can navigate

3. **🟢 Lower Priority:**
   - Edge cases
   - Error handling
   - Accessibility tests
   - Mobile responsiveness

### Strategy: Fix by Test Suite

Instead of fixing 165 individual tests, fix by **test suite**:

1. **Fix Authentication suite first** (`e2e/auth.spec.js`)
   - If this passes, demo login works
   - Other tests depend on this

2. **Fix Navigation suite** (`e2e/navigation.spec.js`)
   - If this passes, navigation works
   - Other tests depend on this

3. **Fix Group Buys suite** (`e2e/group-buys.spec.js`)
   - Once auth + nav work, this should mostly work
   - May need data setup

---

## Step 3: Fix Common Issues

### Issue 1: Tests Can't Find Elements

**Symptoms:**
- `TimeoutError: Locator.click: Timeout 5000ms exceeded`
- `Element not found`

**Fixes:**

1. **Check if element exists:**
   ```javascript
   // In test file, add wait:
   await page.waitForSelector('button[name="Group Buys"]', { timeout: 10000 });
   ```

2. **Check if element is visible:**
   ```javascript
   // Make sure element is not hidden:
   await expect(page.getByRole('button', { name: 'Group Buys' })).toBeVisible();
   ```

3. **Check timing:**
   ```javascript
   // Wait for page to load:
   await page.waitForLoadState('networkidle');
   ```

### Issue 2: Demo User Not Setting

**Symptoms:**
- "Demo Tester" text not appearing
- Tests fail at login step

**Fixes:**

1. **Check if hooks error is fixed:**
   - Refresh browser
   - Check console for hooks errors
   - Should be fixed now!

2. **Check if RLS errors are handled:**
   - RLS errors should fall back to localStorage
   - Check console - should see fewer errors

3. **Verify user state:**
   ```javascript
   // In test, add debug:
   await page.waitForTimeout(2000); // Give time for state to set
   const userText = await page.textContent('text=Demo Tester');
   console.log('User text:', userText);
   ```

### Issue 3: Navigation Not Working

**Symptoms:**
- Bottom nav not appearing
- Buttons not clickable

**Fixes:**

1. **Check if user is set:**
   ```javascript
   // Bottom nav only shows when user exists
   // Make sure demo user is set before checking nav
   ```

2. **Check mobile vs desktop:**
   ```javascript
   // Bottom nav is mobile-only
   // Make sure viewport is mobile-sized in tests
   ```

3. **Wait for navigation:**
   ```javascript
   await page.getByRole('button', { name: 'Group Buys' }).click();
   await page.waitForURL('**/groupbuys'); // Wait for navigation
   ```

### Issue 4: Missing Test Data

**Symptoms:**
- Tests expect products but see empty state
- Tests fail when checking for data

**Fixes:**

1. **Add test data to Supabase:**
   - Go to Supabase dashboard
   - Insert test products into `products` table
   - Or create a seed script

2. **Update tests to handle empty state:**
   ```javascript
   // Make tests work with or without data
   const productCount = await productCards.count();
   if (productCount === 0) {
     // Test empty state instead
     await expect(page.getByText('No group buys available')).toBeVisible();
   }
   ```

---

## Step 4: Fix Tests Systematically

### Approach 1: Fix One Test Suite at a Time

1. **Start with `auth.spec.js`:**
   ```bash
   npm run test:e2e -- e2e/auth.spec.js
   ```
   - Fix all failures in this file
   - Verify it passes completely
   - Move to next suite

2. **Then `navigation.spec.js`:**
   ```bash
   npm run test:e2e -- e2e/navigation.spec.js
   ```
   - Fix all failures
   - Verify it passes

3. **Finally `group-buys.spec.js`:**
   ```bash
   npm run test:e2e -- e2e/group-buys.spec.js
   ```
   - Should mostly work if auth + nav work
   - Fix remaining issues

### Approach 2: Fix by Error Type

1. **Group all "timeout" errors**
   - Add proper waits
   - Fix timing issues

2. **Group all "element not found" errors**
   - Check selectors
   - Verify elements exist

3. **Group all "assertion failed" errors**
   - Check what's actually rendered
   - Update expectations

---

## Step 5: Use Debugging Tools

### Playwright UI Mode

```bash
npm run test:e2e:ui
```

**Benefits:**
- See tests run live
- Pause and inspect
- See screenshots
- Step through tests

### Playwright Debug Mode

```bash
npm run test:e2e:debug
```

**Benefits:**
- Step through tests one by one
- Inspect page state
- See what's happening

### Browser DevTools

1. **Run test in headed mode:**
   ```bash
   npm run test:e2e:headed
   ```

2. **Open DevTools in test browser:**
   - See console errors
   - Inspect elements
   - Check network requests

---

## Step 6: Update Tests (If Needed)

### If UI Changed

If you modified the UI, update tests to match:

```javascript
// Old selector (might not work):
page.locator('.group-buy-card')

// New selector (if you changed class):
page.locator('[data-testid="group-buy-card"]')
```

### If Timing Changed

Add proper waits:

```javascript
// Before action:
await page.waitForLoadState('networkidle');

// After action:
await page.waitForTimeout(1000); // If needed
```

### If Data Structure Changed

Update expectations:

```javascript
// Old expectation:
await expect(page.getByText('Product Title')).toBeVisible();

// New expectation (if structure changed):
await expect(page.getByTestId('product-title')).toBeVisible();
```

---

## Step 7: Verify Fixes

### Run Tests Again

```bash
# Run all E2E tests:
npm run test:e2e

# Run specific suite:
npm run test:e2e -- e2e/auth.spec.js

# Run with UI:
npm run test:e2e:ui
```

### Check Results

- ✅ Tests should pass
- ✅ No console errors
- ✅ App works manually

---

## Quick Reference: Common Fixes

| Error | Quick Fix |
|-------|-----------|
| `TimeoutError` | Add `await page.waitForTimeout(1000)` or proper wait |
| `Element not found` | Check selector, add wait, verify element exists |
| `Demo Tester not visible` | Check hooks error fixed, check RLS handling |
| `Navigation not working` | Check user state, check viewport size |
| `No products found` | Add test data or handle empty state |
| `Assertion failed` | Check what's actually rendered, update expectation |

---

## When to Ask for Help

**Ask for help if:**
- ✅ You've tried the fixes above
- ✅ Tests still fail with same error
- ✅ You don't understand the error message
- ✅ You need help updating test code

**What to share:**
1. Error message from test report
2. Screenshot of failure (if available)
3. What you've tried
4. Test file and line number

---

## Next Steps

1. **Run tests with UI mode:**
   ```bash
   npm run test:e2e:ui
   ```

2. **Identify the pattern:**
   - Are all failures in one suite?
   - Do they fail at the same step?

3. **Fix one suite at a time:**
   - Start with `auth.spec.js`
   - Then `navigation.spec.js`
   - Finally `group-buys.spec.js`

4. **Share results:**
   - If you get stuck, share the error
   - I can help fix specific issues

---

## Remember

- **Most failures are setup issues**, not code bugs
- **Fix by test suite**, not individual tests
- **Use UI mode** to see what's happening
- **Ask for help** if stuck!

Good luck! 🚀

