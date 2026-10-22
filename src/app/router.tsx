import { createHashRouter, Navigate } from 'react-router';
import { CelebrationScreen } from '../core/screens/Celebration';
import { DevCelebrationScreen, DevJourneyScreen, DevTaskScreen } from '../core/screens/DevScreens';
import { DoorScreen } from '../core/screens/Door';
import { LevelIntroScreen } from '../core/screens/LevelIntro';
import { JourneyScreen } from '../core/screens/journey/Journey';
import { TaskRunnerScreen } from '../core/screens/TaskRunner';
import { WarmupDoneScreen, WarmupScreen } from '../core/screens/Warmup';
import { TEST_BUILD } from '../core/testMode';

// Hash URLs (#/map) because GitHub Pages has no fallback for deep links.
export const router = createHashRouter([
  { path: '/', element: <DoorScreen /> },
  { path: '/map', element: <JourneyScreen /> },
  { path: '/map/:world', element: <JourneyScreen /> },
  { path: '/level/:world/:num', element: <LevelIntroScreen /> },
  { path: '/level/:world/:num/play', element: <TaskRunnerScreen /> },
  { path: '/level/:world/:num/done', element: <CelebrationScreen /> },
  { path: '/warmup', element: <WarmupScreen /> },
  { path: '/warmup/done', element: <WarmupDoneScreen /> },
  ...(TEST_BUILD
    ? [
        { path: '/dev/task/:world/:num/:type', element: <DevTaskScreen /> },
        { path: '/dev/celebration', element: <DevCelebrationScreen /> },
        { path: '/dev/journey', element: <DevJourneyScreen /> },
      ]
    : []),
  { path: '*', element: <Navigate to="/" replace /> },
]);
