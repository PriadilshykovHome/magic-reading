import { Link } from 'react-router';
import { FloatingCandles, type CandleSpot } from '../fx/ambient/FloatingCandles';
import { NightSky } from '../fx/ambient/NightSky';
import { t } from '../strings';
import './Map.css';

const CANDLES: CandleSpot[] = [
  { x: 88, y: 12, scale: 0.9 },
  { x: 6, y: 62, scale: 0.6 },
  { x: 90, y: 74, scale: 0.75 },
];

// Placeholder castle map (Phase 1); it proves hash routing works on GitHub Pages.
export function MapScreen() {
  return (
    <main className="screen map-screen screen-arrive">
      <NightSky moon={false} />
      <FloatingCandles spots={CANDLES} />
      <Link to="/" className="icon-button map-back" aria-label={t.map.backToDoor}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <div className="parchment map-card">
        <h1 className="map-title">{t.names.world1}</h1>
        <p className="map-text">{t.map.comingSoon}</p>
      </div>
    </main>
  );
}
