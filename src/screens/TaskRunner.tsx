import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { sfx } from '../audio/sfx';
import { voice } from '../audio/voice';
import { Sonya, type SonyaMood } from '../characters/Sonya';
import { content, levelPath } from '../content/load';
import { sparkBalance } from '../engine/progress';
import { isLevelUnlocked } from '../engine/rewards';
import { seededRandom } from '../engine/rng';
import { completeTask, registerMiss, startRun } from '../engine/run';
import type { Level } from '../engine/schema';
import { buildSession } from '../engine/session';
import { Scene, type CandleSpot } from '../fx/ambient/Scene';
import { useGame } from '../store/game';
import { useProgress } from '../store/progress';
import { fmt, t } from '../strings';
import { taskLogics } from '../tasks/logicRegistry';
import { taskTypes } from '../tasks/registry';
import { CandleRow, SparkJar } from '../ui/Candles';
import { HomeIcon, LockIcon, SpeakerIcon } from '../ui/Icons';
import { HoldButton } from '../ui/HoldButton';
import { useLevel } from './useLevel';
import '../tasks/tasks.css';
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

function Runner({ level }: { level: Level }) {
  const navigate = useNavigate();
  const { config } = content;
  const recordTask = useProgress((s) => s.recordTask);
  const finishLevel = useProgress((s) => s.finishLevel);
  const balance = useProgress((s) => sparkBalance(s.progress));
  const setLastResult = useGame((s) => s.setLastResult);

  // A fresh, reshuffled session every time the level starts.
  const [session] = useState(() => {
    const { progress } = useProgress.getState();
    return buildSession({
      content,
      level,
      progress,
      settings: progress.settings,
      registry: taskLogics,
      rng: seededRandom(randomSeed()),
      now: new Date(),
    });
  });
  const [rng] = useState(() => seededRandom(randomSeed()));
  const run = useRef(startRun(config, rng));
  const [index, setIndex] = useState(0);
  const [solved, setSolved] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [hint, setHint] = useState(false);
  const [mood, setMood] = useState<SonyaMood>('idle');
  const [effect, setEffect] = useState<Effect | null>(null);
  const [doorOpen, setDoorOpen] = useState(false);
  const busy = useRef(false);
  const moodTimer = useRef<number | undefined>(undefined);

  const task = session.tasks[index]!;
  const { Component } = taskTypes[task.type]!;

  const flashMood = useCallback((next: SonyaMood, ms = 900) => {
    setMood(next);
    window.clearTimeout(moodTimer.current);
    moodTimer.current = window.setTimeout(() => setMood('idle'), ms);
  }, []);
  const clearEffect = useCallback(() => setEffect(null), []);

  /** Соня's instruction; listening tasks then say the target. Reading tasks never do (until answered). */
  const instruct = useCallback(() => {
    setMood('talk');
    const said = task.reading || task.type === 'syllableMerge' ? voice.say(task.instruction) : voice.lineThenItem(task.instruction, task.target);
    void said.then(() => setMood((m) => (m === 'talk' ? 'idle' : m)));
  }, [task]);

  useEffect(() => {
    const timer = window.setTimeout(instruct, 550);
    return () => window.clearTimeout(timer);
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
        void voice.say('retry');
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
      if (door) await voice.say('magicDoor.opened');
      await wait(Math.max(0, 1000 - (Date.now() - started)));
      advance();
    })();
  }, [task, config, rng, recordTask, advance, flashMood]);

  const lit = index + (solved ? 1 : 0);
  const body = <Component key={task.key} task={task} hint={hint} onMiss={onMiss} onComplete={onComplete} />;

  return (
    <main className="screen runner-screen">
      <Scene candles={CANDLES} moon={false} quiet />

      <header className="runner-bar">
        <HoldButton holdMs={1000} onHold={() => navigate('/map')} label={t.play.home}>
          <HomeIcon />
        </HoldButton>
        <CandleRow total={session.tasks.length} lit={lit} label={fmt(t.play.progress, { done: lit, total: session.tasks.length })} />
        <SparkJar count={balance} label={fmt(t.map.sparks, { n: balance })} golden={effect?.kind === 'golden'} />
        <button type="button" className="runner-sonya" aria-label={t.play.repeat} onClick={instruct}>
          <Sonya mood={mood} />
          <span className="runner-sonya-badge">
            <SpeakerIcon />
          </span>
        </button>
      </header>

      <section key={task.key} className={`runner-stage ${leaving ? 'is-leaving' : ''}`} data-task-type={task.type} data-boss={task.boss || undefined}>
        {task.boss ? <MagicDoorFrame open={doorOpen}>{body}</MagicDoorFrame> : body}
      </section>

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
