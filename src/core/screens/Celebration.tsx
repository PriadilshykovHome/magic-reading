import { AnimatePresence, m, useAnimate } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { sfx } from '../audio/sfx';
import { useMusic } from '../audio/useMusic';
import { voice } from '../audio/voice';
import { Iskryk } from '../characters/Iskryk';
import { Sonya, type SonyaMood } from '../characters/Sonya';
import { game } from '@game';
import { creatureStage, sparkBalance } from '../engine/progress';
import type { CelebrationStep, LevelSummary } from '../engine/rewards';
import { Scene, type CandleSpot } from '../fx/ambient/Scene';
import { particles } from '../fx/particles';
import { SparkFlights, type Flight } from '../fx/SparkFlight';
import { useGame } from '../store/game';
import { useProgress } from '../store/progress';
import { fmt, t } from '../strings';
import { correctMark } from '../testMode';
import { SparkJar } from '../ui/Candles';
import { HomeButton, ScreenNav } from '../ui/HomeButton';
import { AgainIcon, BookIcon, CastleIcon, StarIcon } from '../ui/Icons';
import { DoorArt } from './DoorArt';
import { levelPath, useLevel } from './useLevel';
import './Celebration.css';

const CANDLES: CandleSpot[] = [
  // Top left belongs to the Home button.
  { x: 5, y: 34, scale: 0.9 },
  { x: 90, y: 22, scale: 0.8 },
  { x: 8, y: 72, scale: 0.6 },
  { x: 88, y: 78, scale: 0.7, wide: true },
];
const SKIPPABLE_AFTER_MS = 2000;
const spring = { type: 'spring', stiffness: 260, damping: 16 } as const;

export function CelebrationScreen() {
  const level = useLevel();
  const result = useGame((s) => s.lastResult);
  if (!level || !result || result.summary.levelId !== level.id) return <Navigate to="/map" replace />;
  return <Celebration summary={result.summary} steps={result.steps} />;
}

type CardState = 'hidden' | 'spinning' | 'waiting' | 'flipped' | 'filed';

