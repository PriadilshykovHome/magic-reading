// Which small ambient details show on a screen today. Seasonal ones come first, on their dates;
// the others each have a daily chance. At most `perScreen` show, never two in the same place,
// and the choice holds all day (seeded by the date), so they don't reshuffle on every visit.
import { dayKey } from '../../engine/calendar.ts';
import { seededRandom, shuffle } from '../../engine/rng.ts';
import type { CoreConfig } from '../../engine/schema.ts';

export type PropScreen = 'door' | 'map';
/** Where a prop sits; two props never share one. */
export type PropSlot = 'ground-left' | 'ground-right' | 'corner' | 'sky' | 'moon' | 'roofs' | 'castle';

export interface PropDef {
  id: string;
  screens: readonly PropScreen[];
  slots: readonly PropSlot[];
}

/** Every prop, in priority order (seasonal ones before the rest, see content/config.json). */
export const PROPS: readonly PropDef[] = [
  { id: 'pumpkins', screens: ['door'], slots: ['ground-left', 'ground-right'] },
  { id: 'mykolai', screens: ['door'], slots: ['ground-left'] },
  { id: 'carolStar', screens: ['door', 'map'], slots: ['sky'] },
  { id: 'stork', screens: ['door'], slots: ['roofs'] },
  { id: 'kalyna', screens: ['door'], slots: ['ground-right'] },
  { id: 'sleepyOwl', screens: ['door'], slots: ['corner'] },
  { id: 'synychka', screens: ['door'], slots: ['corner'] },
  { id: 'owlMoon', screens: ['door', 'map'], slots: ['moon'] },
  // Drawn by the map's castle (CastleWindows), not by PropLayer.
  { id: 'cat', screens: ['map'], slots: ['castle'] },
];

const monthDay = (date: Date) => dayKey(date).slice(5);
const within = (md: string, [from, to]: readonly [string, string]) => (from <= to ? md >= from && md <= to : md >= from || md <= to);

function seedOf(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

export function pickProps(config: CoreConfig['props'], screen: PropScreen, date: Date, defs: readonly PropDef[] = PROPS): string[] {
  const rng = seededRandom(seedOf(`${dayKey(date)}:${screen}`));
  const here = defs.filter((d) => d.screens.includes(screen));
  const seasonal = here.filter((d) => config.dates[d.id] && within(monthDay(date), config.dates[d.id]!));
  const lucky = shuffle(
    here.filter((d) => config.chance[d.id] !== undefined && rng() < config.chance[d.id]!),
    rng,
  );
  const taken = new Set<PropSlot>();
  const out: string[] = [];
  for (const d of [...seasonal, ...lucky]) {
    if (out.length >= config.perScreen || d.slots.some((s) => taken.has(s))) continue;
    d.slots.forEach((s) => taken.add(s));
    out.push(d.id);
  }
  return out;
}
