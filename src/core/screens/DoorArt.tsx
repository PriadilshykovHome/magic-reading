// The magic door: dark walnut, antique gold, warm light through the round window and under the
// door. The leaf (`.door-leaf`) swings open when he taps.
export function DoorArt() {
  const spokes = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
  return (
    <svg className="door-art" viewBox="0 0 200 290" aria-hidden="true">
      <defs>
        <linearGradient id="door-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2f4a" />
          <stop offset="1" stopColor="#211a2c" />
        </linearGradient>
        <linearGradient id="door-wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2e1b0e" />
          <stop offset=".3" stopColor="#553620" />
          <stop offset=".5" stopColor="#664328" />
          <stop offset=".72" stopColor="#4f321d" />
          <stop offset="1" stopColor="#2b190c" />
        </linearGradient>
        <linearGradient id="door-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e2a0" />
          <stop offset=".5" stopColor="#c9a24a" />
          <stop offset="1" stopColor="#8a6526" />
        </linearGradient>
        <linearGradient id="door-gold-h" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0d68a" />
          <stop offset=".55" stopColor="#b58d3c" />
          <stop offset="1" stopColor="#6e4f18" />
        </linearGradient>
        <radialGradient id="door-window" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff6dc" />
          <stop offset=".55" stopColor="#ffd98a" />
          <stop offset="1" stopColor="#d98f3a" />
        </radialGradient>
        <linearGradient id="door-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="1" stopColor="#ffd98a" />
        </linearGradient>
        <radialGradient id="door-shade" cx="50%" cy="55%" r="65%">
          <stop offset=".55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".5" />
        </radialGradient>
      </defs>

      {/* stone arch with faint joints */}
      <path d="M12 274V106a88 88 0 0 1 176 0v168z" fill="url(#door-stone)" />
      <path
        d="M26 108H12M34.2 70l-8.7-5M62 42.2l-5-8.7M138 42.2l5-8.7M165.8 70l8.7-5M174 108h14M12 160h14M174 160h14M12 216h14M174 216h14"
        stroke="#000"
        strokeOpacity=".3"
        strokeWidth="1.5"
      />
      <path d="M26 272V110a74 74 0 0 1 148 0v162z" fill="#0f0b14" />

      {/* light behind the door, revealed as it opens */}
      <path d="M30 270V110a70 70 0 0 1 140 0v160z" fill="url(#door-light)" />

      <g className="door-leaf">
        <path d="M30 270V110a70 70 0 0 1 140 0v160z" fill="url(#door-wood)" />
        <path d="M58 52v218M86 41v229M114 41v229M142 52v218" stroke="#000" strokeOpacity=".38" strokeWidth="1.5" />
        <path d="M59.5 52v218M87.5 41v229M115.5 41v229M143.5 52v218" stroke="#ffdcaa" strokeOpacity=".06" strokeWidth="1" />
        <path
          d="M44 90q3 40-1 80t2 90M72 60q-3 50 1 100t-2 100M100 50q3 60-1 110t1 100M128 60q-2 50 1 100t-1 100M156 90q-3 40 1 80t-2 90"
          fill="none"
          stroke="#ffd2a0"
          strokeOpacity=".07"
          strokeWidth="1"
        />

        {/* gold straps with rivets */}
        <rect x="30" y="152" width="140" height="7" fill="url(#door-gold-h)" />
        <rect x="30" y="232" width="140" height="7" fill="url(#door-gold-h)" />
        <g fill="#5a3f12">
          {[44, 72, 100, 128, 156].map((x) => (
            <g key={x}>
              <circle cx={x} cy="155.5" r="1.4" />
              <circle cx={x} cy="235.5" r="1.4" />
            </g>
          ))}
        </g>

        {/* round window */}
        <circle cx="100" cy="106" r="25" fill="url(#door-window)" />
        <g stroke="#8a6526" strokeWidth="1.6" strokeLinecap="round">
          {spokes.map((a) => (
            <line key={a} x1="100" y1="106" x2={100 + Math.cos(a) * 25} y2={106 + Math.sin(a) * 25} />
          ))}
        </g>
        <circle cx="100" cy="106" r="9" fill="none" stroke="#8a6526" strokeWidth="1.6" />
        <circle cx="100" cy="106" r="25" fill="none" stroke="url(#door-gold)" strokeWidth="4.5" />

        {/* ring knocker */}
        <circle cx="140" cy="186" r="3.2" fill="url(#door-gold)" />
        <circle cx="140" cy="198" r="9.5" fill="none" stroke="url(#door-gold)" strokeWidth="2.8" />

        <path d="M30 270V110a70 70 0 0 1 140 0v160z" fill="url(#door-shade)" />
      </g>

      <path d="M30 270V110a70 70 0 0 1 140 0v160" fill="none" stroke="url(#door-gold)" strokeWidth="5" strokeLinejoin="round" />
      <path d="M100 22l3.2 6.3L110 31l-6.8 2.7L100 40l-3.2-6.3L90 31l6.8-2.7z" fill="url(#door-gold)" />

      {/* warm light leaking under the door, then two stone steps */}
      <rect x="32" y="266.5" width="136" height="2.5" rx="1.25" fill="#ffe9b0" />
      <rect x="18" y="271" width="164" height="8" rx="2" fill="#2c2340" />
      <rect x="18" y="271" width="164" height="1.2" fill="#f0d68a" opacity=".18" />
      <rect x="6" y="279" width="188" height="10" rx="3" fill="#1d1729" />
    </svg>
  );
}
