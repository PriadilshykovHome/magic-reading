import { useState } from 'react';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { fmt, t } from '../../strings';

// Seven windows: three on the keep, two on each tower.
const WINDOWS = [
  { x: 25, y: 31 },
  { x: 32, y: 31 },
  { x: 28.5, y: 40 },
  { x: 9, y: 26 },
  { x: 9, y: 36 },
  { x: 48, y: 26 },
  { x: 48, y: 36 },
];

/**
 * The castle on the map's shelf: one window lights for each day he plays this week, and the
 * seventh brings the weekly card. After 19:00 the lit ones glow warmer. Some days a cat sits on
 * the battlements (a prop chosen like the others); tap it and it giggles.
 */
export function CastleWindows({ lit, evening, cat }: { lit: number; evening: boolean; cat: boolean }) {
  const [catHere, setCatHere] = useState(cat);
  return (
    <button
      type="button"
      className={`journey-castle ${evening ? 'is-evening' : ''}`}
      aria-label={fmt(t.map.windows, { n: lit, total: WINDOWS.length })}
      onClick={() => {
        if (catHere) {
          sfx.pop();
          void voice.say('eggs.cat', 'interrupt');
          setCatHere(false);
        } else {
          sfx.sparkle();
          void voice.say('castle.windows', 'interrupt');
        }
      }}
      data-castle={lit}
    >
      <svg viewBox="0 0 57 52" aria-hidden="true">
        <path
          d="M4 50V22l5-6 5 6v28zM43 50V22l5-6 5 6v28zM14 50V24h4v-4h3v4h3v-4h3v4h3v-4h3v4h4v-4h3v4h4v26z"
          fill="rgb(42 32 56)"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M25 50v-6a3.5 3.5 0 0 1 7 0v6" fill="rgb(14 11 20)" stroke="currentColor" strokeWidth="1.2" />
        {WINDOWS.map((w, i) => (
          <rect key={i} className={`castle-window ${i < lit ? 'is-lit' : ''}`} x={w.x - 1.8} y={w.y - 2.6} width="3.6" height="5.2" rx="1.8" />
        ))}
        {catHere && (
          <g className="castle-cat" transform="translate(38 20.5) scale(2.4)">
            <path d="M-2.4 0v-2.8l1.1 1.1h2.6l1.1-1.1V0z" fill="#d9c9a0" />
            <circle cx="-0.85" cy="-1" r=".38" fill="#2b1d10" />
            <circle cx="0.85" cy="-1" r=".38" fill="#2b1d10" />
            <path d="M2.4-0.4q1.8-0.4 1.6-2.2" fill="none" stroke="#d9c9a0" strokeWidth=".6" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </button>
  );
}
