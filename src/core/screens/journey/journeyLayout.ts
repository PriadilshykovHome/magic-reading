// Where everything on the journey road sits: one continuous road through every world, climbing
// up in portrait and running left to right in landscape. Pure and deterministic, so the spacing
// rules (doors at least 64 px, 16 px apart) hold by construction and are unit-tested.

export type Orientation = 'portrait' | 'landscape';
export type NodeKind = 'door' | 'review' | 'finale';

export interface RegionInput {
  id: string;
  levels: { id: string; kind: NodeKind }[];
}

export interface Point {
  x: number;
  y: number;
}

export interface JourneyNode extends Point {
  id: string;
  kind: NodeKind;
  region: number;
  /** 1-based number across the whole journey. */
  n: number;
  /** The door button's size (door + stars). */
  w: number;
  h: number;
}

export interface JourneyRegion {
  id: string;
  index: number;
  /** Its stretch of the track along the scrolling axis, in px from the track's top / left. */
  start: number;
  end: number;
  /** Centre of its gate (the world's name), and the gate's size. */
  gate: Point & { w: number; h: number };
}

/** A free place beside the road (across from a door in a side lane) for a signpost. */
export interface JourneySpot extends Point {
  region: number;
  /** The widest a sign may be here (it is SIGN_H tall). */
  maxW: number;
}

/** A signpost's height. */
export const SIGN_H = 64;

export interface JourneyLayout {
  orientation: Orientation;
  /** The track: long along the scrolling axis, the viewport's size across it. */
  width: number;
  height: number;
  /** Door width in px (CSS reads it as --door-w). */
  door: number;
  regions: JourneyRegion[];
  nodes: JourneyNode[];
  spots: JourneySpot[];
}

const GAP = 16;
/** A finale's door is this much bigger. */
export const FINALE_SCALE = 1.2;
/** Door + gap + stars row, from the door width (matches journey.css). */
const nodeHeight = (w: number) => Math.round(w * 1.3 + 6 + w * 0.26);
/** The road's wave: centre, one side, centre, other side. */
const WAVE = [0, 1, 0, -1] as const;

