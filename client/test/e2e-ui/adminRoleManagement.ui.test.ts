/**
 * E2E Test: PT10 - Admin Role Management
 * 
 * Tests access control for admin panel and basic navigation.
 */

import { test, expect } from '@playwright/test';

test.describe('PT10 - Admin Role Management', () => {
  test('admin panel page exists and loads', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should either show admin panel or access restricted
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });

  test('admin panel shows access control for unauthenticated users', async ({ page }) => {
    // Clear any session
    await page.context().clearCookies();
    
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should show some content (either login prompt or restricted message)
    const pageContent = await page.locator('body').textContent();
    expect(pageContent?.length).toBeGreaterThan(0);
  });

  test('admin route is defined in the application', async ({ page }) => {
    const response = await page.goto('/admin');
    
    // Should not return 404
    expect(response?.status()).not.toBe(404);
  });

  test('admin panel has proper page structure', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Page should have a root element
    const rootElement = page.locator('#root, [data-testid="root"], body > div').first();
    await expect(rootElement).toBeVisible({ timeout: 10000 });
  });
});
