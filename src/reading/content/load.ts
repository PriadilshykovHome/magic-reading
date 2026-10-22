// Loads content/ once, at startup: derive the lexicon, expand the curriculum, light checks.
// The full validation (every task dry-built) runs in CI and in dev; if anything fails, it fails loudly.
import type { Content } from '../engine/content';
import { validateContent } from '../engine/validate';
import { taskLogics } from '../tasks/logicRegistry';
import { contentFiles } from './files';

function load(): Content {
  const { issues, content } = validateContent(contentFiles(), taskLogics, { deep: import.meta.env.DEV });
  const errors = issues.filter((i) => i.severity === 'error');
  if (!content || errors.length > 0) {
    throw new Error(`Content is invalid:\n${errors.map((e) => `${e.file}: ${e.message}`).join('\n')}`);
  }
  return content;
}

export const content: Content = load();

