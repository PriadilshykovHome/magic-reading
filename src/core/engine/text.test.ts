import { expect, test } from 'vitest';
import { fillTemplate, templateVars } from './text';
import { testContent } from '../../reading/engine/testContent';

const content = testContent();

test("Соня's lines get his name in the right case; private values only from the profile", () => {
  const vars = templateVars(content.strings, content.config);
  expect(fillTemplate('Привіт, {nameVoc}! {mom} — це мама.', vars).text).toBe('Привіт, Мишку! Аліна — це мама.');
  expect(fillTemplate('{fullNameVoc} {patronymicVoc}', vars).missing).toEqual(['patronymicVoc']);
  const withProfile = templateVars(content.strings, content.config, { patronymic: 'Тарасович' });
  expect(fillTemplate('{fullNameVoc} {patronymicVoc}', withProfile).text).toBe('Михайле Тарасовичу');
});
