import { expect, test } from 'vitest';
import { displayText } from './display';

test('reading text is UPPERCASE unless lowercase sentences are turned on', () => {
  expect(displayText('У мами мило.', 'sentence', { lowercaseSentences: false })).toBe('У МАМИ МИЛО.');
  expect(displayText('Лиса у лісі.', 'sentence', { lowercaseSentences: true })).toBe('Лиса у лісі.');
  expect(displayText('ма', 'syllable', { lowercaseSentences: true })).toBe('МА');
});
