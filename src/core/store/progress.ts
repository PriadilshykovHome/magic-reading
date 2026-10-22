// The progress store: the single source of truth for everything saved. Every change is
// mirrored to this device immediately.
import { create } from 'zustand';
import { game } from '@game';
import { recordTaskResult, type Progress, type Settings, type TaskOutcome } from '../engine/progress';
import { finishLevel, type CelebrationStep, type LevelSummary } from '../engine/rewards';
import type { RunState } from '../engine/run';
import type { Level } from '../engine/schema';
import { loadProgress, saveProgress } from '../sync/localCache';

interface ProgressState {
  progress: Progress;
  recordTask(outcome: TaskOutcome): void;
  finishLevel(run: RunState, level: Level): { summary: LevelSummary; steps: CelebrationStep[] };
  updateSettings(patch: Partial<Settings>): void;
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
  updateSettings(patch) {
    const { progress } = get();
    set({ progress: { ...progress, settings: { ...progress.settings, ...patch } } });
  },
}));

useProgress.subscribe((state, prev) => {
  if (state.progress !== prev.progress) saveProgress(state.progress);
});
