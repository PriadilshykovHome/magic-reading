import { describe, expect, it } from 'vitest';
import { emptyProgress, type Progress } from './progress';
import { finishLevel, isLevelUnlocked, starsFor } from './rewards';
import { startRun, type RunState } from './run';
import { testContent } from './testContent';

const content = testContent();
const { config } = content;
const L1 = content.levels.get('tower-of-syllables/01')!;
const L2 = content.levels.get('tower-of-syllables/02')!;
const day = (d: number) => new Date(2026, 9, d, 12);
const run = (firstTry: number, scored: number, sparks = scored): RunState => ({
  ...startRun(config, () => 0.5),
  firstTry,
  scored,
  sparks,
});
/** Progress as the store has it at level end: answers (and their sparks) already saved. */
const withSparks = (p: Progress, sparks: number): Progress => ({
  ...p,
  rewards: { ...p.rewards, sparksEarned: p.rewards.sparksEarned + sparks },
});

describe('stars', () => {
  it('90%+ first-try → 3 stars, 70%+ → 2, otherwise 1; a level is never failed', () => {
    expect(starsFor(9, 10, config)).toBe(3);
    expect(starsFor(7, 10, config)).toBe(2);
    expect(starsFor(6, 10, config)).toBe(1);
    expect(starsFor(0, 10, config)).toBe(1);
  });
});

describe('finishLevel', () => {
  it('first finish: stars, card, unlock, egg hatches, a window lights', () => {
    const { progress, summary, steps } = finishLevel({ progress: withSparks(emptyProgress(), 9), run: run(9, 9), level: L1, content, now: day(21) });
    expect(summary).toMatchObject({
      stars: 3,
      newBest: true,
      card: 'card-hedgehog',
      unlocked: 'tower-of-syllables/02',
      creature: { from: 0, to: 1 },
      firstThreeStars: true,
      windowLit: true,
    });
    expect(steps).toEqual(['stars', 'sparks', 'card', 'creature', 'firstThreeStars']);
    expect(isLevelUnlocked(progress, L2)).toBe(true);
    expect(progress.levels[L1.id]).toMatchObject({ bestStars: 3, plays: 1 });
  });

  it('replays keep the best stars and celebrate one-time moments only once', () => {
    const first = finishLevel({ progress: withSparks(emptyProgress(), 9), run: run(9, 9), level: L1, content, now: day(21) });
    const again = finishLevel({ progress: withSparks(first.progress, 5), run: run(5, 9, 5), level: L1, content, now: day(21) });
    expect(again.summary).toMatchObject({ stars: 1, newBest: false, card: null, unlocked: null, creature: null, firstThreeStars: false, windowLit: false });
    expect(again.steps).toEqual(['stars', 'sparks']);
    expect(again.progress.levels[L1.id]).toMatchObject({ bestStars: 3, plays: 2 });
  });

  it('Іскрик grows when this level’s sparks cross a threshold', () => {
    let p = finishLevel({ progress: withSparks(emptyProgress(), 9), run: run(9, 9), level: L1, content, now: day(1) }).progress;
    p = withSparks(p, config.creature.youngAtSparks - 9 - 5);
    const { summary } = finishLevel({ progress: withSparks(p, 10), run: run(8, 9, 10), level: L2, content, now: day(2) });
    expect(summary.creature).toEqual({ from: 1, to: 2 });
  });

  it('every 7th lit window brings the weekly surprise card', () => {
    let p = emptyProgress();
    const weekly: (string | null)[] = [];
    for (let d = 1; d <= 8; d++) {
      const done = finishLevel({ progress: p, run: run(9, 9, 0), level: L1, content, now: day(d) });
      p = done.progress;
      weekly.push(done.summary.weeklyCard);
    }
    expect(weekly).toEqual([null, null, null, null, null, null, 'card-week', null]);
    expect(p.rewards.litWindows).toHaveLength(8);
  });
});
