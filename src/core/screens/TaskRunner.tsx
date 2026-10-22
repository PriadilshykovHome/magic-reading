import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { sfx } from '../audio/sfx';
import { useMusic } from '../audio/useMusic';
import { voice, type Policy } from '../audio/voice';
import { Sonya, type SonyaMood } from '../characters/Sonya';
import { game } from '@game';
import { gameUi } from '@game-ui';
import { sparkBalance } from '../engine/progress';
import { isLevelUnlocked } from '../engine/rewards';
import { seededRandom } from '../engine/rng';
import { completeTask, registerMiss, startRun } from '../engine/run';
import type { Level } from '../engine/schema';
import { buildSession } from '../engine/session';
import { Scene, type CandleSpot } from '../fx/ambient/Scene';
import { particles } from '../fx/particles';
import { SparkFlights, type Flight } from '../fx/SparkFlight';
import { useGame } from '../store/game';
import { useProgress } from '../store/progress';
import { fmt, t } from '../strings';
import { CandleRow, SparkJar } from '../ui/Candles';
import { HomeButton } from '../ui/HomeButton';
import { LockIcon, SpeakerIcon } from '../ui/Icons';
import { levelPath, useLevel } from './useLevel';
import './TaskRunner.css';

const CANDLES: CandleSpot[] = [
  { x: 3, y: 30, scale: 0.55 },
  { x: 94, y: 70, scale: 0.6, wide: true },
];

const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0]!;
const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

export function TaskRunnerScreen() {
  const level = useLevel();
  const progress = useProgress((s) => s.progress);
  if (!level || !isLevelUnlocked(progress, level)) return <Navigate to="/map" replace />;
  return <Runner key={level.id} level={level} />;
}

type Effect = { kind: 'wand' | 'wave' | 'golden'; id: number };

/** Test routes start at the first task of a given type (or the Magic Door). */
export interface StartAt {
  type: string;
  boss: boolean;
  /** Ask about this item (layout checks force the longest words). */
  target?: string;
}

