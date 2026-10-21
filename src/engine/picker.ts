// Spaced repetition: which item a task asks about. Items sit in boxes 1–5; low boxes and items
// not seen for a while come up more often, and about a quarter come from earlier levels.
import type { ItemProgress, Progress } from './progress.ts';
import { weightedPick, type Rng } from './rng.ts';
import type { Config } from './schema.ts';

const DAY_MS = 86_400_000;

export function srWeight(item: ItemProgress | undefined, now: Date, config: Config): number {
  const { weights, max } = config.boxes;
  if (!item) return weights[0]! * 1.2; // new material: as shaky as box 1, slightly favoured
  const weight = weights[Math.min(Math.max(item.box, 1), max) - 1]!;
  const days = item.lastSeen ? Math.max(0, (now.getTime() - Date.parse(item.lastSeen)) / DAY_MS) : 14;
  return weight * (1 + Math.min(days, 14) / 7);
}

export interface PickInput {
  eligible: readonly string[];
  /** Eligible items that come from earlier levels. */
  review: ReadonlySet<string>;
  progress: Progress;
  /** How often each item was already used in this session. */
  used: ReadonlyMap<string, number>;
  /** The previous task's target, avoided when there's a choice. */
  last?: string;
  rng: Rng;
  now: Date;
  config: Config;
}

export function pickTarget(input: PickInput): string {
  const { eligible, review, progress, used, last, rng, now, config } = input;
  const main = eligible.filter((id) => !review.has(id));
  const old = eligible.filter((id) => review.has(id));
  let from = main.length > 0 ? main : old;
  if (main.length > 0 && old.length > 0 && rng() < config.session.reviewShare) from = old;
  return weightedPick(
    from,
    (id) => (id === last && from.length > 1 ? 0 : srWeight(progress.items[id], now, config) / (1 + 3 * (used.get(id) ?? 0))),
    rng,
  );
}

/** The item he finds hardest: lowest box, then most misses, then least practised. */
export function weakest(eligible: readonly string[], progress: Progress): string {
  return [...eligible].sort((a, b) => {
    const pa = progress.items[a];
    const pb = progress.items[b];
    return (pa?.box ?? 1) - (pb?.box ?? 1) || (pb?.wrong ?? 0) - (pa?.wrong ?? 0) || (pa?.seen ?? 0) - (pb?.seen ?? 0);
  })[0]!;
}

/** The item he has seen least: usually this level's newest material. */
export function newest(eligible: readonly string[], progress: Progress): string {
  return [...eligible].sort((a, b) => (progress.items[a]?.seen ?? 0) - (progress.items[b]?.seen ?? 0))[0]!;
}
