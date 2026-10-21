import { describe, expect, it } from 'vitest';
import { sentenceCompatible, sentenceScore, syllableScore, wordScore } from './distractors';
import { testContent } from './testContent';

const c = testContent();
const vowels = c.config.letters.vowels;
const syl = (id: string) => c.syllables.get(id)!;
const word = (id: string) => c.words.get(id)!;
const sen = (id: string) => c.sentences.get(id)!;

describe('syllable distractors', () => {
  it('prefers the same consonant (МА/МО) or the same vowel (МА/ЛА) over unrelated ones', () => {
    const target = syl('syl-ma');
    expect(syllableScore(target, syl('syl-mo'), vowels)).toBeGreaterThan(syllableScore(target, syl('syl-ty'), vowels));
    expect(syllableScore(target, syl('syl-la'), vowels)).toBeGreaterThan(syllableScore(target, syl('syl-ty'), vowels));
  });

  it('never offers the target itself', () => {
    expect(syllableScore(syl('syl-ma'), syl('syl-ma'), vowels)).toBe(-Infinity);
  });
});

describe('word distractors', () => {
  it('prefers look-alikes (МАМА/ЛАМА) over different words', () => {
    expect(wordScore(word('w-mama'), word('w-lama'))).toBeGreaterThan(wordScore(word('w-mama'), word('w-noty')));
  });

  it('never offers a word with the same picture', () => {
    expect(wordScore(word('w-mama'), word('w-alina'))).toBe(-Infinity);
  });
});

describe('sentence distractors', () => {
  it('rejects scenes that also fit the sentence', () => {
    // "Мама там." — a scene with mum and dad also shows mum.
    expect(sentenceCompatible(sen('s-mama-tam'), sen('s-mama-i-tato'))).toBe(false);
    expect(sentenceCompatible(sen('s-mama-tam'), sen('s-u-mamy-mylo'))).toBe(false);
    // "Мама і тато." — a scene with only mum is clearly wrong.
    expect(sentenceCompatible(sen('s-mama-i-tato'), sen('s-mama-tam'))).toBe(true);
  });

  it('prefers sentences that differ in exactly one word', () => {
    const target = sen('s-u-mamy-mylo');
    expect(sentenceScore(target, sen('s-u-mamy-noty'))).toBeGreaterThan(sentenceScore(target, sen('s-lama-tut')));
  });
});
