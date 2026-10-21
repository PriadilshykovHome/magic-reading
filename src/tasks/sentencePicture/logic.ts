// A short sentence; he taps the scene that matches. The scenes differ in exactly what he must
// read, never in things a picture can't show (тут / там).
import { z } from 'zod';
import { shuffle } from '../../engine/rng.ts';
import type { TaskLogic } from '../../engine/taskLogic.ts';

const configSchema = z.strictObject({
  type: z.literal('sentencePicture'),
  count: z.number().int().min(1),
  choices: z.number().int().min(2).max(3).default(3),
});
type Config = z.output<typeof configSchema>;

export const sentencePicture: TaskLogic<Config, Record<string, never>> = {
  id: 'sentencePicture',
  configSchema,
  scored: true,
  reading: true,
  needsParent: false,
  instruction: () => 'instructions.sentencePicture',
  eligible: (ctx) => ctx.candidates('sentence'),
  build: (ctx, config, target) => ({
    target,
    options: shuffle([target, ...ctx.distractors('sentence', target, config.choices - 1)], ctx.rng),
    data: {},
  }),
};
