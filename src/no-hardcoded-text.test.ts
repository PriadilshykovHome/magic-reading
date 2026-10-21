// Guards the CLAUDE.md rule: Ukrainian text lives in content/, never in source files.
// Comments may quote Ukrainian examples (МА/МО) for documentation; code and markup may not.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import strings from '../content/strings.uk.json';

const SRC = join(import.meta.dirname);
const CYRILLIC = /[Ѐ-ӿ]/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|css)$/.test(entry.name) && !entry.name.endsWith('.test.ts') ? [path] : [];
  });
}

/** Blanks out comments, keeping line numbers. */
function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, (block) => block.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
}

function leaves(value: unknown, path = ''): [string, unknown][] {
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => leaves(child, path ? `${path}.${key}` : key));
  }
  return [[path, value]];
}

describe('user-facing text', () => {
  it('has no Cyrillic in src/ code (it belongs in content/)', () => {
    const offenders = sourceFiles(SRC).flatMap((file) =>
      withoutComments(readFileSync(file, 'utf8'))
        .split('\n')
        .flatMap((line, i) => (CYRILLIC.test(line) ? [`${relative(SRC, file)}:${i + 1}: ${line.trim()}`] : [])),
    );
    expect(offenders).toEqual([]);
  });

  it('still catches Cyrillic in code next to comments', () => {
    const sample = '// МА is fine here\nconst label = "МА"; /* МО */';
    expect(withoutComments(sample).split('\n').filter((l) => CYRILLIC.test(l)).map((l) => l.trim())).toEqual(['const label = "МА";']);
  });

  it('has no hard-coded text in index.html', () => {
    const html = readFileSync(join(SRC, '..', 'index.html'), 'utf8');
    expect(CYRILLIC.test(html)).toBe(false);
  });

  it('has a non-empty string for every key in strings.uk.json', () => {
    const empty = leaves(strings).filter(([, v]) => typeof v !== 'string' || v.trim() === '');
    expect(empty).toEqual([]);
  });
});
