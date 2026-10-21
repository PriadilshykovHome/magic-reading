import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { sfx } from '../audio/sfx';
import { voice } from '../audio/voice';
import { Iskryk } from '../characters/Iskryk';
import { content, levelPath } from '../content/load';
import { creatureStage, sparkBalance } from '../engine/progress';
import { isLevelUnlocked } from '../engine/rewards';
import { Scene, type CandleSpot } from '../fx/ambient/Scene';
import { useGame } from '../store/game';
import { useProgress } from '../store/progress';
import { fmt, t } from '../strings';
import { SparkJar } from '../ui/Candles';
import { FullscreenIcon, LockIcon, StarIcon } from '../ui/Icons';
import './Map.css';

const CANDLES: CandleSpot[] = [
  { x: 6, y: 9, scale: 0.9 },
  { x: 90, y: 14, scale: 0.6 },
  { x: 4, y: 48, scale: 0.55, wide: true },
  { x: 92, y: 56, scale: 0.75 },
];

// Where each level door sits, in % of the map: portrait winds upward, landscape left to right.
const SPOTS = [
  { px: 28, py: 72, lx: 24, ly: 50 },
  { px: 70, py: 50, lx: 50, ly: 40 },
  { px: 32, py: 25, lx: 80, ly: 62 },
];

export function MapScreen() {
  const navigate = useNavigate();
  const progress = useProgress((s) => s.progress);
  const { greeted, setGreeted } = useGame();
  const [bounce, setBounce] = useState(0);
  const [shaking, setShaking] = useState<string | null>(null);

  useEffect(() => {
    if (greeted) return;
    setGreeted();
    const timer = window.setTimeout(() => void voice.say('greeting'), 600);
    return () => window.clearTimeout(timer);
  }, [greeted, setGreeted]);

  const levels = content.levelOrder.map((id) => content.levels.get(id)!);

  const nextId = levels.find((l) => isLevelUnlocked(progress, l) && !progress.levels[l.id]?.bestStars)?.id;

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

  // On a laptop, keys 1, 2, 3 open the level doors.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const level = levels[Number(e.key) - 1];
      if (level) open(level.id, isLevelUnlocked(useProgress.getState().progress, level));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <main className="screen map-screen">
      <Scene candles={CANDLES} />

      <svg className="map-path is-portrait" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M28 96 C 10 86, 20 76, 28 72 S 80 62, 70 50 S 20 38, 32 25 S 60 8, 52 0" />
      </svg>
      <svg className="map-path is-landscape" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 74 C 10 64, 16 54, 24 50 S 40 38, 50 40 S 70 66, 80 62 S 96 40, 100 30" />
      </svg>

      {levels.map((level, i) => {
        const unlocked = isLevelUnlocked(progress, level);
        const best = progress.levels[level.id]?.bestStars ?? 0;
        const spot = SPOTS[i] ?? SPOTS[SPOTS.length - 1]!;
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

      {canGoFullscreen() && (
        <button
          type="button"
          className="icon-button map-fullscreen"
          aria-label={t.map.fullscreen}
          onClick={() => void document.documentElement.requestFullscreen?.().catch(() => {})}
        >
          <FullscreenIcon />
        </button>
      )}

      <div className="map-corner">
        <SparkJar count={sparkBalance(progress)} label={fmt(t.map.sparks, { n: sparkBalance(progress) })} />
        <button
          type="button"
          className="map-iskryk"
          aria-label={t.map.companion}
          onClick={() => {
            sfx.tap();
            setBounce((b) => b + 1);
          }}
        >
          <Iskryk key={bounce} stage={creatureStage(progress, content.config)} className={bounce ? 'is-bouncing' : ''} />
        </button>
      </div>
    </main>
  );
}

/** Installed apps already open full screen; elsewhere offer it where the browser supports it (not iPhone). */
function canGoFullscreen(): boolean {
  return document.fullscreenEnabled && !window.matchMedia('(display-mode: standalone)').matches && !document.fullscreenElement;
}
