import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { gameUi } from '@game-ui';
import { sfx } from '../audio/sfx';
import { useMusic } from '../audio/useMusic';
import { preloadLevel, voice } from '../audio/voice';
import { Sonya } from '../characters/Sonya';
import { isLevelUnlocked } from '../engine/rewards';
import type { Level } from '../engine/schema';
import { Scene } from '../fx/ambient/Scene';
import { useProgress } from '../store/progress';
import { t } from '../strings';
import { HomeButton, MapButton, ScreenNav } from '../ui/HomeButton';
import { PlayIcon } from '../ui/Icons';
import { useTaps } from '../ui/useTaps';
import { levelPath, mapPath, useLevel } from './useLevel';
import './LevelIntro.css';

export function LevelIntroScreen() {
  const level = useLevel();
  const progress = useProgress((s) => s.progress);
  if (!level || !isLevelUnlocked(progress, level)) return <Navigate to="/map" replace />;
  return <Intro key={level.id} level={level} />;
}

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

// Соня says today's goal, then the game's demo shows what's new.
function Intro({ level }: { level: Level }) {
  const navigate = useNavigate();
  const [talking, setTalking] = useState(false);
  const [playing, setPlaying] = useState(false);
  const { IntroDemo } = gameUi;
  useMusic('map');
  useEffect(() => preloadLevel(level), [level]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await wait(500);
      setTalking(true);
      await voice.say(level.intro.voice, 'after', level.intro.topic);
      if (cancelled) return;
      setTalking(false);
      setPlaying(true);
    })();
    return () => {
      cancelled = true;
      voice.stop();
    };
  }, [level]);

  const start = () => {
    sfx.tap();
    navigate(`${levelPath(level.id)}/play`);
  };

  return (
    <main className="screen intro-screen">
      <Scene moon={false} quiet />
      <ScreenNav>
        <HomeButton />
        <MapButton to={mapPath(level.id)} />
      </ScreenNav>

      <div className="intro-stage">
        <SpinningSonya talking={talking} />
        <div className="intro-demo parchment">
          <IntroDemo level={level} waiting={talking} playing={playing} />
        </div>
      </div>

      <button type="button" className="big-button intro-play" aria-label={t.play.start} onClick={start} data-start>
        <PlayIcon />
      </button>
    </main>
  );
}

/** Соня at the intro. Five quick taps: she spins, her hat flies off and lands back on her head. */
function SpinningSonya({ talking }: { talking: boolean }) {
  const [spinning, setSpinning] = useState(false);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const tap = useTaps(5, () => {
    setSpinning(true);
    sfx.whoosh();
    void voice.say('eggs.sonyaSpin', 'interrupt');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSpinning(false), 1600);
  });
  return (
    <button type="button" className={`intro-sonya ${spinning ? 'is-spinning' : ''}`} aria-label={t.names.mascot} onClick={tap}>
      <Sonya mood={talking ? 'talk' : spinning ? 'happy' : 'idle'} />
    </button>
  );
}
