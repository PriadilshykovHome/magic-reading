// End of a level: stars, unlocks, cards, Іскрик's growth, castle windows and one-time moments.
// The returned `steps` are the celebration's running order for the UI.
import { dayKey } from './calendar.ts';
import type { GameContent } from './content.ts';
import { creatureStage, type Progress } from './progress.ts';
import type { RunState } from './run.ts';
import type { CoreConfig as Config, Level } from './schema.ts';

export function starsFor(firstTry: number, scored: number, config: Config): 1 | 2 | 3 {
  if (scored === 0) return 3;
  const ratio = firstTry / scored;
  if (ratio >= config.stars.three) return 3;
  if (ratio >= config.stars.two) return 2;
  return 1;
}

export function nextLevelId(content: GameContent, levelId: string): string | null {
  const at = content.levelOrder.indexOf(levelId);
  return at >= 0 ? (content.levelOrder[at + 1] ?? null) : null;
}

/** Finishing a level with any number of stars unlocks the next one. */
export function isLevelUnlocked(progress: Progress, level: Level): boolean {
  if (progress.settings.unlockAll || level.unlockAfter === null) return true;
  return (progress.levels[level.unlockAfter]?.bestStars ?? 0) > 0;
}

export type CelebrationStep = 'stars' | 'sparks' | 'card' | 'creature' | 'firstThreeStars' | 'weeklyCard';

export interface LevelSummary {
  levelId: string;
  stars: 1 | 2 | 3;
  previousBest: number;
  newBest: boolean;
  firstTry: number;
  scored: number;
  sparks: number;
  goldenSparks: number;
  /** A card collected for the first time. */
  card: string | null;
  unlocked: string | null;
  creature: { from: number; to: number } | null;
  firstThreeStars: boolean;
  windowLit: boolean;
  weeklyCard: string | null;
}

export interface FinishInput {
  /** Progress that already includes this run's answers (they're saved as he goes). */
  progress: Progress;
  run: RunState;
  level: Level;
  content: GameContent;
  now: Date;
}

export function finishLevel({ progress, run, level, content, now }: FinishInput): {
  progress: Progress;
  summary: LevelSummary;
  steps: CelebrationStep[];
} {
  const { config } = content;
  const stars = starsFor(run.firstTry, run.scored, config);
  const prev = progress.levels[level.id];
  const previousBest = prev?.bestStars ?? 0;
  const next = nextLevelId(content, level.id);
  const nextLevel = next ? content.levels.get(next) : undefined;
  const wasUnlocked = nextLevel ? isLevelUnlocked(progress, nextLevel) : true;
  const stageBefore = creatureStage(
    { ...progress, rewards: { ...progress.rewards, sparksEarned: progress.rewards.sparksEarned - run.sparks } },
    config,
  );

  const rewards = progress.rewards;
  const card = level.reward.card && !rewards.cards.includes(level.reward.card) ? level.reward.card : null;
  const firstThreeStars = stars === 3 && !rewards.milestones.includes('firstThreeStars');
  const today = dayKey(now);
  const windowLit = !rewards.litWindows.includes(today);
  const litWindows = windowLit ? [...rewards.litWindows, today] : rewards.litWindows;
  const weeklyCard = windowLit && litWindows.length % config.windows.surpriseEvery === 0 ? config.windows.surpriseCard : null;

  const updated: Progress = {
    ...progress,
    levels: {
      ...progress.levels,
      [level.id]: {
        bestStars: Math.max(previousBest, stars),
        plays: (prev?.plays ?? 0) + 1,
        completedAt: now.toISOString(),
      },
    },
    rewards: {
      ...rewards,
      cards: [...new Set([...rewards.cards, ...(card ? [card] : []), ...(weeklyCard ? [weeklyCard] : [])])],
      litWindows,
      milestones: firstThreeStars ? [...rewards.milestones, 'firstThreeStars'] : rewards.milestones,
    },
  };

  const stageAfter = creatureStage(updated, config);
  const summary: LevelSummary = {
    levelId: level.id,
    stars,
    previousBest,
    newBest: stars > previousBest,
    firstTry: run.firstTry,
    scored: run.scored,
    sparks: run.sparks,
    goldenSparks: run.goldenSparks,
    card,
    unlocked: !wasUnlocked && nextLevel && isLevelUnlocked(updated, nextLevel) ? nextLevel.id : null,
    creature: stageAfter > stageBefore ? { from: stageBefore, to: stageAfter } : null,
    firstThreeStars,
    windowLit,
    weeklyCard,
  };

  const steps: CelebrationStep[] = ['stars', 'sparks'];
  if (card) steps.push('card');
  if (summary.creature) steps.push('creature');
  if (firstThreeStars) steps.push('firstThreeStars');
  if (weeklyCard) steps.push('weeklyCard');
  return { progress: updated, summary, steps };
}
