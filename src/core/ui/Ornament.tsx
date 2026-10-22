/**
 * A Petrykivka-style corner flourish for the Book of Spells and the album: a curling stem with
 * brush-stroke leaves and three калина berries, in antique gold and a muted red. Decorative only.
 */
export function Ornament({ corner }: { corner: 'tl' | 'tr' | 'bl' | 'br' }) {
  return (
    <svg className={`ornament ornament-${corner}`} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M4 60C8 34 22 14 52 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 40c-8-2-10-9-8-14 7 1 10 7 8 14z" fill="currentColor" opacity=".75" />
      <path d="M24 26c-5-6-3-13 2-16 4 6 3 12-2 16z" fill="currentColor" opacity=".75" />
      <path d="M36 16c2-7 9-10 14-8-2 6-8 9-14 8z" fill="currentColor" opacity=".75" />
      <path d="M22 44c6 1 10 6 9 11-6 0-10-5-9-11z" fill="currentColor" opacity=".55" />
      <g className="ornament-berries">
        <circle cx="54" cy="14" r="3.2" />
        <circle cx="58" cy="20" r="2.6" />
        <circle cx="50" cy="20" r="2.4" />
      </g>
    </svg>
  );
}