export function journeyLayout(regions: readonly RegionInput[], viewport: { width: number; height: number }): JourneyLayout {
  const { width: W, height: H } = viewport;
  const orientation: Orientation = H >= W ? 'portrait' : 'landscape';
  const door = Math.round(Math.min(92, Math.max(64, Math.min(W, H) * 0.15)));
  const big = Math.round(door * FINALE_SCALE);
  const h = nodeHeight(door);
  const bigH = nodeHeight(big);
  const size = (kind: NodeKind) => (kind === 'finale' ? { w: big, h: bigH } : { w: door, h });

  const nodes: JourneyNode[] = [];
  const placed: JourneyRegion[] = [];
  let n = 0;

  if (orientation === 'portrait') {
    // Neighbours sit in different lanes, far enough apart sideways; doors two apart share a lane
    // and are far enough apart vertically.
    const lane = Math.max(big + GAP + 2, Math.min(W * 0.26, 200));
    const step = Math.max(Math.ceil((bigH + GAP) / 2) + 4, Math.round(h * 0.78));
    const gate = { w: Math.min(W - 2 * GAP, 300), h: 64 };
    const gateGap = Math.ceil(bigH / 2 + gate.h / 2 + GAP) + 4;
    // Measured from the bottom, then flipped once the length is known: the road climbs.
    const rise: { at: number; node: Omit<JourneyNode, 'y'> }[] = [];
    const gateAt: number[] = [];
    let at = GAP + gate.h / 2;
    regions.forEach((region, r) => {
      if (r > 0) at += gateGap;
      gateAt.push(at);
      region.levels.forEach((level, i) => {
        at += i === 0 ? gateGap : step;
        rise.push({ at, node: { id: level.id, kind: level.kind, region: r, n: n + 1, x: W / 2 + WAVE[n % 4]! * lane, ...size(level.kind) } });
        n++;
      });
    });
    const length = Math.ceil(at + Math.max(H * 0.5, bigH));
    for (const { at: a, node } of rise) nodes.push({ ...node, y: length - a });
    // Across from a door in a side lane, between the screen's edge and the centre lane.
    const spots: JourneySpot[] = [];
    const reach = W / 2 - big / 2 - GAP - 8;
    if (reach >= 72) {
      for (const node of nodes) {
        if (node.x === W / 2) continue;
        const left = node.x > W / 2;
        spots.push({ x: left ? 8 + reach / 2 : W - 8 - reach / 2, y: node.y, maxW: Math.min(reach, 200), region: node.region });
      }
    }
    regions.forEach((region, r) => {
      const gateY = length - gateAt[r]!;
      placed.push({
        id: region.id,
        index: r,
        start: r < regions.length - 1 ? length - gateAt[r + 1]! + gate.h / 2 : 0,
        end: r === 0 ? length : gateY + gate.h / 2,
        gate: { x: W / 2, y: gateY, ...gate },
      });
    });
    return { orientation, width: W, height: length, door, regions: placed, nodes, spots };
  }

  // Landscape: doors are far enough apart along the road; the wave uses the height available.
  const step = Math.max(Math.ceil((big + door) / 2 + GAP) + 2, Math.round(W * 0.12));
  const amplitude = Math.max(0, Math.min(120, (H - bigH - 2 * GAP) / 2));
  const gate = { w: 260, h: 64 };
  const gateGap = Math.ceil(gate.w / 2 + big / 2 + GAP) + 4;
  let at = GAP + gate.w / 2;
  regions.forEach((region, r) => {
    if (r > 0) at += gateGap;
    const gateX = at;
    const startX = r === 0 ? 0 : gateX - gate.w / 2;
    region.levels.forEach((level, i) => {
      at += i === 0 ? gateGap : step;
      nodes.push({ id: level.id, kind: level.kind, region: r, n: ++n, x: at, y: H / 2 + WAVE[(n - 1) % 4]! * amplitude, ...size(level.kind) });
    });
    placed.push({ id: region.id, index: r, start: startX, end: 0, gate: { x: gateX, y: H / 2, ...gate } });
  });
  const length = Math.ceil(at + Math.max(W * 0.5, big));
  placed.forEach((region, r) => (region.end = r < placed.length - 1 ? placed[r + 1]!.start : length));
  // Above or below a door in a side lane, when the road leaves room (not on phones held sideways).
  const spots: JourneySpot[] = [];
  const room = H / 2 - bigH / 2 - GAP - 8;
  if (amplitude > 0 && room >= SIGN_H + 8) {
    for (const node of nodes) {
      if (node.y === H / 2) continue;
      const above = node.y > H / 2;
      spots.push({ x: node.x, y: above ? 8 + room / 2 : H - 8 - room / 2, maxW: 200, region: node.region });
    }
  }
  return { orientation, width: length, height: H, door, regions: placed, nodes, spots };
}

/**
 * The road as smooth segments, one per pair of points (Catmull-Rom through every point), so each
 * stretch can be lit on its own.
 */
export function roadSegments(points: readonly Point[]): string[] {
  const out: string[] = [];
  const p = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))]!;
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    const f = (v: number) => Math.round(v * 10) / 10;
    out.push(`M${f(p1.x)} ${f(p1.y)} C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`);
  }
  return out;
}

/** Points along one road segment, for Іскрик to walk and the sparkles to travel. */
export function samplesBetween(points: readonly Point[], from: number, count = 12): Point[] {
  const p = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))]!;
  const [p0, p1, p2, p3] = [p(from - 1), p(from), p(from + 1), p(from + 2)];
  const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
  const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
  return Array.from({ length: count + 1 }, (_, k) => {
    const t = k / count;
    const u = 1 - t;
    return {
      x: u * u * u * p1.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p2.x,
      y: u * u * u * p1.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p2.y,
    };
  });
}
