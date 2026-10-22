// A picture plus the spoken word; he puts syllable tiles into the slots in order (the word's
// syllables plus confusable extra tiles). Tap-to-place works for every drag.
import { z } from 'zod';
import { pickOne, shuffle } from '../../../core/engine/rng.ts';
import type { ReadingTaskLogic } from '../../engine/domain.ts';

const configSchema = z.strictObject({
  type: z.literal('buildWord'),
  count: z.number().int().min(1),
  extraTiles: z.number().int().min(0).max(2).default(1),
});
type Config = z.output<typeof configSchema>;

export interface BuildWordData {
  /** The word's syllable ids in order (or a sentence's words, for buildSentence): one slot each. */
  slots: string[];
  /** Tiles to place, shuffled: the slots' pieces plus the extra ones. */
  tiles: string[];
  /** The tiles are a sentence's words (plain text), not syllable ids. */
  words?: true;
}

export const buildWord: ReadingTaskLogic<Config, BuildWordData> = {
  id: 'buildWord',
  configSchema,
  scored: true,
  reading: false,
  needsParent: false,
  instruction: () => 'instructions.buildWord',
  // One-syllable words (ЛІС, НІС) would be a single tile, so they never appear here.
  eligible: (ctx) => ctx.candidates('word').filter((id) => (ctx.content.words.get(id)?.syllables.length ?? 0) >= 2),
  build: (ctx, config, target) => {
    const slots = [...ctx.content.words.get(target)!.syllables];
    const extra =
      config.extraTiles > 0 ? ctx.distractors('syllable', pickOne(slots, ctx.rng), config.extraTiles, { exclude: slots }) : [];
    return { target, options: [], data: { slots, tiles: shuffle([...slots, ...extra], ctx.rng) } };
  },
};
