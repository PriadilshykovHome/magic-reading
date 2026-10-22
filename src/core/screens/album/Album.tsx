import { game } from '@game';
import { useNavigate, useParams } from 'react-router';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import type { Progress } from '../../engine/progress';
import { isLevelUnlocked } from '../../engine/rewards';
import type { Card } from '../../engine/schema';
import { Scene, type CandleSpot } from '../../fx/ambient/Scene';
import { useProgress } from '../../store/progress';
import { fmt, t } from '../../strings';
import { HomeButton, MapButton, ScreenNav } from '../../ui/HomeButton';
import { Ornament } from '../../ui/Ornament';
import { PageNav } from '../../ui/PageNav';
import { useSwipe } from '../../ui/useSwipe';
import '../book/book.css';
import './album.css';

const CANDLES: CandleSpot[] = [
  { x: 4, y: 30, scale: 0.6 },
  { x: 95, y: 44, scale: 0.55 },
];

type AlbumPage = { kind: 'family' } | { kind: 'cards'; title: string; cards: Card[] };

/** The family first; then a page per world he has reached (its levels' cards); then the special ones. */
function albumPages(progress: Progress): AlbumPage[] {
  const { content } = game;
  const fromLevels = new Set<string>();
  const worlds: AlbumPage[] = content.worlds.flatMap(({ world, levels }) => {
    const ids = levels.flatMap((l) => (l.reward.card ? [l.reward.card] : []));
    ids.forEach((id) => fromLevels.add(id));
    const reached = levels[0] && isLevelUnlocked(progress, levels[0]);
    return reached && ids.length ? [{ kind: 'cards' as const, title: world.title, cards: ids.map((id) => content.cards.get(id)!) }] : [];
  });
  const special = [...content.cards.values()].filter((c) => !fromLevels.has(c.id));
  return [{ kind: 'family' }, ...worlds, ...(special.length ? [{ kind: 'cards' as const, title: t.album.special, cards: special }] : [])];
}

/**
 * «Колекція Мишка»: the family portraits (words he can read: МАМА, ТАТО, АЛІНА), then the cards,
 * a page per world. A card he has is shown with its name (tap: Соня says it); one still to find is
 * a dim silhouette.
 */
export function AlbumScreen() {
  const navigate = useNavigate();
  const progress = useProgress((s) => s.progress);
  const pages = albumPages(progress);
  const page = Math.min(Math.max(Number(useParams().page ?? 0) || 0, 0), pages.length - 1);
  const go = (to: number) => {
    if (to < 0 || to >= pages.length || to === page) return;
    sfx.flip();
    navigate(`/album/${to}`, { replace: true });
  };
  const swipe = useSwipe(() => go(page + 1), () => go(page - 1));
  const current = pages[page]!;

  return (
    <main className="screen book-screen album-screen" {...swipe}>
      <Scene candles={CANDLES} moon={false} />
      <ScreenNav>
        <HomeButton />
        <MapButton />
      </ScreenNav>

      <section className="book-page" aria-label={current.kind === 'family' ? t.album.family : current.title}>
        {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
          <Ornament key={c} corner={c} />
        ))}
        <h1 className="album-title">
          {page === 0 && <span className="book-title-lead">{fmt(t.album.title, { name: t.child.genitive })}</span>}
          <span className="album-page-title">{current.kind === 'family' ? t.album.family : current.title}</span>
        </h1>
        {current.kind === 'family' ? <Family progress={progress} /> : <Cards cards={current.cards} owned={progress.rewards.cards} />}
      </section>

      <PageNav page={page} pages={pages.length} onGo={go} />
    </main>
  );
}

/** Magic frames with the family's names, readable once he knows their letters. Recorded hellos
 *  from Mum and Dad come with the recording studio (Phase 8); until then Соня reads the name. */
function Family({ progress }: { progress: Progress }) {
  const portraits = game.portraits(progress);
  return (
    <div className="album-family" data-scroll-region>
      {portraits.length === 0 && <p className="book-empty">{t.album.familyLater}</p>}
      {portraits.map(({ item, line }) => {
        const { text, emoji } = game.item(item);
        return (
          <button
            key={item}
            type="button"
            className="album-portrait"
            aria-label={text}
            onClick={() => {
              sfx.tap();
              void (line ? voice.say(line, 'interrupt') : voice.item(item, 'interrupt'));
            }}
          >
            <span className="album-frame" aria-hidden="true">
              <span className="album-frame-face">{emoji}</span>
            </span>
            <span className="album-name parchment read-word">{text}</span>
          </button>
        );
      })}
    </div>
  );
}

function Cards({ cards, owned }: { cards: Card[]; owned: string[] }) {
  return (
    <div className="album-cards" data-scroll-region>
      {cards.map((card) =>
        owned.includes(card.id) ? (
          <button
            key={card.id}
            type="button"
            className="album-card"
            aria-label={card.name}
            onClick={() => {
              sfx.flip();
              void voice.text(card.name, 'interrupt');
            }}
          >
            <span className="album-card-emoji" aria-hidden="true">
              {card.emoji}
            </span>
            <span className="album-card-name">{card.name}</span>
          </button>
        ) : (
          <div key={card.id} className="album-card is-missing" role="img" aria-label={t.album.missing}>
            <span className="album-card-emoji" aria-hidden="true">
              {card.emoji}
            </span>
            <span className="album-card-name">?</span>
          </div>
        ),
      )}
    </div>
  );
}
