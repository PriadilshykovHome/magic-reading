import { game } from '@game';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { Sonya } from '../../characters/Sonya';
import { isMastered } from '../../engine/progress';
import { Scene, type CandleSpot } from '../../fx/ambient/Scene';
import { useProgress } from '../../store/progress';
import { fmt, t } from '../../strings';
import { HomeButton, MapButton, ScreenNav } from '../../ui/HomeButton';
import { Ornament } from '../../ui/Ornament';
import { useTaps } from '../../ui/useTaps';
import { Constellation } from './Constellation';
import { PageNav } from '../../ui/PageNav';
import { useSwipe } from '../../ui/useSwipe';
import './book.css';

const CANDLES: CandleSpot[] = [
  { x: 4, y: 30, scale: 0.6 },
  { x: 95, y: 44, scale: 0.55 },
];

/**
 * Книга Чар: the cover (his name in gold, the letters he has learned as constellations, and Соня,
 * who turns very formal when tapped three times), then a page per letter. A page lights up when
 * he has mastered it; tapping any page has Соня read it.
 */
export function BookScreen() {
  const navigate = useNavigate();
  const progress = useProgress((s) => s.progress);
  const chapters = game.book(progress);
  const page = Math.min(Math.max(Number(useParams().page ?? 0) || 0, 0), chapters.length);
  const go = (to: number) => {
    if (to < 0 || to > chapters.length || to === page) return;
    sfx.flip();
    navigate(`/book/${to}`, { replace: true });
  };
  const swipe = useSwipe(() => go(page + 1), () => go(page - 1));

  return (
    <main className="screen book-screen" {...swipe}>
      <Scene candles={CANDLES} moon={false} />
      <ScreenNav>
        <HomeButton />
        <MapButton />
      </ScreenNav>

      <section className="book-page" aria-label={page === 0 ? t.names.collection : fmt(t.book.chapter, { title: chapters[page - 1]!.title })}>
        {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
          <Ornament key={c} corner={c} />
        ))}
        {page === 0 ? <Cover titles={chapters.map((c) => c.title)} onOpen={(i) => go(i + 1)} /> : <Chapter {...chapters[page - 1]!} />}
      </section>

      <PageNav page={page} pages={chapters.length + 1} onGo={go} />
    </main>
  );
}

function Cover({ titles, onOpen }: { titles: string[]; onOpen(index: number): void }) {
  const [bowing, setBowing] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // Three quick taps: «Шановний Михайле …, прошу до читання!» (his patronymic from the private profile).
  const tap = useTaps(3, () => {
    setBowing(true);
    void voice.say('eggs.formal', 'interrupt');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBowing(false), 2600);
  });

  return (
    <div className="book-cover">
      <h1 className="book-title">
        <span className="book-title-lead">{t.names.collection}</span>
        <span className="book-title-name">{t.child.name}</span>
      </h1>
      <div className="book-sky" data-scroll-region>
        <p className="book-sky-title">{t.book.sky}</p>
        {titles.length === 0 ? (
          <p className="book-empty">{t.book.empty}</p>
        ) : (
          <div className="book-constellations">
            {titles.map((title, i) => (
              <button
                key={title}
                type="button"
                className="book-constellation"
                aria-label={fmt(t.book.chapter, { title })}
                onClick={() => onOpen(i)}
                data-chapter={i + 1}
              >
                <Constellation text={title} />
              </button>
            ))}
          </div>
        )}
      </div>
      <button type="button" className={`book-sonya ${bowing ? 'is-bowing' : ''}`} aria-label={t.names.mascot} onClick={tap} data-sonya>
        <Sonya mood={bowing ? 'happy' : 'idle'} />
      </button>
    </div>
  );
}

function Chapter({ title, items }: { title: string; items: string[] }) {
  const progress = useProgress((s) => s.progress);
  const { config } = game.content;
  const mastered = items.filter((id) => isMastered(progress.items[id], config)).length;
  return (
    <div className="book-chapter">
      <header className="book-chapter-head">
        <span className="book-letter parchment read-syllable">{title}</span>
        <span className="book-count" aria-label={fmt(t.book.mastered, { n: mastered, total: items.length })}>
          ✦ {mastered} / {items.length}
        </span>
      </header>
      <div className="book-items" data-scroll-region>
        {items.map((id) => {
          const { text, emoji } = game.item(id);
          const lit = isMastered(progress.items[id], config);
          return (
            <button
              key={id}
              type="button"
              className={`book-item parchment ${lit ? 'is-mastered' : ''}`}
              aria-label={text}
              onClick={() => {
                sfx.tap();
                void voice.item(id, 'interrupt');
              }}
            >
              {emoji && <span className="book-item-emoji" aria-hidden="true">{emoji}</span>}
              <span className={`read-${game.engine.kindOf(id) ?? 'word'}`}>{text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
