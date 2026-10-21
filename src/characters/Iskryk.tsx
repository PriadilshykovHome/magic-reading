import { useId } from 'react';
import './characters.css';

export type IskrykMood = 'idle' | 'dance';

/**
 * Дракончик Іскрик: a warm amber dragon who grows with the sparks.
 * 0 egg → 1 hatchling (after Level 1) → 2 young dragon → 3 big dragon. Layered SVG: wings, tail,
 * head and eyes are separate groups so they can move on their own.
 */
export function Iskryk({
  stage,
  mood = 'idle',
  cracking = false,
  className = '',
}: {
  stage: number;
  mood?: IskrykMood;
  /** The egg shows its cracks (just before hatching). */
  cracking?: boolean;
  className?: string;
}) {
  const id = useId();
  const url = (name: string) => `url(#${id}-${name})`;
  const s = Math.min(Math.max(stage, 0), 3);
  return (
    <div className={`iskryk iskryk-stage-${s} iskryk-${mood} ${cracking ? 'is-cracking' : ''} ${className}`} aria-hidden="true">
      <span className="iskryk-glow" />
      <svg viewBox="0 0 120 120">
        <defs>
          <radialGradient id={`${id}-egg`} cx="40%" cy="30%" r="75%">
            <stop offset="0" stopColor="#fff9ea" />
            <stop offset=".55" stopColor="#ffe2ad" />
            <stop offset="1" stopColor="#e9ad5e" />
          </radialGradient>
          <radialGradient id={`${id}-body`} cx="40%" cy="30%" r="75%">
            <stop offset="0" stopColor="#ffc982" />
            <stop offset=".55" stopColor="#f08a33" />
            <stop offset="1" stopColor="#bd571a" />
          </radialGradient>
          <linearGradient id={`${id}-wing`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e2763a" />
            <stop offset="1" stopColor="#a8481c" />
          </linearGradient>
          <linearGradient id={`${id}-flame`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#ff8a2a" />
            <stop offset=".6" stopColor="#ffd36b" />
            <stop offset="1" stopColor="#fff6d6" />
          </linearGradient>
        </defs>
        <ellipse cx="60" cy="108" rx={s === 0 ? 24 : 30} ry="5" fill="#000" opacity=".3" />
        {s === 0 ? <Egg url={url} /> : s === 1 ? <Hatchling url={url} /> : <Dragon url={url} big={s === 3} />}
      </svg>
    </div>
  );
}

type Url = (name: string) => string;

function Egg({ url }: { url: Url }) {
  return (
    <g className="isk-egg">
      <path d="M60 18C84 18 92 58 90 76c-2 20-14 30-30 30S32 96 30 76C28 58 36 18 60 18z" fill={url('egg')} />
      <path d="M32 72l7-6 7 6 7-6 7 6 7-6 7 6 7-6 7 6" fill="none" stroke="#e39a44" strokeWidth="2.4" strokeLinejoin="round" opacity=".8" />
      <g fill="#ef9a43" opacity=".75">
        <circle cx="48" cy="48" r="3.2" />
        <circle cx="71" cy="38" r="2.4" />
        <circle cx="68" cy="58" r="3.6" />
        <circle cx="45" cy="88" r="2.6" />
        <circle cx="74" cy="90" r="2.2" />
        <circle cx="58" cy="97" r="1.8" />
      </g>
      <ellipse cx="47" cy="40" rx="5.5" ry="11" fill="#fff" opacity=".45" transform="rotate(-18 47 40)" />
      <g className="isk-cracks" fill="none" stroke="#6b4320" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 20l-4 12 7 8-6 10 5 7" pathLength="1" />
        <path d="M88 56l-9 5 5 7-7 4" pathLength="1" />
        <path d="M33 62l8 3-4 7 7 3" pathLength="1" />
      </g>
    </g>
  );
}

function Face({ y = 0 }: { y?: number }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <g className="isk-eyes">
        <ellipse cx="50" cy="56" rx="6.5" ry="7.5" fill="#fffaf0" />
        <ellipse cx="70" cy="56" rx="6.5" ry="7.5" fill="#fffaf0" />
        <g className="isk-pupils">
          <circle cx="51" cy="57.5" r="4" fill="#2b1d10" />
          <circle cx="71" cy="57.5" r="4" fill="#2b1d10" />
          <circle cx="52.6" cy="55.6" r="1.4" fill="#fff" />
          <circle cx="72.6" cy="55.6" r="1.4" fill="#fff" />
        </g>
      </g>
      <ellipse cx="42" cy="66" rx="4.5" ry="2.6" fill="#ff8f7d" opacity=".55" />
      <ellipse cx="78" cy="66" rx="4.5" ry="2.6" fill="#ff8f7d" opacity=".55" />
      <circle cx="57" cy="64" r="1.1" fill="#7a3510" />
      <circle cx="63" cy="64" r="1.1" fill="#7a3510" />
      <path d="M53 69q7 6 14 0" fill="none" stroke="#7a3510" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Hatchling({ url }: { url: Url }) {
  return (
    <g className="isk-body">
      <g className="isk-head">
        <path d="M60 30q-7-8 0-17 2 7 6 8-1 7-6 9z" fill={url('flame')} className="isk-flame" />
        <ellipse cx="60" cy="62" rx="28" ry="26" fill={url('body')} />
        <path d="M44 42l-4-11 10 7zM76 42l4-11-10 7z" fill="#ffd796" />
        <Face />
      </g>
      <ellipse cx="42" cy="84" rx="6" ry="4.5" fill="#e98536" />
      <ellipse cx="78" cy="84" rx="6" ry="4.5" fill="#e98536" />
      <path
        d="M28 80l8-10 8 8 8-10 8 9 8-10 8 9 8-9 6 8v12q-32 22-64 0z"
        fill={url('egg')}
        stroke="#d99a4f"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </g>
  );
}

function Dragon({ url, big }: { url: Url; big: boolean }) {
  const wing = big ? 1.4 : 1;
  return (
    // CSS animations replace a group's transform attribute, so the size lives on a wrapper.
    <g transform={big ? 'translate(-8 -10) scale(1.13)' : undefined}>
    <g className="isk-body">
      <g className="isk-tail">
        <path d="M74 94q26 6 30-14 2-9-5-13" fill="none" stroke={url('body')} strokeWidth="8" strokeLinecap="round" />
        <path d="M99 59l2.4 4.8 5.3.8-3.9 3.7.9 5.3-4.7-2.5-4.7 2.5.9-5.3-3.8-3.7 5.2-.8z" fill="#ffd36b" className="isk-spark" />
      </g>
      <g className="isk-wing isk-wing-l">
        <path d="M46 72q-26-18-30-38 14 7 18 2 6 11 14 13z" fill={url('wing')} transform={`translate(46 72) scale(${wing}) translate(-46 -72)`} />
      </g>
      <g className="isk-wing isk-wing-r">
        <path d="M74 72q26-18 30-38-14 7-18 2-6 11-14 13z" fill={url('wing')} transform={`translate(74 72) scale(${wing}) translate(-74 -72)`} />
      </g>
      {big && <path d="M60 60l4 6-4 4-4-4zM60 70l3.5 5-3.5 3.5-3.5-3.5z" fill="#ffd796" />}
      <ellipse cx="60" cy="82" rx="22" ry="23" fill={url('body')} />
      <ellipse cx="60" cy="87" rx="13" ry="15" fill="#ffe6b0" />
      <path d="M50 82h20M49 89h22M51 96h18" stroke="#f0b866" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="45" cy="84" rx="5" ry="4" fill="#e98536" />
      <ellipse cx="75" cy="84" rx="5" ry="4" fill="#e98536" />
      <ellipse cx="50" cy="104" rx="7.5" ry="4.2" fill="#d9772c" />
      <ellipse cx="70" cy="104" rx="7.5" ry="4.2" fill="#d9772c" />
      <g className="isk-head">
        <path d="M60 24q-6-8 0-16 2 7 6 8-1 6-6 8z" fill={url('flame')} className="isk-flame" />
        {big ? (
          <path d="M45 34q-8-10-4-20 4 8 11 12zM75 34q8-10 4-20-4 8-11 12z" fill="#ffe0a0" />
        ) : (
          <path d="M46 34l-4-9 9 5zM74 34l4-9-9 5z" fill="#ffd796" />
        )}
        <circle cx="60" cy="48" r="22" fill={url('body')} />
        <ellipse cx="60" cy="60" rx="13" ry="8" fill="#ffcf8a" />
        <Face y={-6} />
      </g>
    </g>
    </g>
  );
}
