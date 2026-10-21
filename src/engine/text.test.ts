import { describe, expect, it } from 'vitest';
import { displayText, fillTemplate, patronymicVocative, templateVars } from './text';
import { testContent } from './testContent';

const content = testContent();

describe('displayText', () => {
  it('shows everything in UPPERCASE by default', () => {
    expect(displayText('У мами мило.', 'sentence', { lowercaseSentences: false })).toBe('У МАМИ МИЛО.');
    expect(displayText('ма', 'syllable', { lowercaseSentences: true })).toBe('МА');
  });

  it('keeps sentence case for sentences once the parent turns lowercase on', () => {
    expect(displayText('Лиса у лісі.', 'sentence', { lowercaseSentences: true })).toBe('Лиса у лісі.');
  });
});

describe('templates', () => {
  const vars = templateVars(content.strings, content.config);

  it('fills names in the right case', () => {
    expect(fillTemplate('Привіт, {nameVoc}!', vars).text).toBe('Привіт, Мишку!');
    expect(fillTemplate('Великий чарівник {fullName}!', vars).text).toBe('Великий чарівник Михайло!');
    expect(fillTemplate('{mom} — це мама!', vars).text).toBe('Аліна — це мама!');
  });

  it('reports a missing private value so Соня can use the fallback line', () => {
    const { missing } = fillTemplate('Шановний {fullNameVoc} {patronymicVoc}!', vars);
    expect(missing).toEqual(['patronymicVoc']);
  });

  it('builds the vocative patronymic from the private profile', () => {
    const withProfile = templateVars(content.strings, content.config, { patronymic: 'Тарасович' });
    expect(fillTemplate('{fullNameVoc} {patronymicVoc}', withProfile).text).toBe('Михайле Тарасовичу');
    expect(patronymicVocative('Іванівна', content.config.grammar.patronymicVocative)).toBe('Іванівно');
  });
});
