// The reading game as the shared shell sees it (imported as '@game'): content, the domain
// engine, task logic and what Соня says for each item. No UI here; that's '@game-ui'.
import type { GameData } from '../core/game';
import { content } from './content/load';
import { ITEM_KINDS, itemText, poolOf, reviewPoolOf } from './engine/content';
import { warmupLevel } from './engine/curriculum';
import { readingEngine } from './engine/domain';
import { lettersOf } from './engine/lexicon';
import type { Level } from './engine/schema';
import { taskLogics } from './tasks/logicRegistry';

export const game: GameData = {
  id: 'reading-uk',
  content,
  engine: readingEngine,
  logics: taskLogics,
  item(id) {
    const item = content.syllables.get(id) ?? content.words.get(id) ?? content.sentences.get(id);
    return { text: itemText(content, id), audio: item?.audio };
  },
  levelItems(coreLevel) {
    const level = coreLevel as Level;
    return ITEM_KINDS.flatMap((kind) => [...poolOf(level, kind), ...reviewPoolOf(content, level, kind)]);
  },
  warmup(progress) {
    const finished = content.levelOrder.filter((id) => (progress.levels[id]?.bestStars ?? 0) > 0);
    const recent = finished.flatMap((id) => (content.levels.get(id) as Level).pool.sentences).at(-1);
    return warmupLevel(content.warmup, finished, recent);
  },
  canRead(progress) {
    const last = content.levelOrder.findLast((id) => (progress.levels[id]?.bestStars ?? 0) > 0);
    const known = new Set(last ? content.plans.get(last)?.known : '');
    return (id) => {
      const text = content.words.get(id)?.text ?? content.sentences.get(id)?.text;
      return text !== undefined && lettersOf(text).every((ch) => known.has(ch));
    };
  },
  nodeKind(level) {
    const template = content.plans.get(level.id)?.template;
    if (template === 'review') return 'review';
    // A finale, or a world's last level with its own door word (МИШКО).
    const world = content.worlds.find((w) => w.levels.at(-1)?.id === level.id);
    return template === 'finale' || (world && level.boss.item) ? 'finale' : 'door';
  },
};
