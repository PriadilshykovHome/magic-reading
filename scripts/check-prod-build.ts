// Production builds must not contain the answer markers or the /dev routes used by tests, and
// must stay within the size budgets (npm run bundle-report shows what each package costs).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = join(import.meta.dirname, '..', 'dist');
const dir = join(dist, 'assets');
const js = readdirSync(dir).filter((f) => f.endsWith('.js'));
const problems = js.flatMap((f) => {
  const code = readFileSync(join(dir, f), 'utf8');
  return ['data-correct', '/dev/task', '/dev/celebration', '/dev/journey', '__audio'].filter((needle) => code.includes(needle)).map((n) => `test-only code: ${f}: ${n}`);
});

// Budgets, just above the sizes after the October 2026 clean-up: raise one only on purpose.
const KB = 1024;
const BUDGET = {
  /** JS the first screen waits for (index.html's scripts and preloads), gzip. */
  firstLoadJs: 215 * KB,
  /** Any chunk loaded later (a screen, Firebase, particles), gzip. */
  lazyChunk: 60 * KB,
  /** Every effect and music file. */
  audio: 520 * KB,
  /** The whole site. */
  site: 2.4 * KB * KB,
};

const gz = (f: string) => gzipSync(readFileSync(join(dir, f))).length;
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const firstLoad = new Set([...html.matchAll(/assets\/([^"]+\.js)/g)].map((m) => m[1]!));
const firstLoadJs = [...firstLoad].reduce((sum, f) => sum + gz(f), 0);
const files = readdirSync(dist, { recursive: true, withFileTypes: true }).filter((e) => e.isFile());
const size = (match: (name: string) => boolean) => files.filter((e) => match(e.name)).reduce((sum, e) => sum + statSync(join(e.parentPath, e.name)).size, 0);
const audio = size((n) => /\.(mp3|wav|ogg|m4a)$/.test(n));
const site = size(() => true);
const kb = (n: number) => `${Math.round(n / KB)} KB`;

if (firstLoadJs > BUDGET.firstLoadJs) problems.push(`first-load JS ${kb(firstLoadJs)} gzip > ${kb(BUDGET.firstLoadJs)}`);
for (const f of js.filter((f) => !firstLoad.has(f))) if (gz(f) > BUDGET.lazyChunk) problems.push(`lazy chunk ${f} ${kb(gz(f))} gzip > ${kb(BUDGET.lazyChunk)}`);
if (audio > BUDGET.audio) problems.push(`audio ${kb(audio)} > ${kb(BUDGET.audio)}`);
if (site > BUDGET.site) problems.push(`site ${kb(site)} > ${kb(BUDGET.site)}`);

if (problems.length) {
  console.error(`✖ Production build:\n  ${problems.join('\n  ')}\n  (npm run bundle-report shows what each package costs)`);
  process.exit(1);
}
console.log(`✔ Production build is clean (${js.length} script file(s) checked); first-load JS ${kb(firstLoadJs)} gzip, audio ${kb(audio)}, site ${kb(site)}.`);
