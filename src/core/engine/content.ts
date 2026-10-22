// Indexed, cross-linked view of the parsed content files every game shares: worlds and levels in
// play order, cards, Соня's voice lines, strings and config. A domain pack extends it with its
// own items (reading: syllables, words, sentences).
import type { Card, CoreConfig, Level, Strings, VoiceNode, VoiceTree, World } from './schema.ts';

export interface WorldContent<W extends World = World, L extends Level = Level> {
  world: W;
  levels: L[];
}

export interface GameBundle<W extends World = World, L extends Level = Level, C extends CoreConfig = CoreConfig> {
  config: C;
  cards: Card[];
  voice: VoiceTree;
  strings: Strings;
  worlds: WorldContent<W, L>[];
}

export interface GameContent<W extends World = World, L extends Level = Level, C extends CoreConfig = CoreConfig> {
  config: C;
  strings: Strings;
  cards: Map<string, Card>;
  /** Flattened voice lines: "instructions.hearPick.word" → text, "praise" → list. */
  voice: Map<string, string | string[]>;
  worlds: WorldContent<W, L>[];
  levels: Map<string, L>;
  /** All levels in play order across worlds. */
  levelOrder: string[];
  worldOfLevel: Map<string, W>;
}

/** The level type a content type holds. */
export type LevelOf<C extends GameContent> = C['levels'] extends Map<string, infer L extends Level> ? L : Level;

export function indexGame<W extends World, L extends Level, C extends CoreConfig>(
  bundle: GameBundle<W, L, C>,
): GameContent<W, L, C> {
  const levels = new Map<string, L>();
  const worldOfLevel = new Map<string, W>();
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
    cards: new Map(bundle.cards.map((c) => [c.id, c])),
    voice: flattenVoice(bundle.voice),
    worlds,
    levels,
    levelOrder,
    worldOfLevel,
  };
}

function flattenVoice(tree: VoiceTree): Map<string, string | string[]> {
  const out = new Map<string, string | string[]>();
  const walk = (node: VoiceNode, path: string) => {
    if (typeof node === 'string' || Array.isArray(node)) out.set(path, node);
    else for (const [key, child] of Object.entries(node)) walk(child, path ? `${path}.${key}` : key);
  };
  for (const [key, node] of Object.entries(tree)) walk(node, key);
  return out;
}
