// «Чарівна розминка»: once a day, a few quick tasks over what he has already learned (the most
// overdue first), then a short celebration that lights today's castle window.
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { game } from '@game';
import { voice } from '../audio/voice';
import { WARMUP_ID, warmupDue } from '../engine/rewards';
import { useGame } from '../store/game';
import { useProgress } from '../store/progress';
import { Celebration } from './Celebration';
import { Runner } from './TaskRunner';

export function WarmupScreen() {
  const [level] = useState(() => {
    const { progress } = useProgress.getState();
    return warmupDue(progress, new Date()) ? game.warmup(progress) : null;
  });
  // The runner's first instruction waits a moment, so this comes first.
  useEffect(() => {
    if (level) void voice.say('warmup.start');
  }, [level]);
  if (!level) return <Navigate to="/map" replace />;
  return <Runner level={level} warmup />;
}

export function WarmupDoneScreen() {
  const result = useGame((s) => s.lastResult);
  if (!result || result.summary.levelId !== WARMUP_ID) return <Navigate to="/map" replace />;
  return <Celebration summary={result.summary} steps={result.steps} />;
}
