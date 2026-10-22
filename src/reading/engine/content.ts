// The reading game's content: the shared game index plus the lexicon, and item helpers.
import { indexGame, type GameContent, type WorldContent } from '../../core/engine/content.ts';
import type { Card, Strings, VoiceTree, World } from '../../core/engine/schema.ts';
import type { LevelPlan } from './curriculum.ts';
import type { Config, Level, Lexicon, Sentence, Syllable, Word } from './schema.ts';

export type ItemKind = 'syllable' | 'word' | 'sentence';
export const ITEM_KINDS: readonly ItemKind[] = ['syllable', 'word', 'sentence'];

export interface ContentBundle {
  config: Config;
  lexicon: Lexicon;
  cards: Card[];
  voice: VoiceTree;
  strings: Strings;
  worlds: WorldContent<World, Level>[];
  plans: LevelPlan[];
}

export interface Content extends GameContent<World, Level, Config> {
  syllables: Map<string, Syllable>;
  words: Map<string, Word>;
  sentences: Map<string, Sentence>;
  /** Per level: letters known by then and what it introduces (src/reading/engine/curriculum.ts). */
  plans: Map<string, LevelPlan>;
}

export function indexContent(bundle: ContentBundle): Content {
  return {
    ...indexGame(bundle),
    syllables: new Map(bundle.lexicon.syllables.map((s) => [s.id, s])),
    words: new Map(bundle.lexicon.words.map((w) => [w.id, w])),
    sentences: new Map(bundle.lexicon.sentences.map((s) => [s.id, s])),
    plans: new Map(bundle.plans.map((p) => [p.id, p])),
  };
}

/** Item kind from the id prefix (syl-, w-, s-). */
export function kindOf(id: string): ItemKind | undefined {
  if (id.startsWith('syl-')) return 'syllable';
  if (id.startsWith('w-')) return 'word';
  if (id.startsWith('s-')) return 'sentence';
  return undefined;
}

export function hasItem(content: Content, id: string): boolean {
  return content.syllables.has(id) || content.words.has(id) || content.sentences.has(id);
}

export function itemText(content: Content, id: string): string {
  const item = content.syllables.get(id) ?? content.words.get(id) ?? content.sentences.get(id);
  if (!item) throw new Error(`Unknown item ${id}`);
  return item.text;
}

const POOL_KEY = { syllable: 'syllables', word: 'words', sentence: 'sentences' } as const;

export function poolOf(level: Level, kind: ItemKind): string[] {
  return level.pool[POOL_KEY[kind]];
}

/** Items of `kind` from the levels in `reviewFrom` that this level doesn't already have. */
export function reviewPoolOf(content: Content, level: Level, kind: ItemKind): string[] {
  const own = new Set(poolOf(level, kind));
  const out = new Set<string>();
  for (const id of level.reviewFrom) {
    const other = content.levels.get(id);
    if (other) for (const item of poolOf(other, kind)) if (!own.has(item)) out.add(item);
  }
  return [...out];
}

export function syllablesOfWords(content: Content, wordIds: readonly string[]): string[] {
  return [...new Set(wordIds.flatMap((id) => content.words.get(id)?.syllables ?? []))];
}

/** Splits a syllable into its consonant and vowel (either may be missing). */
export function syllableShape(syllable: Syllable, vowels: string): { consonant?: string; vowel?: string } {
  const vowel = syllable.parts.find((p) => vowels.includes(p));
  const consonant = syllable.parts.find((p) => !vowels.includes(p));
  return { consonant, vowel };
}
