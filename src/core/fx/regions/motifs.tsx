// Silhouettes for the journey road's scenery (src/core/fx/regions/looks.ts lists which look uses
// which). Quiet, low-contrast shapes; only the candle-lit windows breathe.

const stone = { a: '#2b2335', b: '#18131f' };

export function Tower() {
  return (
    <svg viewBox="0 0 120 320" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="look-stone" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={stone.b} />
          <stop offset=".55" stopColor={stone.a} />
          <stop offset="1" stopColor={stone.b} />
        </linearGradient>
      </defs>
      <path d="M22 320V92h-8V62h14v12h12V62h14v12h12V62h14v12h12V62h14v30h-8v228z" fill="url(#look-stone)" />
      <path d="M14 62h92" stroke="rgb(240 214 138 / .12)" strokeWidth="1.5" />
      <path className="look-window" d="M52 150a8 8 0 0 1 16 0v22H52z" fill="#f0c674" />
      <path className="look-window is-slow" d="M40 230a7 7 0 0 1 14 0v18H40zM66 250a7 7 0 0 1 14 0v18H66z" fill="#e8b45e" />
    </svg>
  );
}

export function Spire() {
  return (
    <svg viewBox="0 0 90 300" preserveAspectRatio="xMidYMax meet">
      <path d="M45 6L66 96H58v204H32V96H24z" fill={stone.a} />
      <path d="M45 6L66 96H24z" fill={stone.b} />
      <circle className="look-window" cx="45" cy="140" r="6" fill="#f0c674" />
    </svg>
  );
}

export function ScrollTower() {
  return (
    <svg viewBox="0 0 130 320" preserveAspectRatio="xMidYMax meet">
      <path d="M26 320V100L65 46l39 54v220z" fill={stone.a} />
      <path d="M26 100L65 46l39 54z" fill={stone.b} />
      {/* a hanging scroll with lines of "writing" */}
      <path d="M48 128h34v74l-17-8-17 8z" fill="#d8c79c" opacity=".55" />
      <path d="M54 142h22M54 152h18M54 162h22M54 172h14" stroke="#4a3a28" strokeWidth="2" opacity=".55" />
      <path className="look-window is-slow" d="M56 236a9 9 0 0 1 18 0v26H56z" fill="#f0c674" />
    </svg>
  );
}

export function Books() {
  return (
    <svg viewBox="0 0 120 90" preserveAspectRatio="xMidYMax meet">
      <path d="M10 90V40h14v50zM26 90V28h12v62zM40 90V46h16v44zM58 90V34h10v56zM70 90l10-52 12 2-10 50z" fill={stone.a} />
      <path d="M10 46h14M26 36h12M40 54h16M58 42h10" stroke="rgb(240 214 138 / .25)" strokeWidth="2" />
    </svg>
  );
}

export function Sunflowers() {
  const flower = (x: number, y: number, s: number) => (
    <g key={`${x}-${y}`} transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0v80" stroke="#3a4a2a" strokeWidth="3" />
      <path d="M0 40c-12-6-18-2-22 4 8 2 14 2 22-4zM0 56c12-6 18-2 22 4-8 2-14 2-22-4z" fill="#3a4a2a" />
      <g fill="#c9a24a" opacity=".8">
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse key={i} cx="0" cy="-13" rx="4" ry="9" transform={`rotate(${i * 30})`} />
        ))}
      </g>
      <circle r="8" fill="#4a3018" />
    </g>
  );
  return (
    <svg viewBox="0 0 140 190" preserveAspectRatio="xMidYMax meet">
      {flower(40, 70, 1.1)}
      {flower(92, 96, 0.9)}
      {flower(120, 120, 0.7)}
      <path d="M0 190c20-34 50-46 70-42s40 18 70 42z" fill="#1f2a1a" />
    </svg>
  );
}

export function Hills() {
  return (
    <svg viewBox="0 0 200 90" preserveAspectRatio="xMidYMax meet">
      <path d="M0 90c30-50 60-62 90-44s50 10 70-8 30-8 40 6v46z" fill={stone.a} />
    </svg>
  );
}

export function Observatory() {
  return (
    <svg viewBox="0 0 130 260" preserveAspectRatio="xMidYMax meet">
      <path d="M30 260V110h70v150z" fill={stone.a} />
      {/* the dome, open along a slit, and the telescope peeking out */}
      <path d="M22 112a43 43 0 0 1 86 0z" fill={stone.b} />
      <path d="M62 70l6-1 4 42h-12z" fill="#120e18" />
      <path d="M58 86l34-30 6 6-34 30z" fill="#3a3046" />
      <path d="M22 112h86" stroke="rgb(240 214 138 / .14)" strokeWidth="1.5" />
      <path className="look-window" d="M56 170a9 9 0 0 1 18 0v26H56z" fill="#f0c674" />
    </svg>
  );
}

export function Planets() {
  return (
    <svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMax meet">
      <circle cx="60" cy="60" r="22" fill={stone.a} />
      <ellipse cx="60" cy="62" rx="44" ry="9" fill="none" stroke="rgb(216 199 156 / .35)" strokeWidth="2.5" transform="rotate(-14 60 62)" />
      <circle cx="18" cy="26" r="6" fill={stone.a} />
      <circle cx="104" cy="98" r="4" fill="rgb(240 214 138 / .35)" />
    </svg>
  );
}

export function Cauldron() {
  return (
    <svg viewBox="0 0 130 120" preserveAspectRatio="xMidYMax meet">
      <path d="M20 54h90c0 30-18 50-45 50S20 84 20 54z" fill={stone.a} />
      <path d="M14 50h102v8H14z" fill={stone.b} />
      <path d="M36 104l-8 16M94 104l8 16" stroke={stone.b} strokeWidth="5" strokeLinecap="round" />
      {/* steam, and the warm glow of what's cooking */}
      <path d="M50 40c-6-10 6-14 0-26M70 42c-6-10 6-14 0-26M88 40c-6-10 6-14 0-26" stroke="rgb(216 199 156 / .22)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse className="look-window" cx="65" cy="54" rx="40" ry="4" fill="#e8b45e" />
    </svg>
  );
}

export function Shelf() {
  return (
    <svg viewBox="0 0 120 150" preserveAspectRatio="xMidYMax meet">
      <path d="M8 60h104v6H8zM8 120h104v6H8z" fill={stone.b} />
      <path d="M18 60V34h14v26zM40 60V24a8 8 0 0 1 16 0v36zM64 60V38h12v22zM84 60V30h18v30z" fill={stone.a} />
      <path d="M16 120V96h20v24zM44 120v-34h14v34zM66 120V92a9 9 0 0 1 18 0v28zM92 120v-20h14v20z" fill={stone.a} />
      <path className="look-window is-slow" d="M70 104h10v10H70z" fill="#f0c674" />
    </svg>
  );
}
