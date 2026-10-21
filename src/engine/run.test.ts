import { expect, test } from 'vitest';
import { completeTask, registerMiss, startRun, type FeedbackEvent, type RunState } from './run';
import type { TaskInstance } from './taskLogic';
import { testContent } from './testContent';

const { config } = testContent();
const task = (over: Partial<TaskInstance> = {}): TaskInstance => ({
  key: 'k', index: 0, type: 'hearPick', boss: false, scored: true, reading: false, kind: 'syllable',
  target: 'syl-ma', options: [], data: {}, instruction: '', ...over,
});
const noGold = () => 0.5;
function play(answers: boolean[], rng = noGold) {
  let state: RunState = startRun(config, rng);
  const events: FeedbackEvent[] = [];
  for (const firstTry of answers) {
    if (!firstTry) state = registerMiss(state, config).state;
    const done = completeTask(state, task(), config, rng);
    state = done.state;
    events.push(...done.events);
  }
  return { state, events };
}

test('wrong answers: a hint after 2 misses', () => {
  const first = registerMiss(startRun(config, noGold), config);
  expect(first.events).toEqual([{ type: 'wrong', misses: 1, hint: false }]);
  expect(registerMiss(first.state, config).events).toEqual([{ type: 'wrong', misses: 2, hint: true }]);
});

test('right answers: a spark each, rotating chimes, rare golden sparks, praise every 2–3', () => {
  const { events, state } = play([true, false, true, true]);
  const correct = events.filter((e) => e.type === 'correct');
  expect(correct.map((e) => e.chime)).toEqual([0, 1, 2, 0]);
  expect(state).toMatchObject({ sparks: 4, scored: 4, firstTry: 3 });
  expect(play([true], () => 0.01).events[0]).toMatchObject({ golden: true, sparks: config.sparks.goldenValue });
  const praised = play(Array<boolean>(12).fill(true)).events.filter((e) => e.type === 'correct' && e.praise).length;
  expect(praised).toBeGreaterThanOrEqual(4);
  expect(praised).toBeLessThanOrEqual(6);
});

test('streaks: wand at 3, wave at 5 and 10; a miss resets; the door opens', () => {
  const streaks = (answers: boolean[]) => play(answers).events.flatMap((e) => (e.type === 'streak' ? [`${e.effect}@${e.length}`] : []));
  expect(streaks(Array<boolean>(10).fill(true))).toEqual(['wand@3', 'wave@5', 'wave@10']);
  expect(streaks([true, true, false, true, true])).toEqual([]);
  expect(completeTask(startRun(config, noGold), task({ boss: true }), config, noGold).events.at(-1)).toEqual({ type: 'doorOpen' });
});
