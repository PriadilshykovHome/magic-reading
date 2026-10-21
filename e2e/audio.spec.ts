import { expect, test } from '@playwright/test';

// Audio unlock as on iPhone/iPad: nothing may play before a tap, and the magic door's tap must
// start the audio context and load the effects and music. Runs against the dev server (sound on)
// in WebKit, Safari's engine. Run with: npx playwright test --config e2e/audio.config.ts

type AudioState = {
  context: () => string;
  effects: () => string;
  music: () => { track: string; state: string; volume: number; playing: boolean } | null;
  speaking: () => boolean;
  holdVoice: (ms: number) => Promise<boolean>;
};

test('the door tap unlocks sound; the map music plays and ducks under Соня', async ({ page }) => {
  await page.goto('#/');
  await page.waitForFunction(() => 'speechSynthesis' in window);
  const before = await page.evaluate(() => (window as unknown as { __audio: AudioState }).__audio.context());
  expect(['none', 'suspended']).toContain(before); // locked until a tap

  await page.locator('button.door').click({ force: true });
  await expect(page).toHaveURL(/#\/map$/);

  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __audio: AudioState }).__audio.context()), { timeout: 10_000 })
    .toBe('running');
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __audio: AudioState }).__audio.effects()), { timeout: 10_000 })
    .toBe('loaded');
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __audio: AudioState }).__audio.music()?.state), { timeout: 10_000 })
    .toBe('loaded');
  const music = await page.evaluate(() => (window as unknown as { __audio: AudioState }).__audio.music());
  expect(music).toMatchObject({ track: 'map', playing: true });

  // While Соня speaks the music sits at 30%, and comes back up afterwards.
  const levels = await page.evaluate(async () => {
    const audio = (window as unknown as { __audio: AudioState }).__audio;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    await wait(1500);
    const full = audio.music()?.volume;
    const held = audio.holdVoice(1500);
    await wait(500);
    const duringSpeech = audio.music()?.volume;
    await held;
    await wait(900);
    return { full, duringSpeech, after: audio.music()?.volume };
  });
  expect(levels.full).toBeCloseTo(0.3, 2);
  expect(levels.duringSpeech).toBeCloseTo(0.3 * 0.3, 2);
  expect(levels.after).toBeCloseTo(0.3, 2);
});
