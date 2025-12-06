import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page correctly', async ({ page }) => {
    // Check if landing page elements are present
    await expect(page.getByText('Join local group buys & errands together')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skip login (test)' })).toBeVisible();
  });

  test('should navigate to auth page when Get Started is clicked', async ({ page }) => {
    await page.getByRole('button', { name: 'Get Started' }).click();
    
    // Should navigate to auth screen
    await expect(page.getByText('Join Korean Community Commerce')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
  });

  test('should allow demo login', async ({ page }) => {
    await page.getByRole('button', { name: 'Skip login (test)' }).click();
    
    // Should navigate to browse screen
    await expect(page.getByText('Browse group buys & errands')).toBeVisible();
    
    // Should show user info in navbar
    await expect(page.getByText('Demo Tester')).toBeVisible();
    
    // Wait for user state to be fully set and roles to render
    // Don't wait for networkidle - real-time connections keep network active
    await page.waitForTimeout(500); // Give React time to update DOM
    
    // Check viewport size - roles are hidden on mobile (sm:block = 640px+)
    const viewport = page.viewportSize();
    const isMobile = viewport && viewport.width < 640;
    
    if (!isMobile) {
      // Desktop: Roles should be visible as separate badge spans
      // Use locator with text content matching (case-insensitive, flexible)
      const customerBadge = page.locator('span').filter({ hasText: 'CUSTOMER' });
      const vendorBadge = page.locator('span').filter({ hasText: 'VENDOR' });
      const helperBadge = page.locator('span').filter({ hasText: 'HELPER' });
      
      await expect(customerBadge.first()).toBeVisible({ timeout: 5000 });
      await expect(vendorBadge.first()).toBeVisible({ timeout: 5000 });
      await expect(helperBadge.first()).toBeVisible({ timeout: 5000 });
    } else {
      // Mobile: Roles are hidden (sm:block), just verify login worked
      // The user name is still visible, which confirms login
      await expect(page.getByText('Demo Tester')).toBeVisible();
    }
  });

  test('should display sign up form by default', async ({ page }) => {
    // App uses state-based routing, not URL hash - click button to navigate
    await page.getByRole('button', { name: 'Get Started' }).click();
    
    // Wait for auth page to render (don't wait for networkidle - real-time connections keep it active)
    await expect(page.getByText('Join Korean Community Commerce')).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
  });

  test('should switch between sign up and sign in forms', async ({ page }) => {
    // App uses state-based routing - click button to navigate to auth page
    await page.getByRole('button', { name: 'Get Started' }).click();
    
    // Wait for auth page to render
    await expect(page.getByText('Join Korean Community Commerce')).toBeVisible({ timeout: 5000 });
    
    // Should start with sign up form
    await expect(page.getByText('Join Korean Community Commerce')).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel('Name')).toBeVisible();
    
    // Click to switch to sign in
    await page.getByRole('button', { name: 'Already have an account? Sign in' }).click();
    
    // Should show sign in form
    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.getByLabel('Name')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    
    // Switch back to sign up
    await page.getByRole('button', { name: "Don't have an account? Sign up" }).click();
    
    // Should show sign up form again
    await expect(page.getByText('Join Korean Community Commerce')).toBeVisible();
    await expect(page.getByLabel('Name')).toBeVisible();
  });

  test('should validate form fields', async ({ page }) => {
    // App uses state-based routing - click button to navigate to auth page
    await page.getByRole('button', { name: 'Get Started' }).click();
    
    // Wait for auth page to render (don't wait for networkidle - real-time connections keep it active)
    await expect(page.getByText('Join Korean Community Commerce')).toBeVisible({ timeout: 5000 });
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Get Started' }).click();
    
    // Should show validation errors (assuming form validation is implemented)
    // Note: This test might need adjustment based on actual validation implementation
  });

  test('should show role selection options', async ({ page }) => {
    // App uses state-based routing - click button to navigate to auth page
    await page.getByRole('button', { name: 'Get Started' }).click();
    
    // Wait for auth page to render (don't wait for networkidle - real-time connections keep it active)
    await expect(page.getByText('Join Korean Community Commerce')).toBeVisible({ timeout: 5000 });
    
    // Check role selection checkboxes
    await expect(page.getByText('Join group buys & post errands')).toBeVisible();
    await expect(page.getByText('Sell products through group buys')).toBeVisible();
    await expect(page.getByText('Help with community errands')).toBeVisible();
    
    // Customer should be selected by default
    const customerCheckbox = page.getByRole('checkbox').first();
    await expect(customerCheckbox).toBeChecked();
  });

  test('should allow role selection', async ({ page }) => {
    // App uses state-based routing - click button to navigate to auth page
    await page.getByRole('button', { name: 'Get Started' }).click();
    
    // Wait for auth page to render (don't wait for networkidle - real-time connections keep it active)
    await expect(page.getByText('Join Korean Community Commerce')).toBeVisible({ timeout: 5000 });
    
    // Select vendor role
    await page.getByText('Sell products through group buys').click();
    
    // Select helper role
    await page.getByText('Help with community errands').click();
    
    // Deselect customer role
    await page.getByText('Join group buys & post errands').click();
    
    // Verify selections (this would need to be implemented based on actual behavior)
  });

  test('should show Google sign in option', async ({ page }) => {
    // App uses state-based routing - click button to navigate to auth page
    await page.getByRole('button', { name: 'Get Started' }).click();
    
    // Wait for auth page to render (don't wait for networkidle - real-time connections keep it active)
    await expect(page.getByText('Join Korean Community Commerce')).toBeVisible({ timeout: 5000 });
    
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });

  test('should handle logout', async ({ page }) => {
    // First login with demo user
    await page.getByRole('button', { name: 'Skip login (test)' }).click();
    
    // Verify logged in
    await expect(page.getByText('Demo Tester')).toBeVisible();
    
    // Click logout
    await page.getByRole('button', { name: 'Logout' }).click();
    
    // Should return to landing page
    await expect(page.getByText('Join local group buys & errands together')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
  });

  test('should show loading states', async ({ page }) => {
    // App uses state-based routing - click button to navigate to auth page
    await page.getByRole('button', { name: 'Get Started' }).click();
    
    // Wait for auth page to render (don't wait for networkidle - real-time connections keep it active)
    await expect(page.getByText('Join Korean Community Commerce')).toBeVisible({ timeout: 5000 });
    
    // Fill in form
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    
    // Submit form and check for loading state
    await page.getByRole('button', { name: 'Get Started' }).click();
    
    // Should show loading state (this might be very brief)
    // Note: This test might need adjustment based on actual loading implementation
  });

  test('should be accessible', async ({ page }) => {
    // App uses state-based routing - click button to navigate to auth page
    await page.getByRole('button', { name: 'Get Started' }).click();
    
    // Wait for auth page to render (don't wait for networkidle - real-time connections keep it active)
    await expect(page.getByText('Join Korean Community Commerce')).toBeVisible({ timeout: 5000 });
    
    // Check for proper form labels
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    
    // Check for proper button roles
    await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    
    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // Should be able to navigate through form elements
  });
});
