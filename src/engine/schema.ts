// Zod schemas for everything in content/. A typo in a content file fails validation (and the
// build), never the game.
import { z } from 'zod';

const slugId = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}[a-z0-9]+(-[a-z0-9]+)*$`), `must look like ${prefix}name`);

export const SyllableId = slugId('syl-');
export const WordId = slugId('w-');
export const SentenceId = slugId('s-');
export const CardId = slugId('card-');
export const LevelId = z.string().regex(/^[a-z0-9-]+\/\d{2}$/, 'must look like world-id/01');

const AssetPath = z.string().regex(/^[a-z0-9_-]+(\/[a-z0-9_.-]+)+$/, 'lower-case relative path');
const Text = z.string().trim().min(1);
const Count = z.number().int().min(1);

// ---------- lexicon ----------

export const SyllableSchema = z.strictObject({
  id: SyllableId,
  text: Text,
  parts: z.array(Text).min(1),
  audio: AssetPath,
  audioStretched: AssetPath.optional(),
});

export const WordSchema = z.strictObject({
  id: WordId,
  text: Text,
  syllables: z.array(SyllableId).min(1),
  audio: AssetPath,
  audioSyllables: AssetPath.optional(),
  picture: AssetPath,
  emoji: Text,
});

export const SentenceSchema = z.strictObject({
  id: SentenceId,
  text: Text,
  words: z.array(Text).min(1),
  /** What the scene shows; a distractor scene may never show everything the target does. */
  depicts: z.array(Text).min(1),
  audio: AssetPath,
  wordStartsSec: z.array(z.number().nonnegative()).optional(),
  scene: AssetPath,
  emoji: Text,
});

export const LexiconSchema = z.strictObject({
  syllables: z.array(SyllableSchema),
  words: z.array(WordSchema),
  sentences: z.array(SentenceSchema),
});

// ---------- tuning ----------

const Ratio = z.number().min(0).max(1);

export const ConfigSchema = z.strictObject({
  letters: z.strictObject({ vowels: Text }),
  session: z.strictObject({ minTasks: Count, maxTasks: Count, reviewShare: Ratio }),
  answers: z.strictObject({ maxChoices: z.number().int().min(2).max(3), hintAfterMisses: Count }),
  boxes: z
    .strictObject({ max: z.number().int().min(2), weights: z.array(z.number().positive()) })
    .refine((b) => b.weights.length === b.max, 'boxes.weights needs one weight per box'),
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

export const LevelSchema = z.strictObject({
  id: LevelId,
  title: Text,
  unlockAfter: LevelId.nullable(),
  intro: z.strictObject({
    voice: z.string().min(1),
    demo: z.strictObject({
      type: z.enum(['syllableMerge', 'readAlong']),
      items: z.array(z.string().min(1)).min(1),
    }),
  }),
  pool: z.strictObject({
    syllables: z.array(SyllableId).default([]),
    words: z.array(WordId).default([]),
    sentences: z.array(SentenceId).default([]),
  }),
  reviewFrom: z.array(LevelId).default([]),
  tasks: z.array(TaskEntrySchema).min(1),
  boss: z.strictObject({
    type: z.literal('magicDoor'),
    inner: z.string().min(1),
    pick: z.enum(['weakest', 'newest']).default('weakest'),
    item: z.string().optional(),
  }),
  reward: z.strictObject({ card: CardId }),
});

export const WorldSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: Text,
  allowedLetters: Text,
  levels: z.array(z.string().regex(/^levels\/[a-z0-9-]+\.json$/)).min(1),
  map: z.strictObject({ art: AssetPath, music: AssetPath }),
});

export type Syllable = z.output<typeof SyllableSchema>;
export type Word = z.output<typeof WordSchema>;
export type Sentence = z.output<typeof SentenceSchema>;
export type Lexicon = z.output<typeof LexiconSchema>;
export type Config = z.output<typeof ConfigSchema>;
export type Card = z.output<typeof CardSchema>;
export type Strings = z.output<typeof StringsSchema>;
export type VoiceTree = z.output<typeof VoiceSchema>;
export type TaskEntry = z.output<typeof TaskEntrySchema>;
export type Level = z.output<typeof LevelSchema>;
export type World = z.output<typeof WorldSchema>;
