// The player's saved state (the Firestore document players/{uid}, minus the private profile) and
// the pure functions that update it. The progress store is the single source of truth; it calls
// these and mirrors the result to local storage and the cloud.
import { z } from 'zod';
import { dayKey } from './calendar.ts';
import type { CoreConfig as Config } from './schema.ts';

const Counter = z.number().int().min(0).default(0);

export const SettingsSchema = z.object({
  parentNearby: z.boolean().default(true),
  lowercaseSentences: z.boolean().default(false),
  voice: z.number().min(0).max(1).default(1),
  sfx: z.number().min(0).max(1).default(0.8),
  music: z.number().min(0).max(1).default(0.3),
  musicInTasks: z.boolean().default(false),
  sessionLimit: z.enum(['off', 'one-level', 'two-levels', 'fifteen-minutes']).default('off'),
  reducedEffects: z.boolean().default(false),
  unlockAll: z.boolean().default(false),
});

export const ItemProgressSchema = z.object({
  box: z.number().int().min(1).default(1),
  seen: Counter,
  firstTryOk: Counter,
  wrong: Counter,
  lastSeen: z.string().nullable().default(null),
  okDays: z.array(z.string()).default([]),
});

export const LevelProgressSchema = z.object({
  bestStars: z.number().int().min(0).max(3).default(0),
  plays: Counter,
  completedAt: z.string().nullable().default(null),
});

export const ProgressSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  settings: SettingsSchema.prefault({}),
  /** When the settings last changed (ISO time), so merging devices keeps the newer ones. */
  settingsAt: z.string().nullable().default(null),
  levels: z.record(z.string(), LevelProgressSchema).default({}),
  items: z.record(z.string(), ItemProgressSchema).default({}),
  rewards: z
    .object({
      // Both only ever go up, so merging devices by "take the higher" is safe; balance = earned − spent.
      sparksEarned: Counter,
      sparksSpent: Counter,
      cards: z.array(z.string()).default([]),
      litWindows: z.array(z.string()).default([]),
      /** One-time moments already celebrated, e.g. "firstThreeStars". */
      milestones: z.array(z.string()).default([]),
      /** The day of his last daily warm-up (one a day). */
      lastWarmup: z.string().nullable().default(null),
      /** The day he last caught the shooting star (one bonus spark a day). */
      lastStar: z.string().nullable().default(null),
    })
    .prefault({}),
  easterEggs: z.object({ found: z.array(z.string()).default([]) }).prefault({}),
});

export type Settings = z.output<typeof SettingsSchema>;
export type ItemProgress = z.output<typeof ItemProgressSchema>;
export type LevelProgress = z.output<typeof LevelProgressSchema>;
export type Progress = z.output<typeof ProgressSchema>;

export function emptyProgress(): Progress {
  return ProgressSchema.parse({});
}

export function sparkBalance(progress: Progress): number {
  return progress.rewards.sparksEarned - progress.rewards.sparksSpent;
}

export interface TaskOutcome {
  target: string;
  scored: boolean;
  firstTry: boolean;
  sparks: number;
}

/**
 * Saves one finished task: sparks always; for scored tasks the target moves up one box on a
 * first-try answer and back to box 1 after any miss.
 */
export function recordTaskResult(progress: Progress, outcome: TaskOutcome, now: Date, config: Config): Progress {
  const prev = progress.items[outcome.target] ?? ItemProgressSchema.parse({});
  const today = dayKey(now);
  // Day keys, not timestamps: spaced repetition counts days, and the saved document stays small.
  let item: ItemProgress = { ...prev, seen: prev.seen + 1, lastSeen: today };
  if (outcome.scored) {
    item = outcome.firstTry
      ? {
          ...item,
          box: Math.min(config.boxes.max, prev.box + 1),
          firstTryOk: prev.firstTryOk + 1,
          // Mastery only needs the last few distinct days, which keeps the saved document small.
          okDays: prev.okDays.includes(today) ? prev.okDays : [...prev.okDays, today].slice(-config.mastery.distinctDays),
        }
      : { ...item, box: 1, wrong: prev.wrong + 1 };
  }
  return {
    ...progress,
    items: { ...progress.items, [outcome.target]: item },
    rewards: { ...progress.rewards, sparksEarned: progress.rewards.sparksEarned + outcome.sparks },
  };
}

/** A page in the Book of Spells lights up: right first time N times, on at least M different days. */
export function isMastered(item: ItemProgress | undefined, config: Config): boolean {
  if (!item) return false;
  return item.firstTryOk >= config.mastery.firstTryOk && new Set(item.okDays).size >= config.mastery.distinctDays;
}

export const CREATURE_STAGES = ['egg', 'hatchling', 'young', 'big'] as const;
export type CreatureStage = (typeof CREATURE_STAGES)[number];

/** Іскрик's growth is derived (never stored), so it can't disagree between devices. */
export function creatureStage(progress: Progress, config: Config): number {
  const hatched = (progress.levels[config.creature.hatchAfterLevel]?.bestStars ?? 0) > 0;
  if (!hatched) return 0;
  const sparks = progress.rewards.sparksEarned;
  if (sparks >= config.creature.bigAtSparks) return 3;
  if (sparks >= config.creature.youngAtSparks) return 2;
  return 1;
}
