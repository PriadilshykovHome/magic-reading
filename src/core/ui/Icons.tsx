// Small line icons (the UI is icon-driven: he can't read labels yet).
const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/** Back to his next door on the map: a door with a little locator star. */
export const MyDoorIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
    <path d="M7 21v-8.5a5 5 0 0 1 10 0V21M5 21h14" />
    <path d="M12 1.8l1.1 2.3 2.5.4-1.8 1.7.4 2.5L12 7.5l-2.2 1.2.4-2.5-1.8-1.7 2.5-.4z" fill="currentColor" stroke="none" />
  </svg>
);

/** The magic door: "home" everywhere in the game. */
export const DoorIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
    <path d="M6 21V10.5a6 6 0 0 1 12 0V21M3.5 21h17M12 4.5V21" />
    <circle cx="10" cy="14" r=".9" fill="currentColor" stroke="none" />
    <circle cx="14" cy="14" r=".9" fill="currentColor" stroke="none" />
  </svg>
);

export const SpeakerIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
    <path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" stroke="none" />
    <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);

export const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
  </svg>
);

export const AgainIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5" />
  </svg>
);

export const CheckIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...common} strokeWidth={2.6}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const BackIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const CastleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
    <path d="M4 21V9h3v2h2V9h2v2h2V9h2v2h2V9h3v12zM10 21v-4a2 2 0 0 1 4 0v4M12 9V3l4 1.5L12 6" />
  </svg>
);

export const LockIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
    <rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" fillOpacity=".25" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"
      fill={filled ? 'url(#star-gold)' : 'none'}
      stroke={filled ? '#f6e2a0' : 'rgb(240 214 138 / 0.45)'}
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id="star-gold" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff3cc" />
        <stop offset=".5" stopColor="#f0d68a" />
        <stop offset="1" stopColor="#c9a24a" />
      </linearGradient>
    </defs>
  </svg>
);

export const FullscreenIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
    <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
  </svg>
);

export const BookIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
    <path d="M12 7l1 2 2 .3-1.5 1.4.4 2.1L12 11.8l-1.9 1 .4-2.1L9 9.3l2-.3z" fill="currentColor" stroke="none" />
  </svg>
);

/** «Це жарт!»: a winking face, for "the picture doesn't match". */
export const JokeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
    <circle cx="12" cy="12" r="9" />
    <path d="M7.6 10.2c.7-.6 1.7-.6 2.4 0" />
    <circle cx="15.5" cy="10" r="1.1" fill="currentColor" stroke="none" />
    <path d="M7.8 14.2c2.4 3.2 6 3.2 8.4 0" />
    <path d="M12.6 16.4c.2 1.6 2.3 1.8 2.8.2" fill="currentColor" stroke="none" />
  </svg>
);

/** The daily warm-up: a little cauldron with rising bubbles. */
export const CauldronIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
    <path d="M4 11h16M5 11c0 5 3 8.5 7 8.5s7-3.5 7-8.5M7.5 19.5L6.5 21M16.5 19.5l1 1.5" />
    <circle cx="9.5" cy="6.5" r="1.3" />
    <circle cx="13.5" cy="4" r="1" />
    <circle cx="14.5" cy="7.8" r=".8" />
  </svg>
);

/** The cloud copy's state: a cloud with a tick, arrows (sending), or a slash (no cloud / offline). */
export const CloudIcon = ({ state }: { state: 'synced' | 'syncing' | 'offline' | 'off' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
    <path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4.5 4.5 0 0 1-.5 9z" />
    {state === 'synced' && <path d="M9.5 13.5l2 2 3.5-3.5" />}
    {state === 'syncing' && <path d="M12 11v5M9.8 13.2L12 11l2.2 2.2" />}
    {(state === 'offline' || state === 'off') && <path d="M4 4l16 16" />}
  </svg>
);
