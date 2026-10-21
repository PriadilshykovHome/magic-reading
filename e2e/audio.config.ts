import { defineConfig, devices } from '@playwright/test';

// Audio checks need sound on, so they run against the dev server (not the silent e2e build),
// in WebKit (Safari's engine) and Chrome.
export default defineConfig({
  testDir: '.',
  testMatch: 'audio.spec.ts',
  use: { baseURL: 'http://localhost:5173/magic-reading/' },
  projects: [
    { name: 'webkit-iphone', use: { ...devices['iPhone 13'] } },
    { name: 'chrome', use: { channel: process.env.CI ? undefined : 'chrome', viewport: { width: 1024, height: 768 } } },
  ],
  webServer: {
    command: 'npx vite --port 5173 --strictPort',
    url: 'http://localhost:5173/magic-reading/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
