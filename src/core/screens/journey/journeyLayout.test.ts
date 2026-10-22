import { expect, test } from 'vitest';
import { journeyLayout, SIGN_H, type RegionInput } from './journeyLayout';

/** The planned 13 worlds (about 290 levels), each ending in a finale, with a review every 7th. */
const PLANNED = [6, 5, 20, 18, 22, 22, 24, 25, 25, 25, 35, 35, 25];
const regions: RegionInput[] = PLANNED.map((count, r) => ({
  id: `world-${r + 1}`,
  levels: Array.from({ length: count }, (_, i) => ({
    id: `world-${r + 1}/${i + 1}`,
    kind: i === count - 1 ? 'finale' : i % 7 === 6 ? 'review' : 'door',
  })),
}));

// The road's viewport at the test sizes (the header takes the top 96 px).
const VIEWPORTS = [
  { width: 360, height: 544 },
  { width: 768, height: 928 },
  { width: 844, height: 294 },
  { width: 1024, height: 672 },
];

test('every door, gate and signpost on a 290-level road keeps 16 px from its neighbours and stays on screen across the road', () => {
  for (const viewport of VIEWPORTS) {
    const layout = journeyLayout(regions, viewport);
    const boxes = [
      ...layout.nodes.map((n) => ({ name: `door ${n.n}`, ...n })),
      ...layout.regions.map((r) => ({ name: `gate ${r.id}`, ...r.gate })),
      ...layout.spots.map((s, i) => ({ name: `sign ${i}`, x: s.x, y: s.y, w: s.maxW, h: SIGN_H })),
    ].map((b) => ({ name: b.name, l: b.x - b.w / 2, r: b.x + b.w / 2, t: b.y - b.h / 2, b: b.y + b.h / 2 }));
    const where = `${viewport.width}×${viewport.height}`;
    expect(layout.nodes).toHaveLength(PLANNED.reduce((a, b) => a + b));
    expect(layout.door, where).toBeGreaterThanOrEqual(64);

    const across = layout.orientation === 'portrait' ? (b: (typeof boxes)[0]) => [b.l, b.r] : (b: (typeof boxes)[0]) => [b.t, b.b];
    const size = layout.orientation === 'portrait' ? viewport.width : viewport.height;
    for (const b of boxes) {
      const [lo, hi] = across(b);
      expect(lo! >= 8 && hi! <= size - 8, `${where}: ${b.name} leaves the road`).toBe(true);
    }

    // Sorted along the road, only boxes close together can collide.
    const along = layout.orientation === 'portrait' ? (b: (typeof boxes)[0]) => b.t : (b: (typeof boxes)[0]) => b.l;
    const sorted = [...boxes].sort((a, b) => along(a) - along(b));
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < Math.min(sorted.length, i + 6); j++) {
        const [a, b] = [sorted[i]!, sorted[j]!];
        const gap = Math.max(Math.max(a.l, b.l) - Math.min(a.r, b.r), Math.max(a.t, b.t) - Math.min(a.b, b.b));
        expect(gap, `${where}: ${a.name} ↔ ${b.name}`).toBeGreaterThanOrEqual(16);
      }
    }

    // The road only moves forward: up in portrait, right in landscape.
    const pos = layout.nodes.map((n) => (layout.orientation === 'portrait' ? -n.y : n.x));
    expect(pos.every((p, i) => i === 0 || p > pos[i - 1]!), where).toBe(true);
  }
});
