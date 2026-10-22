// Short-lived, unsaved game state shared between screens.
import { create } from 'zustand';
import type { CelebrationStep, LevelSummary } from '../engine/rewards';

interface GameState {
  /** The last finished level, for the celebration screen. */
  lastResult: { summary: LevelSummary; steps: CelebrationStep[] } | null;
  /** Соня greets him once per visit, not on every return to the map. */
  greeted: boolean;
  /** A door he just opened: Іскрик walks there on the map (once). */
  walk: { from: string; to: string } | null;
  setLastResult(result: GameState['lastResult']): void;
  setGreeted(): void;
  takeWalk(): void;
}

export const useGame = create<GameState>()((set) => ({
  lastResult: null,
  greeted: false,
  walk: null,
  setLastResult: (lastResult) =>
    set(lastResult?.summary.unlocked ? { lastResult, walk: { from: lastResult.summary.levelId, to: lastResult.summary.unlocked } } : { lastResult }),
  setGreeted: () => set({ greeted: true }),
  takeWalk: () => set({ walk: null }),
}));
