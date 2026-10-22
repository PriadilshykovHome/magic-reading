// The reading game's content: the shared game index plus the lexicon, and item helpers.
import { indexGame, type GameContent, type WorldContent } from '../../core/engine/content.ts';
import type { Card, Strings, VoiceTree, World } from '../../core/engine/schema.ts';
import type { LevelPlan } from './curriculum.ts';
import type { Config, Level, Lexicon, Sentence, Syllable, Template, Word } from './schema.ts';

export type ItemKind = 'syllable' | 'word' | 'sentence';
export const ITEM_KINDS: readonly ItemKind[] = ['syllable', 'word', 'sentence'];

export interface ContentBundle {
  config: Config;
  lexicon: Lexicon;
  /** Scene action → its sign (content/scenes.json). */
  actions: Record<string, string>;
  /** The daily warm-up's template, if there is one. */
  warmup?: Template;
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
  actions: Map<string, string>;
  warmup?: Template;
}

export function indexContent(bundle: ContentBundle): Content {
  return {
    ...indexGame(bundle),
    syllables: new Map(bundle.lexicon.syllables.map((s) => [s.id, s])),
    words: new Map(bundle.lexicon.words.map((w) => [w.id, w])),
    sentences: new Map(bundle.lexicon.sentences.map((s) => [s.id, s])),
    plans: new Map(bundle.plans.map((p) => [p.id, p])),
    actions: new Map(Object.entries(bundle.actions)),
    ...(bundle.warmup ? { warmup: bundle.warmup } : {}),
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

/** The levels a level reviews: every one before it (reviewEarlier), or those in `reviewFrom`. */
function reviewLevels(content: Content, level: Level): readonly string[] {
  if (!level.reviewEarlier) return level.reviewFrom;
  const at = content.levelOrder.indexOf(level.id);
  return [...content.levelOrder.slice(0, at), ...level.reviewFrom];
}

/** Items of `kind` from the levels this level reviews that it doesn't already have itself. */
export function reviewPoolOf(content: Content, level: Level, kind: ItemKind): string[] {
  const own = new Set(poolOf(level, kind));
  const out = new Set<string>();
  for (const id of reviewLevels(content, level)) {
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
