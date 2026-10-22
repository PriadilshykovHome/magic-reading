// Spaced repetition: which item a task asks about. Items sit in boxes 1–5; each box has an
// interval in days. Low boxes and overdue items come up more often, items not yet due rarely,
// and about a quarter of the tasks review earlier levels (their most overdue items).
import type { ItemProgress, Progress } from './progress.ts';
import { weightedPick, type Rng } from './rng.ts';
import type { CoreConfig as Config } from './schema.ts';

const DAY_MS = 86_400_000;
/** With a thousand words learned, review still only draws from the most overdue few. */
const REVIEW_LIMIT = 50;

export function srWeight(item: ItemProgress | undefined, now: Date, config: Config): number {
  const { weights, intervalDays, max } = config.boxes;
  if (!item) return weights[0]! * 1.2; // new material: as shaky as box 1, slightly favoured
  const box = Math.min(Math.max(item.box, 1), max) - 1;
  const interval = intervalDays[box]!;
  const days = item.lastSeen ? Math.max(0, (now.getTime() - Date.parse(item.lastSeen)) / DAY_MS) : 2 * interval + 1;
  // 1 = due today; below 1 = not due yet (still possible, rarely); overdue items climb to 3×.
  const due = interval === 0 ? 1 + Math.min(days, 2) / 2 : days / interval;
  return weights[box]! * Math.min(3, 0.15 + due);
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
  const weight = (id: string) => srWeight(progress.items[id], now, config);
  const main = eligible.filter((id) => !review.has(id));
  const reviewable = eligible.filter((id) => review.has(id));
  const old = reviewable.length > REVIEW_LIMIT ? [...reviewable].sort((a, b) => weight(b) - weight(a)).slice(0, REVIEW_LIMIT) : reviewable;
  let from = main.length > 0 ? main : old;
  if (main.length > 0 && old.length > 0 && rng() < config.session.reviewShare) from = old;
  return weightedPick(
    from,
    (id) => (id === last && from.length > 1 ? 0 : weight(id) / (1 + 3 * (used.get(id) ?? 0))),
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
