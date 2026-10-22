import { useCallback } from 'react';
import { content } from '../../content/load';
import { itemText, kindOf } from '../../engine/content';
import { displayText } from '../../engine/display';
import { useProgress } from '../../../core/store/progress';

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
