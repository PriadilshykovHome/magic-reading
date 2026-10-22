// Zod schemas for the reading game: the lexicon (syllables, words, sentences) and the reading
// extensions of the shared config, world and level schemas.
import { z } from 'zod';
import {
  AssetPath,
  CoreConfigSchema,
  IntroSchema,
  LevelSchema as CoreLevelSchema,
  slugId,
  Text,
  WorldSchema as CoreWorldSchema,
} from '../../core/engine/schema.ts';

export const SyllableId = slugId('syl-');
export const WordId = slugId('w-');
export const SentenceId = slugId('s-');

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

// ---------- reading extensions of the shared schemas ----------

export const ConfigSchema = CoreConfigSchema.extend({
  letters: z.strictObject({ vowels: Text }),
});

export const WorldSchema = CoreWorldSchema.extend({
  allowedLetters: Text,
});

export const LevelSchema = CoreLevelSchema.extend({
  intro: IntroSchema.extend({
    demo: z.strictObject({
      /** syllableMerge: letters fuse into syllables; wordMerge: syllables into a word; readAlong: a sentence word by word */
      type: z.enum(['syllableMerge', 'wordMerge', 'readAlong']),
      items: z.array(z.string().min(1)).min(1),
    }),
  }),
  pool: z.strictObject({
    syllables: z.array(SyllableId).default([]),
    words: z.array(WordId).default([]),
    sentences: z.array(SentenceId).default([]),
  }),
});

export type Syllable = z.output<typeof SyllableSchema>;
export type Word = z.output<typeof WordSchema>;
export type Sentence = z.output<typeof SentenceSchema>;
export type Lexicon = z.output<typeof LexiconSchema>;
export type Config = z.output<typeof ConfigSchema>;
export type World = z.output<typeof WorldSchema>;
export type Level = z.output<typeof LevelSchema>;
