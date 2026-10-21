import { expect, test, type Page } from '@playwright/test';

// The plan: every level played start to finish on iPhone-, iPad- (landscape) and laptop-sized viewports.
const PLAYTHROUGH_PROJECTS = ['phone-390x844', 'tablet-landscape-1024x768', 'laptop-1366x768'];
const LEVELS = ['tower-of-syllables/01', 'tower-of-syllables/02', 'tower-of-syllables/03'];
const KEY = 'magic-reading:progress:guest';

async function playLevel(page: Page, levelId: string) {
  await page.locator(`[data-level="${levelId}"]`).click();
  await page.locator('[data-start]').click();
  await expect(page).toHaveURL(/\/play$/);
  const deadline = Date.now() + 90_000;
  while (!page.url().endsWith('/done')) {
    expect(Date.now(), `${levelId} should finish`).toBeLessThan(deadline);
    const correct = page.locator('.runner-stage [data-correct]').first();
    if (await correct.count()) {
      // Bubbles keep moving, so tap them directly; everything else like a finger would.
      if (await correct.evaluate((el) => el.classList.contains('bubble'))) await correct.evaluate((el: HTMLElement) => el.click());
      else await correct.click({ force: true, timeout: 2_000 }).catch(() => {});
    }
    await page.waitForTimeout(150);
  }
  // Celebration: flip the card when it comes, then back to the map.
  while (!(await page.locator('[data-to-map]').count())) {
    const card = page.locator('.magic-card[data-correct]');
    if (await card.count()) await card.click();
    await page.waitForTimeout(200);
  }
  await expect(page.locator('.celebration-star.is-earned')).toHaveCount(3);
  await page.locator('[data-to-map]').click();
  await expect(page).toHaveURL(/#\/map$/);
}

test('all three levels can be played start to finish, and progress survives a reload', async ({ page }, info) => {
  test.skip(!PLAYTHROUGH_PROJECTS.includes(info.project.name), 'played on phone, iPad landscape and laptop only');
  test.setTimeout(300_000);

  await page.goto('#/');
  await page.evaluate((key) => localStorage.removeItem(key), KEY);
  await page.locator('button.door').click({ force: true });
  await expect(page).toHaveURL(/#\/map$/);

  for (const levelId of LEVELS) await playLevel(page, levelId);

  const before = await page.evaluate((key) => localStorage.getItem(key), KEY);
  await page.reload();
  await expect(page.locator('.map-node.is-locked')).toHaveCount(0);
  for (const levelId of LEVELS) {
    await expect(page.locator(`[data-level="${levelId}"] .map-stars path[fill^="url"]`)).toHaveCount(3);
  }
  const after = await page.evaluate((key) => localStorage.getItem(key), KEY);
  expect(after).toBe(before);
  const saved = JSON.parse(after!);
  expect(saved.rewards.cards).toEqual(['card-hedgehog', 'card-squirrel', 'card-bunny']);
});
