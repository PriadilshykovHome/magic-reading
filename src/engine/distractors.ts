// Wrong options are confusable on purpose (same consonant МА/МО, same vowel МА/ЛА, look-alike
// words МАМА/ЛАМА), so the only way to the right answer is to really read or listen.
import { syllableShape } from './content.ts';
import type { Sentence, Syllable, Word } from './schema.ts';

/** Higher = more confusable; -Infinity = never a valid wrong option. */
export function syllableScore(target: Syllable, other: Syllable, vowels: string): number {
  if (target.text === other.text) return -Infinity;
  const a = syllableShape(target, vowels);
  const b = syllableShape(other, vowels);
  let score = 0;
  if (a.consonant && a.consonant === b.consonant) score += 2;
  if (a.vowel && a.vowel === b.vowel) score += 2;
  if (target.parts.length === other.parts.length) score += 1;
  return score;
}

export function wordScore(target: Word, other: Word): number {
  // Pictures must differ, or a picture task would have two right answers.
  if (target.text === other.text || target.picture === other.picture || target.emoji === other.emoji) return -Infinity;
  const remaining = [...other.syllables];
  let shared = 0;
  for (const s of target.syllables) {
    const at = remaining.indexOf(s);
    if (at >= 0) {
      shared++;
      remaining.splice(at, 1);
    }
  }
  let score = shared * 2;
  if (target.text[0] === other.text[0]) score += 1;
  if (target.syllables.at(-1) === other.syllables.at(-1)) score += 1;
  if (target.syllables.length === other.syllables.length) score += 1;
  return score;
}

/**
 * A wrong scene must not also fit the sentence: its picture may not show everything the target
 * shows (for "Мама там." a scene with мама і тато would be ambiguous).
 */
export function sentenceCompatible(target: Sentence, other: Sentence): boolean {
  if (target.id === other.id || target.scene === other.scene || target.emoji === other.emoji) return false;
  return !target.depicts.every((thing) => other.depicts.includes(thing));
}

export function sentenceScore(target: Sentence, other: Sentence): number {
  if (!sentenceCompatible(target, other)) return -Infinity;
  let score = target.depicts.filter((thing) => other.depicts.includes(thing)).length;
  if (target.words.length === other.words.length) {
    score += 1;
    const differing = target.words.filter((w, i) => w.toLowerCase() !== other.words[i]?.toLowerCase()).length;
    if (differing === 1) score += 3; // "У мами мило" vs "У мами ноти": exactly what he must read
  }
  return score;
}
