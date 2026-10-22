import { expect, test } from 'vitest';
import { sentenceCompatible, sentenceScore, syllableScore, wordScore } from './distractors';
import { testContent } from './testContent';

const c = testContent();
const v = c.config.letters.vowels;
const syl = (id: string) => c.syllables.get(id)!;
const word = (id: string) => c.words.get(id)!;
const sen = (id: string) => c.sentences.get(id)!;

test('wrong options are look-alikes on purpose, never the answer or the same picture', () => {
  expect(syllableScore(syl('syl-ma'), syl('syl-mo'), v)).toBeGreaterThan(syllableScore(syl('syl-ma'), syl('syl-ty'), v));
  expect(syllableScore(syl('syl-ma'), syl('syl-la'), v)).toBeGreaterThan(syllableScore(syl('syl-ma'), syl('syl-ty'), v));
  expect(syllableScore(syl('syl-ma'), syl('syl-ma'), v)).toBe(-Infinity);
  expect(wordScore(word('w-mama'), word('w-lama'))).toBeGreaterThan(wordScore(word('w-mama'), word('w-noty')));
  expect(wordScore(word('w-mama'), { ...word('w-mama'), id: 'w-alina', text: 'АЛІНА' })).toBe(-Infinity); // same picture
});

test('a wrong scene never also fits the sentence; one-word differences are preferred', () => {
  expect(sentenceCompatible(sen('s-mama-tam'), sen('s-mama-i-tato'))).toBe(false);
  expect(sentenceCompatible(sen('s-mama-i-tato'), sen('s-mama-tam'))).toBe(true);
  expect(sentenceScore(sen('s-u-mamy-mylo'), sen('s-u-mamy-noty'))).toBeGreaterThan(sentenceScore(sen('s-u-mamy-mylo'), sen('s-lama-tut')));
});
