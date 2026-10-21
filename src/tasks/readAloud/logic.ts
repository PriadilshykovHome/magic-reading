// He reads a syllable, word or sentence aloud; the parent taps a small tick or "again", then he
// can tap to hear it. Only offered when the parent-nearby setting is on.
import { z } from 'zod';
import type { TaskLogic } from '../../engine/taskLogic.ts';

const configSchema = z.strictObject({
  type: z.literal('readAloud'),
  count: z.number().int().min(1),
  itemKind: z.enum(['syllable', 'word', 'sentence']),
});
type Config = z.output<typeof configSchema>;

export const readAloud: TaskLogic<Config, Record<string, never>> = {
  id: 'readAloud',
  configSchema,
  scored: true,
  reading: true,
  needsParent: true,
  instruction: () => 'instructions.readAloud',
  eligible: (ctx, config) => ctx.candidates(config.itemKind),
  build: (_ctx, _config, target) => ({ target, options: [], data: {} }),
};