export function Runner({ level, startAt, seed }: { level: Level; startAt?: StartAt; seed?: number }) {
  const navigate = useNavigate();
  const { content, logics: taskLogics, engine } = game;
  const { config } = content;
  const recordTask = useProgress((s) => s.recordTask);
  const finishLevel = useProgress((s) => s.finishLevel);
  const balance = useProgress((s) => sparkBalance(s.progress));
  const setLastResult = useGame((s) => s.setLastResult);
  const musicInTasks = useProgress((s) => s.progress.settings.musicInTasks);
  useMusic(musicInTasks ? 'tasks' : null); // reading needs focus: off unless the parent turns it on

  // A fresh, reshuffled session every time the level starts.
  const [session] = useState(() => {
    const { progress } = useProgress.getState();
    const built = buildSession({
      content,
      level,
      domain: engine,
      progress,
      settings: progress.settings,
      registry: taskLogics,
      rng: seededRandom(seed ?? randomSeed()),
      now: new Date(),
    });
    const at = startAt?.target ? built.tasks.findIndex((x) => x.type === startAt.type && x.boss === startAt.boss) : -1;
    if (at >= 0) {
      const task = built.tasks[at]!;
      const logic = taskLogics[task.type]!;
      const entry = level.tasks.find((e) => e.type === task.type) ?? { type: task.type, count: 1 };
      const rebuilt = logic.build(engine.createBuildContext(content, level, seededRandom(seed ?? 1)), logic.configSchema.parse(entry), startAt!.target!);
      built.tasks[at] = { ...task, target: startAt!.target!, options: rebuilt.options, data: rebuilt.data };
    }
    return built;
  });
  const [rng] = useState(() => seededRandom(seed !== undefined ? seed + 1 : randomSeed()));
  const run = useRef(startRun(config, rng));
  const [index, setIndex] = useState(() =>
    startAt ? Math.max(0, session.tasks.findIndex((x) => x.type === startAt.type && x.boss === startAt.boss)) : 0,
  );
  const [solved, setSolved] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [hint, setHint] = useState(false);
  const [mood, setMood] = useState<SonyaMood>('idle');
  const [effect, setEffect] = useState<Effect | null>(null);
  const [doorOpen, setDoorOpen] = useState(false);
  const busy = useRef(false);
  const moodTimer = useRef<number | undefined>(undefined);
  const jar = useRef<HTMLDivElement>(null);
  const lastTap = useRef<{ x: number; y: number; at: number } | null>(null);
  const [flights, setFlights] = useState<(Flight & { sparks: number })[]>([]);
  const inFlight = flights.reduce((n, f) => n + f.sparks, 0);

  useEffect(() => particles.prewarm(), []);

  // Where he tapped, so the sparkles and the spark start from his finger.
  useEffect(() => {
    const onDown = (e: PointerEvent) => (lastTap.current = { x: e.clientX, y: e.clientY, at: performance.now() });
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, []);

  const launchSpark = useCallback((sparks: number, golden: boolean) => {
    const tap = lastTap.current;
    let from = tap && performance.now() - tap.at < 1500 ? { x: tap.x, y: tap.y } : null;
    if (!from) {
      const el = document.querySelector('.runner-stage .is-correct, .runner-stage .task-prompt, .runner-stage');
      const r = el?.getBoundingClientRect();
      from = r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
    const r = jar.current?.getBoundingClientRect();
    const to = r ? { x: r.left + 22, y: r.top + r.height / 2 } : { x: window.innerWidth - 120, y: 40 };
    particles.sparkle(from.x, from.y);
    setFlights((f) => [...f, { id: Date.now() + Math.random(), from, to, golden, sparks }]);
  }, []);

  const landSpark = useCallback((id: number) => {
    sfx.clink();
    setFlights((f) => f.filter((x) => x.id !== id));
  }, []);

  const task = session.tasks[index]!;
  const { Component } = gameUi.tasks[task.type]!;

  const flashMood = useCallback((next: SonyaMood, ms = 900) => {
    setMood(next);
    window.clearTimeout(moodTimer.current);
    moodTimer.current = window.setTimeout(() => setMood('idle'), ms);
  }, []);
  const clearEffect = useCallback(() => setEffect(null), []);

  /** Соня's instruction; listening tasks then say the target. Reading tasks never do (until answered). */
  const instruct = useCallback(
    (policy: Policy = 'after') => {
    setMood('talk');
    const said =
      task.reading || task.type === 'syllableMerge'
        ? voice.say(task.instruction, policy)
        : voice.lineThenItem(task.instruction, task.target, policy);
    void said.then(() => setMood((m) => (m === 'talk' ? 'idle' : m)));
    },
    [task],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => instruct('after'), 550);
    return () => window.clearTimeout(timer);
  }, [instruct]);

  // On a laptop: keys 1, 2, 3 pick options (or tiles), Space repeats the instruction.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        instruct('interrupt');
        return;
      }
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1 || n > 9) return;
      const targets = document.querySelectorAll<HTMLElement>(
        '.runner-stage .choices .option:not(:disabled), .runner-stage .build-tray .tile, .runner-stage .merge-consonant, .runner-stage .parent-button:not(:disabled)',
      );
      targets[n - 1]?.click();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [instruct]);

  useEffect(
    () => () => {
      voice.stop();
      window.clearTimeout(moodTimer.current);
    },
    [],
  );

  const onMiss = useCallback(() => {
    if (busy.current) return;
    const { state, events } = registerMiss(run.current, config);
    run.current = state;
    for (const e of events) {
      if (e.type !== 'wrong') continue;
      sfx.wrong();
      flashMood('shrug');
      if (e.hint) {
        setHint(true);
        void voice.say('hint');
      } else {
        void voice.say('retry', 'ifIdle'); // quick second misses don't pile up
      }
    }
  }, [config, flashMood]);

  const advance = useCallback(() => {
    if (index < session.tasks.length - 1) {
      setLeaving(true);
      window.setTimeout(() => {
        sfx.candle();
        setIndex((i) => i + 1);
        setLeaving(false);
        setSolved(false);
        setHint(false);
        setDoorOpen(false);
        setMood('idle');
        busy.current = false;
      }, 420);
      return;
    }
    setLastResult(finishLevel(run.current, level));
    navigate(`${levelPath(level.id)}/done`, { replace: true });
  }, [index, session, finishLevel, level, navigate, setLastResult]);

  const onComplete = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    setSolved(true);
    const { state, events, result } = completeTask(run.current, task, config, rng);
    run.current = state;
    // Saved straight away: answers survive leaving mid-level.
    recordTask({ target: task.target, scored: task.scored, firstTry: result.firstTry, sparks: result.sparks });

    let extraLine: string | null = null;
    let door = false;
    for (const e of events) {
      if (e.type === 'correct') {
        launchSpark(e.sparks, e.golden);
        if (e.golden) {
          sfx.golden();
          setEffect({ kind: 'golden', id: Date.now() });
          extraLine = 'goldenSpark';
        } else {
          sfx.correct(e.chime);
          if (e.praise) extraLine ??= 'praise';
        }
        navigator.vibrate?.(30);
      }
      if (e.type === 'streak') {
        setEffect({ kind: e.effect, id: Date.now() });
        if (e.effect === 'wand') {
          const w = window.innerWidth;
          const h = window.innerHeight;
          particles.trail(Array.from({ length: 7 }, (_, i) => ({ x: w * (0.05 + i * 0.15), y: h * (0.32 - i * 0.022) })));
          sfx.whoosh();
        } else {
          sfx.sparkle();
        }
        extraLine = `streak.${e.effect}`;
      }
      if (e.type === 'doorOpen') door = true;
    }
    flashMood('happy', 1200);

    void (async () => {
      const started = Date.now();
      if (door) {
        sfx.doorOpen();
        setDoorOpen(true);
      }
      await wait(250);
      await voice.item(task.target); // the answer is always confirmed out loud
      if (extraLine) await voice.say(extraLine);
      if (door) await voice.say(level.boss.openedLine ?? 'magicDoor.opened');
      await wait(Math.max(0, 1000 - (Date.now() - started)));
      advance();
    })();
  }, [task, config, rng, recordTask, advance, flashMood, launchSpark, level]);

  const lit = index + (solved ? 1 : 0);
  const body = <Component key={task.key} task={task} hint={hint} onMiss={onMiss} onComplete={onComplete} />;

  return (
    <main className="screen runner-screen">
      <Scene candles={CANDLES} moon={false} quiet />

      <header className="runner-bar">
        <HomeButton hold />
        <CandleRow total={session.tasks.length} lit={lit} label={fmt(t.play.progress, { done: lit, total: session.tasks.length })} />
        <div ref={jar} className="runner-jar">
          {/* the jar counts each spark as it lands */}
          <SparkJar count={balance - inFlight} label={fmt(t.map.sparks, { n: balance })} golden={effect?.kind === 'golden'} />
        </div>
        <button type="button" className="runner-sonya" aria-label={t.play.repeat} onClick={() => instruct('interrupt')}>
          <Sonya mood={mood} />
          <span className="runner-sonya-badge">
            <SpeakerIcon />
          </span>
        </button>
      </header>

      <section key={task.key} className={`runner-stage ${leaving ? 'is-leaving' : ''}`} data-task-type={task.type} data-boss={task.boss || undefined}>
        {task.boss ? <MagicDoorFrame open={doorOpen}>{body}</MagicDoorFrame> : body}
      </section>

      <SparkFlights flights={flights} onArrive={landSpark} />
      {effect && <ScreenEffect key={effect.id} kind={effect.kind} onDone={clearEffect} />}
    </main>
  );
}

/** The mini-boss: the task dressed as a locked magic door that bursts open with light. */
function MagicDoorFrame({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div className={`magic-door ${open ? 'is-open' : ''}`} aria-label={t.play.magicDoor} role="group">
      <div className="magic-door-arch">
        <span className="magic-door-lock">
          <LockIcon />
        </span>
      </div>
      <div className="magic-door-body">{children}</div>
      <span className="magic-door-light" aria-hidden="true" />
    </div>
  );
}

/** Streak rewards and the golden spark: brief full-screen flourishes that never take taps. */
function ScreenEffect({ kind, onDone }: { kind: Effect['kind']; onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 1400);
    return () => window.clearTimeout(timer);
  }, [onDone]);
  return <div className={`screen-effect effect-${kind}`} aria-hidden="true" />;
}
