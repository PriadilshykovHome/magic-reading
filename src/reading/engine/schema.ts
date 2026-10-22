// Zod schemas for the reading game's content files, and the shapes the game uses after
// deriving everything that isn't written by hand (src/reading/engine/lexicon.ts,
// src/reading/engine/curriculum.ts).
//
//   content/templates.json                 what each kind of level does (task mix, intro, door)
//   content/worlds/<world>/world.json      the world and its units of levels
//   content/worlds/<world>/lexicon.json    the items first taught there, one compact row each
import { z } from 'zod';
import {
  CardId,
  CoreConfigSchema,
  IntroSchema,
  LevelId,
  LevelSchema as CoreLevelSchema,
  slugId,
  TaskEntrySchema,
  Text,
} from '../../core/engine/schema.ts';

export const SyllableId = slugId('syl-');
export const WordId = slugId('w-');
export const SentenceId = slugId('s-');
const Key = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'lower-case key like e-words');
const ItemKindSchema = z.enum(['syllable', 'word', 'sentence']);
const DemoType = z.enum(['syllableMerge', 'wordMerge', 'readAlong']);

// ---------- the lexicon as written ----------

export const WordRowSchema = z.strictObject({
  id: WordId,
  /** Hand-written syllable split, e.g. "МА-МА"; the text and syllables are derived from it. */
  split: z.string().regex(/^[^\s-]+(-[^\s-]+)*$/, 'syllables joined by "-"'),
  /** Placeholder picture until the illustration exists. */
  emoji: Text,
  /** Themes (family, food, magic, …) for balance reports and later category tasks. */
  tags: z.array(Key).default([]),
  /** Which syllable is stressed (0 = first), for words with more than one. */
  stress: z.number().int().min(0).optional(),
});

export const SentenceRowSchema = z.strictObject({
  id: SentenceId,
  text: Text,
  /** What the scene shows; a distractor scene may never show everything the target does. */
  depicts: z.array(Text).min(1),
  emoji: Text,
  wordStartsSec: z.array(z.number().nonnegative()).optional(),
});

export const LexiconFileSchema = z.strictObject({
  /** Syllables for drills, space-separated ("МА МО МУ"); closed ones come from the word splits. */
  syllables: z.string().default(''),
  words: z.array(WordRowSchema).default([]),
  sentences: z.array(SentenceRowSchema).default([]),
});

// ---------- the lexicon as the game uses it (derived) ----------

export interface Syllable {
  id: string;
  text: string;
  /** Letters, with Ь and the apostrophe kept on their consonant ("НЬ", "М’"). */
  parts: string[];
  audio: string;
  /** "М-м-м… А-а… МА", for open syllables the merge demo can stretch. */
  audioStretched?: string;
}

export interface Word {
  id: string;
  text: string;
  syllables: string[];
  audio: string;
  /** "МА… МА", for words of more than one syllable. */
  audioSyllables?: string;
  picture: string;
  emoji: string;
  tags: string[];
  stress?: number;
}

export interface Sentence {
  id: string;
  text: string;
  words: string[];
  depicts: string[];
  audio: string;
  wordStartsSec?: number[];
  scene: string;
  emoji: string;
}

export interface Lexicon {
  syllables: Syllable[];
  words: Word[];
  sentences: Sentence[];
}

// ---------- templates: what each kind of level does ----------

export const TemplateSchema = z.strictObject({
  title: Text,
  intro: z.strictObject({
    /** Соня's line; it may use {topic} (the unit's letters) and should then have a …Fallback line. */
    voice: z.string().min(1),
    demo: DemoType,
    /** "new": this level's own items; "recent": the latest item met before this level. */
    from: z.enum(['new', 'recent']).default('new'),
  }),
  /** The kinds of item this level introduces; everything else comes from review. */
  teaches: z.array(ItemKindSchema).default([]),
  tasks: z.array(TaskEntrySchema).min(1),
  boss: z.strictObject({ inner: z.string().min(1), pick: z.enum(['weakest', 'newest']).default('weakest') }),
});

export const TemplatesSchema = z.record(Key, TemplateSchema);

// ---------- worlds as written: units of levels ----------

const ReadingIntroSchema = IntroSchema.extend({
  demo: z.strictObject({
    /** syllableMerge: letters fuse into syllables; wordMerge: syllables into a word; readAlong: a sentence word by word */
    type: DemoType,
    items: z.array(z.string().min(1)).min(1),
  }),
});

const PoolSchema = z.strictObject({
  syllables: z.array(SyllableId).default([]),
  words: z.array(WordId).default([]),
  sentences: z.array(SentenceId).default([]),
});

/** A level in a unit: a template name, a template with overrides ({ "t": … }), or a level written out in full. */
export const LevelEntrySchema = z.union([
  Key,
  z.strictObject({
    t: Key.optional(),
    /** Only for levels that keep an older id (his saved progress is keyed by it). */
    id: LevelId.optional(),
    title: Text.optional(),
    intro: ReadingIntroSchema.optional(),
    pool: PoolSchema.optional(),
    reviewFrom: z.array(LevelId).optional(),
    tasks: z.array(TaskEntrySchema).min(1).optional(),
    boss: CoreLevelSchema.shape.boss.optional(),
    /** A finale's Magic Door: this item (kept out of every pool before it) and Соня's line when it opens. */
    door: z.string().optional(),
    line: z.string().optional(),
    card: CardId.optional(),
  }),
]);

export const UnitSchema = z.strictObject({
  /** Part of generated level ids (world/key-template), so never rename it once played. */
  key: Key,
  /** The letters this unit teaches; everything after it may use them. */
  letters: z.string().default(''),
  /** Given for finishing the unit's last level. */
  card: CardId.optional(),
  levels: z.array(LevelEntrySchema).min(1),
});

export const WorldFileSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  order: z.number().int().min(1),
  title: Text,
  look: Key,
  units: z.array(UnitSchema).min(1),
});

// ---------- the reading extensions of the shared runtime schemas ----------

export const LettersSchema = z.strictObject({
  vowels: Text,
  /** Latin spelling of each letter, for ids and file names ("МИШ" → syl-mysh). */
  latin: z.record(z.string().length(1), z.string()),
  /** Signs that stay with the consonant before them in a syllable's parts ("НЬ"). */
  softeners: z.string(),
  /** Two letters for one sound at the start of a syllable ("ДЖ"). */
  digraphs: z.array(z.string().length(2)),
});

export const ConfigSchema = CoreConfigSchema.extend({ letters: LettersSchema });

/** A level as the game plays it, after expanding its unit and template. */
export const LevelSchema = CoreLevelSchema.extend({ intro: ReadingIntroSchema, pool: PoolSchema });

export type Config = z.output<typeof ConfigSchema>;
export type Letters = z.output<typeof LettersSchema>;
export type Level = z.output<typeof LevelSchema>;
export type LexiconFile = z.output<typeof LexiconFileSchema>;
export type Template = z.output<typeof TemplateSchema>;
export type Templates = z.output<typeof TemplatesSchema>;
export type LevelEntry = z.output<typeof LevelEntrySchema>;
export type Unit = z.output<typeof UnitSchema>;
export type WorldFile = z.output<typeof WorldFileSchema>;
export type ItemKindName = z.output<typeof ItemKindSchema>;
