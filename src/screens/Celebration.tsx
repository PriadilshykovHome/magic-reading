import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { sfx } from '../audio/sfx';
import { useMusic } from '../audio/useMusic';
import { voice } from '../audio/voice';
import { Iskryk } from '../characters/Iskryk';
import { content, levelPath } from '../content/load';
import type { CelebrationStep, LevelSummary } from '../engine/rewards';
import { Scene, type CandleSpot } from '../fx/ambient/Scene';
import { useGame } from '../store/game';
import { correctMark } from '../tasks/shared/helpers';
import { fmt, t } from '../strings';
import { AgainIcon, CastleIcon, StarIcon } from '../ui/Icons';
import { useLevel } from './useLevel';
import './Celebration.css';

const CANDLES: CandleSpot[] = [
  { x: 6, y: 10, scale: 1 },
  { x: 90, y: 22, scale: 0.8 },
  { x: 8, y: 70, scale: 0.6 },
  { x: 88, y: 78, scale: 0.7, wide: true },
];

/** How long each step holds before the next (the card waits for his tap). */
const STEP_MS: Record<CelebrationStep, number> = {
  stars: 2200,
  sparks: 1400,
  card: 1800,
  creature: 2600,
  firstThreeStars: 2600,
  weeklyCard: 2400,
};
const SKIPPABLE_AFTER_MS = 2000;

export function CelebrationScreen() {
  const level = useLevel();
  const result = useGame((s) => s.lastResult);
  if (!level || !result || result.summary.levelId !== level.id) return <Navigate to="/map" replace />;
  return <Celebration summary={result.summary} steps={result.steps} />;
}

export function Celebration({
  summary,
  steps,
  startFinished = false,
}: {
  summary: LevelSummary;
  steps: CelebrationStep[];
  /** Everything revealed at once (used by the layout checks). */
  startFinished?: boolean;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState(startFinished ? steps.length : 0);
  const [cardFlipped, setCardFlipped] = useState(startFinished);
  const [canSkip, setCanSkip] = useState(false);
  const finished = step >= steps.length;
  const current = steps[step];
  const shown = (s: CelebrationStep) => steps.indexOf(s) >= 0 && steps.indexOf(s) <= step;
  const card = summary.card ? content.cards.get(summary.card) : undefined;
  const weekly = summary.weeklyCard ? content.cards.get(summary.weeklyCard) : undefined;
  const started = useRef(false);
  useMusic(null); // the fanfare takes over

  // Opening fanfare, once.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    sfx.fanfare();
    void voice.say('celebration.levelDone');
    const timer = window.setTimeout(() => setCanSkip(true), SKIPPABLE_AFTER_MS);
    return () => {
      window.clearTimeout(timer);
      voice.stop();
    };
  }, []);

  // Each step: its sounds and lines, then on to the next (the card waits to be flipped).
  useEffect(() => {
    if (!current) return;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    if (current === 'stars') for (let i = 0; i < summary.stars; i++) later(400 + i * 550, () => sfx.star(i));
    if (current === 'creature' && summary.creature) {
      later(900, () => {
        sfx.golden();
        void voice.say(summary.creature!.from === 0 ? 'celebration.hatch' : 'celebration.grow');
      });
    }
    if (current === 'firstThreeStars') void voice.say('celebration.firstThreeStars');
    if (current === 'weeklyCard') {
      sfx.flip();
      void voice.say('celebration.weeklyCard');
    }
    if (current !== 'card' || cardFlipped) later(STEP_MS[current], () => setStep((s) => s + 1));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [current, cardFlipped, summary]);

  const flip = () => {
    if (cardFlipped) return;
    sfx.flip();
    setCardFlipped(true);
    void voice.say('celebration.newCard');
  };

  const skip = () => {
    if (!canSkip || finished) return;
    voice.stop();
    setCardFlipped(true);
    setStep(steps.length);
  };

  const confetti = useMemo(
    () => Array.from({ length: 36 }, (_, i) => ({ left: (i * 37) % 100, delay: (i % 12) * 0.18, dur: 2.6 + (i % 5) * 0.35 })),
    [],
  );

  return (
    <main className="screen celebration-screen" onClick={skip}>
      <Scene candles={CANDLES} />
      <span className="celebration-light" aria-hidden="true" />

      <div className="celebration-column">
        <div className="celebration-stars" role="img" aria-label={fmt(t.map.stars, { n: summary.stars })}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`celebration-star ${i < summary.stars ? 'is-earned' : ''}`}
              style={{ '--i': i } as CSSProperties}
            >
              <StarIcon filled={i < summary.stars} />
            </span>
          ))}
        </div>

        {shown('sparks') && (
          <p className="celebration-sparks" aria-label={fmt(t.map.sparks, { n: summary.sparks })}>
            <span className="celebration-spark-icon" aria-hidden="true">✦</span>
            {fmt(t.celebration.sparksEarned, { n: summary.sparks })}
          </p>
        )}

        <div className="celebration-rewards">
          {card && shown('card') && (
            <button
              type="button"
              className={`magic-card ${cardFlipped ? 'is-flipped' : ''}`}
              aria-label={cardFlipped ? fmt(t.celebration.newCard, { name: card.name }) : t.celebration.flipCard}
              onClick={(e) => {
                e.stopPropagation();
                flip();
              }}
              {...correctMark(!cardFlipped)}
            >
              <span className="magic-card-back" aria-hidden="true">✦</span>
              <span className="magic-card-front">
                <span className="magic-card-art">{card.emoji}</span>
                <span className="magic-card-name">{card.name}</span>
              </span>
            </button>
          )}

          {summary.creature && shown('creature') && (
            <div className="celebration-creature">
              <CreatureChange from={summary.creature.from} to={summary.creature.to} />
            </div>
          )}

          {weekly && shown('weeklyCard') && (
            <div className="magic-card is-flipped is-static">
              <span className="magic-card-front">
                <span className="magic-card-art">{weekly.emoji}</span>
                <span className="magic-card-name">{weekly.name}</span>
              </span>
            </div>
          )}
        </div>

        {finished && (
          <div className="celebration-actions">
            <button
              type="button"
              className="big-button is-ghost"
              aria-label={t.celebration.playAgain}
              onClick={() => navigate(`${levelPath(summary.levelId)}/play`, { replace: true })}
            >
              <AgainIcon />
            </button>
            <button type="button" className="big-button" aria-label={t.celebration.toMap} onClick={() => navigate('/map')} data-to-map>
              <CastleIcon />
            </button>
          </div>
        )}
      </div>

      {shown('firstThreeStars') && (
        <div className="confetti" aria-hidden="true">
          {confetti.map((c, i) => (
            <span key={i} style={{ left: `${c.left}%`, animationDelay: `${c.delay}s`, animationDuration: `${c.dur}s` }} />
          ))}
        </div>
      )}
    </main>
  );
}

function CreatureChange({ from, to }: { from: number; to: number }) {
  const [stage, setStage] = useState(from);
  useEffect(() => {
    const timer = window.setTimeout(() => setStage(to), 900);
    return () => window.clearTimeout(timer);
  }, [to]);
  return (
    <div className={`creature-change ${stage === to ? 'is-evolved' : 'is-wobbling'}`}>
      <Iskryk stage={stage} />
    </div>
  );
}
