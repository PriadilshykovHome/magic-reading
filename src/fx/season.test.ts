import { describe, expect, it } from 'vitest';
import { parseSeason, seasonFor } from './season';

const on = (iso: string) => new Date(`${iso}T12:00:00`);

describe('seasonFor', () => {
  it.each([
    ['2026-12-01', 'winter'],
    ['2027-01-15', 'winter'],
    ['2027-02-28', 'winter'],
    ['2027-03-01', 'spring'],
    ['2027-05-31', 'spring'],
    ['2027-06-01', 'summer'],
    ['2027-08-31', 'summer'],
    ['2026-09-01', 'autumn'],
    ['2026-10-21', 'autumn'],
    ['2026-11-30', 'autumn'],
  ])('%s is %s', (iso, season) => {
    expect(seasonFor(on(iso))).toBe(season);
  });
});

describe('parseSeason', () => {
  it('accepts known seasons and rejects anything else', () => {
    expect(parseSeason('winter')).toBe('winter');
    expect(parseSeason('monsoon')).toBeUndefined();
    expect(parseSeason(null)).toBeUndefined();
  });
});
