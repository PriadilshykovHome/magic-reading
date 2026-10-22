// Bubbles with syllables float up; he pops every bubble with the syllable Соня says.
// No time pressure: missed bubbles come round again.
import { z } from 'zod';
import { shuffle } from '../../../core/engine/rng.ts';
import type { ReadingTaskLogic } from '../../engine/domain.ts';

const configSchema = z
  .strictObject({
    type: z.literal('bubblePop'),
    count: z.number().int().min(1),
    bubbles: z.number().int().min(4).max(12).default(8),
    targets: z.number().int().min(1).max(5).default(3),
  })
  .refine((c) => c.targets < c.bubbles, 'targets must be fewer than bubbles');
type Config = z.output<typeof configSchema>;

export interface BubblePopData {
  /** Syllable id on each bubble, in launch order; the target appears `targets` times. */
  bubbles: string[];
}

export const bubblePop: ReadingTaskLogic<Config, BubblePopData> = {
  id: 'bubblePop',
  configSchema,
  scored: true,
  reading: false,
  needsParent: false,
  manyOptions: true,
  instruction: () => 'instructions.bubblePop',
  eligible: (ctx) => ctx.candidates('syllable').filter((id) => ctx.content.syllables.get(id)?.parts.length === 2),
  build: (ctx, config, target) => {
    const confusers = ctx.distractors('syllable', target, 2);
    const others = Array.from({ length: config.bubbles - config.targets }, (_, i) => confusers[i % confusers.length]!);
    return {
      target,
      options: [target, ...confusers],
      data: { bubbles: shuffle([...Array<string>(config.targets).fill(target), ...others], ctx.rng) },
    };
  },
};
