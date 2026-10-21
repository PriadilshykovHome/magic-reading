// Pure season logic for the seasonal decorations (pumpkins in autumn, snow in winter, ...).
export const SEASONS = ['winter', 'spring', 'summer', 'autumn'] as const;
export type Season = (typeof SEASONS)[number];

export function seasonFor(date: Date): Season {
  const month = date.getMonth(); // 0 = January
  if (month === 11 || month <= 1) return 'winter';
  if (month <= 4) return 'spring';
  if (month <= 7) return 'summer';
  return 'autumn';
}

export function parseSeason(value: string | null | undefined): Season | undefined {
  return SEASONS.find((s) => s === value);
}
