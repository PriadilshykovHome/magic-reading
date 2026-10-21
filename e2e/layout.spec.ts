import { test } from '@playwright/test';
import { expectGoodLayout, unlockEverything } from './checks';

const L = 'tower-of-syllables';
const task = (num: string, type: string, extra = '') => `#/dev/task/${L}/${num}/${type}${extra}`;

const SCREENS: [string, string][] = [
  ['door', '#/'],
  ['map', '#/map'],
  ['intro: syllables merge', `#/level/${L}/01`],
  ['intro: read along', `#/level/${L}/03`],
  ['celebration (everything revealed)', '#/dev/celebration'],
];
for (const seed of [1, 7]) {
  SCREENS.push(
    [`syllableMerge #${seed}`, task('01', 'syllableMerge', `?seed=${seed}`)],
    [`hearPick syllables #${seed}`, task('01', 'hearPick', `?seed=${seed}`)],
    [`bubblePop #${seed}`, task('01', 'bubblePop', `?seed=${seed}`)],
    [`readPickPicture #${seed}`, task('01', 'readPickPicture', `?seed=${seed}`)],
    [`readAloud syllable #${seed}`, task('01', 'readAloud', `?seed=${seed}`)],
    [`Magic Door: word #${seed}`, task('01', 'readPickPicture', `?boss=1&seed=${seed}`)],
    [`hearPick words #${seed}`, task('02', 'hearPick', `?seed=${seed}`)],
    [`buildWord #${seed}`, task('02', 'buildWord', `?seed=${seed}`)],
    [`readAloud word #${seed}`, task('02', 'readAloud', `?seed=${seed}`)],
    [`Magic Door: build #${seed}`, task('02', 'buildWord', `?boss=1&seed=${seed}`)],
    [`sentencePicture #${seed}`, task('03', 'sentencePicture', `?seed=${seed}`)],
    [`readAloud sentence #${seed}`, task('03', 'readAloud', `?seed=${seed}`)],
    [`Magic Door: sentence #${seed}`, task('03', 'sentencePicture', `?boss=1&seed=${seed}`)],
  );
}

test.describe('layout at every test viewport', () => {
  test.beforeEach(async ({ page }) => unlockEverything(page));

  for (const [name, path] of SCREENS) {
    test(name, async ({ page }, info) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(900); // entry animations settle
      await page.screenshot({ path: `e2e-screens/${info.project.name}/${name.replace(/[^\w-]+/g, '_')}.png`, animations: 'disabled' });
      await expectGoodLayout(page, `${name} @ ${info.project.name}`);
    });
  }
});
