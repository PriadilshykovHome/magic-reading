import { expect, test } from '@playwright/test';

test('the celebration: no skipping before 2 s, skipping after; also with reduced motion', async ({ page }) => {
  const buttons = page.locator('[data-to-map]');
  // The celebration is a lazy route: time from when it is on screen, not from the navigation.
  const screen = page.locator('.celebration-screen');

  await page.goto('#/dev/celebration?live=1');
  await expect(screen).toBeVisible();
  await page.waitForTimeout(900);
  await page.mouse.click(30, 400); // an early, accidental tap
  await page.waitForTimeout(500);
  await expect(buttons).toHaveCount(0);
  await page.waitForTimeout(900);
  await page.mouse.click(30, 400); // past 2 s: jumps to the end
  await expect(buttons).toBeVisible({ timeout: 1000 });
  await expect(page.locator('.celebration-star.is-earned')).toHaveCount(3);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('#/map');
  await page.goto('#/dev/celebration?live=1');
  await expect(screen).toBeVisible();
  await page.waitForTimeout(2300);
  await page.mouse.click(30, 400);
  await expect(buttons).toBeVisible({ timeout: 1000 });
  await expect(page.locator('canvas.fx-layer')).toHaveCount(0); // no particle storms
});
