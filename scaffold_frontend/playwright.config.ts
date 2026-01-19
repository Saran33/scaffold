// import { defineConfig, devices } from '@playwright/test';
// import { z } from 'zod';
// import { loadEnvironment, getEnvVar } from './tests/e2e/env';

// loadEnvironment();

// const playwrightConfigSchema = z.object({
//   baseUrl: z.string().url(),
// });

// const parsedConfig = playwrightConfigSchema.parse({
//   baseUrl: getEnvVar('BASE_URL', 'http://localhost:3000/'),
// });

// /**
//  * See https://playwright.dev/docs/test-configuration.
//  */
// export default defineConfig({
//   testDir: './tests/e2e/specs',
//   /* Run tests in files in parallel */
//   fullyParallel: true,
//   /* Fail the build on CI if you accidentally left test.only in the source code. */
//   forbidOnly: !!process.env.CI,
//   /* Retry on CI only */
//   retries: process.env.CI ? 1 : 0,
//   /* Opt out of parallel tests on CI. */
//   workers: process.env.CI ? 1 : undefined,
//   /* Reporter to use. See https://playwright.dev/docs/test-reporters */
//   reporter: 'html',
//   /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
//   use: {
//     /* Base URL to use in actions like `await page.goto('/')`. */
//     baseURL: parsedConfig.baseUrl,

//     // testIdAttribute: 'data-testid',

//     /* Force dark mode preference to match our new default */
//     colorScheme: 'dark',

//     /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
//     trace: 'on-first-retry',

//     video: {
//       mode: 'on-first-retry', // retain-on-failure
//       size: { width: 640, height: 480 },
//     },
//   },

//   /* Configure projects for major browsers */
//   projects: [
//     {
//       name: 'chromium',
//       use: { ...devices['Desktop Chrome'] },
//     },

//     // {
//     //   name: 'firefox',
//     //   use: { ...devices['Desktop Firefox'] },
//     // },

//     // {
//     //   name: 'webkit',
//     //   use: { ...devices['Desktop Safari'] },
//     // },

//     /* Test against mobile viewports. */
//     // {
//     //   name: 'Mobile Chrome',
//     //   use: { ...devices['Pixel 5'] },
//     // },
//     {
//       name: 'Mobile Safari',
//       use: { ...devices['iPhone 14'] },
//     },

//     /* Test against branded browsers. */
//     // {
//     //   name: 'Microsoft Edge',
//     //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
//     // },
//     // {
//     //   name: 'Google Chrome',
//     //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
//     // },
//   ],
//   expect: {
//     timeout: process.env.CI ? 20 * 1000 : 5 * 1000,
//   },

//   /* Ensure the server is built before starting the tests in CI */
//   /* If running locally, ensure dev server is already running */
//   webServer: {
//     command: process.env.CI ? 'pnpm start:ci' : 'pnpm dev',
//     url: parsedConfig.baseUrl,
//     // port: 3000,
//     reuseExistingServer: !process.env.CI,
//     timeout: 10 * 60 * 1000,
//   },
// });
