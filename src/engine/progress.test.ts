import { describe, expect, it } from 'vitest';
import { creatureStage, emptyProgress, isMastered, ProgressSchema, recordTaskResult, sparkBalance } from './progress';
import { testContent } from './testContent';

const { config } = testContent();
const day = (d: number) => new Date(2026, 9, d, 12);

describe('recordTaskResult', () => {
  it('moves an item up one box on a first-try answer and back to box 1 after a miss', () => {
    let p = emptyProgress();
    p = recordTaskResult(p, { target: 'syl-ma', scored: true, firstTry: true, sparks: 1 }, day(1), config);
    p = recordTaskResult(p, { target: 'syl-ma', scored: true, firstTry: true, sparks: 1 }, day(1), config);
    expect(p.items['syl-ma']).toMatchObject({ box: 3, seen: 2, firstTryOk: 2, okDays: ['2026-10-01'] });
    p = recordTaskResult(p, { target: 'syl-ma', scored: true, firstTry: false, sparks: 1 }, day(2), config);
    expect(p.items['syl-ma']).toMatchObject({ box: 1, wrong: 1, seen: 3 });
    expect(p.rewards.sparksEarned).toBe(3);
  });

  it('never goes above the top box', () => {
    let p = emptyProgress();
    for (let i = 0; i < 9; i++) p = recordTaskResult(p, { target: 'w-mama', scored: true, firstTry: true, sparks: 0 }, day(1), config);
    expect(p.items['w-mama']!.box).toBe(config.boxes.max);
  });

  it('only counts unscored tasks as seen', () => {
    const p = recordTaskResult(emptyProgress(), { target: 'syl-la', scored: false, firstTry: true, sparks: 1 }, day(1), config);
    expect(p.items['syl-la']).toMatchObject({ box: 1, seen: 1, firstTryOk: 0 });
  });
});

describe('mastery (a page in the Book of Spells)', () => {
  it('needs 3 first-try answers on at least 2 different days', () => {
    let p = emptyProgress();
    for (let i = 0; i < 3; i++) p = recordTaskResult(p, { target: 'syl-mo', scored: true, firstTry: true, sparks: 1 }, day(1), config);
    expect(isMastered(p.items['syl-mo'], config)).toBe(false);
    p = recordTaskResult(p, { target: 'syl-mo', scored: true, firstTry: true, sparks: 1 }, day(2), config);
    expect(isMastered(p.items['syl-mo'], config)).toBe(true);
  });
});

describe('Іскрик grows', () => {
  it('egg → hatchling after Level 1 → young at 150 → big at 400 sparks', () => {
    const p = emptyProgress();
    expect(creatureStage(p, config)).toBe(0);
    p.rewards.sparksEarned = 500;
    expect(creatureStage(p, config)).toBe(0); // still an egg until Level 1 is done
    p.levels['tower-of-syllables/01'] = { bestStars: 1, plays: 1, completedAt: null };
    p.rewards.sparksEarned = 20;
    expect(creatureStage(p, config)).toBe(1);
    p.rewards.sparksEarned = 150;
    expect(creatureStage(p, config)).toBe(2);
    p.rewards.sparksEarned = 400;
    expect(creatureStage(p, config)).toBe(3);
  });
});

describe('ProgressSchema', () => {
  it('fills defaults for an empty or old save', () => {
    const p = ProgressSchema.parse({ rewards: { sparksEarned: 12 } });
    expect(p.settings.parentNearby).toBe(true);
    expect(p.settings.lowercaseSentences).toBe(false);
    expect(p.rewards).toMatchObject({ sparksEarned: 12, sparksSpent: 0, cards: [] });
    expect(sparkBalance(p)).toBe(12);
  });
});
