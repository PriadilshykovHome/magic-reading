// His saved progress is keyed by level, item and card ids. The fixture is a progress document
// over every id that existed on 2026-10-22 (70 levels, 546 items; numbers made up, no names):
// if a content or schema change renames or drops one, this fails before his iPad finds out.
// New levels and items need no fixture change.
import { expect, test } from 'vitest';
import { mergeProgress } from '../../core/engine/merge';
import { ProgressSchema } from '../../core/engine/progress';
import { seededRandom } from '../../core/engine/rng';
import { buildSession } from '../../core/engine/session';
import { hasItem } from '../engine/content';
import { readingEngine } from '../engine/domain';
import { testContent } from '../engine/testContent';
import { taskLogics } from '../tasks/logicRegistry';
import saved from './saved-progress.fixture.json';

test('progress saved on 2026-10-22 still loads, merges unchanged, and every id in it resolves', () => {
  const content = testContent();
  const progress = ProgressSchema.parse(saved);
  expect(progress).toEqual(saved); // nothing dropped or reshaped
  expect(mergeProgress(progress, progress, content.config.mastery.distinctDays)).toEqual(progress);

  expect(Object.keys(progress.levels).filter((id) => !content.levels.has(id))).toEqual([]);
  expect(Object.keys(progress.items).filter((id) => !hasItem(content, id))).toEqual([]);
  expect(progress.rewards.cards.filter((id) => !content.cards.has(id))).toEqual([]);

  // And every level still builds on top of it (review and spaced repetition read these items).
  for (const levelId of content.levelOrder) {
    const { tasks } = buildSession({
      content,
      level: content.levels.get(levelId)!,
      domain: readingEngine,
      progress,
      settings: { parentNearby: true },
      registry: taskLogics,
      rng: seededRandom(1),
      now: new Date(2026, 9, 22),
    });
    expect(tasks.length, levelId).toBeGreaterThan(0);
  }
}, 60_000);
