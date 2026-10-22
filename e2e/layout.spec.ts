import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { layoutProblems, unlockEverything } from './checks';

/** Every level played (the saved-progress fixture), so the Book of Spells and the album are full. */
const PLAYED = JSON.parse(readFileSync('src/reading/content/saved-progress.fixture.json', 'utf8')) as object;

const L = 'tower-of-syllables';
const task = (num: string, type: string, extra = '', world = L) => `#/dev/task/${world}/${num}/${type}?seed=1${extra}`;

/** Every screen, and every task type once (with its longest content where it matters). */
const SCREENS: [string, string][] = [
  ['door', '#/'],
  ['login', '#/login'],
  ['door: owl, gift, калина, carol star', '?props=sleepyOwl,mykolai,kalyna,carolStar,stork#/'],
  ['journey', '#/map/tower-of-syllables'],
  ['journey: second world', '#/map/tower-of-words'],
  ['journey: 290 levels', '#/dev/journey'],
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
  ['missingSyllable: НА-МИС-ТО', task('06', 'missingSyllable', '&target=w-namysto')],
  ['trueFalse', task('06', 'trueFalse', '&target=s-u-mamy-namysto')],
  ['buildSentence: У ДРАКОНА ШОКОЛАД', task('04', 'buildSentence', '&target=s-u-drakona-shokolad', 'tower-of-words')],
  ['Magic Door', task('02', 'buildWord', '&boss=1')],
  ['Magic Door: МИШКО', task('05', 'readPickPicture', '&boss=1', 'tower-of-words')],
  // Content wave 1 (worlds 3–5): the longest words and sentences, and the new doors.
  ['buildWord: ВИ-ШИ-ВАН-КА', task('rev2-review', 'buildWord', '&target=w-vyshyvanka', 'sunflower-garden')],
  ['buildWord: ЧЕ-РЕ-ПА-ХА', task('rev2-review', 'buildWord', '&target=w-cherepakha', 'magic-kitchen')],
  ['missingSyllable: МО-РО-ЗИ-ВО', task('rev2-review', 'missingSyllable', '&target=w-morozyvo', 'sunflower-garden')],
  ['readPickPicture: ПОЖЕЖНИК', task('rev2-review', 'readPickPicture', '&target=w-pozhezhnyk', 'magic-kitchen')],
  ['buildSentence: МАЛИЙ КІТ СПИТЬ НА ДИВАНІ', task('finale-finale', 'buildSentence', '&target=s-malyj-kit-spytj-na-dyvani', 'star-observatory')],
  ['sentencePicture: ЧАРІВНИК НЕСЕ ПАЛИЧКУ', task('rev2-review', 'sentencePicture', '&target=s-charivnyk-nese-palychku', 'magic-kitchen')],
  ['Magic Door: Я МИШКО!', task('finale-finale', 'sentencePicture', '&boss=1', 'star-observatory')],
  ['Magic Door: МИХАЙЛО', task('finale-finale', 'readPickPicture', '&boss=1', 'magic-kitchen')],
  ['celebration', '#/dev/celebration'],
  ['Book of Spells: cover', '#/book'],
  ['Book of Spells: Р', '#/book/12'],
  ['Book of Spells: Ь (31 pages)', '#/book/21'],
];

test('every screen keeps the layout rules', async ({ page }, info) => {
  test.setTimeout(120_000);
  await unlockEverything(page, PLAYED);
  for (const [name, path] of SCREENS) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(900); // entry animations settle
    await page.screenshot({ path: `e2e-screens/${info.project.name}/${name.replace(/[^\w-]+/g, '_')}.png`, animations: 'disabled' });
    expect.soft(await layoutProblems(page), name).toEqual([]);
  }
});
