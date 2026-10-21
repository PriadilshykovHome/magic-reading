import { describe, expect, it } from 'vitest';
import { newest, pickTarget, srWeight, weakest } from './picker';
import { emptyProgress } from './progress';
import { seededRandom, shuffle } from './rng';
import { testContent } from './testContent';

const { config } = testContent();
const now = new Date(2026, 9, 21, 12);

describe('rng', () => {
  it('is deterministic per seed and shuffle keeps every item', () => {
    const a = seededRandom(7);
    const b = seededRandom(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(shuffle([1, 2, 3, 4, 5], seededRandom(3)).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('srWeight', () => {
  it('favours low boxes and items not seen for a while', () => {
    const fresh = now.toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();
    const item = (box: number, lastSeen: string) => ({ box, seen: 1, firstTryOk: 0, wrong: 0, lastSeen, okDays: [] });
    expect(srWeight(item(1, fresh), now, config)).toBeGreaterThan(srWeight(item(5, fresh), now, config));
    expect(srWeight(item(3, weekAgo), now, config)).toBeGreaterThan(srWeight(item(3, fresh), now, config));
  });
});

describe('pickTarget', () => {
  const eligible = ['syl-ma', 'syl-mo', 'syl-la', 'syl-na', 'syl-ta'];
  const review = new Set(['syl-na', 'syl-ta']);

  it('picks shaky items far more often than mastered ones', () => {
    const progress = emptyProgress();
    for (const id of ['syl-mo', 'syl-la']) {
      progress.items[id] = { box: 5, seen: 9, firstTryOk: 9, wrong: 0, lastSeen: now.toISOString(), okDays: [] };
    }
    const rng = seededRandom(11);
    const counts = new Map<string, number>();
    for (let i = 0; i < 2000; i++) {
      const id = pickTarget({ eligible, review, progress, used: new Map(), rng, now, config });
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    expect(counts.get('syl-ma')!).toBeGreaterThan(3 * counts.get('syl-mo')!);
  });

  it('mixes in about a quarter review items', () => {
    const rng = seededRandom(5);
    let reviewPicks = 0;
    for (let i = 0; i < 4000; i++) {
      if (review.has(pickTarget({ eligible, review, progress: emptyProgress(), used: new Map(), rng, now, config }))) reviewPicks++;
    }
    expect(reviewPicks / 4000).toBeCloseTo(config.session.reviewShare, 1);
  });

  it('avoids repeating the previous target', () => {
    const rng = seededRandom(9);
    for (let i = 0; i < 200; i++) {
      expect(pickTarget({ eligible: ['syl-ma', 'syl-mo'], review: new Set(), progress: emptyProgress(), used: new Map(), last: 'syl-ma', rng, now, config })).toBe('syl-mo');
    }
  });
});

describe('Magic Door picks', () => {
  it('weakest = lowest box, then most misses; newest = least seen', () => {
    const p = emptyProgress();
    p.items['w-mama'] = { box: 4, seen: 8, firstTryOk: 6, wrong: 1, lastSeen: null, okDays: [] };
    p.items['w-lama'] = { box: 1, seen: 5, firstTryOk: 1, wrong: 3, lastSeen: null, okDays: [] };
    p.items['w-mylo'] = { box: 1, seen: 2, firstTryOk: 0, wrong: 1, lastSeen: null, okDays: [] };
    expect(weakest(['w-mama', 'w-lama', 'w-mylo'], p)).toBe('w-lama');
    expect(newest(['w-mama', 'w-lama', 'w-mylo'], p)).toBe('w-mylo');
  });
});
