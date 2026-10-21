import type { CSSProperties } from 'react';
import { seededRandom } from '../../engine/rng';
import { Embers } from './Embers';
import './ambient.css';

// x / y are % of the screen; scale < 0.6 reads as far away. `wide` candles are hidden on phones.
export type CandleSpot = { x: number; y: number; scale: number; wide?: boolean };

type Star = { x: number; y: number; size: number; dur: number; delay: number; peak: number };

function makeStars(count: number): Star[] {
  const rnd = seededRandom(20261021);
  return Array.from({ length: count }, () => ({
    x: rnd() * 100,
    y: rnd() ** 1.5 * 100, // biased toward the top of the sky
    size: rnd() < 0.85 ? 1 + rnd() : 2 + rnd() * 0.8,
    dur: 3 + rnd() * 5,
    delay: -rnd() * 8,
    peak: 0.5 + rnd() * 0.5,
  }));
}

const STARS = makeStars(90);

/**
 * The shared night backdrop: sky, stars, moon, floating candles, mist, drifting embers and a
 * vignette. Everything here is quiet and slow; the screen's focal element gets the attention.
 */
export function Scene({
  candles = [],
  moon = true,
  quiet = false,
}: {
  candles?: CandleSpot[];
  moon?: boolean;
  /** During tasks: fewer embers and dimmer candles, so nothing competes with the reading card. */
  quiet?: boolean;
}) {
  return (
    <div className={`scene ${quiet ? 'is-quiet' : ''}`} aria-hidden="true">
      <div className="scene-sky" />
      <div className="scene-stars">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="star"
            style={
              {
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: s.size,
                height: s.size,
                animationDuration: `${s.dur}s`,
                animationDelay: `${s.delay}s`,
                '--peak': s.peak,
              } as CSSProperties
            }
          />
        ))}
        <span className="shooting-star" />
      </div>
      {moon && <Moon />}
      <div className="scene-mist scene-mist-back" />
      <div className="scene-candles">
        {candles.map((c, i) => (
          <Candle key={i} spot={c} index={i} />
        ))}
      </div>
      <div className="scene-mist scene-mist-front" />
      <Embers density={quiet ? 0.35 : 1} />
      <div className="scene-vignette" />
    </div>
  );
}

function Candle({ spot, index }: { spot: CandleSpot; index: number }) {
  const far = spot.scale < 0.6;
  const style = {
    '--x': `${spot.x}%`,
    '--y': `${spot.y}%`,
    '--s': spot.scale,
    '--o': far ? 0.6 : spot.scale < 0.9 ? 0.85 : 1,
    '--bob': `${(far ? 10 : 7) + (index % 4) * 0.8}s`,
    '--flick': `${1.4 + (index % 5) * 0.17}s`,
    '--delay': `${-index * 0.73}s`,
  } as CSSProperties;
  return (
    <div className={`candle ${spot.wide ? 'candle-wide' : ''}`} style={style}>
      <span className="candle-halo" />
      <span className="candle-flame" />
      <span className="candle-wick" />
      <span className="candle-wax" />
    </div>
  );
}

function Moon() {
  return (
    <div className="moon">
      <span className="moon-halo" />
      <svg viewBox="0 0 100 100">
        <defs>
          <mask id="moon-crescent">
            <rect width="100" height="100" fill="#fff" />
            <circle cx="64" cy="40" r="36" fill="#000" />
          </mask>
          <radialGradient id="moon-face" cx="35%" cy="60%" r="70%">
            <stop offset="0" stopColor="#fbf2d9" />
            <stop offset="1" stopColor="#d9c9a0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="40" fill="url(#moon-face)" mask="url(#moon-crescent)" />
      </svg>
    </div>
  );
}
