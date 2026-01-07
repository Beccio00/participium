/**
 * E2E Test: PT27 - Citizen Email Verification
 * 
 * Tests the email verification flow for new citizen registrations.
 */

import { test, expect } from '@playwright/test';

test.describe('PT27 - Email Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    
    // Mock signup API
    await page.route('**/citizen/signup', async (route) => {
      const post = route.request().postDataJSON() || {};
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: Date.now(),
          firstName: post.firstName || 'Test',
          lastName: post.lastName || 'User',
          email: post.email || 'test@example.com',
          role: 'CITIZEN',
        }),
      });
    });
  });

  test('new user is redirected to email verification after registration', async ({ page }) => {
    await page.goto('/signup');

    // Fill and submit registration form
    await page.fill('input[name="firstName"]', 'New');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', `test-${Date.now()}@test.com`);
    await page.fill('input[name="password"]', 'Test1234!');
    await page.fill('input[name="confirmPassword"]', 'Test1234!');
    await page.click('button[type="submit"]');

    // Should be redirected to verification page
    await expect(page).toHaveURL('/verify-email', { timeout: 10000 });
  });

  test('user can enter verification code', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('input[name="firstName"]', 'Code');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', `code-${Date.now()}@test.com`);
    await page.fill('input[name="password"]', 'Test1234!');
    await page.fill('input[name="confirmPassword"]', 'Test1234!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/verify-email');

    // Enter verification code
    const codeInput = page.locator('input[type="text"]').first();
    await codeInput.fill('123456');
    await expect(codeInput).toHaveValue('123456');
  });

  test('user can request code resend', async ({ page }) => {
    await page.goto('/signup');

    await page.fill('input[name="firstName"]', 'Resend');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', `resend-${Date.now()}@test.com`);
    await page.fill('input[name="password"]', 'Test1234!');
    await page.fill('input[name="confirmPassword"]', 'Test1234!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/verify-email');

    // Resend button should be available
    const resendButton = page.locator('button').filter({ hasText: /resend|reinvia/i }).first();
    await expect(resendButton).toBeVisible();
    await expect(resendButton).toBeEnabled();
  });
});
