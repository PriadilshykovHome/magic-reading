import { expect, test } from '@playwright/test';
import { layoutProblems, unlockEverything } from './checks';

const L = 'tower-of-syllables';
const task = (num: string, type: string, extra = '') => `#/dev/task/${L}/${num}/${type}?seed=1${extra}`;

/** Every screen, and every task type once (with its longest content where it matters). */
const SCREENS: [string, string][] = [
  ['door', '#/'],
  ['map', '#/map'],
  ['intro: merge', `#/level/${L}/01`],
  ['intro: read along', `#/level/${L}/03`],
  ['syllableMerge', task('01', 'syllableMerge')],
  ['hearPick', task('01', 'hearPick')],
  ['hearPick words', task('02', 'hearPick')],
  ['bubblePop', task('01', 'bubblePop')],
  ['readPickPicture', task('01', 'readPickPicture')],
  ['buildWord', task('02', 'buildWord')],
  ['sentencePicture', task('03', 'sentencePicture')],
  ['readAloud sentence', task('03', 'readAloud')],
  ['Magic Door', task('02', 'buildWord', '&boss=1')],
  ['celebration', '#/dev/celebration'],
];

test('every screen keeps the layout rules', async ({ page }, info) => {
  test.setTimeout(120_000);
  await unlockEverything(page);
  for (const [name, path] of SCREENS) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(900); // entry animations settle
    await page.screenshot({ path: `e2e-screens/${info.project.name}/${name.replace(/[^\w-]+/g, '_')}.png`, animations: 'disabled' });
    expect.soft(await layoutProblems(page), name).toEqual([]);
  }
});
