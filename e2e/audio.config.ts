import { defineConfig, devices } from '@playwright/test';

// Audio checks need sound on, so they run against the dev server (not the silent e2e build),
// in WebKit (Safari's engine).
export default defineConfig({
  testDir: '.',
  testMatch: 'audio.spec.ts',
  use: { baseURL: 'http://localhost:5173/magic-reading/' },
  projects: [
    // WebKit = Safari's engine: the iPhone/iPad unlock check.
    { name: 'webkit-iphone', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npx vite --port 5173 --strictPort',
    url: 'http://localhost:5173/magic-reading/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
