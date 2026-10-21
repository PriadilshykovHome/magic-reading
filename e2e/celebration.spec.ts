import { expect, test } from '@playwright/test';

test('the celebration can be skipped after 2 seconds, but not by a tap before that', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone-390x844', 'behaviour, not layout: one viewport is enough');
  await page.goto('#/dev/celebration?live=1');
  const buttons = page.locator('[data-to-map]');

  await page.waitForTimeout(900);
  await page.mouse.click(30, 400); // an early, accidental tap
  await page.waitForTimeout(500);
  await expect(buttons).toHaveCount(0); // still celebrating

  await page.waitForTimeout(900); // now past 2 s
  await page.mouse.click(30, 400);
  await expect(buttons).toBeVisible({ timeout: 1000 }); // jumps straight to the end
  await expect(page.locator('.celebration-star.is-earned')).toHaveCount(3);
});

test('with reduced motion the celebration still plays through and can be skipped', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone-390x844', 'behaviour, not layout: one viewport is enough');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('#/dev/celebration?live=1');
  await page.waitForTimeout(2300);
  await page.mouse.click(30, 400);
  await expect(page.locator('[data-to-map]')).toBeVisible({ timeout: 1000 });
  await expect(page.locator('canvas.fx-layer')).toHaveCount(0); // no particle storms
});
