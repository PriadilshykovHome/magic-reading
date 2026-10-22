import { expect, test } from 'vitest';
import { orthodoxEaster } from './calendar';
import { catchStar, findPysanka, hiddenPysanky } from './eggs';
import { emptyProgress } from './progress';
import { testContent } from '../../reading/engine/testContent';

const { config } = testContent();

test('the shooting star gives one bonus spark a day', () => {
  const day = (d: number) => new Date(2026, 9, d, 12);
  const first = catchStar(emptyProgress(), day(22));
  expect(first.spark).toBe(true);
  expect(catchStar(first.progress, day(22)).spark).toBe(false);
  const next = catchStar(first.progress, day(23));
  expect(next.progress.rewards.sparksEarned).toBe(2);
});

test('pysanky hide only around Великдень; the year’s last one brings the card once', () => {
  const easter = orthodoxEaster(2027);
  expect(hiddenPysanky(emptyProgress(), new Date(2027, 9, 1), config)).toEqual([]);
  let p = emptyProgress();
  const cards: (string | null)[] = [];
  for (const i of hiddenPysanky(p, easter, config)) {
    const found = findPysanka(p, i, easter, config);
    p = found.progress;
    cards.push(found.card);
  }
  expect(cards.filter(Boolean)).toEqual([config.eggs.pysankyCard]);
  expect(cards.at(-1)).toBe(config.eggs.pysankyCard);
  expect(hiddenPysanky(p, easter, config)).toEqual([]);
  expect(findPysanka(p, 0, easter, config).card).toBeNull();
});
