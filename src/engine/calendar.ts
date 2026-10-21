// Dates for streak windows, mastery days and the seasonal / personal Easter eggs. Pure: every
// function takes the date it should look at (the app passes a debug override when testing).
import type { Config } from './schema.ts';

export const SEASONS = ['winter', 'spring', 'summer', 'autumn'] as const;
export type Season = (typeof SEASONS)[number];
export type TimeOfDay = 'night' | 'morning' | 'day' | 'evening';

const DAY_MS = 86_400_000;

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function seasonFor(date: Date): Season {
  const month = date.getMonth();
  if (month === 11 || month <= 1) return 'winter';
  if (month <= 4) return 'spring';
  if (month <= 7) return 'summer';
  return 'autumn';
}

export function parseSeason(value: string | null | undefined): Season | undefined {
  return SEASONS.find((s) => s === value);
}

export function timeOfDay(date: Date, eggs: Config['eggs']): TimeOfDay {
  const hour = date.getHours();
  if (hour < 5) return 'night';
  if (hour < eggs.morningUntilHour) return 'morning';
  if (hour < eggs.eveningFromHour) return 'day';
  return 'evening';
}

/**
 * Orthodox Easter (Великдень) in the Gregorian calendar: Meeus' Julian algorithm plus the
 * 13-day calendar offset, valid for 1900–2099.
 */
export function orthodoxEaster(year: number): Date {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31); // Julian month (3 = March, 4 = April)
  const day = ((d + e + 114) % 31) + 1;
  return new Date(year, month - 1, day + 13);
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** True in the days around Великдень when the pysanky hide on the map. */
export function isPysankyTime(date: Date, eggs: Config['eggs']): boolean {
  const diffDays = Math.round((startOfDay(date) - orthodoxEaster(date.getFullYear()).getTime()) / DAY_MS);
  return diffDays >= -eggs.pysankyDaysBefore && diffDays <= eggs.pysankyDaysAfter;
}

/** `birthday` is YYYY-MM-DD; a 29 February birthday is celebrated on 28 February in other years. */
export function isBirthday(date: Date, birthday: string | undefined): boolean {
  const parts = parseDay(birthday);
  if (!parts) return false;
  const leap = new Date(date.getFullYear(), 1, 29).getMonth() === 1;
  const [month, day] = parts.month === 2 && parts.day === 29 && !leap ? [2, 28] : [parts.month, parts.day];
  return date.getMonth() + 1 === month && date.getDate() === day;
}

export function ageOn(date: Date, birthday: string | undefined): number | undefined {
  const parts = parseDay(birthday);
  if (!parts) return undefined;
  const hadBirthday =
    date.getMonth() + 1 > parts.month || (date.getMonth() + 1 === parts.month && date.getDate() >= parts.day);
  return date.getFullYear() - parts.year - (hadBirthday ? 0 : 1);
}

function parseDay(value: string | undefined): { year: number; month: number; day: number } | undefined {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return undefined;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

export interface Surprises {
  season: Season;
  timeOfDay: TimeOfDay;
  pumpkins: boolean;
  snow: boolean;
  fireflies: boolean;
  pysanky: boolean;
  birthday: boolean;
  /** His age today, if the private profile has a birthday. */
  age?: number;
}

/** Everything date-driven that decorates the map and start screen today. */
export function surprisesOn(date: Date, eggs: Config['eggs'], birthday?: string): Surprises {
  const season = seasonFor(date);
  const time = timeOfDay(date, eggs);
  return {
    season,
    timeOfDay: time,
    pumpkins: season === 'autumn',
    snow: season === 'winter',
    fireflies: season === 'summer' && (time === 'evening' || time === 'night'),
    pysanky: isPysankyTime(date, eggs),
    birthday: isBirthday(date, birthday),
    age: ageOn(date, birthday),
  };
}
