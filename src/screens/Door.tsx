import { useState } from 'react';
import { useNavigate } from 'react-router';
import { currentSeason } from '../fx/currentSeason';
import { FloatingCandles, type CandleSpot } from '../fx/ambient/FloatingCandles';
import { NightSky } from '../fx/ambient/NightSky';
import { Pumpkin } from '../fx/ambient/Pumpkin';
import { t } from '../strings';
import './Door.css';

const OPEN_MS = 650;

// Kept to the screen edges so they never crowd the title or the door.
const CANDLES: CandleSpot[] = [
  { x: 7, y: 10, scale: 1 },
  { x: 27, y: 3, scale: 0.5 },
  { x: 60, y: 6, scale: 0.55 },
  { x: 92, y: 25, scale: 0.8 },
  { x: 4, y: 46, scale: 0.65 },
  { x: 91, y: 52, scale: 1.05 },
  { x: 11, y: 79, scale: 0.5 },
  { x: 86, y: 83, scale: 0.7 },
];

const DUST = [26, 41, 57, 72, 84];

// Placeholder magic door (Phase 1 + art direction preview). Later phases add the audio unlock,
// the owl's spoken greeting and login.
export function DoorScreen() {
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);
  const [season] = useState(currentSeason);

  function enter() {
    if (opening) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate('/map');
      return;
    }
    setOpening(true);
    window.setTimeout(() => navigate('/map'), OPEN_MS);
  }

  return (
    <main className={`screen door-screen ${opening ? 'is-opening' : ''}`}>
      <NightSky />
      <FloatingCandles spots={CANDLES} />

      <div className="door-layout">
        <div className="door-text">
          <h1 className="door-title">
            <span className="door-title-lead">{t.app.titleLead}</span>
            <span className="door-title-name">{t.child.genitive}</span>
          </h1>
          <svg className="door-flourish" viewBox="0 0 200 16" aria-hidden="true">
            <path d="M8 8h70M122 8h70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M100 1l2.4 4.6L107 8l-4.6 2.4L100 15l-2.4-4.6L93 8l4.6-2.4z" fill="currentColor" />
          </svg>
          <p className="door-hint" aria-hidden="true">
            <span className="door-hint-spark">✦</span>
            {t.door.tapToEnter}
            <span className="door-hint-spark">✦</span>
          </p>
        </div>

        <div className="door-stage">
          <span className="door-glow" aria-hidden="true" />
          <span className="door-ground-light" aria-hidden="true" />
          <button type="button" className="door" aria-label={t.door.doorLabel} onClick={enter}>
            <DoorArt />
          </button>
          <div className="door-dust" aria-hidden="true">
            {DUST.map((x, i) => (
              <span key={x} style={{ left: `${x}%`, animationDelay: `${-i * 1.15}s` }} />
            ))}
          </div>
          {season === 'autumn' && (
            <>
              <Pumpkin className="pumpkin-left" />
              <Pumpkin className="pumpkin-right" />
            </>
          )}
        </div>
      </div>

      <span className="door-flash" aria-hidden="true" />
      <p className="build-id">
        v{__APP_VERSION__} · {__BUILD_ID__}
      </p>
    </main>
  );
}

function DoorArt() {
  const spokes = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
  return (
    <svg className="door-art" viewBox="0 0 200 290" aria-hidden="true">
      <defs>
        <linearGradient id="door-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="1" stopColor="#ffd98a" />
        </linearGradient>
        <linearGradient id="door-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6d4cc0" />
          <stop offset=".6" stopColor="#4a3096" />
          <stop offset="1" stopColor="#36216f" />
        </linearGradient>
        <radialGradient id="door-window" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff7d8" />
          <stop offset=".7" stopColor="#ffd27a" />
          <stop offset="1" stopColor="#e9a94a" />
        </radialGradient>
      </defs>

      {/* stone arch */}
      <path d="M14 272V108a86 86 0 0 1 172 0v164z" fill="#251e4d" />
      <path
        d="M14 272V108a86 86 0 0 1 172 0v164M28 108l-14 0M37 66l-12-7M66 34l-7-12M100 22V8M134 34l7-12M163 66l12-7M172 108h14"
        fill="none"
        stroke="#3a3071"
        strokeWidth="2"
      />

      {/* light behind the door, revealed as it opens */}
      <path d="M30 270V110a70 70 0 0 1 140 0v160z" fill="url(#door-light)" />

      <g className="door-leaf">
        <path d="M30 270V110a70 70 0 0 1 140 0v160z" fill="url(#door-wood)" />
        <path d="M65 52v218M100 40v230M135 52v218" stroke="#000" strokeOpacity=".14" strokeWidth="2" />
        <path d="M48 254V146h104v108z" fill="none" stroke="#f4c86a" strokeOpacity=".45" strokeWidth="2.5" />
        <circle cx="100" cy="104" r="23" fill="url(#door-window)" />
        <g stroke="#b98a3a" strokeWidth="2" strokeLinecap="round">
          {spokes.map((a) => (
            <line key={a} x1="100" y1="104" x2={100 + Math.cos(a) * 23} y2={104 + Math.sin(a) * 23} />
          ))}
        </g>
        <circle cx="100" cy="104" r="23" fill="none" stroke="#f4c86a" strokeWidth="3.5" />
        <circle cx="100" cy="104" r="5" fill="#f4c86a" />
        <circle cx="140" cy="200" r="7" fill="#f4c86a" />
        <circle cx="138" cy="198" r="2.2" fill="#fff4cf" />
      </g>

      <path d="M30 270V110a70 70 0 0 1 140 0v160" fill="none" stroke="#f4c86a" strokeWidth="6" strokeLinejoin="round" />
      {/* warm light leaking under the door */}
      <rect x="32" y="266" width="136" height="3" rx="1.5" fill="#fff1c1" />
      <rect x="18" y="270" width="164" height="9" rx="3" fill="#3b3170" />
      <rect x="4" y="279" width="192" height="10" rx="4" fill="#2c2459" />
    </svg>
  );
}
