import { defineConfig } from '@playwright/test';

const PORT = 4174;

/** Layout is checked at the extremes: smallest phone, shortest (phone landscape), and the
 *  tablet in both orientations (the main target). Behaviour is checked once, on a phone. */
const LAYOUT_VIEWPORTS = {
  'phone-360x640': [360, 640],
  'phone-landscape-844x390': [844, 390],
  'tablet-768x1024': [768, 1024],
  'tablet-landscape-1024x768': [1024, 768],
} as const;

export default defineConfig({
  testDir: 'e2e',
  testIgnore: 'audio.spec.ts', // needs sound: run with --config e2e/audio.config.ts
  fullyParallel: true,
  workers: process.env.CI ? 3 : 5,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/magic-reading/`,
    // Locally use the installed Chrome; CI installs Playwright's Chromium.
    channel: process.env.CI ? undefined : 'chrome',
    screenshot: 'only-on-failure',
  },
  projects: [
    ...Object.entries(LAYOUT_VIEWPORTS).map(([name, [width, height]]) => ({
      name: `layout ${name}`,
      testMatch: 'layout.spec.ts',
      use: { viewport: { width, height }, hasTouch: true },
    })),
    { name: 'play phone-390x844', testMatch: ['playthrough.spec.ts', 'celebration.spec.ts'], use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
  ],
  // A production build with answer markers and no sound: what Playwright plays.
  webServer: {
    command: `VITE_MARK_CORRECT=true VITE_E2E=true npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/magic-reading/`,
    reuseExistingServer: false, // always test the current code
    timeout: 180_000,
  },
});
