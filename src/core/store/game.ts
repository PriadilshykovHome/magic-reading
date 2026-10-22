// Short-lived, unsaved game state shared between screens.
import { create } from 'zustand';
import type { CelebrationStep, LevelSummary } from '../engine/rewards';

interface GameState {
  /** The last finished level, for the celebration screen. */
  lastResult: { summary: LevelSummary; steps: CelebrationStep[] } | null;
  /** Соня greets him once per visit, not on every return to the map. */
  greeted: boolean;
  setLastResult(result: GameState['lastResult']): void;
  setGreeted(): void;
}

export const useGame = create<GameState>()((set) => ({
  lastResult: null,
  greeted: false,
  setLastResult: (lastResult) => set({ lastResult }),
  setGreeted: () => set({ greeted: true }),
}));
