// Merging the same player's progress from two places (this device and the cloud, or a guest
// session and an account), field by field, so nothing earned on either side is lost:
//   counters only go up → the higher; lists → the union; an item → the one seen later (its okDays
//   joined); settings → the newer; the private profile → the one edited later.
// Pure and order-independent: merge(a, b) equals merge(b, a).
import { z } from 'zod';
import type { ItemProgress, LevelProgress, Progress } from './progress.ts';

const union = (a: readonly string[], b: readonly string[]) => [...new Set([...a, ...b])].sort();
const later = (a: string | null, b: string | null) => (a === null ? b : b === null ? a : a > b ? a : b);
const earlier = (a: string | null, b: string | null) => (a === null ? b : b === null ? a : a < b ? a : b);

function mergeMap<T>(a: Record<string, T>, b: Record<string, T>, both: (x: T, y: T) => T): Record<string, T> {
  const out: Record<string, T> = { ...a };
  for (const [id, y] of Object.entries(b)) out[id] = id in a ? both(a[id]!, y) : y;
  return out;
}

function mergeLevel(a: LevelProgress, b: LevelProgress): LevelProgress {
  return { bestStars: Math.max(a.bestStars, b.bestStars), plays: Math.max(a.plays, b.plays), completedAt: earlier(a.completedAt, b.completedAt) };
}

/** The item seen later wins (its box is the current one); a tie keeps the one seen more. */
function mergeItem(a: ItemProgress, b: ItemProgress, keepDays: number): ItemProgress {
  const aFirst = (a.lastSeen ?? '') > (b.lastSeen ?? '') || (a.lastSeen === b.lastSeen && (a.seen > b.seen || (a.seen === b.seen && JSON.stringify(a) >= JSON.stringify(b))));
  const win = aFirst ? a : b;
  return { ...win, okDays: union(a.okDays, b.okDays).slice(-keepDays) };
}

export function mergeProgress(a: Progress, b: Progress, keepDays: number): Progress {
  const newerSettings = (a.settingsAt ?? '') > (b.settingsAt ?? '') || (a.settingsAt === b.settingsAt && JSON.stringify(a.settings) >= JSON.stringify(b.settings)) ? a : b;
  return {
    schemaVersion: 1,
    settings: newerSettings.settings,
    settingsAt: newerSettings.settingsAt,
    levels: mergeMap(a.levels, b.levels, mergeLevel),
    items: mergeMap(a.items, b.items, (x, y) => mergeItem(x, y, keepDays)),
    rewards: {
      sparksEarned: Math.max(a.rewards.sparksEarned, b.rewards.sparksEarned),
      sparksSpent: Math.max(a.rewards.sparksSpent, b.rewards.sparksSpent),
      cards: union(a.rewards.cards, b.rewards.cards),
      litWindows: union(a.rewards.litWindows, b.rewards.litWindows),
      milestones: union(a.rewards.milestones, b.rewards.milestones),
      lastWarmup: later(a.rewards.lastWarmup, b.rewards.lastWarmup),
    },
    easterEggs: { found: union(a.easterEggs.found, b.easterEggs.found) },
  };
}

/** The private profile (players/{uid}): only ever on his devices and in his cloud document. */
export const ProfileSchema = z.object({
  surname: z.string().optional(),
  patronymic: z.string().optional(),
  /** YYYY-MM-DD */
  birthday: z.string().optional(),
  /** When it was last edited (ISO time); merging keeps the later. */
  updatedAt: z.string().nullable().default(null),
});
export type Profile = z.output<typeof ProfileSchema>;

export const mergeProfile = (a: Profile, b: Profile): Profile => ((a.updatedAt ?? '') >= (b.updatedAt ?? '') ? a : b);

/**
 * What changed between two saved copies, as field paths ([section] or [map, id]), so a cloud
 * write sends only those: one item, not the whole 300-level document.
 */
export function changedPaths(before: Progress, after: Progress): { path: string[]; value: unknown }[] {
  const out: { path: string[]; value: unknown }[] = [];
  const same = (x: unknown, y: unknown) => x === y || JSON.stringify(x) === JSON.stringify(y);
  for (const map of ['levels', 'items'] as const) {
    for (const [id, value] of Object.entries(after[map])) if (!same(before[map][id], value)) out.push({ path: [map, id], value });
  }
  for (const key of ['schemaVersion', 'settings', 'settingsAt', 'rewards', 'easterEggs'] as const) {
    if (!same(before[key], after[key])) out.push({ path: [key], value: after[key] });
  }
  return out;
}
