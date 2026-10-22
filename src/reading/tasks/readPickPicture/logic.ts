// A word on a parchment card; he taps the matching picture. A reading task: the word is only
// spoken after he answers.
import { z } from 'zod';
import { shuffle } from '../../../core/engine/rng.ts';
import type { ReadingTaskLogic } from '../../engine/domain.ts';

const configSchema = z.strictObject({
  type: z.literal('readPickPicture'),
  count: z.number().int().min(1),
  choices: z.number().int().min(2).max(3).default(3),
});
type Config = z.output<typeof configSchema>;

export const readPickPicture: ReadingTaskLogic<Config, Record<string, never>> = {
  id: 'readPickPicture',
  configSchema,
  scored: true,
  reading: true,
  needsParent: false,
  instruction: () => 'instructions.readPickPicture',
  eligible: (ctx) => ctx.candidates('word'),
  build: (ctx, config, target) => ({
    target,
    options: shuffle([target, ...ctx.distractors('word', target, config.choices - 1)], ctx.rng),
    data: {},
  }),
};
