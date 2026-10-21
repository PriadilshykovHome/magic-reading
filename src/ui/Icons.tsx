// Small line icons (the UI is icon-driven: he can't read labels yet).
const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const HomeIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
    <path d="M4 11l8-7 8 7M6 10v10h4v-6h4v6h4V10" />
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