/**
 * The level celebration (about 8–10 s, skippable after 2): the door swings open, stars land one
 * by one, fireworks, sparks stream into the jar, a card spins in for him to flip, Іскрик dances
 * (and hatches or grows), and the buttons pop in. Follows the engine's CelebrationSteps.
 */
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
  const progress = useProgress((s) => s.progress);
  const balance = sparkBalance(progress);
  const stageNow = creatureStage(progress, game.content.config);
  const card = steps.includes('card') && summary.card ? game.content.cards.get(summary.card) : undefined;
  const weekly = steps.includes('weeklyCard') && summary.weeklyCard ? game.content.cards.get(summary.weeklyCard) : undefined;
  const creature = steps.includes('creature') ? summary.creature : null;

  const [scope, animate] = useAnimate();
  const [doorOpen, setDoorOpen] = useState(startFinished);
  const [stars, setStars] = useState(startFinished ? summary.stars : 0);
  const [sparksShown, setSparksShown] = useState(startFinished);
  const [jarCount, setJarCount] = useState(startFinished ? balance : balance - summary.sparks);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [cardState, setCardState] = useState<CardState>(startFinished ? 'filed' : 'hidden');
  const [weeklyState, setWeeklyState] = useState<CardState>(startFinished ? 'filed' : 'hidden');
  const [filed, setFiled] = useState(startFinished ? Number(!!card) + Number(!!weekly) : 0);
  const [stage, setStage] = useState(startFinished ? stageNow : (creature?.from ?? stageNow));
  const [cracking, setCracking] = useState(false);
  const [flash, setFlash] = useState(0);
  const [iskrykShown, setIskrykShown] = useState(startFinished);
  const [buttons, setButtons] = useState(startFinished);
  const [sonya, setSonya] = useState<SonyaMood>('idle');
  const [canSkip, setCanSkip] = useState(startFinished);

  useMusic(null); // the fanfare takes over

  // Every wait in the timeline resolves early when he skips; nothing runs after unmount.
  const skipped = useRef(startFinished);
  const skipWake = useRef<() => void>(() => {});
  const flipWake = useRef<() => void>(() => {});
  const jar = useRef<HTMLDivElement>(null);

  const finishNow = useCallback(() => {
    skipped.current = true;
    skipWake.current();
    flipWake.current();
    voice.stop();
    setDoorOpen(true);
    setStars(summary.stars);
    setSparksShown(true);
    setJarCount(balance);
    setFlights([]);
    setCardState('filed');
    setWeeklyState('filed');
    setFiled(Number(!!card) + Number(!!weekly));
    setStage(stageNow);
    setCracking(false);
    setIskrykShown(true);
    setButtons(true);
  }, [summary.stars, balance, card, weekly, stageNow]);

  useEffect(() => {
    if (startFinished) return;
    let alive = true;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        if (skipped.current) return resolve();
        const timer = window.setTimeout(resolve, ms);
        skipWake.current = () => {
          window.clearTimeout(timer);
          resolve();
        };
      });
    const go = () => alive && !skipped.current;
    const later = (ms: number, fn: () => void) => window.setTimeout(() => alive && fn(), ms);
    const skipTimer = window.setTimeout(() => setCanSkip(true), SKIPPABLE_AFTER_MS);

    void (async () => {
      // 1. The screen dims and the Magic Door swings open with light rays.
      sfx.doorOpen();
      sfx.fanfare();
      await wait(1100);
      if (!go()) return;
      setDoorOpen(true);
      void voice.say('celebration.levelDone');
      await wait(450);

      // 2. Stars land one by one, each with a rising chime and a tiny screen shake.
      for (let i = 0; i < summary.stars; i++) {
        await wait(520);
        if (!go()) return;
        setStars(i + 1);
        later(260, () => {
          sfx.star(i);
          if (scope.current) void animate(scope.current, { x: [0, -5, 5, -3, 0] }, { duration: 0.26 });
          const r = document.querySelectorAll('.celebration-star')[i]?.getBoundingClientRect();
          if (r) particles.sparkle(r.left + r.width / 2, r.top + r.height / 2);
        });
      }
      if (summary.stars === 3) later(500, () => setSonya('celebrate'));

      // 3. Fireworks: 3 to 5 bursts in gold, violet and teal.
      for (let k = 0; k < 2 + summary.stars; k++) {
        later(300 + k * 420, () => {
          sfx.fireworkLaunch();
          later(480, () => {
            particles.firework(15 + ((k * 37) % 70), 14 + ((k * 23) % 26), k);
            sfx.fireworkBurst();
          });
        });
      }
      if (summary.stars >= 2) later(1100, () => sfx.cheer());
      await wait(1100);
      if (!go()) return;

      // 4. Sparks stream into the jar while the counter rolls up.
      setSparksShown(true);
      await wait(300);
      const r = jar.current?.getBoundingClientRect();
      const to = r ? { x: r.left + 22, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: 60 };
      const streams = Math.min(summary.sparks, 10);
      setFlights(
        Array.from({ length: streams }, (_, i) => ({
          id: i,
          from: { x: window.innerWidth * (0.3 + ((i * 0.13) % 0.4)), y: window.innerHeight * 0.78 },
          to,
          golden: i < summary.goldenSparks,
          delay: i * 0.09,
        })),
      );
      await wait(950 + streams * 90);
      if (!go()) return;

      // 5. A card spins in face down; he taps it, it glows, and flies into the album.
      if (card) {
        setCardState('spinning');
        sfx.whoosh();
        await wait(900);
        if (!go()) return;
        setCardState('waiting');
        await new Promise<void>((resolve) => {
          flipWake.current = resolve;
          later(9000, resolve); // flips itself if he doesn't
        });
        if (!go()) return;
        setCardState('flipped');
        sfx.flip();
        later(260, () => sfx.chirp());
        void voice.say('celebration.newCard');
        await wait(1700);
        if (!go()) return;
        setCardState('filed');
        sfx.sparkle();
        later(600, () => setFiled((n) => n + 1));
        await wait(700);
      }

      // 6. Іскрик dances; at a growth stage he evolves (the egg wobbles, cracks and hatches).
      setIskrykShown(true);
      sfx.chirp();
      await wait(700);
      if (creature && go()) {
        if (creature.from === 0) {
          setCracking(true);
          sfx.eggCrack();
          await wait(650);
          sfx.eggCrack();
          await wait(650);
          if (!go()) return;
          setCracking(false);
        }
        setFlash((f) => f + 1);
        sfx.golden();
        setStage(creature.to);
        void voice.say(creature.from === 0 ? 'celebration.hatch' : 'celebration.grow');
        await wait(1800);
      }

      // One-time: his first ever 3 stars bring golden confetti and Соня's ceremonial line.
      if (steps.includes('firstThreeStars') && go()) {
        particles.confettiRain();
        setSonya('celebrate');
        void voice.say('celebration.firstThreeStars');
        await wait(2200);
      }

      if (weekly && go()) {
        setWeeklyState('spinning');
        await wait(900);
        if (!go()) return;
        setWeeklyState('flipped');
        sfx.flip();
        void voice.say('celebration.weeklyCard');
        await wait(1800);
        if (!go()) return;
        setWeeklyState('filed');
        later(600, () => setFiled((n) => n + 1));
        await wait(600);
      }

      // 7. The buttons pop in.
      if (go()) setButtons(true);
    })();

    return () => {
      alive = false;
      window.clearTimeout(skipTimer);
      skipWake.current();
      voice.stop();
    };
    // The timeline runs once per celebration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skip = () => {
    if (canSkip && !buttons) finishNow();
  };

  const landSpark = useCallback(
    (id: number) => {
      sfx.clink();
      setFlights((f) => {
        const rest = f.filter((x) => x.id !== id);
        setJarCount((n) => (rest.length === 0 ? balance : Math.min(balance, n + 1)));
        return rest;
      });
    },
    [balance],
  );

  return (
    <main className="screen celebration-screen" onClick={skip}>
      <Scene candles={CANDLES} />
      {buttons && (
        <ScreenNav>
          <HomeButton />
        </ScreenNav>
      )}

      <AnimatePresence>
        {!doorOpen && (
          <m.div key="door" className="celebration-door" exit={{ opacity: 0, transition: { duration: 0.6 } }} aria-hidden="true">
            <span className="celebration-rays" />
            <div className="celebration-door-art">
              <DoorArt />
            </div>
          </m.div>
        )}
      </AnimatePresence>
      <span className="celebration-light" aria-hidden="true" />

      <div className="celebration-sonya">
        <Sonya key={sonya} mood={sonya} />
      </div>

      <div className={`celebration-album ${filed ? 'has-cards' : ''}`} aria-hidden="true">
        <BookIcon />
        {filed > 0 && (
          <m.span key={filed} className="celebration-album-count" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring}>
            +{filed}
          </m.span>
        )}
      </div>

      <div ref={scope} className="celebration-column">
        <div className="celebration-stars" role="img" aria-label={fmt(t.map.stars, { n: summary.stars })}>
          {[0, 1, 2].map((i) => {
            const earned = i < stars;
            return (
              <m.span
                key={`${i}-${earned}`}
                className={`celebration-star ${earned ? 'is-earned' : ''}`}
                initial={earned && !startFinished ? { y: -140, scale: 2.2, rotate: -45, opacity: 0 } : false}
                animate={{ y: 0, scale: 1, rotate: 0, opacity: earned ? 1 : 0.3 }}
                transition={{ type: 'spring', stiffness: 320, damping: 14 }}
              >
                <StarIcon filled={earned} />
              </m.span>
            );
          })}
        </div>

        <div className="celebration-sparks-row">
          {sparksShown && (
            <m.p className="celebration-sparks" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}>
              <span className="celebration-spark-icon" aria-hidden="true">
                ✦
              </span>
              {fmt(t.celebration.sparksEarned, { n: summary.sparks })}
            </m.p>
          )}
          <div ref={jar}>
            <SparkJar count={jarCount} label={fmt(t.map.sparks, { n: balance })} />
          </div>
        </div>

        <div className="celebration-rewards">
          <AnimatePresence>
            {card && (cardState === 'spinning' || cardState === 'waiting' || cardState === 'flipped') && (
              <m.button
                key="card"
                type="button"
                className={`magic-card ${cardState === 'flipped' ? 'is-flipped' : ''} ${cardState === 'waiting' ? 'is-waiting' : ''}`}
                aria-label={cardState === 'flipped' ? fmt(t.celebration.newCard, { name: card.name }) : t.celebration.flipCard}
                initial={{ opacity: 0, scale: 0.3, rotate: -540, y: -80 }}
                animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.15, x: '38vw', y: '-42vh', rotate: 25, transition: { duration: 0.6, ease: [0.5, 0, 0.3, 1] } }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (cardState === 'waiting') flipWake.current();
                }}
                {...correctMark(cardState === 'waiting')}
              >
                <span className="magic-card-back" aria-hidden="true">
                  ✦
                </span>
                <span className="magic-card-front">
                  <span className="magic-card-art">{card.emoji}</span>
                  <span className="magic-card-name">{card.name}</span>
                </span>
              </m.button>
            )}
            {weekly && (weeklyState === 'spinning' || weeklyState === 'flipped') && (
              <m.div
                key="weekly"
                className={`magic-card is-static ${weeklyState === 'flipped' ? 'is-flipped' : ''}`}
                initial={{ opacity: 0, scale: 0.3, rotate: -540 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.15, x: '38vw', y: '-42vh', transition: { duration: 0.6 } }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              >
                <span className="magic-card-back" aria-hidden="true">
                  ✦
                </span>
                <span className="magic-card-front">
                  <span className="magic-card-art">{weekly.emoji}</span>
                  <span className="magic-card-name">{weekly.name}</span>
                </span>
              </m.div>
            )}
          </AnimatePresence>

          {iskrykShown && (
            <m.div className="celebration-creature" initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}>
              <Iskryk key={stage} stage={stage} mood={cracking ? 'idle' : 'dance'} cracking={cracking} />
              {flash > 0 && <span key={flash} className="evolve-flash" aria-hidden="true" />}
            </m.div>
          )}
        </div>

        <div className="celebration-actions">
          {buttons && (
            <>
              <m.button
                type="button"
                className="big-button is-ghost"
                aria-label={t.celebration.playAgain}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...spring, delay: 0.1 }}
                onClick={() => navigate(`${levelPath(summary.levelId)}/play`, { replace: true })}
              >
                <AgainIcon />
              </m.button>
              <m.button
                type="button"
                className="big-button"
                aria-label={t.celebration.toMap}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...spring, delay: 0.22 }}
                onClick={() => navigate('/map')}
                data-to-map
              >
                <CastleIcon />
              </m.button>
            </>
          )}
        </div>
      </div>

      <SparkFlights flights={flights} onArrive={landSpark} />
    </main>
  );
}
