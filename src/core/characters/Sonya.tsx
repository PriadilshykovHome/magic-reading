import './characters.css';

export type SonyaMood = 'idle' | 'happy' | 'shrug' | 'talk' | 'celebrate';

/**
 * Сова Соня: a small round purple owl with glasses and a tiny hat (never white). A layered SVG
 * whose parts Phase 6 animates properly; for now simple CSS moods.
 */
export function Sonya({ mood = 'idle', className = '' }: { mood?: SonyaMood; className?: string }) {
  return (
    <div className={`sonya sonya-${mood} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 120 132">
        <defs>
          <radialGradient id="sonya-body" cx="45%" cy="35%" r="70%">
            <stop offset="0" stopColor="#a38ad8" />
            <stop offset=".6" stopColor="#7a5cb8" />
            <stop offset="1" stopColor="#4d3488" />
          </radialGradient>
          <linearGradient id="sonya-hat" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3f8f88" />
            <stop offset="1" stopColor="#245a55" />
          </linearGradient>
        </defs>
        <g className="sonya-figure">
          <path d="M30 40q-6-14 2-22 6 10 14 14zM90 40q6-14-2-22-6 10-14 14z" fill="#5c4199" />
          <ellipse cx="60" cy="80" rx="42" ry="46" fill="url(#sonya-body)" />
          <g className="sonya-wing-l">
            <path d="M20 78q-6 22 10 38 6-16 2-34z" fill="#5c4199" />
          </g>
          <g className="sonya-wing-r">
            <path d="M100 78q6 22-10 38-6-16-2-34z" fill="#5c4199" />
          </g>
          <ellipse cx="60" cy="96" rx="25" ry="26" fill="#d9ccf0" opacity=".9" />
          <path d="M44 92q4 4 8 0M56 92q4 4 8 0M68 92q4 4 8 0M50 102q4 4 8 0M62 102q4 4 8 0" fill="none" stroke="#a892d4" strokeWidth="1.6" strokeLinecap="round" />
          <g className="sonya-eyes">
            <circle cx="44" cy="66" r="13" fill="#fffaf0" />
            <circle cx="76" cy="66" r="13" fill="#fffaf0" />
            <g className="sonya-pupils">
              <circle cx="46" cy="67" r="6" fill="#2b1d10" />
              <circle cx="78" cy="67" r="6" fill="#2b1d10" />
              <circle cx="48" cy="65" r="1.8" fill="#fff" />
              <circle cx="80" cy="65" r="1.8" fill="#fff" />
            </g>
          </g>
          <g fill="none" stroke="#c9a24a" strokeWidth="2.6">
            <circle cx="44" cy="66" r="15" />
            <circle cx="76" cy="66" r="15" />
            <path d="M59 64q1-2 2 0" />
          </g>
          <path d="M55 78l5 9 5-9z" fill="#f0b55a" />
          <path d="M48 124l-4 6M54 125v6M66 125v6M72 124l4 6" stroke="#f0b55a" strokeWidth="3" strokeLinecap="round" />
          <g className="sonya-hat">
            <path d="M44 36L66 4 74 36z" fill="url(#sonya-hat)" />
            <ellipse cx="59" cy="36" rx="19" ry="5" fill="#2d6b65" />
            <path d="M64 17l1.6 3.2 3.4.5-2.5 2.4.6 3.4-3.1-1.6-3.1 1.6.6-3.4-2.5-2.4 3.4-.5z" fill="#f0d68a" />
          </g>
        </g>
      </svg>
    </div>
  );
}
