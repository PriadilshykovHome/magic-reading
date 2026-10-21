// Indexed, cross-linked view of the parsed content files.
import type { Card, Config, Level, Lexicon, Sentence, Strings, Syllable, VoiceNode, VoiceTree, Word, World } from './schema.ts';

export type ItemKind = 'syllable' | 'word' | 'sentence';
export const ITEM_KINDS: readonly ItemKind[] = ['syllable', 'word', 'sentence'];

export interface WorldContent {
  world: World;
  levels: Level[];
}

export interface ContentBundle {
  config: Config;
  lexicon: Lexicon;
  cards: Card[];
  voice: VoiceTree;
  strings: Strings;
  worlds: WorldContent[];
}

export interface Content {
  config: Config;
  strings: Strings;
  syllables: Map<string, Syllable>;
  words: Map<string, Word>;
  sentences: Map<string, Sentence>;
  cards: Map<string, Card>;
  /** Flattened voice lines: "instructions.hearPick.word" → text, "praise" → list. */
  voice: Map<string, string | string[]>;
  worlds: WorldContent[];
  levels: Map<string, Level>;
  /** All levels in play order across worlds. */
  levelOrder: string[];
  worldOfLevel: Map<string, World>;
}

export function indexContent(bundle: ContentBundle): Content {
  const levels = new Map<string, Level>();
  const worldOfLevel = new Map<string, World>();
  const levelOrder: string[] = [];
  const worlds = [...bundle.worlds].sort((a, b) => a.world.order - b.world.order);
  for (const { world, levels: worldLevels } of worlds) {
    for (const level of worldLevels) {
      levels.set(level.id, level);
      worldOfLevel.set(level.id, world);
      levelOrder.push(level.id);
    }
  }
  return {
    config: bundle.config,
    strings: bundle.strings,
    syllables: new Map(bundle.lexicon.syllables.map((s) => [s.id, s])),
    words: new Map(bundle.lexicon.words.map((w) => [w.id, w])),
    sentences: new Map(bundle.lexicon.sentences.map((s) => [s.id, s])),
    cards: new Map(bundle.cards.map((c) => [c.id, c])),
    voice: flattenVoice(bundle.voice),
    worlds,
    levels,
    levelOrder,
    worldOfLevel,
  };
}

export function flattenVoice(tree: VoiceTree): Map<string, string | string[]> {
  const out = new Map<string, string | string[]>();
  const walk = (node: VoiceNode, path: string) => {
    if (typeof node === 'string' || Array.isArray(node)) out.set(path, node);
    else for (const [key, child] of Object.entries(node)) walk(child, path ? `${path}.${key}` : key);
  };
  for (const [key, node] of Object.entries(tree)) walk(node, key);
  return out;
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
