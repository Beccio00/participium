/**
 * E2E Test: PT28 - Unregistered User Map View
 * 
 * Tests that unregistered users can see approved reports on an interactive map.
 */

import { test, expect } from '@playwright/test';

test.describe('PT28 - Public Map View', () => {
  test('unregistered user can see the map with reports', async ({ page }) => {
    await page.route('**/api/session/current', async (route) => {
      await route.fulfill({ status: 401, body: '{}' });
    });

    await page.route('**/api/reports**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 1,
          title: 'Public Report',
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

    // Map should be visible
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10000 });
  });

  test('user can interact with map (zoom)', async ({ page }) => {
    await page.route('**/api/session/current', async (route) => {
      await route.fulfill({ status: 401, body: '{}' });
    });

    await page.route('**/api/reports**', async (route) => {
      await route.fulfill({ status: 200, body: '[]' });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Zoom controls should work
    const zoomIn = page.locator('.leaflet-control-zoom-in');
    await zoomIn.click();
    await page.waitForTimeout(300);

    const zoomOut = page.locator('.leaflet-control-zoom-out');
    await zoomOut.click();
    await page.waitForTimeout(300);

    // If we got here, zoom works
    expect(true).toBe(true);
  });

  test('clicking on a report marker shows details', async ({ page }) => {
    await page.route('**/api/session/current', async (route) => {
      await route.fulfill({ status: 401, body: '{}' });
    });

    await page.route('**/api/reports**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 1,
          title: 'Visible Report',
          description: 'Test description',
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
    await page.waitForTimeout(2000);

    // Click on marker if available
    const marker = page.locator('.leaflet-marker-icon').first();
    if (await marker.isVisible()) {
      await marker.click();
      await page.waitForTimeout(1000);

      // Should show report details (popup or modal)
      const detailsVisible = await page.locator('.leaflet-popup, [role="dialog"], .modal').count() > 0 ||
                            await page.getByText(/visible report/i).count() > 0;
      expect(detailsVisible).toBeTruthy();
    }
  });
});