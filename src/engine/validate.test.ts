import { expect, test } from 'vitest';
import { taskLogics } from '../tasks/logicRegistry';
import { rawBundle } from './testContent';
import { validateContent, type RawBundle } from './validate';

type Json = Record<string, unknown>;
const errorsOf = (raw: RawBundle) => validateContent(raw, taskLogics).issues.filter((i) => i.severity === 'error').map((i) => `${i.file}: ${i.message}`).join('\n');
const level = (raw: RawBundle, i: number) => raw.worlds[0]!.levels[i]!.data as Json;

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
    ['wrong split', (r) => ((r.lexicon.data as { words: Json[] }).words.find((w) => w.id === 'w-lysa')!.syllables = ['syl-ly', 'syl-so']), /syllables spell ЛИСО, not ЛИСА/],
    ['unknown card', (r) => (level(r, 2).reward = { card: 'card-dragon' }), /unknown card card-dragon/],
    ['schema', (r) => (level(r, 0).id = 'Tower/1'), /id: must look like world-id\/01/],
    ['missing instruction', (r) => delete ((r.voice.data as Json).instructions as Json).buildWord, /no instruction line instructions.buildWord/],
  ];
  for (const [name, breakIt, expected] of cases) {
    const raw = rawBundle();
    breakIt(raw);
    expect(errorsOf(raw), name).toMatch(expected);
  }
});

test('words with letters not taught in the world are rejected', () => {
  const raw = rawBundle();
  const lexicon = raw.lexicon.data as { words: Json[] }; // syl-ka exists (World 2); КА is not taught in World 1
  lexicon.words.push({ id: 'w-kama', text: 'КАМА', syllables: ['syl-ka', 'syl-ma'], audio: 'voice/words/kama.mp3', picture: 'img/words/kama.webp', emoji: '🪨' });
  ((level(raw, 1).pool as Json).words as string[]).push('w-kama');
  expect(errorsOf(raw)).toMatch(/w-kama "КАМА" uses letters not taught in this world: К/);
});
