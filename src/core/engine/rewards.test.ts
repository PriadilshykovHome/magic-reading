import { expect, test } from 'vitest';
import { emptyProgress, type Progress } from './progress';
import { finishLevel, isLevelUnlocked, starsFor } from './rewards';
import { startRun, type RunState } from './run';
import { testContent } from '../../reading/engine/testContent';

const content = testContent();
const { config } = content;
const L1 = content.levels.get('tower-of-syllables/01')!;
const L2 = content.levels.get('tower-of-syllables/02')!;
const day = (d: number) => new Date(2026, 9, d, 12);
const run = (firstTry: number, scored: number, sparks = scored): RunState => ({ ...startRun(config, () => 0.5), firstTry, scored, sparks });
const withSparks = (p: Progress, sparks: number): Progress => ({ ...p, rewards: { ...p.rewards, sparksEarned: p.rewards.sparksEarned + sparks } });

test('stars: 90%+ first-try → 3, 70%+ → 2, otherwise 1 (never failed)', () => {
  expect([[9, 10], [7, 10], [6, 10], [0, 10]].map(([a, b]) => starsFor(a!, b!, config))).toEqual([3, 2, 1, 1]);
});

test('first finish rewards everything once; replays keep the best', () => {
  const first = finishLevel({ progress: withSparks(emptyProgress(), 9), run: run(9, 9), level: L1, content, now: day(21) });
  expect(first.summary).toMatchObject({ stars: 3, card: 'card-hedgehog', unlocked: L2.id, creature: { from: 0, to: 1 }, firstThreeStars: true });
  expect(first.steps).toEqual(['stars', 'sparks', 'card', 'creature', 'firstThreeStars']);
  expect(isLevelUnlocked(first.progress, L2)).toBe(true);
  const again = finishLevel({ progress: withSparks(first.progress, 5), run: run(5, 9, 5), level: L1, content, now: day(21) });
  expect(again.summary).toMatchObject({ stars: 1, card: null, unlocked: null, creature: null, firstThreeStars: false });
  expect(again.progress.levels[L1.id]).toMatchObject({ bestStars: 3, plays: 2 });
});

test('Іскрик grows when sparks cross a threshold; every 7th lit window brings the weekly card', () => {
  let p = finishLevel({ progress: withSparks(emptyProgress(), 9), run: run(9, 9), level: L1, content, now: day(1) }).progress;
  p = withSparks(p, config.creature.youngAtSparks - 9 - 5);
  expect(finishLevel({ progress: withSparks(p, 10), run: run(8, 9, 10), level: L2, content, now: day(2) }).summary.creature).toEqual({ from: 1, to: 2 });

  let q = emptyProgress();
  const weekly: (string | null)[] = [];
  for (let d = 1; d <= 8; d++) {
    const done = finishLevel({ progress: q, run: run(9, 9, 0), level: L1, content, now: day(d) });
    q = done.progress;
    weekly.push(done.summary.weeklyCard);
  }
  expect(weekly.indexOf('card-week')).toBe(6);
  expect(weekly.filter(Boolean)).toHaveLength(1);
});
