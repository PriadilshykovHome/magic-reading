import { describe, expect, it } from 'vitest';
import { completeTask, registerMiss, startRun, type FeedbackEvent, type RunState } from './run';
import type { TaskInstance } from './taskLogic';
import { testContent } from './testContent';

const { config } = testContent();
const task = (over: Partial<TaskInstance> = {}): TaskInstance => ({
  key: 'k',
  index: 0,
  type: 'hearPick',
  boss: false,
  scored: true,
  reading: false,
  kind: 'syllable',
  target: 'syl-ma',
  options: [],
  data: {},
  instruction: 'instructions.hearPick.syllable',
  ...over,
});
const noGold = () => 0.5; // above goldenChance: never golden

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

describe('answers', () => {
  it('a wrong answer wobbles, and after 2 misses the right option pulses as a hint', () => {
    const s = startRun(config, noGold);
    const first = registerMiss(s, config);
    expect(first.events).toEqual([{ type: 'wrong', misses: 1, hint: false }]);
    expect(registerMiss(first.state, config).events).toEqual([{ type: 'wrong', misses: 2, hint: true }]);
  });

  it('every correct answer sends a spark to the jar, and the chime rotates through 3 pitches', () => {
    const { events, state } = play([true, false, true, true]);
    const correct = events.filter((e) => e.type === 'correct');
    expect(correct.map((e) => e.chime)).toEqual([0, 1, 2, 0]);
    expect(correct.map((e) => e.firstTry)).toEqual([true, false, true, true]);
    expect(state.sparks).toBe(4);
    expect(state).toMatchObject({ scored: 4, firstTry: 3 });
  });

  it('a rare golden spark is worth 5', () => {
    const { events, state } = play([true], () => 0.01);
    expect(events[0]).toMatchObject({ type: 'correct', golden: true, sparks: config.sparks.goldenValue });
    expect(state.goldenSparks).toBe(1);
  });

  it('Соня praises every 2 or 3 correct answers', () => {
    const { events } = play(Array<boolean>(12).fill(true));
    const praised = events.flatMap((e, i) => (e.type === 'correct' && e.praise ? [i] : []));
    expect(praised.length).toBeGreaterThanOrEqual(4);
    expect(praised.length).toBeLessThanOrEqual(6);
  });
});

describe('streaks', () => {
  it('3 in a row → wand trail, 5 in a row → magic wave; a miss resets', () => {
    const streaks = (answers: boolean[]) =>
      play(answers).events.flatMap((e) => (e.type === 'streak' ? [`${e.effect}@${e.length}`] : []));
    expect(streaks([true, true, true, true, true])).toEqual(['wand@3', 'wave@5']);
    expect(streaks([true, true, false, true, true])).toEqual([]);
    expect(streaks(Array<boolean>(10).fill(true))).toEqual(['wand@3', 'wave@5', 'wave@10']);
  });

  it('the Magic Door bursts open when solved', () => {
    const done = completeTask(startRun(config, noGold), task({ boss: true }), config, noGold);
    expect(done.events.at(-1)).toEqual({ type: 'doorOpen' });
  });

  it('unscored tasks give a spark but never break or build a streak', () => {
    let s = play([true, true]).state;
    s = completeTask(s, task({ scored: false, type: 'syllableMerge' }), config, noGold).state;
    expect(s.streak).toBe(2);
    expect(s.scored).toBe(2);
  });
});
