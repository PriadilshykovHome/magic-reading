// The reading game as the shared shell sees it (imported as '@game'): content, the domain
// engine, task logic and what Соня says for each item. No UI here; that's '@game-ui'.
import type { GameData } from '../core/game';
import { content } from './content/load';
import { ITEM_KINDS, itemText, poolOf, reviewPoolOf } from './engine/content';
import { readingEngine } from './engine/domain';
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
};
