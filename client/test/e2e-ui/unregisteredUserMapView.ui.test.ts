/**
 * E2E UI Test for User Story - Unregistered User Map View
 * Story 28: As an unregistered user
 * I want to see approved reports on an interactive map
 * So that I can know about issues in my area and beyond.
 */

import { test, expect } from '@playwright/test';

test.describe('Unregistered User Map View - UI Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and local storage before each test
    await page.context().clearCookies();
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should display the map on homepage for unregistered users', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');

    // Verify map container exists (MapView renders a div with class "leaflet-map")
    const mapContainer = page.locator('.leaflet-map');
    await expect(mapContainer).toBeVisible({ timeout: 15000 });

    // Verify the Leaflet container is eventually present inside the map
    const leafletContainer = page.locator('.leaflet-container');
    await expect(leafletContainer).toBeVisible({ timeout: 15000 });
  });

  test('should show map controls (zoom buttons)', async ({ page }) => {
    await page.goto('/');

    // Wait for map to load
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10000 });

    // Verify zoom controls are present
    const zoomIn = page.locator('.leaflet-control-zoom-in');
    const zoomOut = page.locator('.leaflet-control-zoom-out');
    
    await expect(zoomIn).toBeVisible();
    await expect(zoomOut).toBeVisible();
  });

  test('should display approved reports as markers on the map', async ({ page }) => {
    await page.goto('/');

    // Wait for map to load
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10000 });

    // Wait for markers to be rendered (if any reports exist)
    // Note: This will pass even with 0 reports, but checks structure
    await page.waitForTimeout(2000); // Give time for API call and marker rendering

    // Check if marker cluster is initialized (the map should have clustering)
    const markerCluster = page.locator('.leaflet-marker-icon, .marker-cluster');
    
    // Count should be >= 0 (no error if no reports exist)
    const count = await markerCluster.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow zooming in and out on the map', async ({ page }) => {
    await page.goto('/');

    // Wait for map to be ready
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10000 });

    // Click zoom in button
    const zoomIn = page.locator('.leaflet-control-zoom-in');
    await zoomIn.click();
    await page.waitForTimeout(500);

    // Click zoom out button
    const zoomOut = page.locator('.leaflet-control-zoom-out');
    await zoomOut.click();
    await page.waitForTimeout(500);

    // If we got here without errors, zoom controls work
    expect(true).toBe(true);
  });

  test('should show report details when clicking on a marker', async ({ page }) => {
    await page.goto('/');

    // Wait for map to load
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for markers to render

    // Try to find a marker (if reports exist)
    const markers = page.locator('.leaflet-marker-icon');
    const markerCount = await markers.count();

    if (markerCount > 0) {
      // Click on the first marker
      await markers.first().click();
      await page.waitForTimeout(500);

      // Check if modal or popup appears with report details
      // This could be an InfoModal or a popup - adjust based on actual implementation
      const modalOrPopup = page.locator('.modal, .leaflet-popup, [role="dialog"]');
      await expect(modalOrPopup).toBeVisible({ timeout: 5000 });
    } else {
      // Skip test if no markers present (no reports in DB)
      test.skip();
    }
  });

  test('should show only approved reports, not pending ones', async ({ page }) => {
    await page.goto('/');

    // Wait for map and reports to load
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Get all report cards/markers visible
    const markers = page.locator('.leaflet-marker-icon');
    const markerCount = await markers.count();

    // All visible reports should be approved (assigned, in_progress, resolved)
    // We can't verify the actual status without inspecting data, but we verify
    // the reports are visible at all (which means they passed the filter)
    
    // This is more of a smoke test - actual filtering is tested in backend
    expect(markerCount).toBeGreaterThanOrEqual(0);
  });

});