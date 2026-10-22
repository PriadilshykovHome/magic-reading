import { expect, test } from 'vitest';
import { dayKey, isBirthday, isPysankyTime, orthodoxEaster, surprisesOn } from './calendar';
import { testContent } from '../../reading/engine/testContent';

const eggs = testContent().config.eggs;
const on = (iso: string, hour = 12) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y!, m! - 1, d!, hour);
};

test('Orthodox Easter dates, and the pysanky window around them', () => {
  for (const [year, date] of [[2024, '2024-05-05'], [2025, '2025-04-20'], [2026, '2026-04-12'], [2027, '2027-05-02']] as const) {
    expect(dayKey(orthodoxEaster(year))).toBe(date);
  }
  expect([on('2026-04-08'), on('2026-04-09'), on('2026-04-19'), on('2026-04-20')].map((d) => isPysankyTime(d, eggs))).toEqual([false, true, true, false]);
});

test('seasonal and personal surprises', () => {
  expect(surprisesOn(on('2026-10-21', 20), eggs)).toMatchObject({ season: 'autumn', timeOfDay: 'evening', pumpkins: true, snow: false });
  expect(surprisesOn(on('2027-01-05'), eggs).snow).toBe(true);
  expect(surprisesOn(on('2027-07-01', 21), eggs).fireflies).toBe(true);
  expect(surprisesOn(on('2027-03-14'), eggs, '2022-03-14')).toMatchObject({ birthday: true, age: 5 });
  expect(isBirthday(on('2027-02-28'), '2024-02-29')).toBe(true); // 29 Feb celebrated on 28 Feb
  expect(isBirthday(on('2027-03-14'), undefined)).toBe(false); // no private profile, no party
});
