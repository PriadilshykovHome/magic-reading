// Production builds must not contain the answer markers or the /dev routes used by tests.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dirname, '..', 'dist', 'assets');
const js = readdirSync(dir).filter((f) => f.endsWith('.js'));
const leaks = js.flatMap((f) => {
  const code = readFileSync(join(dir, f), 'utf8');
  return ['data-correct', '/dev/task', '/dev/celebration', '/dev/journey', '__audio'].filter((needle) => code.includes(needle)).map((n) => `${f}: ${n}`);
});
if (leaks.length) {
  console.error(`✖ Test-only code in the production build:\n  ${leaks.join('\n  ')}`);
  process.exit(1);
}
console.log(`✔ Production build is clean (${js.length} script file(s) checked).`);
