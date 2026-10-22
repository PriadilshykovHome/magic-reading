// The core runs a whole other game: validate its content, build sessions, play a level, finish it.
// Nothing here (or in the fixture) imports src/reading.
import { expect, test } from 'vitest';
import files from './fixtures/countStars/content.json';
import { countPick, countStarsContent, countStarsEngine } from './fixtures/countStars/domain';
import { emptyProgress, recordTaskResult } from './progress';
import { finishLevel, isLevelUnlocked } from './rewards';
import { seededRandom } from './rng';
import { completeTask, startRun } from './run';
import { buildSession } from './session';
import { checkGame } from './validate';

test('a second game (count the stars) runs on core alone: content checks, sessions, a level played and finished', () => {
  const content = countStarsContent(files);
  const registry = { countPick };
  const errors: string[] = [];
  const gameFiles = { config: 'config', cards: 'cards', voice: 'voice', levelFile: (id: string) => id };
  checkGame(content, gameFiles, registry, countStarsEngine, (file, message) => errors.push(`${file}: ${message}`));
  expect(errors).toEqual([]);

  let progress = emptyProgress();
  const [first, second] = content.levelOrder.map((id) => content.levels.get(id)!);
  expect(isLevelUnlocked(progress, second!)).toBe(false);

  const now = new Date(2026, 9, 22);
  const rng = seededRandom(7);
  const session = buildSession({ content, level: first!, domain: countStarsEngine, progress, settings: { parentNearby: false }, registry, rng, now });
  expect(session.tasks).toHaveLength(10); // 9 + the Magic Door
  expect(session.tasks.at(-1)!.boss).toBe(true);
  expect(session.tasks.every((t) => t.options.length === 3 && t.options.includes(t.target) && !t.sayTarget)).toBe(true);

  let run = startRun(content.config, rng);
  for (const task of session.tasks) {
    const done = completeTask(run, task, content.config, rng);
    run = done.state;
    progress = recordTaskResult(progress, { target: task.target, scored: task.scored, firstTry: true, sparks: done.result.sparks }, now, content.config);
  }
  const finished = finishLevel({ progress, run, level: first!, content, now });
  expect(finished.summary.stars).toBe(3);
  expect(finished.summary.unlocked).toBe(second!.id);

  // The next level reviews the first one's numbers and opens on its fixed door item.
  const next = buildSession({ content, level: second!, domain: countStarsEngine, progress: finished.progress, settings: { parentNearby: true }, registry, rng, now });
  expect(next.tasks.some((t) => ['n-1', 'n-2', 'n-3'].includes(t.target))).toBe(true);
  expect(next.tasks.at(-1)!.target).toBe('n-5');
});
