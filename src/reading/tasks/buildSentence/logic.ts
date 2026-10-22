// «Склади речення»: Соня reads a sentence; he puts its words in order (plus one extra word from a
// look-alike sentence). The buildWord component with word tiles.
import { z } from 'zod';
import { pickOne, shuffle } from '../../../core/engine/rng.ts';
import { ShortageError } from '../../../core/engine/taskLogic.ts';
import type { ReadingTaskLogic } from '../../engine/domain.ts';
import type { BuildWordData } from '../buildWord/logic.ts';

const configSchema = z.strictObject({
  type: z.literal('buildSentence'),
  count: z.number().int().min(1),
  extraTiles: z.number().int().min(0).max(2).default(1),
});
type Config = z.output<typeof configSchema>;

export const buildSentence: ReadingTaskLogic<Config, BuildWordData> = {
  id: 'buildSentence',
  configSchema,
  scored: true,
  reading: false,
  needsParent: false,
  instruction: () => 'instructions.buildSentence',
  eligible: (ctx) => ctx.candidates('sentence').filter((id) => (ctx.content.sentences.get(id)?.words.length ?? 0) >= 2),
  build: (ctx, config, target) => {
    const slots = [...ctx.content.sentences.get(target)!.words];
    const same = (a: string, b: string) => a.toLocaleLowerCase('uk-UA') === b.toLocaleLowerCase('uk-UA');
    const extra: string[] = [];
    if (config.extraTiles > 0) {
      // Words from the look-alike sentences first ("мило" for "У мами ноти"), else any sentence's.
      let lookAlikes: string[] = [];
      try {
        lookAlikes = ctx.distractors('sentence', target, 2);
      } catch (e) {
        if (!(e instanceof ShortageError)) throw e;
      }
      const others = [...lookAlikes, ...ctx.candidates('sentence')].flatMap((id) => ctx.content.sentences.get(id)?.words ?? []);
      const fresh = [...new Set(others.filter((w) => !slots.some((s) => same(s, w))))];
      for (let i = 0; i < config.extraTiles && fresh.length; i++) extra.push(fresh.splice(fresh.indexOf(pickOne(fresh.slice(0, 4), ctx.rng)), 1)[0]!);
      if (extra.length < config.extraTiles) throw new ShortageError(`${ctx.level.id}: no extra word for ${target}`);
    }
    return { target, options: [], data: { slots, tiles: shuffle([...slots, ...extra], ctx.rng), words: true } };
  },
};
