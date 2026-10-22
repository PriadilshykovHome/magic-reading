// The hidden surprises that change saved progress: the shooting star (a bonus spark once a day)
// and the pysanky hunt around Великдень (all of a year's eggs found → a special card). Pure.
import { dayKey, isPysankyTime } from './calendar.ts';
import type { Progress } from './progress.ts';
import type { CoreConfig as Config } from './schema.ts';

/** He caught the shooting star: one bonus spark, once a day. */
export function catchStar(progress: Progress, now: Date): { progress: Progress; spark: boolean } {
  const today = dayKey(now);
  if (progress.rewards.lastStar === today) return { progress, spark: false };
  return {
    progress: { ...progress, rewards: { ...progress.rewards, sparksEarned: progress.rewards.sparksEarned + 1, lastStar: today } },
    spark: true,
  };
}

const pysankaKey = (year: number, index: number) => `pysanka-${year}-${index}`;

/** Which of this year's pysanky are still hidden (none outside the days around Великдень). */
export function hiddenPysanky(progress: Progress, now: Date, config: Config): number[] {
  if (!isPysankyTime(now, config.eggs)) return [];
  const found = new Set(progress.easterEggs.found);
  return Array.from({ length: config.eggs.pysankyCount }, (_, i) => i).filter((i) => !found.has(pysankaKey(now.getFullYear(), i)));
}

/** He found one; the year's last one brings the pysanka card (once). */
export function findPysanka(progress: Progress, index: number, now: Date, config: Config): { progress: Progress; card: string | null } {
  const key = pysankaKey(now.getFullYear(), index);
  if (progress.easterEggs.found.includes(key)) return { progress, card: null };
  const found = [...progress.easterEggs.found, key];
  const year = Array.from({ length: config.eggs.pysankyCount }, (_, i) => pysankaKey(now.getFullYear(), i));
  const all = year.every((k) => found.includes(k));
  const card = all && !progress.rewards.cards.includes(config.eggs.pysankyCard) ? config.eggs.pysankyCard : null;
  return {
    progress: {
      ...progress,
      easterEggs: { ...progress.easterEggs, found },
      rewards: card ? { ...progress.rewards, cards: [...progress.rewards.cards, card] } : progress.rewards,
    },
    card,
  };
}
