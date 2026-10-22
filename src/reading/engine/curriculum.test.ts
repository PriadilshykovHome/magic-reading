import { expect, test } from 'vitest';
import { taskLogics } from '../tasks/logicRegistry';
import { bookChapters, itemText, reviewPoolOf } from './content';
import { lettersOf } from './lexicon';
import { rawBundle, testContent } from './testContent';
import { validateContent, type RawBundle } from './validate';

/** A third world written the new way: units of templates (a preview of World 3). */
function withGarden(units: unknown[], words?: unknown[]): RawBundle {
  const raw = rawBundle();
  raw.worlds = raw.worlds.slice(0, 2); // the two worlds written out in full, then this one
  raw.worlds.push({
    world: { file: 'content/worlds/test-garden/world.json', data: { id: 'test-garden', order: 3, title: 'Сад', look: 'garden', units } },
    lexicon: {
      file: 'content/worlds/test-garden/lexicon.json',
      data: {
        syllables: 'МЕ ЛЕ НЕ ТЕ СЕ ВЕ',
        words: words ?? [
          { id: 'w-alina', split: 'А-ЛІ-НА', emoji: '👩' },
          { id: 'w-derevo', split: 'ДЕ-РЕ-ВО', emoji: '🌳' },
          { id: 'w-pero', split: 'ПЕ-РО', emoji: '🪶' },
          { id: 'w-metro', split: 'МЕТ-РО', emoji: '🚇' },
          { id: 'w-kepka', split: 'КЕП-КА', emoji: '🧢' },
          { id: 'w-sestra', split: 'СЕС-ТРА', emoji: '👧' },
          { id: 'w-vesna', split: 'ВЕС-НА', emoji: '🌱' },
          { id: 'w-vedmedyk', split: 'ВЕД-МЕ-ДИК', emoji: '🧸' },
          { id: 'w-oleksandr', split: 'О-ЛЕК-САНДР', emoji: '👨' },
        ],
        sentences: [
          { id: 's-tato-nese-syr', text: 'Тато несе сир.', scene: 'tato has syr' },
          { id: 's-kit-na-derevi', text: 'Кіт на дереві.', scene: 'kit on derevo' },
          { id: 's-mama-i-sestra', text: 'Мама і сестра.', scene: 'mama and sestra' },
        ],
      },
    },
  });
  return raw;
}

const GARDEN = [
  { key: 'practice', levels: ['words'] },
  { key: 'e', letters: 'Е', card: 'card-fox', levels: ['letters', 'words', 'words', 'sentences'] },
  { key: 'finale', levels: [{ t: 'finale', door: 'w-oleksandr', line: 'magicDoor.ownName' }] },
];

test('units × templates expand into levels; the levels he has played keep their ids', () => {
  const { issues, content } = validateContent(withGarden(GARDEN), taskLogics);
  expect(issues.filter((i) => i.severity === 'error').map((i) => i.message)).toEqual([]);
  const order = content!.levelOrder;

  // His saved progress is keyed by these: they never change.
  expect(order.slice(0, 11)).toEqual([
    ...[1, 2, 3, 4, 5, 6].map((n) => `tower-of-syllables/0${n}`),
    ...[1, 2, 3, 4, 5].map((n) => `tower-of-words/0${n}`),
  ]);
  expect(order.slice(11)).toEqual([
    'test-garden/practice-words',
    'test-garden/e-letters',
    'test-garden/e-words',
    'test-garden/e-words-2',
    'test-garden/e-sentences',
    'test-garden/finale-finale',
  ]);

  const level = (id: string) => content!.levels.get(`test-garden/${id}`)!;
  const plan = (id: string) => content!.plans.get(`test-garden/${id}`)!;
  expect(level('practice-words').unlockAfter).toBe('tower-of-words/05');
  // Practice before the new letter: old letters only, in the order they became readable
  // (АЛІНА from World 1, then МИШКО, once he has met it at its door).
  expect(level('practice-words').pool.words).toEqual(['w-alina', 'w-myshko']);
  expect(plan('e-letters').known).toContain('Е');
  expect(level('e-letters').intro.topic).toEqual({ text: 'Е', key: 'e' });
  expect(level('e-letters').pool.syllables).toEqual(['syl-me', 'syl-le', 'syl-ne', 'syl-te', 'syl-se', 'syl-ve']);
  // New words are shared out over the unit's levels that teach words; the door's word waits for its door.
  const newWords = ['e-letters', 'e-words', 'e-words-2'].flatMap((id) => level(id).pool.words);
  expect(newWords.sort()).toEqual(['w-derevo', 'w-kepka', 'w-metro', 'w-pero', 'w-sestra', 'w-vedmedyk', 'w-vesna']);
  expect(level('e-sentences').pool.sentences).toHaveLength(3);
  expect(level('finale-finale').boss.item).toBe('w-oleksandr');
  expect(order.slice(0, -1).every((id) => !Object.values(content!.levels.get(id)!.pool).flat().includes('w-oleksandr'))).toBe(true);
  // Review reaches back over every earlier level; the unit's card comes with its last level.
  expect(level('e-sentences').reviewEarlier).toBe(true);
  expect(reviewPoolOf(content!, level('e-sentences'), 'word')).toEqual(expect.arrayContaining(['w-mama', 'w-myshko', 'w-alina', 'w-pero']));
  expect(level('e-sentences').reward.card).toBe('card-fox');
});

test('steady pace: a new letter brings enough new words', () => {
  const few = [{ id: 'w-pero', split: 'ПЕ-РО', emoji: '🪶' }];
  const raw = withGarden([{ key: 'e', letters: 'Е', levels: ['letters', 'words'] }], few);
  (raw.worlds.at(-1)!.lexicon.data as { sentences: unknown[] }).sentences = [];
  const messages = validateContent(raw, taskLogics).issues.map((i) => i.message).join('\n');
  expect(messages).toMatch(/unit test-garden\/e teaches only \d new words; a letter needs at least 6/);
});

test('the Book of Spells: every syllable and word on exactly one letter page, using only letters known by then', () => {
  const content = testContent();
  const chapters = bookChapters(content);
  const pages = chapters.flatMap((c) => c.items);
  expect(new Set(pages).size).toBe(pages.length);
  const words = new Set([...content.words.values()].map((w) => w.text));
  const expected = [...content.syllables.values()].filter((s) => !words.has(s.text)).length + content.words.size;
  expect(pages).toHaveLength(expected);
  // Each page's letter is the newest one it needs: every other letter has its own earlier page.
  const known = new Set<string>();
  for (const { title, items } of chapters) {
    known.add(title);
    for (const id of items) expect(lettersOf(itemText(content, id)).filter((ch) => !known.has(ch)), `${title}: ${id}`).toEqual([]);
  }
});
