import { useState } from 'react';
import { useNavigate } from 'react-router';
import { unlockAudio } from '../audio/voice';
import { Kharkiv } from '../fx/ambient/Kharkiv';
import { Scene, type CandleSpot } from '../fx/ambient/Scene';
import { PropLayer } from '../fx/props/Props';
import { useProps } from '../fx/props/useProps';
import { t } from '../strings';
import { FullscreenIcon } from '../ui/Icons';
import { DoorArt } from './DoorArt';
import './Door.css';

const OPEN_MS = 700;

// Only along the sides: the central column belongs to the title and the door at every size.
// `wide` ones are hidden on phones (both orientations).
const CANDLES: CandleSpot[] = [
  { x: 6, y: 8, scale: 1 },
  { x: 14, y: 33, scale: 0.55 },
  { x: 87, y: 24, scale: 1.05 },
  { x: 3, y: 42, scale: 0.5 },
  { x: 12, y: 60, scale: 0.8 },
  { x: 92, y: 62, scale: 0.6 },
  { x: 22, y: 14, scale: 0.6, wide: true },
  { x: 25, y: 52, scale: 0.45, wide: true },
  { x: 78, y: 10, scale: 0.5, wide: true },
  { x: 80, y: 40, scale: 0.55, wide: true },
  { x: 18, y: 84, scale: 0.5, wide: true },
];

// The magic door: tapping it unlocks sound (iPhones need a tap first) and enters the castle.
// Phase 7 adds the login in between.
export function DoorScreen() {
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);
  const props = useProps('door');

  function enter() {
    if (opening) return;
    unlockAudio();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate('/map');
      return;
    }
    setOpening(true);
    window.setTimeout(() => navigate('/map'), OPEN_MS);
  }

  return (
    <main className={`screen door-screen ${opening ? 'is-opening' : ''}`}>
      <Scene candles={CANDLES} />
      <Kharkiv />
      <PropLayer ids={props} slots={['sky', 'moon', 'roofs', 'corner']} />

      <div className="door-layout">
        <div className="door-text">
          <h1 className="door-title">
            <span className="door-title-lead">{t.app.titleLead}</span>
            <span className="door-title-name">{t.child.genitive}</span>
          </h1>
          <svg className="door-flourish" viewBox="0 0 220 14" aria-hidden="true">
            <path d="M6 7h82M132 7h82" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <path d="M96 7l4-3 4 3-4 3zM116 7l4-3 4 3-4 3z" fill="currentColor" opacity=".6" />
            <path d="M110 1l2.2 4.3L116 7l-3.8 1.7L110 13l-2.2-4.3L104 7l3.8-1.7z" fill="currentColor" />
          </svg>
          <p className="door-hint" aria-hidden="true">
            {t.door.tapToEnter}
          </p>
        </div>

        <div className="door-stage">
          <span className="door-glow" aria-hidden="true" />
          <span className="door-ground-light" aria-hidden="true" />
          <button type="button" className="door" aria-label={t.door.doorLabel} onClick={enter}>
            <DoorArt />
          </button>
          <PropLayer ids={props} slots={['ground-left', 'ground-right']} />
        </div>
      </div>

      {canGoFullscreen() && (
        <button
          type="button"
          className="icon-button door-fullscreen"
          aria-label={t.map.fullscreen}
          onClick={() => void document.documentElement.requestFullscreen?.().catch(() => {})}
        >
          <FullscreenIcon />
        </button>
      )}

      <span className="door-flash" aria-hidden="true" />
      <p className="build-id">
        v{__APP_VERSION__} · {__BUILD_ID__}
      </p>
    </main>
  );
}

/** Installed apps already open full screen; elsewhere offer it where the browser supports it (not iPhone). */
function canGoFullscreen(): boolean {
  return document.fullscreenEnabled && !window.matchMedia('(display-mode: standalone)').matches && !document.fullscreenElement;
}
