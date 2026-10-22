import type { CSSProperties } from 'react';

interface Star {
  x: number;
  y: number;
}

const cache = new Map<string, { stars: Star[]; lines: [number, number][] }>();

/**
 * «Сузір’я літер»: a letter drawn as a constellation. The glyph is rendered once on a small
 * canvas and thinned to its centre line; a dozen stars are spread along that line (each as far as
 * possible from the others) and faint lines join them along the shortest tree, so it reads as
 * the letter without spelling it.
 */
function constellation(text: string): { stars: Star[]; lines: [number, number][] } {
  const hit = cache.get(text);
  if (hit) return hit;
  const size = 100;
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  let inside: Star[] = [];
  if (ctx) {
    ctx.canvas.width = ctx.canvas.height = size;
    const family = getComputedStyle(document.documentElement).getPropertyValue('--font-reading') || 'sans-serif';
    ctx.font = `800 ${size * 0.8}px ${family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size / 2, size * 0.54);
    const { data } = ctx.getImageData(0, 0, size, size);
    const ink = Uint8Array.from({ length: size * size }, (_, i) => (data[i * 4 + 3]! > 128 ? 1 : 0));
    inside = thin(ink, size);
  }
  // Farthest-point sampling, starting from the top-left-most point: an even spread.
  const count = Math.min(inside.length, Math.max(6, Math.min(13, Math.round(inside.length / 14))));
  const stars: Star[] = [];
  if (inside.length) stars.push(inside.reduce((a, b) => (b.x + b.y < a.x + a.y ? b : a)));
  const d2 = (a: Star, b: Star) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
  while (stars.length < count) {
    let best = inside[0]!;
    let bestD = -1;
    for (const p of inside) {
      const d = Math.min(...stars.map((s) => d2(p, s)));
      if (d > bestD) [best, bestD] = [p, d];
    }
    stars.push(best);
  }
  // The shortest tree through the stars (Prim's algorithm; a dozen points).
  const lines: [number, number][] = [];
  const joined = new Set([0]);
  while (joined.size < stars.length) {
    let edge: [number, number] = [0, 0];
    let bestD = Infinity;
    for (const i of joined) {
      stars.forEach((s, j) => {
        if (!joined.has(j) && d2(stars[i]!, s) < bestD) [edge, bestD] = [[i, j], d2(stars[i]!, s)];
      });
    }
    joined.add(edge[1]);
    lines.push(edge);
  }
  const shape = { stars, lines };
  cache.set(text, shape);
  return shape;
}

/** Zhang–Suen thinning: peel the glyph's edges until only its one-pixel centre line is left. */
function thin(ink: Uint8Array, size: number): Star[] {
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= size || y >= size ? 0 : ink[y * size + x]!);
  for (let changed = true; changed; ) {
    changed = false;
    for (const pass of [0, 1]) {
      const peel: number[] = [];
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (!at(x, y)) continue;
          // Neighbours clockwise from north: P2 … P9.
          const p = [at(x, y - 1), at(x + 1, y - 1), at(x + 1, y), at(x + 1, y + 1), at(x, y + 1), at(x - 1, y + 1), at(x - 1, y), at(x - 1, y - 1)];
          const filled = p.reduce((a, b) => a + b, 0);
          const turns = p.filter((v, i) => v === 0 && p[(i + 1) % 8] === 1).length;
          const [n, e, s, w] = [p[0]!, p[2]!, p[4]!, p[6]!];
          const ok = pass === 0 ? n * e * s === 0 && e * s * w === 0 : n * e * w === 0 && n * s * w === 0;
          if (filled >= 2 && filled <= 6 && turns === 1 && ok) peel.push(y * size + x);
        }
      }
      for (const i of peel) ink[i] = 0;
      if (peel.length) changed = true;
    }
  }
  const out: Star[] = [];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (ink[y * size + x]) out.push({ x, y });
  return out;
}

export function Constellation({ text }: { text: string }) {
  const { stars, lines } = constellation(text);
  // Framed on the letter itself (a square around its stars), so every letter fills its patch of sky.
  const xs = stars.map((s) => s.x);
  const ys = stars.map((s) => s.y);
  const side = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 20) + 14;
  const box = `${(Math.min(...xs) + Math.max(...xs) - side) / 2} ${(Math.min(...ys) + Math.max(...ys) - side) / 2} ${side} ${side}`;
  return (
    <svg className="constellation" viewBox={stars.length ? box : '0 0 100 100'} aria-hidden="true">
      {lines.map(([a, b], i) => (
        <line key={i} x1={stars[a]!.x} y1={stars[a]!.y} x2={stars[b]!.x} y2={stars[b]!.y} />
      ))}
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={i % 3 === 0 ? 3.4 : 2.4} style={{ '--delay': `${-((i * 0.83) % 4)}s` } as CSSProperties} />
      ))}
    </svg>
  );
}
