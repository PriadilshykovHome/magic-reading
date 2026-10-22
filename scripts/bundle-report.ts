// npm run bundle-report: what each package and source folder costs in the production build.
// Builds with source maps into dist-report/ and attributes every byte of every chunk to the
// file it came from (decoding the maps by hand, no extra dependency). First-load chunks are the
// ones index.html loads; the rest are lazy (loaded when a screen or feature needs them).
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = join(import.meta.dirname, '..');
const out = join(root, 'dist-report');
execSync('npx vite build --sourcemap --outDir dist-report --emptyOutDir', { cwd: root, stdio: 'ignore' });

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const decode = (segment: string): number[] => {
  const out: number[] = [];
  let value = 0;
  let shift = 0;
  for (const ch of segment) {
    const digit = B64.indexOf(ch);
    value += (digit & 31) << shift;
    if (digit & 32) shift += 5;
    else {
      out.push(value & 1 ? -(value >>> 1) : value >>> 1);
      value = 0;
      shift = 0;
    }
  }
  return out;
};

/** Bytes of generated code per original source file. */
function attribute(code: string, map: { sources: string[]; mappings: string }): Map<string, number> {
  const bytes = new Map<string, number>();
  const lines = code.split('\n');
  let source = 0;
  map.mappings.split(';').forEach((line, i) => {
    const text = lines[i] ?? '';
    let column = 0;
    const segments = line ? line.split(',').map(decode) : [];
    segments.forEach((seg, k) => {
      column += seg[0]!;
      if (seg.length >= 4) source += seg[1]!;
      const next = k + 1 < segments.length ? column + segments[k + 1]![0]! : text.length;
      if (seg.length >= 4) {
        const file = map.sources[source]!;
        bytes.set(file, (bytes.get(file) ?? 0) + Math.max(0, next - column));
      }
    });
  });
  return bytes;
}

/** node_modules/<pkg> (or @scope/pkg) for packages, otherwise the first two folders. */
const groupOf = (file: string): string => {
  const nm = file.lastIndexOf('node_modules/');
  if (nm >= 0) {
    const parts = file.slice(nm + 'node_modules/'.length).split('/');
    return parts[0]!.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0]!;
  }
  const local = file.replace(/^(\.\.\/)+/, '');
  if (local.startsWith('content/')) return 'content/';
  return local.split('/').slice(0, 3).join('/');
};

const assets = join(out, 'assets');
const html = readFileSync(join(out, 'index.html'), 'utf8');
const firstLoad = new Set([...html.matchAll(/assets\/([^"]+\.js)/g)].map((m) => m[1]!));
const kb = (n: number) => `${(n / 1024).toFixed(1).padStart(7)} KB`;

let firstGzip = 0;
let lazyGzip = 0;
const chunks = readdirSync(assets).filter((f) => f.endsWith('.js'));
for (const file of chunks.sort((a, b) => Number(firstLoad.has(b)) - Number(firstLoad.has(a)))) {
  const code = readFileSync(join(assets, file), 'utf8');
  const gz = gzipSync(code).length;
  if (firstLoad.has(file)) firstGzip += gz;
  else lazyGzip += gz;
  if (code.length < 8 * 1024) continue;
  const map = JSON.parse(readFileSync(join(assets, `${file}.map`), 'utf8')) as { sources: string[]; mappings: string };
  const groups = new Map<string, number>();
  for (const [source, n] of attribute(code, map)) groups.set(groupOf(source), (groups.get(groupOf(source)) ?? 0) + n);
  console.log(`\n${firstLoad.has(file) ? 'FIRST LOAD' : 'lazy'}  ${file}: ${kb(code.length)} (${kb(gz).trim()} gzip)`);
  for (const [group, n] of [...groups].sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(`  ${kb(n)}  ${group}`);
}

const others = readdirSync(out, { recursive: true, withFileTypes: true }).filter((e) => e.isFile() && !e.name.endsWith('.map'));
const byKind = new Map<string, number>();
for (const e of others) {
  const kind = /\.(js)$/.test(e.name) ? 'js' : /\.(css)$/.test(e.name) ? 'css' : /\.(woff2)$/.test(e.name) ? 'fonts' : /\.(wav|mp3|ogg|m4a)$/.test(e.name) ? 'audio' : 'other';
  byKind.set(kind, (byKind.get(kind) ?? 0) + readFileSync(join(e.parentPath, e.name)).length);
}
console.log(`\nJS gzip: first load ${kb(firstGzip).trim()}, lazy ${kb(lazyGzip).trim()}`);
console.log(`Site: ${[...byKind].map(([k, n]) => `${k} ${kb(n).trim()}`).join(', ')}`);
