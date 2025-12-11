/**
 * Test Helper Functions for E2E UI Tests
 * Reusable functions for common testing operations
 */

import { Page, expect } from '@playwright/test';

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Register a new user through the UI
 */
export async function registerUser(
  page: Page,
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<void> {
  await page.goto('/signup');
  await page.fill('input[name="firstName"]', firstName);
  await page.fill('input[name="lastName"]', lastName);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for registration success - now redirects to verify-email
  await expect(page).toHaveURL('/verify-email', { timeout: 10000 });
}

/**
 * Login through the UI
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for successful login
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * Register and login in one step
 */
export async function registerAndLogin(
  page: Page,
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<void> {
  await registerUser(page, email, password, firstName, lastName);
  await login(page, email, password);
}

/**
 * Logout through the UI
 */
export async function logout(page: Page): Promise<void> {
  await page.click('button:has-text("Logout"), a:has-text("Logout")');
  await page.waitForURL('/login', { timeout: 5000 });
}

// ============================================================================
// REPORT HELPERS
// ============================================================================

/**
 * Create a report through the UI
 */
export async function createReport(
  page: Page,
  title: string,
  description: string,
  category: string,
  latitude: string = '45.0704',
  longitude: string = '7.6870'
): Promise<void> {
  // Navigate to create report
  await page.click('button:has-text("Create Report"), a:has-text("Create Report")');
  
  // Fill report form
  await page.fill('input[name="title"]', title);
  await page.fill('textarea[name="description"]', description);
  await page.selectOption('select[name="category"]', category);
  
  // Set location
  await page.fill('input[name="latitude"]', latitude);
  await page.fill('input[name="longitude"]', longitude);
  
  // Upload photo
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'test-photo.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('fake-image-data'),
  });
  
  // Submit report
  await page.click('button[type="submit"]');
  
  // Wait for success message
  await expect(page.locator('text=/report.*created|success/i')).toBeVisible({ timeout: 10000 });
}

/**
 * Navigate to a specific report by ID
 */
