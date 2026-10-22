import { useState } from 'react';
import type { TaskInstance } from '../engine/taskLogic';

/** Pick-one-of-N: wrong picks wobble, dim and disable; the right one springs up. */
export function useChoice(task: TaskInstance, onMiss: () => void, onComplete: () => void) {
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const pick = (id: string) => {
    if (solved || wrong.includes(id)) return;
    if (id === task.target) {
      setSolved(true);
      onComplete();
    } else {
      setWrong((w) => [...w, id]);
      onMiss();
    }
  };
  const stateOf = (id: string, hint: boolean) => {
    if (solved) return id === task.target ? 'is-correct' : 'is-faded';
    if (wrong.includes(id)) return 'is-wrong';
    return hint && id === task.target ? 'is-hint' : '';
  };
  return { pick, stateOf, solved, isWrong: (id: string) => wrong.includes(id) };
}
