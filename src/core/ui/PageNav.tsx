import { useEffect } from 'react';
import { t } from '../strings';

const Arrow = ({ back }: { back?: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={back ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
  </svg>
);

/** Page turning for the Book of Spells and the album: two arrows, the page number, ← → keys. */
export function PageNav({ page, pages, onGo }: { page: number; pages: number; onGo(page: number): void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onGo(page + 1);
      if (e.key === 'ArrowLeft') onGo(page - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page, onGo]);

  return (
    <nav className="page-nav">
      <button type="button" className="icon-button" aria-label={t.book.prev} disabled={page === 0} onClick={() => onGo(page - 1)} data-prev>
        <Arrow back />
      </button>
      <span className="page-nav-count" aria-hidden="true">
        {page + 1} / {pages}
      </span>
      <button type="button" className="icon-button" aria-label={t.book.next} disabled={page >= pages - 1} onClick={() => onGo(page + 1)} data-next>
        <Arrow />
      </button>
    </nav>
  );
}
