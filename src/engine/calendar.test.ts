import { describe, expect, it } from 'vitest';
import { ageOn, dayKey, isBirthday, isPysankyTime, orthodoxEaster, parseSeason, seasonFor, surprisesOn, timeOfDay } from './calendar';
import { testContent } from './testContent';

const eggs = testContent().config.eggs;
const on = (iso: string, hour = 12) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d!, hour);
};

describe('orthodoxEaster (Великдень)', () => {
  it.each([
    [2023, '2023-04-16'],
    [2024, '2024-05-05'],
    [2025, '2025-04-20'],
    [2026, '2026-04-12'],
    [2027, '2027-05-02'],
    [2030, '2030-04-28'],
  ])('%i → %s', (year, expected) => {
    expect(dayKey(orthodoxEaster(year))).toBe(expected);
  });

  it('hides pysanky from 3 days before to 7 days after', () => {
    expect(isPysankyTime(on('2026-04-08'), eggs)).toBe(false);
    expect(isPysankyTime(on('2026-04-09'), eggs)).toBe(true);
    expect(isPysankyTime(on('2026-04-12'), eggs)).toBe(true);
    expect(isPysankyTime(on('2026-04-19'), eggs)).toBe(true);
    expect(isPysankyTime(on('2026-04-20'), eggs)).toBe(false);
  });
});

describe('seasons and time of day', () => {
  it.each([
    ['2026-12-01', 'winter'],
    ['2027-02-28', 'winter'],
    ['2027-03-01', 'spring'],
    ['2027-06-01', 'summer'],
    ['2026-09-01', 'autumn'],
    ['2026-11-30', 'autumn'],
  ])('%s is %s', (iso, season) => {
    expect(seasonFor(on(iso))).toBe(season);
  });

  it('parses only known seasons', () => {
    expect(parseSeason('winter')).toBe('winter');
    expect(parseSeason('monsoon')).toBeUndefined();
  });

  it('turns evening at 19:00 and morning before 10:00', () => {
    expect(timeOfDay(on('2026-10-21', 3), eggs)).toBe('night');
    expect(timeOfDay(on('2026-10-21', 8), eggs)).toBe('morning');
    expect(timeOfDay(on('2026-10-21', 14), eggs)).toBe('day');
    expect(timeOfDay(on('2026-10-21', 19), eggs)).toBe('evening');
  });
});

describe('birthday', () => {
  it('matches month and day, and computes the new age', () => {
    expect(isBirthday(on('2027-03-14'), '2022-03-14')).toBe(true);
    expect(isBirthday(on('2027-03-15'), '2022-03-14')).toBe(false);
    expect(ageOn(on('2027-03-13'), '2022-03-14')).toBe(4);
    expect(ageOn(on('2027-03-14'), '2022-03-14')).toBe(5);
  });

  it('celebrates a 29 February birthday on 28 February in other years', () => {
    expect(isBirthday(on('2027-02-28'), '2024-02-29')).toBe(true);
    expect(isBirthday(on('2028-02-29'), '2024-02-29')).toBe(true);
    expect(isBirthday(on('2028-02-28'), '2024-02-29')).toBe(false);
  });

  it('is off without a birthday in the private profile', () => {
    expect(isBirthday(on('2027-03-14'), undefined)).toBe(false);
  });
});

describe('surprisesOn', () => {
  it('decorates today (21 Oct, evening) with pumpkins', () => {
    expect(surprisesOn(on('2026-10-21', 20), eggs)).toMatchObject({
      season: 'autumn',
      timeOfDay: 'evening',
      pumpkins: true,
      snow: false,
      pysanky: false,
      birthday: false,
    });
  });

  it('brings fireflies only on summer evenings, and snow in winter', () => {
    expect(surprisesOn(on('2027-07-01', 21), eggs).fireflies).toBe(true);
    expect(surprisesOn(on('2027-07-01', 12), eggs).fireflies).toBe(false);
    expect(surprisesOn(on('2027-01-05'), eggs).snow).toBe(true);
  });
});
