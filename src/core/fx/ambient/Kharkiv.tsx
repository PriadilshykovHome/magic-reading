import { useEffect, useRef, useState } from 'react';
import { unlockAudio, voice } from '../../audio/voice';
import { t } from '../../strings';

// Kharkiv on the horizon, low and quiet under the door: the Annunciation Cathedral's bell tower,
// rooftops and Держпром, with the park's Ferris wheel turning slowly. The wheel is a tiny
// Easter egg: tap it and Соня tells him it's his city, and the windows light up.

type Win = [x: number, y: number, on: boolean];

// Держпром (viewBox 0 0 120 90): three stepped blocks joined by bridges, a mast on the tallest.
const DERZHPROM = 'M0 90V42h18V28h22V14h4V0h1v14h4v14h22v14h18v48zM18 50h4v-4h-4zM36 38h11v-4H36zM68 38h10v-4H68zM96 50h4v-4h-4z';
const DERZHPROM_WINDOWS: Win[] = [];
for (const [x, top, cols] of [[2, 42, 3], [20, 28, 3], [43, 14, 4], [76, 28, 3], [96, 42, 3]] as const) {
  for (let y = top + 6; y < 86; y += 7) for (let c = 0; c < cols; c++) DERZHPROM_WINDOWS.push([x + 2 + c * 5, y, (x + y + c) % 11 === 0]);
}

// The Annunciation Cathedral (viewBox 0 0 70 90): domes and the tall bell tower with its spire.
const CATHEDRAL = 'M0 90V62h4a8 8 0 0 1 16 0h4v28zM26 90V40h3V26h2V16a4 4 0 0 1 2-3.5V0h1v12.5a4 4 0 0 1 2 3.5v10h2v14h3v50zM44 90V68h3a6 6 0 0 1 12 0h3v22z';
const CATHEDRAL_WINDOWS: Win[] = [[9, 72, true], [14, 78, false], [32, 48, false], [33, 60, true], [50, 76, false]];

const LIT_MS = 9000;

export function Kharkiv() {
  const [lit, setLit] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const egg = () => {
    unlockAudio();
    void voice.say('eggs.kharkiv', 'interrupt');
    setLit(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLit(false), LIT_MS);
  };

  return (
    <div className={`kharkiv ${lit ? 'is-lit' : ''}`}>
      <svg className="kharkiv-roofs" aria-hidden="true">
        <defs>
          <pattern id="kharkiv-roofs" width="150" height="40" patternUnits="userSpaceOnUse">
            <path d="M0 40V26l10-6 10 6v-4h14l8-6 8 6v6h12V18l6-4 6 4v8h10v-6h16l6 4v6h12V22l9-6 9 6v18z" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#kharkiv-roofs)" />
      </svg>
      <Landmark className="kharkiv-cathedral" box="0 0 70 90" path={CATHEDRAL} windows={CATHEDRAL_WINDOWS} />
      <Landmark className="kharkiv-derzhprom" box="0 0 120 90" path={DERZHPROM} windows={DERZHPROM_WINDOWS} />

      <button type="button" className="kharkiv-wheel" aria-label={t.door.wheel} onClick={egg}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path className="kharkiv-wheel-legs" d="M50 50L30 98M50 50l20 48M26 98h48" />
          <g className="kharkiv-wheel-turn">
            <circle cx="50" cy="50" r="38" />
            <circle cx="50" cy="50" r="31" />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const [x, y] = [50 + Math.cos(a) * 38, 50 + Math.sin(a) * 38];
              return (
                <g key={i}>
                  <line x1="50" y1="50" x2={x} y2={y} />
                  <circle className="kharkiv-cabin" cx={x} cy={y} r="3.4" />
                </g>
              );
            })}
            <circle className="kharkiv-hub" cx="50" cy="50" r="4" />
          </g>
        </svg>
      </button>
    </div>
  );
}

function Landmark({ className, box, path, windows }: { className: string; box: string; path: string; windows: Win[] }) {
  return (
    <svg className={`kharkiv-landmark ${className}`} viewBox={box} aria-hidden="true">
      <path d={path} fillRule="evenodd" />
      <g className="kharkiv-windows">
        {windows.map(([x, y, on], i) => (
          <rect key={i} x={x} y={y} width={2.2} height={3} rx={0.6} className={on ? 'is-on' : undefined} />
        ))}
      </g>
    </svg>
  );
}
