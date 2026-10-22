import { useId } from 'react';
import './ambient.css';

// A friendly carved pumpkin lantern (autumn only), lit from inside.
export function Pumpkin({ className = '' }: { className?: string }) {
  const id = useId();
  const ref = (name: string) => `url(#${id}-${name})`;
  return (
    <div className={`pumpkin ${className}`} aria-hidden="true">
      <span className="pumpkin-glow" />
      <svg viewBox="0 0 120 100">
        <defs>
          <radialGradient id={`${id}-side`} cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#e08a3c" />
            <stop offset=".55" stopColor="#b2581c" />
            <stop offset="1" stopColor="#5e2a0c" />
          </radialGradient>
          <radialGradient id={`${id}-mid`} cx="45%" cy="35%" r="70%">
            <stop offset="0" stopColor="#f0a052" />
            <stop offset=".55" stopColor="#c86a26" />
            <stop offset="1" stopColor="#713612" />
          </radialGradient>
          <radialGradient id={`${id}-face`} cx="50%" cy="45%" r="60%">
            <stop offset="0" stopColor="#fff4c2" />
            <stop offset=".6" stopColor="#ffc85a" />
            <stop offset="1" stopColor="#f08a2a" />
          </radialGradient>
          <linearGradient id={`${id}-stem`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#3e2c14" />
            <stop offset=".5" stopColor="#7a6036" />
            <stop offset="1" stopColor="#3a2912" />
          </linearGradient>
          <filter id={`${id}-blur`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        <ellipse cx="60" cy="95" rx="44" ry="4.5" fill="#000" opacity=".4" />
        <ellipse cx="33" cy="61" rx="27" ry="31" fill={ref('side')} />
        <ellipse cx="87" cy="61" rx="27" ry="31" fill={ref('side')} />
        <ellipse cx="46" cy="60" rx="23" ry="34" fill={ref('mid')} />
        <ellipse cx="74" cy="60" rx="23" ry="34" fill={ref('mid')} />
        <ellipse cx="60" cy="59" rx="20" ry="35" fill={ref('mid')} />
        <path d="M40 30q-8 30 0 60M80 30q8 30 0 60M51 26q-4 33 0 66M69 26q4 33 0 66" fill="none" stroke="#5a2508" strokeOpacity=".35" strokeWidth="1.4" />
        <ellipse cx="51" cy="40" rx="5" ry="11" fill="#fff" opacity=".1" />

        <path d="M56 28q-2-10 4-18l5 2q-4 7-2 16z" fill={ref('stem')} />
        <path d="M64 14q10-8 17-1q4 5-2 8" fill="none" stroke="#6f7f3a" strokeWidth="2.2" strokeLinecap="round" />

        <g className="pumpkin-face">
          <g filter={ref('blur')} fill="#ffb347" opacity=".85">
            <path d="M39 54l8-10 8 10z" />
            <path d="M65 54l8-10 8 10z" />
            <path d="M40 65q20 16 40 0q-6 3-9 3l-2 4-3-3.5q-6 1.2-12 0l-3 3.5-2-4q-3 0-9-3z" />
          </g>
          <g fill={ref('face')} stroke="#7a3410" strokeWidth=".8" strokeLinejoin="round">
            <path d="M39 54l8-10 8 10z" />
            <path d="M65 54l8-10 8 10z" />
            <path d="M40 65q20 16 40 0q-6 3-9 3l-2 4-3-3.5q-6 1.2-12 0l-3 3.5-2-4q-3 0-9-3z" />
          </g>
        </g>
      </svg>
    </div>
  );
}
