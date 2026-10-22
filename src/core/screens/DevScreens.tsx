// Test-build-only routes (never in production): open any task type or a fully revealed
// celebration directly, so layout checks can visit every screen at every viewport quickly.
import { useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router';
import { game } from '@game';
import type { CelebrationStep, LevelSummary } from '../engine/rewards';
import { Celebration } from './Celebration';
import { JourneyView, type JourneyWorld } from './journey/Journey';
import { Runner } from './TaskRunner';

export function DevTaskScreen() {
  const { world, num, type } = useParams();
  const [search] = useSearchParams();
  const level = game.content.levels.get(`${world}/${num}`);
  if (!level || !type) return <Navigate to="/map" replace />;
  const seed = Number(search.get('seed') ?? 1);
  return <Runner key={`${level.id}:${type}:${seed}`} level={level} seed={seed} startAt={{ type, boss: search.get('boss') === '1', target: search.get('target') ?? undefined }} />;
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

/** `#/dev/celebration` shows the final state; `?live=1` plays the whole sequence. */
export function DevCelebrationScreen() {
  const [search] = useSearchParams();
  const [sample] = useState(SAMPLE);
  return <Celebration summary={sample.summary} steps={sample.steps} startFinished={search.get('live') !== '1'} />;
}

/** The planned journey (13 worlds, about 290 levels) to check the road's layout and frame rate. */
const PLANNED = [6, 5, 20, 18, 22, 22, 24, 25, 25, 25, 35, 35, 25];

/** `#/dev/journey?done=120` shows the road with the first 120 doors finished. */
export function DevJourneyScreen() {
  const [search] = useSearchParams();
  const done = Number(search.get('done') ?? 120);
  const [worlds] = useState<JourneyWorld[]>(() => {
    let n = 0;
    return PLANNED.map((count, w) => ({
      id: `world-${w + 1}`,
      title: game.content.worlds[w % game.content.worlds.length]!.world.title,
      look: game.content.worlds[w % game.content.worlds.length]!.world.look,
      signs: game.content.worlds[w % game.content.worlds.length]!.world.signs.map((id) => ({ id, text: game.item(id).text })),
      levels: Array.from({ length: count }, (_, i) => {
        n++;
        const kind = i === count - 1 ? 'finale' : i % 7 === 6 ? 'review' : 'door';
        const state = n <= done ? 'done' : n === done + 1 ? 'next' : 'locked';
        return { id: `world-${w + 1}/${i + 1}`, kind, state, stars: state === 'done' ? 1 + (n % 3) : 0 };
      }),
    }));
  });
  return <JourneyView worlds={worlds} onOpen={() => {}} creature={2} jar={null} />;
}
