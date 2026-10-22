import { createHashRouter, Navigate } from 'react-router';
import { CelebrationScreen } from '../core/screens/Celebration';
import { DevCelebrationScreen, DevTaskScreen } from '../core/screens/DevScreens';
import { DoorScreen } from '../core/screens/Door';
import { LevelIntroScreen } from '../core/screens/LevelIntro';
import { MapScreen } from '../core/screens/Map';
import { TaskRunnerScreen } from '../core/screens/TaskRunner';
import { TEST_BUILD } from '../core/testMode';

// Hash URLs (#/map) because GitHub Pages has no fallback for deep links.
export const router = createHashRouter([
  { path: '/', element: <DoorScreen /> },
  { path: '/map', element: <MapScreen /> },
  { path: '/map/:world', element: <MapScreen /> },
  { path: '/level/:world/:num', element: <LevelIntroScreen /> },
  { path: '/level/:world/:num/play', element: <TaskRunnerScreen /> },
  { path: '/level/:world/:num/done', element: <CelebrationScreen /> },
  ...(TEST_BUILD
    ? [
        { path: '/dev/task/:world/:num/:type', element: <DevTaskScreen /> },
        { path: '/dev/celebration', element: <DevCelebrationScreen /> },
      ]
    : []),
  { path: '*', element: <Navigate to="/" replace /> },
]);
