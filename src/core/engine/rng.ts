// Seeded randomness. The engine never calls Math.random(): callers pass an Rng in, so tests and
// replays are deterministic.
export type Rng = () => number;

/** mulberry32: small, fast, good enough for games. */
export function seededRandom(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function pickOne<T>(items: readonly T[], rng: Rng): T {
  if (items.length === 0) throw new Error('pickOne: empty list');
  return items[Math.floor(rng() * items.length)]!;
}

export function weightedPick<T>(items: readonly T[], weight: (item: T) => number, rng: Rng): T {
  if (items.length === 0) throw new Error('weightedPick: empty list');
  const weights = items.map((item) => Math.max(0, weight(item)));
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return pickOne(items, rng);
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i]!;
    if (roll < 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

/** Weighted sampling without replacement. */
export function weightedSample<T>(items: readonly T[], n: number, weight: (item: T) => number, rng: Rng): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    const chosen = weightedPick(pool, weight, rng);
    out.push(chosen);
    pool.splice(pool.indexOf(chosen), 1);
  }
  return out;
}
