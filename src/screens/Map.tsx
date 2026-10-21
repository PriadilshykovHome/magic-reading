import { Link } from 'react-router';
import { t } from '../strings';
import './Map.css';

// Placeholder castle map (Phase 1); it proves hash routing works on GitHub Pages.
export function MapScreen() {
  return (
    <main className="screen map-screen">
      <div className="sky" aria-hidden="true" />
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
