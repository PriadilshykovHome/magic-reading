import { useEffect, useRef, useState } from 'react';
import { sfx } from '../../audio/sfx';
import { t } from '../../strings';
import { Pumpkin } from '../ambient/Pumpkin';
import { PROPS, type PropSlot } from './pick';
import './props.css';

// The small ambient details: drawn here, chosen by pick.ts (dates and chances in content/config.json).
// Each is quiet and stays at the edges; the owl's flight is off under reduced motion.

const slotsOf = (id: string): readonly PropSlot[] => PROPS.find((p) => p.id === id)?.slots ?? [];
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Renders the chosen props that sit in `slots` (the door's ground props live beside the door). */
export function PropLayer({ ids, slots }: { ids: readonly string[]; slots: readonly PropSlot[] }) {
  return (
    <>
      {ids
        .filter((id) => slotsOf(id).some((s) => slots.includes(s)))
        .map((id) => {
          const Prop = DRAWINGS[id];
          return Prop ? <Prop key={id} /> : null;
        })}
    </>
  );
}

const DRAWINGS: Record<string, () => React.ReactNode> = {
  pumpkins: () => (
    <>
      <Pumpkin className="pumpkin-left" />
      <Pumpkin className="pumpkin-right" />
    </>
  ),
  mykolai: MykolaiGift,
  carolStar: CarolStar,
  stork: Stork,
  kalyna: Kalyna,
  sleepyOwl: SleepyOwl,
  owlMoon: () => (reduced() ? null : <OwlMoon />),
};

/** St Nicholas Day: a small present left by the door. */
function MykolaiGift() {
  return (
    <svg className="prop prop-gift" viewBox="0 0 60 56" aria-hidden="true">
      <defs>
        <linearGradient id="gift-box" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7b3434" />
          <stop offset="1" stopColor="#4a1d22" />
        </linearGradient>
      </defs>
      <rect x="6" y="22" width="48" height="32" rx="3" fill="url(#gift-box)" />
      <rect x="3" y="15" width="54" height="10" rx="2.5" fill="#8a3c3a" />
      <rect x="26" y="15" width="8" height="39" fill="#c9a24a" />
      <path d="M30 15c-6-10-17-10-15-3 1 4 9 4 15 3zm0 0c6-10 17-10 15-3-1 4-9 4-15 3z" fill="none" stroke="#e0bf6a" strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="30" cy="54" rx="28" ry="2.5" fill="rgb(0 0 0 / 0.35)" />
    </svg>
  );
}

/** Christmas to Vodokhreshche: the carollers' eight-pointed star by the moon. */
function CarolStar() {
  const ray = 'M50 8l7 30-7 4-7-4z';
  return (
    <div className="prop prop-carol-star" aria-hidden="true">
      <span className="prop-carol-glow" />
      <svg viewBox="0 0 100 100">
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={ray} fill={i % 2 ? '#c9a24a' : '#f0d68a'} transform={`rotate(${i * 45} 50 50)`} />
        ))}
        <circle cx="50" cy="50" r="12" fill="#fff3cc" />
        <circle cx="50" cy="50" r="6" fill="#c9a24a" />
      </svg>
    </div>
  );
}

/** Spring: a stork in its nest on a chimney over the rooftops. */
function Stork() {
  return (
    <svg className="prop prop-stork" viewBox="0 0 60 60" aria-hidden="true">
      <rect x="22" y="44" width="16" height="16" fill="#1d1727" />
      <path d="M10 46c6-6 34-6 40 0-6 4-34 4-40 0z" fill="#4a3826" />
      <path d="M12 45l36-2M14 47l32 1" stroke="#6b5236" strokeWidth="1.2" />
      {/* the stork: white body, black wing tips, a long red beak */}
      <path d="M24 42c-2-10 4-16 10-15 2-8 3-14 1-18 3 0 5 3 5 6l-2 12c3 4 3 10-2 15z" fill="#d9d0c0" />
      <path d="M24 42c4-2 10-2 12 0l-6-10z" fill="#2a2230" />
      <path d="M40 15l12 3-12 0z" fill="#b5513f" />
      <circle cx="39.5" cy="12.5" r="0.9" fill="#1d1727" />
    </svg>
  );
}

