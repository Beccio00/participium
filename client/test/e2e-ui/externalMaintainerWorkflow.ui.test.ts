/**
 * E2E UI Test for Stories 24, 25, 26 - External Maintainer Workflow
 * 
 * Story 24 (PT24): Technical staff assigns reports to external maintainers
 * Story 25 (PT25): External maintainer updates report status
 * Story 26 (PT26): Technical staff/external maintainer exchange internal notes
 * 
 * SIMPLIFIED VERSION - Only basic UI flow tests
 * Full workflow tests with backend integration should be done in backend E2E tests
 */

import { test, expect, Page } from '@playwright/test';

// Helper function for basic registration
async function register(page: Page, email: string, password: string, firstName: string, lastName: string) {
  await page.goto('/signup');
  await page.fill('input[name="firstName"]', firstName);
  await page.fill('input[name="lastName"]', lastName);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to verify-email
  await expect(page).toHaveURL('/verify-email', { timeout: 10000 });
}

test.describe('External Maintainer Workflow - Basic UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    // Navigate to a page first to avoid localStorage SecurityError
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should complete basic registration flow', async ({ page }) => {
    const email = `user-${Date.now()}@test.com`;
    const password = 'Test1234!';

    await register(page, email, password, 'Test', 'User');

    // Verify we're on verification page
    await expect(page).toHaveURL('/verify-email');
    await expect(page.locator('text=/verify.*email/i')).toBeVisible();
  });

  test('should allow navigation to login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  /**
   * Note: Complex workflow tests involving multiple user roles, report management,
   * and business logic are in server/test/e2e/ where they can properly test
   * the full system with backend API and database integration.
   */
});

test.describe('UI Navigation Tests', () => {
  test('should have accessible signup page', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL('/signup');
    
    // Check form fields exist
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should have accessible login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    
    // Check form fields exist
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
