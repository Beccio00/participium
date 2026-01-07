/**
 * E2E Test: PT24, PT25, PT26 - External Maintainer Workflow
 * 
 * Tests basic authentication and navigation flows.
 * Focuses on user workflows, not UI implementation details.
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {
  test('login page is accessible and has required fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');

    // Login form has required fields
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('signup page is accessible and has required fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL('/signup');

    // Signup form has required fields
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });

  test('homepage is accessible without login', async ({ page }) => {
    await page.route('**/api/session/current', async (route) => {
      await route.fulfill({ status: 401, body: '{}' });
    });
    await page.route('**/api/reports**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Map should be visible for unauthenticated users
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10000 });
  });
});