/** Autumn: a sprig of калина by the door. */
function Kalyna() {
  const berries: [number, number][] = [
    [30, 30], [36, 28], [33, 35], [40, 34], [27, 36], [37, 40], [44, 38], [31, 41], [42, 44], [35, 46],
  ];
  return (
    <svg className="prop prop-kalyna" viewBox="0 0 80 60" aria-hidden="true">
      <path d="M2 56C20 50 30 40 36 28M36 28c8-8 20-12 34-12" stroke="#4a3220" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M56 17c4-8 14-10 20-6-4 7-12 10-20 6zM50 20c-2-9 3-16 10-17 1 8-3 14-10 17z" fill="#4f5a32" />
      <path d="M14 52c-2-8 2-14 9-16 1 8-2 13-9 16z" fill="#5a6338" />
      {berries.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4.2" fill="#8e2a2a" />
          <circle cx={x - 1.3} cy={y - 1.4} r="1.2" fill="#d97a6a" opacity="0.8" />
        </g>
      ))}
    </svg>
  );
}

/** A sleepy owl in the corner (brown, not Соня): tap it and it opens its eyes and hoots. */
function SleepyOwl() {
  const [awake, setAwake] = useState(false);
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      className={`prop prop-sleepy-owl ${awake ? 'is-awake' : ''}`}
      aria-label={t.door.owl}
      onClick={() => {
        sfx.hoot();
        setAwake(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setAwake(false), 1600);
      }}
    >
      <svg viewBox="0 0 80 80" aria-hidden="true">
        <defs>
          <radialGradient id="owl-body" cx="45%" cy="35%" r="70%">
            <stop offset="0" stopColor="#8a6a4c" />
            <stop offset="1" stopColor="#4a3424" />
          </radialGradient>
        </defs>
        <path d="M8 76h64" stroke="#3a2a1c" strokeWidth="4" strokeLinecap="round" />
        <path d="M22 74c-8-14-8-36 4-48l-2-12 9 8c5-2 9-2 14 0l9-8-2 12c12 12 12 34 4 48z" fill="url(#owl-body)" />
        <ellipse cx="40" cy="56" rx="12" ry="14" fill="#a88a66" opacity="0.55" />
        <path d="M34 54l3 3m3-5l3 3m-9 5l3 3m3-4l3 3" stroke="#6b5038" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="31" cy="36" r="8" fill="#c9b08a" />
        <circle cx="49" cy="36" r="8" fill="#c9b08a" />
        <g className="owl-sleeping">
          <path d="M26 37q5 4 10 0M44 37q5 4 10 0" stroke="#3a2a1c" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
        <g className="owl-awake">
          <circle cx="31" cy="36" r="4.4" fill="#f0c86a" />
          <circle cx="49" cy="36" r="4.4" fill="#f0c86a" />
          <circle cx="31" cy="36" r="2.2" fill="#1d1410" />
          <circle cx="49" cy="36" r="2.2" fill="#1d1410" />
        </g>
        <path d="M40 41l-3 4h6z" fill="#c9a24a" />
      </svg>
    </button>
  );
}

/** Now and then an owl glides across the moon. */
function OwlMoon() {
  return (
    <div className="prop prop-owl-moon" aria-hidden="true">
      <svg viewBox="0 0 40 20">
        <path className="owl-wings" d="M20 9c-4-6-11-8-19-5 6 1 10 4 12 8 2-1 5-2 7-3zm0 0c4-6 11-8 19-5-6 1-10 4-12 8-2-1-5-2-7-3z" />
        <ellipse cx="20" cy="11" rx="3.4" ry="4.2" />
      </svg>
    </div>
  );
}
