// Zod schemas for the game-agnostic content files: config, cards, voice, strings, worlds and
// levels. A game's domain pack extends them (e.g. reading adds the lexicon and allowed letters).
// A typo in a content file fails validation (and the build), never the game.
import { z } from 'zod';

export const slugId = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}[a-z0-9]+(-[a-z0-9]+)*$`), `must look like ${prefix}name`);

export const CardId = slugId('card-');
export const LevelId = z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/, 'must look like world-id/level-key');

export const AssetPath = z.string().regex(/^[a-z0-9_-]+(\/[a-z0-9_.-]+)+$/, 'lower-case relative path');
export const Text = z.string().trim().min(1);
export const Count = z.number().int().min(1);

// ---------- tuning ----------

const Ratio = z.number().min(0).max(1);

export const CoreConfigSchema = z.strictObject({
  session: z.strictObject({ minTasks: Count, maxTasks: Count, reviewShare: Ratio }),
  answers: z.strictObject({ maxChoices: z.number().int().min(2).max(3), hintAfterMisses: Count }),
  boxes: z
    .strictObject({
      max: z.number().int().min(2),
      weights: z.array(z.number().positive()),
      /** Days until an item in each box is due again (box 1 is always due). */
      intervalDays: z.array(z.number().min(0)),
    })
    .refine((b) => b.weights.length === b.max && b.intervalDays.length === b.max, 'boxes needs one weight and one interval per box'),
  stars: z.strictObject({ three: Ratio, two: Ratio }),
  sparks: z.strictObject({
    perCorrect: Count,
    goldenChance: Ratio,
    goldenValue: Count,
    praiseEvery: z.tuple([Count, Count]),
  }),
  streaks: z.strictObject({ wand: Count, wave: Count }),
  mastery: z.strictObject({ firstTryOk: Count, distinctDays: Count }),
  creature: z.strictObject({ hatchAfterLevel: LevelId, youngAtSparks: Count, bigAtSparks: Count }),
  windows: z.strictObject({ surpriseEvery: Count, surpriseCard: CardId }),
  eggs: z.strictObject({
    pysankyDaysBefore: z.number().int().min(0),
    pysankyDaysAfter: z.number().int().min(0),
    pysankyCount: Count,
    pysankyCard: CardId,
    eveningFromHour: z.number().int().min(0).max(23),
    morningUntilHour: z.number().int().min(0).max(23),
  }),
  grammar: z.strictObject({
    /** [ending, vocative ending] pairs for patronymics, e.g. -ович → -овичу */
    patronymicVocative: z.array(z.tuple([Text, Text])),
  }),
});

// ---------- cards, strings, voice ----------

export const CardSchema = z.strictObject({
  id: CardId,
  name: Text,
  emoji: Text,
  art: AssetPath,
  sound: AssetPath.optional(),
});

export const CardsSchema = z.strictObject({ cards: z.array(CardSchema) });

/** Names Соня uses in every game (his name and its case forms, the family, his home city). */
export const StringsSchema = z.looseObject({
  app: z.looseObject({ title: Text }),
  child: z.strictObject({ name: Text, short: Text, vocative: Text, vocativeFull: Text, genitive: Text }),
  family: z.strictObject({ mom: Text, dad: Text }),
  places: z.strictObject({ birthCity: Text }),
  names: z.looseObject({ mascot: Text, companion: Text }),
});

export type VoiceNode = string | string[] | { [key: string]: VoiceNode };
const VoiceNodeSchema: z.ZodType<VoiceNode> = z.lazy(() =>
  z.union([Text, z.array(Text).min(1), z.record(z.string(), VoiceNodeSchema)]),
);
export const VoiceSchema = z.record(z.string(), VoiceNodeSchema);

// ---------- worlds and levels ----------

/** Every task entry has a type and a count; the task type's own schema checks the rest. */
export const TaskEntrySchema = z.looseObject({ type: z.string().min(1), count: Count });

export const IntroSchema = z.strictObject({
  voice: z.string().min(1),
  /** What the level is about (e.g. a new letter), filling {topic} in Соня's line; `key` names its recording. */
  topic: z.strictObject({ text: Text, key: z.string().regex(/^[a-z0-9-]+$/) }).optional(),
  /** The domain defines the demo types and which items they take. */
  demo: z.strictObject({ type: z.string().min(1), items: z.array(z.string().min(1)).min(1) }),
});

export const LevelSchema = z.strictObject({
  id: LevelId,
  title: Text,
  unlockAfter: LevelId.nullable(),
  intro: IntroSchema,
  /** Item ids this level teaches, grouped as the domain likes (reading: syllables, words, sentences). */
  pool: z.record(z.string(), z.array(z.string())),
  reviewFrom: z.array(LevelId).default([]),
  tasks: z.array(TaskEntrySchema).min(1),
  boss: z.strictObject({
    type: z.literal('magicDoor'),
    inner: z.string().min(1),
    pick: z.enum(['weakest', 'newest']).default('weakest'),
    item: z.string().optional(),
    /** Соня's line when this door opens (default: magicDoor.opened). */
    openedLine: z.string().optional(),
  }),
  /** A card for finishing the level (not every level has one). */
  reward: z.strictObject({ card: CardId.optional() }).prefault({}),
});

export const WorldSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** Worlds are played in this order (1, 2, …). */
  order: z.number().int().min(1),
  title: Text,
  /** The scenery preset of its stretch of the journey road. */
  look: z.string().regex(/^[a-z0-9-]+$/),
});

export type CoreConfig = z.output<typeof CoreConfigSchema>;
export type Card = z.output<typeof CardSchema>;
export type Strings = z.output<typeof StringsSchema>;
export type VoiceTree = z.output<typeof VoiceSchema>;
export type TaskEntry = z.output<typeof TaskEntrySchema>;
export type Level = z.output<typeof LevelSchema>;
export type World = z.output<typeof WorldSchema>;
