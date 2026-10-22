import { expect, test } from 'vitest';
import { newest, pickTarget, weakest } from './picker';
import { emptyProgress } from './progress';
import { seededRandom } from './rng';
import { testContent } from '../../reading/engine/testContent';

const { config } = testContent();
const now = new Date(2026, 9, 21, 12);

test('spaced repetition: shaky items come up far more often, ~25% review, no immediate repeats', () => {
  const eligible = ['syl-ma', 'syl-mo', 'syl-la', 'syl-na', 'syl-ta'];
  const review = new Set(['syl-na', 'syl-ta']);
  const progress = emptyProgress();
  progress.items['syl-mo'] = { box: 5, seen: 9, firstTryOk: 9, wrong: 0, lastSeen: now.toISOString(), okDays: [] };
  const rng = seededRandom(11);
  const counts = new Map<string, number>();
  for (let i = 0; i < 4000; i++) {
    const id = pickTarget({ eligible, review, progress, used: new Map(), rng, now, config });
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  expect(counts.get('syl-ma')!).toBeGreaterThan(3 * counts.get('syl-mo')!);
  expect(((counts.get('syl-na') ?? 0) + (counts.get('syl-ta') ?? 0)) / 4000).toBeCloseTo(config.session.reviewShare, 1);
  expect(pickTarget({ eligible: ['syl-ma', 'syl-mo'], review: new Set(), progress, used: new Map(), last: 'syl-ma', rng, now, config })).toBe('syl-mo');
});

test('Magic Door picks: weakest = lowest box then most misses; newest = least seen', () => {
  const p = emptyProgress();
  p.items['w-mama'] = { box: 4, seen: 8, firstTryOk: 6, wrong: 1, lastSeen: null, okDays: [] };
  p.items['w-lama'] = { box: 1, seen: 5, firstTryOk: 1, wrong: 3, lastSeen: null, okDays: [] };
  p.items['w-mylo'] = { box: 1, seen: 2, firstTryOk: 0, wrong: 1, lastSeen: null, okDays: [] };
  expect(weakest(['w-mama', 'w-lama', 'w-mylo'], p)).toBe('w-lama');
  expect(newest(['w-mama', 'w-lama', 'w-mylo'], p)).toBe('w-mylo');
});
