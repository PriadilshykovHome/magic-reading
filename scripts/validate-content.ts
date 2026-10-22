// npm run validate-content [-- --root <dir>] [--strict] [--verbose] [--report]
// Checks every file in content/ (schemas, ids, letters, the curriculum's pace, task configs, pool
// sizes) and that the audio and pictures it names exist under public/. Exit code 1 on any error.
// --report prints the progress curve: what each level introduces and how much he can read by then.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { curve } from '../src/reading/engine/curriculum.ts';
import { validateContent, type Issue, type RawBundle, type RawFile } from '../src/reading/engine/validate.ts';
import { taskLogics } from '../src/reading/tasks/logicRegistry.ts';

const args = process.argv.slice(2);
const rootArg = args.indexOf('--root');
const root = resolve(rootArg >= 0 ? args[rootArg + 1]! : join(dirname(fileURLToPath(import.meta.url)), '..'));
const strict = args.includes('--strict');
const verbose = args.includes('--verbose');
const report = args.includes('--report');

const loadErrors: Issue[] = [];
const rel = (path: string) => path.slice(root.length + 1);

function load(path: string): RawFile {
  const file = rel(path);
  try {
    return { file, data: JSON.parse(readFileSync(path, 'utf8')) };
  } catch (e) {
    loadErrors.push({ severity: 'error', file, message: e instanceof Error ? e.message : String(e) });
    return { file, data: undefined };
  }
}

const content = join(root, 'content');
const worldsDir = join(content, 'worlds');
const worldIds = existsSync(worldsDir)
  ? readdirSync(worldsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()
  : [];

const raw: RawBundle = {
  config: load(join(content, 'config.json')),
  templates: load(join(content, 'templates.json')),
  cards: load(join(content, 'cards.json')),
  voice: load(join(content, 'voice.uk.json')),
  strings: load(join(content, 'strings.uk.json')),
  worlds: worldIds.map((id) => ({
    world: load(join(worldsDir, id, 'world.json')),
    lexicon: existsSync(join(worldsDir, id, 'lexicon.json')) ? load(join(worldsDir, id, 'lexicon.json')) : { file: rel(join(worldsDir, id, 'lexicon.json')), data: {} },
  })),
};

const { issues, content: valid } = loadErrors.length
  ? { issues: loadErrors, content: null }
  : validateContent(raw, taskLogics, {
      strictAssets: strict,
      hasAsset: (kind, path) => existsSync(join(root, 'public', kind === 'audio' ? 'audio/uk' : '', path)),
    });

const errors = issues.filter((i) => i.severity === 'error');
const warnings = issues.filter((i) => i.severity === 'warning');

for (const e of errors) console.error(`✖ ${e.file}: ${e.message}`);
if (warnings.length) {
  const byFile = new Map<string, Issue[]>();
  for (const w of warnings) byFile.set(w.file, [...(byFile.get(w.file) ?? []), w]);
  for (const [file, list] of byFile) {
    console.warn(`⚠ ${file}: ${list.length} missing asset(s)${verbose ? '' : ' (use --verbose to list)'}`);
    if (verbose) for (const w of list) console.warn(`    ${w.message}`);
  }
}

if (report && valid) {
  const levels = [...valid.levels.values()];
  const rows = curve(levels, levels.map((l) => valid.plans.get(l.id)!));
  console.log('\n  #  level                                  template    +syl +words +sent  words sent');
  for (const r of rows) {
    console.log(
      `${String(r.n).padStart(3)}  ${r.id.padEnd(38)} ${r.template.padEnd(10)} ${String(r.newSyllables).padStart(4)} ${String(r.newWords).padStart(6)} ${String(r.newSentences).padStart(5)} ${String(r.knownWords).padStart(6)} ${String(r.knownSentences).padStart(4)}`,
    );
  }
  console.log('');
}

const levels = valid?.levels.size ?? 0;
if (errors.length) {
  console.error(`\n✖ Content invalid: ${errors.length} error(s).`);
  process.exit(1);
}
console.log(`✔ Content valid: ${worldIds.length} world(s), ${levels} level(s)${warnings.length ? `, ${warnings.length} asset warning(s)` : ''}.`);
