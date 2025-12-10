/**
 * E2E UI Test for Story 27 - Citizen Email Verification
 * 
 * Story 27 (PT27): As a citizen, I want to confirm my registration with a verification code
 * so that my account becomes valid and I can start using the system.
 * 
 * SIMPLIFIED VERSION - Only tests UI flow without backend integration
 * Full tests with actual verification codes should be done in backend E2E tests
 * result: Running 8 tests using 1 worker

  ✓  1 …mail Verification (UI) › should navigate to verification page after registration (1.8s)  
  ✓  2 …Citizen Email Verification (UI) › should show resend button on verification page (1.7s)  
  ✓  3 …Citizen Email Verification (UI) › should accept input in verification code field (1.6s) 
   ✓  4 …:3 › UI Elements Validation › should display proper styling on verification page (1.2s)  
   ✓  5 …l Maintainer Workflow - Basic UI Tests › should complete basic registration flow (1.5s) 
  ✓  6 …nal Maintainer Workflow - Basic UI Tests › should allow navigation to login page (1.2s)  
  ✓  7 …kflow.ui.test.ts:61:3 › UI Navigation Tests › should have accessible signup page (1.1s)  
  ✓  8 …kflow.ui.test.ts:73:3 › UI Navigation Tests › should have accessible login page (992ms)
  8 passed (13.7s)

To open last HTML report run:

  npx playwright show-report

 */

import { test, expect } from '@playwright/test';

test.describe('Story 27 - Citizen Email Verification (UI)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and local storage before each test
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should navigate to verification page after registration', async ({ page }) => {
    const email = `newuser-${Date.now()}@test.com`;
    const password = 'Test1234!';

    // Step 1: Navigate to signup page
    await page.goto('/signup');

    // Step 2: Fill registration form
    await page.fill('input[name="firstName"]', 'New');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);

    // Step 3: Submit registration
    await page.click('button[type="submit"]');

    // Step 4: Verify redirect to verification page
    await expect(page).toHaveURL('/verify-email', { timeout: 10000 });

    // Step 5: Verify page content
    await expect(page.locator('text=/verify.*email/i')).toBeVisible();
    await expect(page.locator('text=/30.*minute/i')).toBeVisible();

    // Step 6: Verify input field exists
    const codeInput = page.locator('input[type="text"]').first();
    await expect(codeInput).toBeVisible();

    // Step 7: Verify buttons exist
    await expect(page.locator('button:has-text("Verifica")')).toBeVisible();
    await expect(page.locator('button:has-text("Reinvia")')).toBeVisible();
  });

  test('should show resend button on verification page', async ({ page }) => {
    const email = `resend-${Date.now()}@test.com`;
    const password = 'Test1234!';

    // Register
    await page.goto('/signup');
    await page.fill('input[name="firstName"]', 'Resend');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for verification page
    await expect(page).toHaveURL('/verify-email');

    // Verify resend button exists and is clickable
    const resendButton = page.locator('button:has-text("Reinvia")');
    await expect(resendButton).toBeVisible();
    await expect(resendButton).toBeEnabled();
    
    // Verify button text contains expected Italian text
    await expect(resendButton).toContainText('Reinvia');
    
    // Note: We don't test the actual resend functionality here as it requires
    // backend integration. That's tested in server/test/e2e/
  });

  test('should accept input in verification code field', async ({ page }) => {
    const email = `input-${Date.now()}@test.com`;
    const password = 'Test1234!';

    // Register
    await page.goto('/signup');
    await page.fill('input[name="firstName"]', 'Input');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for verification page
    await expect(page).toHaveURL('/verify-email');

    // Try entering a code
    const codeInput = page.locator('input[type="text"]').first();
    await codeInput.fill('123456');

    // Verify the code was entered
    await expect(codeInput).toHaveValue('123456');
  });

  /**
   * Note: Tests for actual verification code validation, error handling,
   * and full authentication workflow are in server/test/e2e/ where they
   * can properly interact with the backend API and database.
   */
});

test.describe('UI Elements Validation', () => {
  test('should display proper styling on verification page', async ({ page }) => {
    const email = `style-${Date.now()}@test.com`;
    const password = 'Test1234!';

    // Register to get to verification page
    await page.goto('/signup');
    await page.fill('input[name="firstName"]', 'Style');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/verify-email');

    // Check that main container exists
    const container = page.locator('.email-verification-fullscreen');
    await expect(container).toBeVisible();
  });
});
