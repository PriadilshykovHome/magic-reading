// The progress store: the single source of truth for everything saved. Every change is
// mirrored to this device immediately, and to the cloud by src/core/sync/cloud.ts.
import { create } from 'zustand';
import { game } from '@game';
import { catchStar, findPysanka } from '../engine/eggs';
import { recordTaskResult, type Progress, type Settings, type TaskOutcome } from '../engine/progress';
import { finishLevel, finishWarmup, type CelebrationStep, type LevelSummary } from '../engine/rewards';
import type { RunState } from '../engine/run';
import type { Level } from '../engine/schema';
import { loadProgress, saveProgress } from '../sync/localCache';
import { useAccount } from './account';

interface ProgressState {
  progress: Progress;
  recordTask(outcome: TaskOutcome): void;
  finishLevel(run: RunState, level: Level): { summary: LevelSummary; steps: CelebrationStep[] };
  finishWarmup(run: RunState): { summary: LevelSummary; steps: CelebrationStep[] };
  updateSettings(patch: Partial<Settings>): void;
  /** The shooting star: true if it brought today's bonus spark. */
  catchStar(now: Date): boolean;
  /** A pysanka found on the map: the card, when it was the year's last one. */
  findPysanka(index: number, now: Date): string | null;
  /** Swap in another copy (another account's, or merged with the cloud's). */
  replace(progress: Progress): void;
}

export const useProgress = create<ProgressState>()((set, get) => ({
  progress: loadProgress(),
  recordTask(outcome) {
    set({ progress: recordTaskResult(get().progress, outcome, new Date(), game.content.config) });
  },
  finishLevel(run, level) {
    const result = finishLevel({ progress: get().progress, run, level, content: game.content, now: new Date() });
    set({ progress: result.progress });
    return { summary: result.summary, steps: result.steps };
  },
  finishWarmup(run) {
    const result = finishWarmup({ progress: get().progress, run, content: game.content, now: new Date() });
    set({ progress: result.progress });
    return { summary: result.summary, steps: result.steps };
  },
  updateSettings(patch) {
    const { progress } = get();
    set({ progress: { ...progress, settings: { ...progress.settings, ...patch }, settingsAt: new Date().toISOString() } });
  },
  catchStar(now) {
    const result = catchStar(get().progress, now);
    if (result.spark) set({ progress: result.progress });
    return result.spark;
  },
  findPysanka(index, now) {
    const result = findPysanka(get().progress, index, now, game.content.config);
    set({ progress: result.progress });
    return result.card;
  },
  replace(progress) {
    set({ progress });
  },
}));

useProgress.subscribe((state, prev) => {
  if (state.progress !== prev.progress) saveProgress(useAccount.getState().account, state.progress);
});
