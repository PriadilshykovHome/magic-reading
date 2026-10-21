import { defineConfig } from '@playwright/test';

const PORT = 4174;

/** The plan's test viewports (CSS px). */
export const VIEWPORTS = {
  'phone-360x640': [360, 640],
  'phone-390x844': [390, 844],
  'phone-landscape-844x390': [844, 390],
  'tablet-768x1024': [768, 1024],
  'tablet-landscape-1024x768': [1024, 768],
  'tablet-820x1180': [820, 1180],
  'laptop-1366x768': [1366, 768],
  'laptop-1920x1080': [1920, 1080],
} as const;

export default defineConfig({
  testDir: 'e2e',
  testIgnore: 'audio.spec.ts', // needs sound: run with --config e2e/audio.config.ts
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/magic-reading/`,
    // Locally use the installed Chrome; CI installs Playwright's Chromium.
    channel: process.env.CI ? undefined : 'chrome',
    screenshot: 'only-on-failure',
  },
  projects: Object.entries(VIEWPORTS).map(([name, [width, height]]) => ({
    name,
    use: { viewport: { width, height }, hasTouch: width < 1100 },
  })),
  // A production build with answer markers and no sound: what Playwright plays.
  webServer: {
    command: `VITE_MARK_CORRECT=true VITE_E2E=true npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/magic-reading/`,
    reuseExistingServer: false, // always test the current code
    timeout: 180_000,
  },
});
