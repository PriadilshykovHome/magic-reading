// Test-build-only routes (never in production): open any task type or a fully revealed
// celebration directly, so layout checks can visit every screen at every viewport quickly.
import { useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router';
import { content } from '../content/load';
import type { CelebrationStep, LevelSummary } from '../engine/rewards';
import { Celebration } from './Celebration';
import { Runner } from './TaskRunner';

export function DevTaskScreen() {
  const { world, num, type } = useParams();
  const [search] = useSearchParams();
  const level = content.levels.get(`${world}/${num}`);
  if (!level || !type) return <Navigate to="/map" replace />;
  const seed = Number(search.get('seed') ?? 1);
  return <Runner key={`${level.id}:${type}:${seed}`} level={level} seed={seed} startAt={{ type, boss: search.get('boss') === '1' }} />;
}

const SAMPLE: { summary: LevelSummary; steps: CelebrationStep[] } = {
  summary: {
    levelId: 'tower-of-syllables/01',
    stars: 3,
    previousBest: 0,
    newBest: true,
    firstTry: 9,
    scored: 9,
    sparks: 15,
    goldenSparks: 1,
    card: 'card-hedgehog',
    unlocked: 'tower-of-syllables/02',
    creature: { from: 0, to: 1 },
    firstThreeStars: true,
    windowLit: true,
    weeklyCard: 'card-week',
  },
  steps: ['stars', 'sparks', 'card', 'creature', 'firstThreeStars', 'weeklyCard'],
};

export function DevCelebrationScreen() {
  const [sample] = useState(SAMPLE);
  return <Celebration summary={sample.summary} steps={sample.steps} startFinished />;
}
