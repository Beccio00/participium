/**
 * E2E Test: PT30 - Address Search for Reports
 * 
 * Tests the functionality of searching reports by address.
 * Focuses on user workflows, not UI implementation details.
 */

import { test, expect } from '@playwright/test';

test.describe('PT30 - Address Search', () => {
  test('user can search reports by address', async ({ page }) => {
    // Mock geocode API
    await page.route('**/api/geocode**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          latitude: 45.0703,
          longitude: 7.6869,
          zoom: 16,
          bbox: '7.6819,45.0653,7.6919,45.0753'
        }),
      });
    });

    await page.route('**/api/reports**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 1,
          title: 'Test Report',
          category: 'PUBLIC_LIGHTING',
          status: 'ASSIGNED',
          latitude: 45.0703,
          longitude: 7.6869,
          createdAt: new Date().toISOString(),
        }]),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Search for an address
    const searchInput = page.locator('input').first();
    await searchInput.fill('Via Roma, Torino');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(2000);

    // Map should still be visible with results
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('shows error for address outside Turin', async ({ page }) => {
    await page.route('**/api/geocode**', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Address not in Turin' }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input').first();
    await searchInput.fill('Via del Corso, Roma');
    await page.keyboard.press('Enter');
    
    await page.waitForTimeout(1500);

    // Should show error feedback (toast, alert, or text)
    const errorVisible = await page.getByText(/turin|torino|error|invalid/i).count() > 0 ||
                         await page.locator('.toast, [role="alert"]').count() > 0;
    expect(errorVisible).toBeTruthy();
  });
});
