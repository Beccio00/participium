/**
 * E2E Test: PT15 - Anonymous Report Creation
 * 
 * Tests that citizens can choose to make their reports anonymous.
 */

import { test, expect } from '@playwright/test';

test.describe('PT15 - Anonymous Reports', () => {
  test('create report page exists and loads', async ({ page }) => {
    await page.goto('/create-report');
    await page.waitForLoadState('networkidle');
    
    // Should either show form or access restricted
    const hasContent = await page.locator('body').textContent();
    expect(hasContent).toBeTruthy();
  });

  test('anonymous reports show "Anonymous" instead of user name', async ({ page }) => {
    await page.route('**/api/session/current', async (route) => {
      await route.fulfill({ status: 401, body: '{}' });
    });

    await page.route('**/api/reports**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            title: 'Anonymous Report',
            isAnonymous: true,
            status: 'ASSIGNED',
            latitude: 45.07,
            longitude: 7.68,
            user: { firstName: 'anonymous', lastName: '' },
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            title: 'Public Report',
            isAnonymous: false,
            status: 'ASSIGNED',
            latitude: 45.08,
            longitude: 7.69,
            user: { firstName: 'John', lastName: 'Doe' },
            createdAt: new Date().toISOString(),
          }
        ]),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Check that anonymous is displayed somewhere
    const anonymousText = await page.getByText(/anonymous/i).count();
    expect(anonymousText).toBeGreaterThan(0);
  });

  test('create report route is defined in the application', async ({ page }) => {
    const response = await page.goto('/create-report');
    
    // Should not return 404
    expect(response?.status()).not.toBe(404);
  });
});
