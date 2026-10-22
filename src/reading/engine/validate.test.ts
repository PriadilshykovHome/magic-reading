import { expect, test } from 'vitest';
import { taskLogics } from '../tasks/logicRegistry';
import { rawBundle } from './testContent';
import { validateContent, type RawBundle } from './validate';

type Json = Record<string, unknown>;
const errorsOf = (raw: RawBundle) => validateContent(raw, taskLogics).issues.filter((i) => i.severity === 'error').map((i) => `${i.file}: ${i.message}`).join('\n');
/** A level written out in full in World 1's only unit. */
const level = (raw: RawBundle, i: number) => ((raw.worlds[0]!.world.data as { units: Json[] }).units[0]!.levels as Json[])[i]!;
const lexicon = (raw: RawBundle, w = 0) => raw.worlds[w]!.lexicon.data as { words: Json[]; sentences: Json[] };

test('the real content is valid; missing audio/pictures are warnings (errors with --strict)', () => {
  expect(errorsOf(rawBundle())).toBe('');
  const lenient = validateContent(rawBundle(), taskLogics, { hasAsset: () => false }).issues;
  expect(lenient.length).toBeGreaterThan(0);
  expect(lenient.every((i) => i.severity === 'warning')).toBe(true);
  expect(validateContent(rawBundle(), taskLogics, { hasAsset: () => false, strictAssets: true }).issues.some((i) => i.severity === 'error')).toBe(true);
});

test('a broken content file is caught, with a message pointing at the problem', () => {
  const cases: [string, (raw: RawBundle) => void, RegExp][] = [
    ['unknown id', (r) => ((level(r, 0).pool as Json).syllables as string[]).push('syl-zzz'), /pool: unknown syllable syl-zzz/],
    ['task type typo', (r) => ((level(r, 0).tasks as Json[])[1]!.type = 'hearPik'), /unknown task type/],
    ['too many choices', (r) => ((level(r, 1).tasks as Json[])[0]!.choices = 5), /choices/],
    ['pool too small', (r) => ((level(r, 0).pool as Json).words = ['w-mama', 'w-lama']), /only 1 usable wrong options/],
    ['task count', (r) => ((level(r, 1).tasks as Json[])[0]!.count = 9), /a level needs 8–10/],
    ['no reading alone', (r) => (level(r, 1).tasks = [{ type: 'buildWord', count: 4 }, { type: 'hearPick', count: 4, itemKind: 'word' }]), /reading task he can solve alone/],
    ['split without syllables', (r) => (lexicon(r).words.find((w) => w.id === 'w-lysa')!.split = 'ЛИСА'), /syllable ЛИСА in ЛИСА needs exactly one vowel/],
    ['unknown card', (r) => (level(r, 2).card = 'card-dragon'), /unknown card card-dragon/],
    ['schema', (r) => (level(r, 0).id = 'Tower/1'), /id: must look like world-id\/level-key/],
    ['letters no unit teaches', (r) => lexicon(r).sentences.push({ id: 's-tsap', text: 'Цап тут.', scene: 'kit' }), /s-tsap uses Ц, which no unit teaches yet/],
    ['missing instruction', (r) => delete ((r.voice.data as Json).instructions as Json).buildWord, /no instruction line instructions.buildWord/],
  ];
  for (const [name, breakIt, expected] of cases) {
    const raw = rawBundle();
    raw.worlds = raw.worlds.slice(0, 2); // every case breaks the first two worlds
    breakIt(raw);
    expect(errorsOf(raw), name).toMatch(expected);
  }
});

test('words with letters not taught yet are rejected', () => {
  const raw = rawBundle();
  lexicon(raw).words.push({ id: 'w-kama', split: 'КА-МА', emoji: '🪨' }); // К is only taught in World 2
  ((level(raw, 1).pool as Json).words as string[]).push('w-kama');
  expect(errorsOf(raw)).toMatch(/w-kama "КАМА" uses letters not taught yet: К/);
});
