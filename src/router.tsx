import { createHashRouter, Navigate } from 'react-router';
import { CelebrationScreen } from './screens/Celebration';
import { DoorScreen } from './screens/Door';
import { LevelIntroScreen } from './screens/LevelIntro';
import { MapScreen } from './screens/Map';
import { TaskRunnerScreen } from './screens/TaskRunner';

// Hash URLs (#/map) because GitHub Pages has no fallback for deep links.
export const router = createHashRouter([
  { path: '/', element: <DoorScreen /> },
  { path: '/map', element: <MapScreen /> },
  { path: '/level/:world/:num', element: <LevelIntroScreen /> },
  { path: '/level/:world/:num/play', element: <TaskRunnerScreen /> },
  { path: '/level/:world/:num/done', element: <CelebrationScreen /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
