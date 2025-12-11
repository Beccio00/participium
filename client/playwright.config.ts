import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E UI Test Configuration
 * For Stories 24, 25, 26, 27
 */
export default defineConfig({
  testDir: './test/e2e-ui',
  
  // Run tests in files in parallel
  fullyParallel: false, // Sequential for database consistency
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: 1, // Single worker for database safety
  
  // Reporter to use
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:5173', // Vite dev server
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run your local dev server before starting the tests
  // Note: Servers are expected to be running manually
  // Backend: cd server && npm run dev (port 3001)
  // Frontend: cd client && npm run dev (port 5173)
  
  // webServer: [
  //   {
  //     command: 'cd ../server && npm run dev',
  //     port: 3001,
  //     timeout: 120 * 1000,
  //     reuseExistingServer: true,
  //   },
  //   {
  //     command: 'npm run dev',
  //     port: 5173,
  //     timeout: 120 * 1000,
  //     reuseExistingServer: true,
  //   },
  // ],
});

