import { expect, test } from 'vitest';
import { changedPaths, mergeProgress } from './merge';
import { emptyProgress, ProgressSchema } from './progress';

test('merging two devices keeps everything earned on either, and the order does not matter', () => {
  const laptop = ProgressSchema.parse({
    settings: { music: 0.1 },
    settingsAt: '2026-10-20T10:00:00Z',
    levels: { 'w/01': { bestStars: 3, plays: 2, completedAt: '2026-10-19T09:00:00Z' }, 'w/02': { bestStars: 1, plays: 1 } },
    items: { 'syl-ma': { box: 3, seen: 9, firstTryOk: 7, lastSeen: '2026-10-20', okDays: ['2026-10-18', '2026-10-20'] } },
    rewards: { sparksEarned: 40, sparksSpent: 5, cards: ['card-fox'], lastWarmup: '2026-10-20' },
  });
  const phone = ProgressSchema.parse({
    settings: { music: 0.6 },
    settingsAt: '2026-10-21T08:00:00Z',
    levels: { 'w/01': { bestStars: 2, plays: 5, completedAt: '2026-10-18T09:00:00Z' }, 'w/03': { bestStars: 2, plays: 1 } },
    items: { 'syl-ma': { box: 1, seen: 11, wrong: 2, lastSeen: '2026-10-21', okDays: ['2026-10-19'] }, 'syl-la': { seen: 1, lastSeen: '2026-10-21' } },
    rewards: { sparksEarned: 52, sparksSpent: 0, cards: ['card-bear'], milestones: ['firstThreeStars'] },
    easterEggs: { found: ['moon-star'] },
  });

  const merged = mergeProgress(laptop, phone, 14);
  expect(mergeProgress(phone, laptop, 14)).toEqual(merged);
  expect(merged.settings.music).toBe(0.6); // the newer settings
  expect(merged.levels['w/01']).toEqual({ bestStars: 3, plays: 5, completedAt: '2026-10-18T09:00:00Z' });
  expect(Object.keys(merged.levels).sort()).toEqual(['w/01', 'w/02', 'w/03']);
  // The item seen later wins (a miss today sends it back to box 1), with both devices' good days.
  expect(merged.items['syl-ma']).toMatchObject({ box: 1, seen: 11, okDays: ['2026-10-18', '2026-10-19', '2026-10-20'] });
  expect(merged.items['syl-la']?.seen).toBe(1);
  expect(merged.rewards).toMatchObject({ sparksEarned: 52, sparksSpent: 5, cards: ['card-bear', 'card-fox'], lastWarmup: '2026-10-20' });
  expect(merged.easterEggs.found).toEqual(['moon-star']);
  expect(mergeProgress(merged, merged, 14)).toEqual(merged);

  // A cloud write sends only what changed: here, one item and the sparks.
  const after = { ...merged, items: { ...merged.items, 'syl-la': { ...merged.items['syl-la']!, seen: 2 } }, rewards: { ...merged.rewards, sparksEarned: 53 } };
  expect(changedPaths(merged, after).map((c) => c.path.join(' '))).toEqual(['items syl-la', 'rewards']);
  expect(changedPaths(emptyProgress(), emptyProgress())).toEqual([]);
});
