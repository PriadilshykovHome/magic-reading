// The teaching moment: a consonant card flies into a vowel card and they fuse ("М… А… МА").
import { z } from 'zod';
import type { ReadingTaskLogic } from '../../engine/domain.ts';

const configSchema = z.strictObject({ type: z.literal('syllableMerge'), count: z.number().int().min(1) });
type Config = z.output<typeof configSchema>;

export interface SyllableMergeData {
  /** The letters that merge, in order, e.g. ["М", "А"]. */
  parts: string[];
}

export const syllableMerge: ReadingTaskLogic<Config, SyllableMergeData> = {
  id: 'syllableMerge',
  configSchema,
  scored: false,
  reading: false,
  playsTarget: true,
  needsParent: false,
  instruction: () => 'instructions.syllableMerge',
  // Only this level's new consonant + vowel syllables.
  eligible: (ctx) => ctx.level.pool.syllables.filter((id) => ctx.content.syllables.get(id)?.parts.length === 2),
  build: (ctx, _config, target) => ({
    target,
    options: [],
    data: { parts: [...ctx.content.syllables.get(target)!.parts] },
  }),
};
