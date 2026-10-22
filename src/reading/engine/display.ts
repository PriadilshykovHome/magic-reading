// How reading text is shown to him.
import type { ItemKind } from './content.ts';

/** UPPERCASE everywhere, like an alphabet book, unless the parent turned on lowercase sentences. */
export function displayText(text: string, kind: ItemKind, opts: { lowercaseSentences: boolean }): string {
  if (kind === 'sentence' && opts.lowercaseSentences) return text;
  return text.toLocaleUpperCase('uk-UA');
}
