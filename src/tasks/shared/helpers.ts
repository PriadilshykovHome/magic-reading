import { useCallback, useState } from 'react';
import { content } from '../../content/load';
import { itemText, kindOf } from '../../engine/content';
import type { TaskInstance } from '../../engine/taskLogic';
import { displayText } from '../../engine/text';
import { useProgress } from '../../store/progress';
import { TEST_BUILD } from '../../testMode';

/** Reading text as shown to him: UPPERCASE unless the parent turned on lowercase sentences. */
export function useDisplayText(): (id: string) => string {
  const lowercaseSentences = useProgress((s) => s.progress.settings.lowercaseSentences);
  return useCallback(
    (id: string) => displayText(itemText(content, id), kindOf(id) ?? 'word', { lowercaseSentences }),
    [lowercaseSentences],
  );
}

/** Placeholder picture (emoji) until the illustrations exist. */
export function pictureOf(id: string): string {
  return content.words.get(id)?.emoji ?? content.sentences.get(id)?.emoji ?? '';
}


/** Test builds mark the correct option for automated play-throughs; production builds strip it. */
export function correctMark(isCorrect: boolean): { 'data-correct'?: 'true' } {
  return TEST_BUILD && isCorrect ? { 'data-correct': 'true' } : {};
}

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
