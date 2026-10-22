// Test helper: the real content files, as a fresh RawBundle copy or validated + indexed.
import { contentFiles } from '../content/files';
import { taskLogics } from '../tasks/logicRegistry';
import type { Content } from './content';
import { validateContent, type RawBundle } from './validate';

/** A fresh deep copy each call, so tests can break it freely (worlds in play order). */
export function rawBundle(): RawBundle {
  const raw = structuredClone(contentFiles());
  raw.worlds.sort((a, b) => ((a.world.data as { order: number }).order ?? 0) - ((b.world.data as { order: number }).order ?? 0));
  return raw;
}

export function testContent(): Content {
  const { issues, content } = validateContent(rawBundle(), taskLogics);
  const errors = issues.filter((i) => i.severity === 'error');
  if (!content || errors.length) throw new Error(`content invalid: ${errors.map((e) => e.message).join('; ')}`);
  return content;
}
