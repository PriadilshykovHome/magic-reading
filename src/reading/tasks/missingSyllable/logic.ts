// «Загублений склад»: a picture and its word with one syllable missing (МА-__); he picks the
// missing syllable from look-alikes. A reading task: the word is heard only after he answers.
import { z } from 'zod';
import { shuffle } from '../../../core/engine/rng.ts';
import type { ReadingTaskLogic } from '../../engine/domain.ts';

const configSchema = z.strictObject({
  type: z.literal('missingSyllable'),
  count: z.number().int().min(1),
  choices: z.number().int().min(2).max(3).default(3),
});
type Config = z.output<typeof configSchema>;

export interface MissingSyllableData {
  /** The word's syllable ids in order. */
  syllables: string[];
  /** Which one is missing. */
  missing: number;
}

export const missingSyllable: ReadingTaskLogic<Config, MissingSyllableData> = {
  id: 'missingSyllable',
  configSchema,
  scored: true,
  reading: true,
  needsParent: false,
  instruction: () => 'instructions.missingSyllable',
  eligible: (ctx) => ctx.candidates('word').filter((id) => (ctx.content.words.get(id)?.syllables.length ?? 0) >= 2),
  build: (ctx, config, target) => {
    const syllables = [...ctx.content.words.get(target)!.syllables];
    const missing = Math.floor(ctx.rng() * syllables.length);
    const answer = syllables[missing]!;
    const wrong = ctx.distractors('syllable', answer, config.choices - 1, { exclude: syllables });
    return { target, options: shuffle([answer, ...wrong], ctx.rng), answer, data: { syllables, missing } };
  },
};
