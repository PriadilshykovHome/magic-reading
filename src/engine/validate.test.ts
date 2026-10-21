import { describe, expect, it } from 'vitest';
import { taskLogics } from '../tasks/logicRegistry';
import { rawBundle } from './testContent';
import { validateContent, type RawBundle } from './validate';

type Json = Record<string, unknown>;
const errorsOf = (raw: RawBundle) =>
  validateContent(raw, taskLogics).issues.filter((i) => i.severity === 'error').map((i) => `${i.file}: ${i.message}`);
/** Edit one level file of a fresh copy of the real content. */
const breakLevel = (index: number, edit: (level: Json) => void) => {
  const raw = rawBundle();
  edit(raw.worlds[0]!.levels[index]!.data as Json);
  return errorsOf(raw);
};

describe('validateContent', () => {
  it('accepts the real content', () => {
    expect(errorsOf(rawBundle())).toEqual([]);
  });

  it('warns about missing audio and pictures, and fails on them in strict mode', () => {
    const lenient = validateContent(rawBundle(), taskLogics, { hasAsset: () => false });
    expect(lenient.issues.every((i) => i.severity === 'warning')).toBe(true);
    expect(lenient.issues.some((i) => i.message.includes('voice/syl/ma.mp3'))).toBe(true);
    const strict = validateContent(rawBundle(), taskLogics, { hasAsset: () => false, strictAssets: true });
    expect(strict.issues.some((i) => i.severity === 'error')).toBe(true);
  });

  describe('catches a broken level file', () => {
    it('unknown item in the pool', () => {
      const errors = breakLevel(0, (l) => ((l.pool as Json).syllables as string[]).push('syl-ka'));
      expect(errors.join('\n')).toMatch(/01-syllables\.json: pool: unknown syllable syl-ka/);
    });

    it('a typo in a task type or its config', () => {
      expect(breakLevel(0, (l) => ((l.tasks as Json[])[1]!.type = 'hearPik')).join('\n')).toMatch(/unknown task type/);
      expect(breakLevel(1, (l) => ((l.tasks as Json[])[0]!.choices = 5)).join('\n')).toMatch(/choices/);
    });

    it('not enough items for the requested number of choices', () => {
      const errors = breakLevel(0, (l) => {
        (l.pool as Json).words = ['w-mama', 'w-lama'];
        l.boss = { type: 'magicDoor', inner: 'hearPick' };
      });
      expect(errors.join('\n')).toMatch(/readPickPicture: .*only 1 usable wrong options/);
    });

    it('too many or too few tasks', () => {
      expect(breakLevel(1, (l) => ((l.tasks as Json[])[0]!.count = 9)).join('\n')).toMatch(/a level needs 8–10/);
    });

    it('a level with nothing he can read alone', () => {
      const errors = breakLevel(1, (l) => {
        l.tasks = [
          { type: 'buildWord', count: 4 },
          { type: 'hearPick', count: 4, itemKind: 'word' },
        ];
      });
      expect(errors.join('\n')).toMatch(/reading task he can solve alone/);
    });

    it('a word with letters not taught yet', () => {
      const raw = rawBundle();
      const lexicon = raw.lexicon.data as { words: Json[]; syllables: Json[] };
      lexicon.syllables.push({ id: 'syl-ka', text: 'КА', parts: ['К', 'А'], audio: 'voice/syl/ka.mp3' });
      lexicon.words.push({ id: 'w-kama', text: 'КАМА', syllables: ['syl-ka', 'syl-ma'], audio: 'voice/words/kama.mp3', picture: 'img/words/kama.webp', emoji: '🪨' });
      ((raw.worlds[0]!.levels[1]!.data as { pool: Json }).pool.words as string[]).push('w-kama');
      expect(errorsOf(raw).join('\n')).toMatch(/w-kama "КАМА" uses letters not taught in this world: К/);
    });

    it('a hand-written syllable split that does not spell the word', () => {
      const raw = rawBundle();
      const words = (raw.lexicon.data as { words: Json[] }).words;
      words.find((w) => w.id === 'w-lysa')!.syllables = ['syl-ly', 'syl-so'];
      expect(errorsOf(raw).join('\n')).toMatch(/w-lysa: syllables spell ЛИСО, not ЛИСА/);
    });

    it('unlock order, unknown cards and a broken Magic Door', () => {
      const errors = breakLevel(2, (l) => {
        l.unlockAfter = 'tower-of-syllables/07';
        l.reward = { card: 'card-dragon' };
        l.boss = { type: 'magicDoor', inner: 'readAloud' };
      }).join('\n');
      expect(errors).toMatch(/unlockAfter: tower-of-syllables\/07 must be an earlier level/);
      expect(errors).toMatch(/unknown card card-dragon/);
      expect(errors).toMatch(/boss.inner: readAloud must be scored and playable without a parent/);
    });

    it('schema errors point at the field', () => {
      const errors = breakLevel(0, (l) => {
        l.id = 'Tower/1';
        delete l.title;
      }).join('\n');
      expect(errors).toMatch(/01-syllables\.json: id: must look like world-id\/01/);
      expect(errors).toMatch(/01-syllables\.json: title:/);
    });
  });

  it('checks Соня’s lines: an instruction per task type and only known placeholders', () => {
    const raw = rawBundle();
    const voice = raw.voice.data as { instructions: Json; praise: string[] };
    delete voice.instructions.buildWord;
    voice.praise.push('Браво, {nickname}!');
    const errors = errorsOf(raw).join('\n');
    expect(errors).toMatch(/no instruction line instructions.buildWord/);
    expect(errors).toMatch(/unknown placeholder \{nickname\}/);
  });
});
