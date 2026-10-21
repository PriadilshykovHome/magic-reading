import { Link } from 'react-router';
import { Scene, type CandleSpot } from '../fx/ambient/Scene';
import { t } from '../strings';
import './Map.css';

const CANDLES: CandleSpot[] = [
  { x: 86, y: 10, scale: 0.9 },
  { x: 8, y: 22, scale: 0.55, wide: true },
  { x: 5, y: 66, scale: 0.6 },
  { x: 91, y: 72, scale: 0.75 },
  { x: 74, y: 86, scale: 0.5, wide: true },
];

// Placeholder castle map (Phase 1); it proves hash routing works on GitHub Pages.
export function MapScreen() {
  return (
    <main className="screen map-screen screen-arrive">
      <Scene candles={CANDLES} moon={false} />
      <Link to="/" className="icon-button map-back" aria-label={t.map.backToDoor}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <div className="parchment map-card">
        <h1 className="map-title">{t.names.world1}</h1>
        <p className="map-text">{t.map.comingSoon}</p>
      </div>
    </main>
  );
}
