import { expect, test } from 'vitest';
import { creatureStage, emptyProgress, isMastered, recordTaskResult } from './progress';
import { testContent } from './testContent';

const { config } = testContent();
const day = (d: number) => new Date(2026, 9, d, 12);
const answer = (target: string, firstTry: boolean, scored = true) => ({ target, scored, firstTry, sparks: 1 });

test('boxes: up one on a first-try answer (max 5), back to 1 after a miss; sparks saved', () => {
  let p = emptyProgress();
  for (let i = 0; i < 6; i++) p = recordTaskResult(p, answer('syl-ma', true), day(1), config);
  expect(p.items['syl-ma']).toMatchObject({ box: 5, firstTryOk: 6 });
  p = recordTaskResult(p, answer('syl-ma', false), day(2), config);
  expect(p.items['syl-ma']).toMatchObject({ box: 1, wrong: 1, seen: 7 });
  p = recordTaskResult(p, answer('syl-la', true, false), day(2), config);
  expect(p.items['syl-la']).toMatchObject({ box: 1, seen: 1 }); // unscored: seen only
  expect(p.rewards.sparksEarned).toBe(8);
});

test('mastery needs 3 first-try answers on at least 2 different days', () => {
  let p = emptyProgress();
  for (let i = 0; i < 3; i++) p = recordTaskResult(p, answer('syl-mo', true), day(1), config);
  expect(isMastered(p.items['syl-mo'], config)).toBe(false);
  p = recordTaskResult(p, answer('syl-mo', true), day(2), config);
  expect(isMastered(p.items['syl-mo'], config)).toBe(true);
});

test('Іскрик: egg until Level 1 is done, then grows at 150 and 400 sparks', () => {
  const p = emptyProgress();
  p.rewards.sparksEarned = 500;
  expect(creatureStage(p, config)).toBe(0);
  p.levels['tower-of-syllables/01'] = { bestStars: 1, plays: 1, completedAt: null };
  expect([20, 150, 400].map((s) => creatureStage({ ...p, rewards: { ...p.rewards, sparksEarned: s } }, config))).toEqual([1, 2, 3]);
});
