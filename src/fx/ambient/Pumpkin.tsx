import './ambient.css';

// A friendly carved pumpkin lantern (autumn only). Its glow flickers like the candles.
export function Pumpkin({ className = '' }: { className?: string }) {
  return (
    <div className={`pumpkin ${className}`} aria-hidden="true">
      <span className="pumpkin-glow" />
      <svg viewBox="0 0 120 96">
        <ellipse cx="38" cy="60" rx="30" ry="31" fill="#b85a1c" />
        <ellipse cx="82" cy="60" rx="30" ry="31" fill="#b85a1c" />
        <ellipse cx="60" cy="59" rx="31" ry="34" fill="#e3822e" />
        <path d="M45 28q-9 31 0 64M75 28q9 31 0 64" fill="none" stroke="#a84f17" strokeOpacity=".55" strokeWidth="2" />
        <path d="M57 27q-1-10 6-17l4 3q-5 6-4 14z" fill="#5c4527" />
        <path d="M65 13q9-7 16 0" fill="none" stroke="#7d9a45" strokeWidth="3" strokeLinecap="round" />
        <g className="pumpkin-face">
          <path d="M37 55q8-10 16 0q-8-4-16 0z" />
          <path d="M67 55q8-10 16 0q-8-4-16 0z" />
          <path d="M40 67q20 17 40 0q-4 1-7 1l-2 4-3-3q-8 2-16 0l-3 3-2-4q-3 0-7-1z" />
        </g>
      </svg>
    </div>
  );
}
