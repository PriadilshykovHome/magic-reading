import { expect, test } from '@playwright/test';
import { layoutProblems, unlockEverything } from './checks';

const L = 'tower-of-syllables';
const task = (num: string, type: string, extra = '', world = L) => `#/dev/task/${world}/${num}/${type}?seed=1${extra}`;

/** Every screen, and every task type once (with its longest content where it matters). */
const SCREENS: [string, string][] = [
  ['door', '#/'],
  ['map', '#/map/tower-of-syllables'],
  ['map: second tower', '#/map/tower-of-words'],
  ['intro: merge', `#/level/${L}/01`],
  ['intro: word merge', `#/level/${L}/04`],
  ['intro: read along', `#/level/${L}/03`],
  ['syllableMerge', task('01', 'syllableMerge')],
  ['hearPick', task('01', 'hearPick')],
  ['hearPick words', task('02', 'hearPick')],
  ['bubblePop', task('01', 'bubblePop')],
  ['readPickPicture', task('01', 'readPickPicture')],
  ['buildWord', task('02', 'buildWord')],
  ['buildWord: 3 syllables', task('04', 'buildWord', '&target=w-namysto')],
  ['buildWord: ШО-КО-ЛАД', task('03', 'buildWord', '&target=w-shokolad', 'tower-of-words')],
  ['sentencePicture', task('03', 'sentencePicture')],
  ['sentencePicture: longest', task('04', 'sentencePicture', '&target=s-u-drakona-shokolad', 'tower-of-words')],
  ['readAloud sentence', task('03', 'readAloud')],
  ['Magic Door', task('02', 'buildWord', '&boss=1')],
  ['Magic Door: МИШКО', task('05', 'readPickPicture', '&boss=1', 'tower-of-words')],
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
