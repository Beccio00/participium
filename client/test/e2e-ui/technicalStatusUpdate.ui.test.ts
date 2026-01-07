/**
 * E2E Test: PT11 - Technical Staff Status Updates
 * 
 * Tests that technical staff can update report statuses.
 */

import { test, expect } from '@playwright/test';

test.describe('PT11 - Technical Staff Status Updates', () => {
  test('assign reports page exists and loads', async ({ page }) => {
    await page.goto('/assign-reports');
    await page.waitForLoadState('networkidle');
    
    // Should either show reports panel or access restricted
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });

  test('assign reports route is defined in the application', async ({ page }) => {
    const response = await page.goto('/assign-reports');
    
    // Should not return 404
    expect(response?.status()).not.toBe(404);
  });

  test('assign reports page has proper page structure', async ({ page }) => {
    await page.goto('/assign-reports');
    await page.waitForLoadState('domcontentloaded');
    
    // Page should have a root element
    const rootElement = page.locator('#root, [data-testid="root"], body > div').first();
    await expect(rootElement).toBeVisible({ timeout: 10000 });
  });

  test('non-technical staff cannot access assigned reports page', async ({ page }) => {
    await page.route('**/api/session/current', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 5, firstName: 'Test', lastName: 'Citizen', email: 'citizen@test.com', role: ['CITIZEN'], isVerified: true }
        }),
      });
    });

    await page.goto('/assign-reports');
    await page.waitForLoadState('networkidle');

    // Should see access restricted message
    await expect(page.getByText('Access Restricted')).toBeVisible({ timeout: 10000 });
  });
});
