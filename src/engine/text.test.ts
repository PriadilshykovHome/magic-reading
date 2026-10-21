import { expect, test } from 'vitest';
import { displayText, fillTemplate, templateVars } from './text';
import { testContent } from './testContent';

const content = testContent();

test('reading text is UPPERCASE unless lowercase sentences are turned on', () => {
  expect(displayText('У мами мило.', 'sentence', { lowercaseSentences: false })).toBe('У МАМИ МИЛО.');
  expect(displayText('Лиса у лісі.', 'sentence', { lowercaseSentences: true })).toBe('Лиса у лісі.');
  expect(displayText('ма', 'syllable', { lowercaseSentences: true })).toBe('МА');
});

test("Соня's lines get his name in the right case; private values only from the profile", () => {
  const vars = templateVars(content.strings, content.config);
  expect(fillTemplate('Привіт, {nameVoc}! {mom} — це мама.', vars).text).toBe('Привіт, Мишку! Аліна — це мама.');
  expect(fillTemplate('{fullNameVoc} {patronymicVoc}', vars).missing).toEqual(['patronymicVoc']);
  const withProfile = templateVars(content.strings, content.config, { patronymic: 'Тарасович' });
  expect(fillTemplate('{fullNameVoc} {patronymicVoc}', withProfile).text).toBe('Михайле Тарасовичу');
});
