// The voice says a syllable or word; he taps the matching written card.
import { z } from 'zod';
import { shuffle } from '../../engine/rng.ts';
import type { TaskLogic } from '../../engine/taskLogic.ts';

const configSchema = z.strictObject({
  type: z.literal('hearPick'),
  count: z.number().int().min(1),
  itemKind: z.enum(['syllable', 'word']).default('syllable'),
  choices: z.number().int().min(2).max(3).default(3),
});
type Config = z.output<typeof configSchema>;

export const hearPick: TaskLogic<Config, Record<string, never>> = {
  id: 'hearPick',
  configSchema,
  scored: true,
  reading: false,
  needsParent: false,
  instruction: (config) => `instructions.hearPick.${config.itemKind}`,
  eligible: (ctx, config) => ctx.candidates(config.itemKind),
  build: (ctx, config, target) => ({
    target,
    options: shuffle([target, ...ctx.distractors(config.itemKind, target, config.choices - 1)], ctx.rng),
    data: {},
  }),
};
