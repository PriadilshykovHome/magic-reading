import { useState } from 'react';
import { useNavigate } from 'react-router';
import { t } from '../strings';
import './Door.css';

const OPEN_MS = 600;

// Placeholder magic door (Phase 1). Later phases add the audio unlock, the owl's greeting and login.
export function DoorScreen() {
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);

  function enter() {
    if (opening) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      navigate('/map');
      return;
    }
    setOpening(true);
    window.setTimeout(() => navigate('/map'), OPEN_MS);
  }

  return (
    <main className="screen door-screen">
      <div className="sky" aria-hidden="true" />
      <h1 className="door-title">{t.app.title}</h1>

      <button
        type="button"
        className={`door ${opening ? 'is-opening' : ''}`}
        aria-label={t.door.doorLabel}
        onClick={enter}
      >
        <span className="door-glow" aria-hidden="true" />
        <svg className="door-art" viewBox="0 0 200 280" aria-hidden="true">
          <defs>
            <linearGradient id="door-light" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff6d6" />
              <stop offset="1" stopColor="#f4c86a" />
            </linearGradient>
            <linearGradient id="door-wood" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#7b57cc" />
              <stop offset="1" stopColor="#4a2f94" />
            </linearGradient>
          </defs>
          {/* light behind the door, revealed when it swings open */}
          <path d="M30 270V110a70 70 0 0 1 140 0v160z" fill="url(#door-light)" />
          <g className="door-leaf">
            <path d="M30 270V110a70 70 0 0 1 140 0v160z" fill="url(#door-wood)" />
            <path d="M52 250V118a48 48 0 0 1 96 0v132z" fill="none" stroke="#f4c86a" strokeOpacity=".55" strokeWidth="4" />
            <line x1="100" y1="72" x2="100" y2="250" stroke="#f4c86a" strokeOpacity=".35" strokeWidth="3" />
            <circle cx="132" cy="178" r="8" fill="#f4c86a" />
            <path d="M100 96l5 10 11 1.6-8 7.8 1.9 11-9.9-5.2-9.9 5.2 1.9-11-8-7.8 11-1.6z" fill="#f4c86a" />
          </g>
          <path d="M30 270V110a70 70 0 0 1 140 0v160" fill="none" stroke="#f4c86a" strokeWidth="8" strokeLinejoin="round" />
          <rect x="14" y="266" width="172" height="12" rx="6" fill="#f4c86a" />
        </svg>
      </button>

      <p className="door-hint" aria-hidden="true">
        <span className="door-hint-spark">✦</span> {t.door.tapToEnter} <span className="door-hint-spark">✦</span>
      </p>

      <p className="build-id">
        v{__APP_VERSION__} · {__BUILD_ID__}
      </p>
    </main>
  );
}
