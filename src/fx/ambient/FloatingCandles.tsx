import type { CSSProperties } from 'react';
import './ambient.css';

// x / y are % of the screen; scale < 0.6 reads as far away (dimmer and slower).
export type CandleSpot = { x: number; y: number; scale: number };

export function FloatingCandles({ spots }: { spots: CandleSpot[] }) {
  return (
    <div className="candles" aria-hidden="true">
      <svg width="0" height="0" className="svg-defs">
        <defs>
          <radialGradient id="flame-outer" cx="50%" cy="70%" r="60%">
            <stop offset="0" stopColor="#fff6c8" />
            <stop offset=".45" stopColor="#ffc95a" />
            <stop offset="1" stopColor="#ff8a2a" />
          </radialGradient>
          <linearGradient id="wax" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#d9c9a6" />
            <stop offset=".35" stopColor="#fff8e8" />
            <stop offset="1" stopColor="#c7b38b" />
          </linearGradient>
        </defs>
      </svg>
      {spots.map((c, i) => {
        const far = c.scale < 0.6;
        return (
          <div
            key={i}
            className="candle"
            style={
              {
                left: `${c.x}%`,
                top: `${c.y}%`,
                '--s': c.scale,
                '--o': far ? 0.55 : c.scale < 0.9 ? 0.8 : 1,
                '--float': `${(far ? 9 : 6.5) + (i % 3) * 0.9}s`,
                '--delay': `${-i * 1.37}s`,
              } as CSSProperties
            }
          >
            <span className="candle-halo" />
            <svg viewBox="0 0 20 90">
              <g className="candle-flame">
                <path d="M10 1C14 8 16 12 16 16.5a6 6 0 0 1-12 0C4 12 6 8 10 1z" fill="url(#flame-outer)" />
                <path d="M10 9c2 3 3 5 3 7a3 3 0 0 1-6 0c0-2 1-4 3-7z" fill="#fffdf2" />
              </g>
              <path d="M10 19v5" stroke="#3a2a1a" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M4 26q0-2 2-2h8q2 0 2 2v62H4z" fill="url(#wax)" />
              <path d="M5 25h10v4q0 3-1.5 3T12 29v-1q0 5-1.8 5T8.5 28q0 3-1.6 3T5 28z" fill="#fffaf0" />
            </svg>
          </div>
        );
      })}
    </div>
  );
}
