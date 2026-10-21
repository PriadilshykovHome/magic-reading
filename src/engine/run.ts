// What happens inside a level, answer by answer. The engine decides; the UI only choreographs:
// every animation, sound and line of Соня's is driven by these FeedbackEvents.
import type { Rng } from './rng.ts';
import type { Config } from './schema.ts';
import type { TaskInstance } from './taskLogic.ts';

export type FeedbackEvent =
  /** Wobble + soft "хм" + "Спробуй ще!"; after enough misses the right option pulses. */
  | { type: 'wrong'; misses: number; hint: boolean }
  /** Card springs, sparkles burst, one іскорка (or a rare golden one) flies to the jar. */
  | { type: 'correct'; firstTry: boolean; chime: 0 | 1 | 2; sparks: number; golden: boolean; praise: boolean }
  /** 3 in a row: a wand trail swooshes across; 5 in a row: a shimmering wave. */
  | { type: 'streak'; effect: 'wand' | 'wave'; length: number }
  /** The Magic Door bursts open with light. */
  | { type: 'doorOpen' };

export interface TaskResult {
  key: string;
  target: string;
  scored: boolean;
  firstTry: boolean;
  misses: number;
  sparks: number;
}

export interface RunState {
  /** Misses on the current task. */
  misses: number;
  /** Consecutive first-try answers on scored tasks. */
  streak: number;
  bestStreak: number;
  scored: number;
  firstTry: number;
  sparks: number;
  goldenSparks: number;
  chime: 0 | 1 | 2;
  sincePraise: number;
  praiseAt: number;
  results: TaskResult[];
}

const praiseGap = (config: Config, rng: Rng) => {
  const [min, max] = config.sparks.praiseEvery;
  return min + Math.floor(rng() * (max - min + 1));
};

export function startRun(config: Config, rng: Rng): RunState {
  return {
    misses: 0,
    streak: 0,
    bestStreak: 0,
    scored: 0,
    firstTry: 0,
    sparks: 0,
    goldenSparks: 0,
    chime: 0,
    sincePraise: 0,
    praiseAt: praiseGap(config, rng),
    results: [],
  };
}

export function registerMiss(state: RunState, config: Config): { state: RunState; events: FeedbackEvent[] } {
  const misses = state.misses + 1;
  return {
    state: { ...state, misses },
    events: [{ type: 'wrong', misses, hint: misses >= config.answers.hintAfterMisses }],
  };
}

export function completeTask(
  state: RunState,
  task: TaskInstance,
  config: Config,
  rng: Rng,
): { state: RunState; events: FeedbackEvent[]; result: TaskResult } {
  const firstTry = state.misses === 0;
  const golden = rng() < config.sparks.goldenChance;
  const sparks = golden ? config.sparks.goldenValue : config.sparks.perCorrect;
  const sincePraise = state.sincePraise + 1;
  const praise = sincePraise >= state.praiseAt;
  const streak = task.scored ? (firstTry ? state.streak + 1 : 0) : state.streak;

  const events: FeedbackEvent[] = [{ type: 'correct', firstTry, chime: state.chime, sparks, golden, praise }];
  if (task.scored && firstTry) {
    const { wand, wave } = config.streaks;
    if (streak === wand) events.push({ type: 'streak', effect: 'wand', length: streak });
    else if (streak >= wave && (streak - wave) % wave === 0) events.push({ type: 'streak', effect: 'wave', length: streak });
  }
  if (task.boss) events.push({ type: 'doorOpen' });

  const result: TaskResult = { key: task.key, target: task.target, scored: task.scored, firstTry, misses: state.misses, sparks };
  return {
    state: {
      misses: 0,
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
      scored: state.scored + (task.scored ? 1 : 0),
      firstTry: state.firstTry + (task.scored && firstTry ? 1 : 0),
      sparks: state.sparks + sparks,
      goldenSparks: state.goldenSparks + (golden ? 1 : 0),
      chime: ((state.chime + 1) % 3) as 0 | 1 | 2,
      sincePraise: praise ? 0 : sincePraise,
      praiseAt: praise ? praiseGap(config, rng) : state.praiseAt,
      results: [...state.results, result],
    },
    events,
    result,
  };
}
