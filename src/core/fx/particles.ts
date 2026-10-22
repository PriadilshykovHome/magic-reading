// Sparkles, fireworks and confetti on one full-screen canvas that never takes taps.
// tsParticles is loaded on first use, so it costs nothing on the first screen.
// Budget: about 150 particles alive on phones (more on bigger screens), halved on weak devices;
// none at all under reduced motion or the parent's "reduced effects" setting.
import type { ConfettiOptions } from '@tsparticles/confetti';
import { useProgress } from '../store/progress';
import { SILENT } from '../testMode';

type Fire = (options: ConfettiOptions) => Promise<unknown>;

const GOLD = ['#fff3cc', '#f0d68a', '#c9a24a', '#ffd36b'];
const FIREWORK_COLORS = [GOLD, ['#c9b6ff', '#9b7be0', '#f0d68a'], ['#9ee6de', '#5fb8af', '#f0d68a']];

let fire: Promise<Fire | null> | null = null;
let alive: { count: number; until: number }[] = [];

function layer(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.className = 'fx-layer';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '40' });
  document.body.append(canvas);
  return canvas;
}

function load(): Promise<Fire | null> {
  fire ??= import('@tsparticles/confetti')
    .then(({ confetti }) => confetti.create(layer(), { disableForReducedMotion: true }) as Promise<Fire>)
    .catch(() => null);
  return fire;
}

function effectsEnabled(): boolean {
  if (SILENT || typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return !useProgress.getState().progress.settings.reducedEffects;
}

function budget(): number {
  const phone = Math.min(window.innerWidth, window.innerHeight) < 600;
  const weak = (navigator.hardwareConcurrency || 4) <= 4;
  return (phone ? 150 : 300) * (weak ? 0.5 : 1);
}

/** Fires a burst, trimmed so the screen never holds more particles than the budget. */
function burst(options: ConfettiOptions, wanted: number, lifeMs: number) {
  if (!effectsEnabled()) return;
  const now = performance.now();
  alive = alive.filter((a) => a.until > now);
  const free = budget() - alive.reduce((n, a) => n + a.count, 0);
  const count = Math.min(wanted, Math.floor(free));
  if (count < 4) return;
  alive.push({ count, until: now + lifeMs });
  void load().then((f) => f?.({ ...options, particleCount: count }));
}

const pct = (x: number, y: number) => ({ x: (x / window.innerWidth) * 100, y: (y / window.innerHeight) * 100 });

export const particles = {
  /** Load the particle engine in idle time (a level is starting), so the first sparkle doesn't hitch. */
  prewarm() {
    if (!effectsEnabled()) return;
    const idle = window.requestIdleCallback ?? ((fn: () => void) => window.setTimeout(fn, 300));
    idle(() => void load());
  },
  /** A small burst of gold stars from where he tapped the right answer. */
  sparkle(x: number, y: number) {
    burst(
      { position: pct(x, y), spread: 360, startVelocity: 16, ticks: 55, gravity: 0.35, decay: 0.9, scalar: 0.75, shapes: ['star'], colors: GOLD, flat: true },
      18,
      1000,
    );
  },
  /** One firework burst (gold, violet or teal) at a point given in % of the screen. */
  firework(xPct: number, yPct: number, palette = 0) {
    burst(
      {
        position: { x: xPct, y: yPct },
        spread: 360,
        startVelocity: 26,
        ticks: 95,
        gravity: 0.55,
        decay: 0.92,
        scalar: 0.6,
        shapes: ['circle'],
        colors: FIREWORK_COLORS[palette % FIREWORK_COLORS.length]!,
      },
      55,
      1700,
    );
  },
  /** Golden confetti raining down from both sides (his first ever 3 stars). */
  confettiRain() {
    for (const [x, angle] of [
      [0, 60],
      [100, 120],
    ] as const) {
      burst(
        { position: { x, y: 65 }, angle, spread: 55, startVelocity: 45, ticks: 220, gravity: 0.8, decay: 0.94, scalar: 0.9, shapes: ['square', 'circle'], colors: GOLD },
        45,
        3600,
      );
    }
  },
  /** Sparkles along a sweep (the 3-in-a-row wand trail). */
  trail(points: { x: number; y: number }[]) {
    points.forEach((p, i) =>
      window.setTimeout(
        () => burst({ position: pct(p.x, p.y), spread: 120, angle: 200, startVelocity: 8, ticks: 45, gravity: 0.2, scalar: 0.55, shapes: ['star'], colors: GOLD, flat: true }, 8, 800),
        i * 70,
      ),
    );
  },
};
