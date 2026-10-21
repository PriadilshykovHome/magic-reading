// Guards the CLAUDE.md rule: Ukrainian text lives in content/, never in code.
// Comments may quote Ukrainian examples (МА/МО) for documentation; code and markup may not.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { expect, test } from 'vitest';
import strings from '../content/strings.uk.json';

const SRC = import.meta.dirname;
const CYRILLIC = /[Ѐ-ӿ]/;

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sourceFiles(join(dir, e.name)) : /\.(ts|tsx|css)$/.test(e.name) && !e.name.endsWith('.test.ts') ? [join(dir, e.name)] : [],
  );

/** Blanks out comments, keeping line numbers. */
const withoutComments = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

test('no Ukrainian text in code or index.html (it belongs in content/)', () => {
  expect(withoutComments('// МА is fine\nconst label = "МА"; /* МО */').split('\n').filter((l) => CYRILLIC.test(l))).toHaveLength(1);
  const offenders = sourceFiles(SRC).flatMap((file) =>
    withoutComments(readFileSync(file, 'utf8'))
      .split('\n')
      .flatMap((line, i) => (CYRILLIC.test(line) ? [`${relative(SRC, file)}:${i + 1}: ${line.trim()}`] : [])),
  );
  expect(offenders).toEqual([]);
  expect(CYRILLIC.test(readFileSync(join(SRC, '..', 'index.html'), 'utf8'))).toBe(false);
});

test('every UI string is filled in', () => {
  const leaves = (value: unknown): unknown[] => (value && typeof value === 'object' ? Object.values(value).flatMap(leaves) : [value]);
  expect(leaves(strings).filter((v) => typeof v !== 'string' || v.trim() === '')).toEqual([]);
});
