// Loads and validates everything in content/ once, at startup. The same validator runs in CI,
// so in practice this never fails; if it does (a bad edit in dev), it fails loudly.
import type { Content } from '../engine/content';
import { validateContent } from '../engine/validate';
import { taskLogics } from '../tasks/logicRegistry';
import { contentFiles } from './files';

function load(): Content {
  const { issues, content } = validateContent(contentFiles(), taskLogics);
  const errors = issues.filter((i) => i.severity === 'error');
  if (!content || errors.length > 0) {
    throw new Error(`Content is invalid:\n${errors.map((e) => `${e.file}: ${e.message}`).join('\n')}`);
  }
  return content;
}

export const content: Content = load();

/** "tower-of-syllables/01" → its route. */
export const levelPath = (levelId: string) => `/level/${levelId}`;

/** The map of the tower a level belongs to. */
export const mapPath = (levelId?: string) => (levelId ? `/map/${levelId.split('/')[0]}` : '/map');