export async function goToReport(page: Page, reportId: number): Promise<void> {
  await page.goto(`/reports/${reportId}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Update report status through the UI
 */
export async function updateReportStatus(
  page: Page,
  status: 'IN_PROGRESS' | 'SUSPENDED' | 'RESOLVED'
): Promise<void> {
  await page.click('button:has-text("Update Status")');
  await page.selectOption('select[name="status"]', status);
  await page.click('button:has-text("Confirm")');
  
  // Wait for status update confirmation
  await expect(page.locator(`text="${status}"`)).toBeVisible({ timeout: 5000 });
}

// ============================================================================
// EXTERNAL MAINTAINER HELPERS
// ============================================================================

/**
 * Assign report to external company/maintainer
 */
export async function assignToExternal(
  page: Page,
  companyName?: string,
  maintainerName?: string
): Promise<void> {
  await page.click('button:has-text("Assign to External")');
  
  if (companyName) {
    await page.selectOption('select[name="externalCompany"]', { label: new RegExp(companyName, 'i') });
  } else {
    // Select first option
    await page.selectOption('select[name="externalCompany"]', { index: 0 });
  }
  
  if (maintainerName) {
    await page.selectOption('select[name="externalMaintainer"]', { label: new RegExp(maintainerName, 'i') });
  }
  
  await page.click('button:has-text("Confirm Assignment")');
  
  // Wait for success message
  await expect(page.locator('text=/assigned.*external/i')).toBeVisible({ timeout: 10000 });
}

// ============================================================================
// INTERNAL NOTES HELPERS
// ============================================================================

/**
 * Add an internal note to a report
 */
export async function addInternalNote(
  page: Page,
  content: string
): Promise<void> {
  // Open internal notes section if not already open
  const notesSection = page.locator('.internal-notes-section, [data-testid="internal-notes"]');
  const isVisible = await notesSection.isVisible().catch(() => false);
  
  if (!isVisible) {
    await page.click('button:has-text("Internal Notes")');
  }
  
  // Add note
  await page.fill('textarea[name="internalNote"]', content);
  await page.click('button:has-text("Add Internal Note"), button:has-text("Add Note")');
  
  // Wait for note to appear
  await expect(page.locator(`text="${content}"`)).toBeVisible({ timeout: 5000 });
}

/**
 * Get all internal notes from the page
 */
export async function getInternalNotes(page: Page): Promise<string[]> {
  // Open internal notes section
  await page.click('button:has-text("Internal Notes")');
  
  // Get all note contents
  const noteElements = page.locator('.internal-note, .note-content');
  const count = await noteElements.count();
  
  const notes: string[] = [];
  for (let i = 0; i < count; i++) {
    const content = await noteElements.nth(i).textContent();
    if (content) notes.push(content);
  }
  
  return notes;
}

// ============================================================================
// EMAIL VERIFICATION HELPERS
// ============================================================================

/**
 * Complete email verification process
 */
export async function verifyEmail(
  page: Page,
  email: string,
  code: string
): Promise<void> {
  // Should be on verification page
  await expect(page).toHaveURL('/verify-email');
  
  // Fill verification code
  await page.fill('input[name="verificationCode"]', code);
  await page.click('button:has-text("Verify Email")');
  
  // Wait for success
  await expect(page.locator('text=/verified|success/i')).toBeVisible({ timeout: 10000 });
}

/**
 * Resend verification code
 */
export async function resendVerificationCode(page: Page): Promise<void> {
  await page.click('button:has-text("Resend Code")');
  await expect(page.locator('text=/code.*sent/i')).toBeVisible({ timeout: 5000 });
}

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Navigate to technical panel
 */
export async function goToTechPanel(page: Page): Promise<void> {
  await page.goto('/tech-panel');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to external panel
 */
export async function goToExternalPanel(page: Page): Promise<void> {
  await page.goto('/external-panel');
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to user's reports
 */
export async function goToMyReports(page: Page): Promise<void> {
  await page.goto('/my-reports');
  await page.waitForLoadState('networkidle');
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert that a success message is visible
 */
export async function expectSuccessMessage(
  page: Page,
  messagePattern?: string | RegExp
): Promise<void> {
  const pattern = messagePattern || /success|created|updated|saved/i;
  await expect(page.locator('text=' + pattern)).toBeVisible({ timeout: 5000 });
}

/**
 * Assert that an error message is visible
 */
export async function expectErrorMessage(
  page: Page,
  messagePattern?: string | RegExp
): Promise<void> {
  const pattern = messagePattern || /error|failed|invalid/i;
  await expect(page.locator('.error-message, .alert-danger')).toContainText(pattern, { timeout: 5000 });
}

/**
 * Assert that user is on a specific page
 */
export async function expectUrl(
  page: Page,
  url: string | RegExp,
  timeout: number = 5000
): Promise<void> {
  await page.waitForURL(url, { timeout });
}

// ============================================================================
// DATA GENERATION HELPERS
// ============================================================================

/**
 * Generate unique email for testing
 */
export function generateEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}@test.com`;
}

/**
 * Generate unique name
 */
export function generateName(type: 'first' | 'last' = 'first'): string {
  const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana'];
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Moore'];
  
  const names = type === 'first' ? firstNames : lastNames;
  return names[Math.floor(Math.random() * names.length)] + Date.now().toString().slice(-4);
}

/**
 * Default test password
 */
export const TEST_PASSWORD = 'Test1234!';

// ============================================================================
// CLEANUP HELPERS
// ============================================================================

/**
 * Clear all cookies and storage
 * Note: Page must have navigated to a URL before calling this function
 */
export async function clearSession(page: Page): Promise<void> {
  await page.context().clearCookies();
  // Try to clear storage, but don't fail if page hasn't navigated yet
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (error) {
    // Ignore SecurityError if page is at about:blank
    if (!error.message?.includes('SecurityError')) {
      throw error;
    }
  }
}

/**
 * Take screenshot for debugging
 */
export async function debugScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `test-results/debug-${name}-${Date.now()}.png`, fullPage: true });
}

// ============================================================================
// WAIT HELPERS
// ============================================================================

/**
 * Wait for API request to complete
 */
export async function waitForApiCall(
  page: Page,
  urlPattern: string | RegExp
): Promise<void> {
  await page.waitForResponse(resp => 
    typeof urlPattern === 'string' 
      ? resp.url().includes(urlPattern)
      : urlPattern.test(resp.url())
  );
}

/**
 * Wait for element to be visible
 */
export async function waitForElement(
  page: Page,
  selector: string,
  timeout: number = 5000
): Promise<void> {
  await expect(page.locator(selector)).toBeVisible({ timeout });
}

