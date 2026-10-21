import { useEffect, useState, type CSSProperties } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { sfx } from '../audio/sfx';
import { useMusic } from '../audio/useMusic';
import { voice } from '../audio/voice';
import { Iskryk } from '../characters/Iskryk';
import { content, levelPath } from '../content/load';
import type { WorldContent } from '../engine/content';
import { creatureStage, sparkBalance, type Progress } from '../engine/progress';
import { isLevelUnlocked } from '../engine/rewards';
import { Scene, type CandleSpot } from '../fx/ambient/Scene';
import { useGame } from '../store/game';
import { useProgress } from '../store/progress';
import { fmt, t } from '../strings';
import { SparkJar } from '../ui/Candles';
import { BackIcon, LockIcon, StarIcon } from '../ui/Icons';
import './Map.css';

const CANDLES: CandleSpot[] = [
  { x: 4, y: 30, scale: 0.6 },
  { x: 93, y: 45, scale: 0.75 },
  { x: 6, y: 62, scale: 0.55, wide: true },
];

/**
 * Where each door sits, in % of the map. Portrait: zigzag up the tower, first door at the
 * bottom right (the jar and Іскрик live bottom left). Landscape: left to right in two rows.
 */
function spots(count: number) {
  const step = (span: number) => span / Math.max(1, count - 1);
  return Array.from({ length: count }, (_, i) => ({
    px: i % 2 === 0 ? 70 : 30,
    py: 76 - i * step(50),
    lx: 24 + i * step(62),
    ly: i % 2 === 0 ? 59 : 41,
  }));
}

function nextLevelToPlay(progress: Progress): string | undefined {
  return content.levelOrder.find((id) => isLevelUnlocked(progress, content.levels.get(id)!) && !progress.levels[id]?.bestStars);
}

/** The tower holding his next level (so after the last level of one tower he sees the next). */
function currentTower(progress: Progress): WorldContent {
  const worldId = (nextLevelToPlay(progress) ?? content.levelOrder.at(-1)!).split('/')[0];
  return content.worlds.find((w) => w.world.id === worldId) ?? content.worlds[0]!;
}

export function MapScreen() {
  const navigate = useNavigate();
  const { world: worldParam } = useParams();
  const progress = useProgress((s) => s.progress);
  const { greeted, setGreeted } = useGame();
  const [bounce, setBounce] = useState(0);
  const [shaking, setShaking] = useState<string | null>(null);
  useMusic('map');

  const tower = worldParam ? content.worlds.find((w) => w.world.id === worldParam) : currentTower(progress);
  const towerIndex = tower ? content.worlds.indexOf(tower) : -1;
  const levels = tower?.levels ?? [];
  const layout = spots(levels.length);
  const nextId = nextLevelToPlay(progress);

  useEffect(() => {
    if (greeted) return;
    setGreeted();
    const timer = window.setTimeout(() => void voice.say('greeting'), 600);
    return () => window.clearTimeout(timer);
  }, [greeted, setGreeted]);

  const open = (levelId: string, unlocked: boolean) => {
    if (!unlocked) {
      sfx.wrong();
      setShaking(levelId);
      window.setTimeout(() => setShaking(null), 400);
      return;
    }
    sfx.tap();
    navigate(levelPath(levelId));
  };

  // On a laptop, keys 1–9 open the doors of this tower.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const level = levels[Number(e.key) - 1];
      if (level) open(level.id, isLevelUnlocked(useProgress.getState().progress, level));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!tower) return <Navigate to="/map" replace />;

  const goTower = (offset: number) => {
    const target = content.worlds[towerIndex + offset];
    if (!target) return;
    sfx.whoosh();
    navigate(`/map/${target.world.id}`, { replace: true });
  };
  const path = (orientation: 'portrait' | 'landscape') =>
    layout.map((s) => (orientation === 'portrait' ? `L ${s.px} ${s.py}` : `L ${s.lx} ${s.ly}`)).join(' ');

  return (
    <main className="screen map-screen">
      <Scene candles={CANDLES} />

      <svg className="map-path is-portrait" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d={`M 70 100 ${path('portrait')} L 50 0`} />
      </svg>
      <svg className="map-path is-landscape" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d={`M 0 72 ${path('landscape')} L 100 30`} />
      </svg>

      <header className="map-bar">
        {towerIndex > 0 ? (
          <button type="button" className="icon-button" aria-label={t.map.prevWorld} onClick={() => goTower(-1)}>
            <BackIcon />
          </button>
        ) : (
          <span className="map-bar-gap" />
        )}
        <h1 className="map-title">{tower.world.title}</h1>
        {towerIndex < content.worlds.length - 1 ? (
          <button type="button" className="icon-button map-next" aria-label={t.map.nextWorld} onClick={() => goTower(1)} data-next-tower>
            <BackIcon />
          </button>
        ) : (
          <span className="map-bar-gap" />
        )}
      </header>

      {levels.map((level, i) => {
        const unlocked = isLevelUnlocked(progress, level);
        const best = progress.levels[level.id]?.bestStars ?? 0;
        const spot = layout[i]!;
        const state = !unlocked ? 'is-locked' : level.id === nextId ? 'is-next' : best > 0 ? 'is-done' : '';
        return (
          <button
            key={level.id}
            type="button"
            className={`map-node ${state} ${shaking === level.id ? 'is-shaking' : ''}`}
            style={{ '--px': `${spot.px}%`, '--py': `${spot.py}%`, '--lx': `${spot.lx}%`, '--ly': `${spot.ly}%` } as CSSProperties}
            aria-label={`${fmt(t.map.level, { n: i + 1 })}. ${unlocked ? fmt(t.map.stars, { n: best }) : t.map.locked}`}
            onClick={() => open(level.id, unlocked)}
            data-level={level.id}
          >
            <span className="map-door">
              <span className="map-door-number">{i + 1}</span>
              {!unlocked && (
                <span className="map-lock">
                  <LockIcon />
                </span>
              )}
            </span>
            <span className="map-stars">
              {[0, 1, 2].map((s) => (
                <StarIcon key={s} filled={s < best} />
              ))}
            </span>
          </button>
        );
      })}

      <div className="map-corner">
        <SparkJar count={sparkBalance(progress)} label={fmt(t.map.sparks, { n: sparkBalance(progress) })} />
        <button
          type="button"
          className="map-iskryk"
          aria-label={t.map.companion}
          onClick={() => {
            sfx.chirp();
            setBounce((b) => b + 1);
          }}
        >
          <Iskryk key={bounce} stage={creatureStage(progress, content.config)} mood={bounce ? 'dance' : 'idle'} />
        </button>
      </div>
    </main>
  );
}
