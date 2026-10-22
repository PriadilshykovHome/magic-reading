// A second, test-only game ("count the stars": items n-1 … n-5) built on core alone, with no
// import from src/reading. It proves the shell needs nothing from the reading game, and it is the
// smallest template for the maths game: content, a DomainEngine, one TaskLogic.
import { z } from 'zod';
import { indexGame, type GameContent } from '../../content.ts';
import { shuffle } from '../../rng.ts';
import { CardSchema, CoreConfigSchema, LevelSchema, StringsSchema, VoiceSchema, WorldSchema, type Level } from '../../schema.ts';
import { ShortageError, type DomainEngine, type TaskLogic } from '../../taskLogic.ts';

const value = (id: string) => Number(id.slice(2));
const ITEMS = ['n-1', 'n-2', 'n-3', 'n-4', 'n-5'];

/** Parses the fixture's files with core's own schemas, then indexes them. */
export function countStarsContent(files: Record<'config' | 'cards' | 'voice' | 'strings' | 'world' | 'levels', unknown>): GameContent {
  return indexGame({
    config: CoreConfigSchema.parse(files.config),
    cards: z.array(CardSchema).parse(files.cards),
    voice: VoiceSchema.parse(files.voice),
    strings: StringsSchema.parse(files.strings),
    worlds: [{ world: WorldSchema.parse(files.world), levels: z.array(LevelSchema).parse(files.levels) }],
  });
}

export const countStarsEngine: DomainEngine = {
  kindOf: (id) => (ITEMS.includes(id) ? 'number' : undefined),
  hasItem: (_content, id) => ITEMS.includes(id),
  createBuildContext(content, level, rng) {
    const order = content.levelOrder;
    const earlier = level.reviewEarlier ? order.slice(0, order.indexOf(level.id)) : level.reviewFrom;
    const review = new Set(earlier.flatMap((id) => (content.levels.get(id) as Level).pool.numbers ?? []));
    const own = level.pool.numbers ?? [];
    return {
      content,
      level,
      rng,
      candidates: (kind) => (kind === 'number' ? [...own, ...review] : []),
      isReview: (id) => review.has(id) && !own.includes(id),
      distractors(_kind, target, n) {
        // The closest numbers are the confusable ones.
        const near = ITEMS.filter((id) => id !== target).sort((a, b) => Math.abs(value(a) - value(target)) - Math.abs(value(b) - value(target)));
        if (near.length < n) throw new ShortageError(`not enough numbers near ${target}`);
        return shuffle(near.slice(0, n + 1), rng).slice(0, n);
      },
    };
  },
};

const configSchema = z.strictObject({ type: z.literal('countPick'), count: z.number().int().min(1) });

/** Stars on the card; he picks how many. A "reading" task: the number is said only after he answers. */
export const countPick: TaskLogic<z.output<typeof configSchema>, { stars: number }> = {
  id: 'countPick',
  configSchema,
  scored: true,
  reading: true,
  needsParent: false,
  instruction: () => 'instructions.countPick',
  eligible: (ctx) => ctx.candidates('number'),
  build(ctx, _config, target) {
    const options = shuffle([target, ...ctx.distractors('number', target, 2)], ctx.rng);
    return { target, options, data: { stars: value(target) } };
  },
};
