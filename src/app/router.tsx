import { createHashRouter, Navigate } from 'react-router';
import { DoorScreen } from '../core/screens/Door';
import { LevelIntroScreen } from '../core/screens/LevelIntro';
import { JourneyScreen } from '../core/screens/journey/Journey';
import { TaskRunnerScreen } from '../core/screens/TaskRunner';
import { TEST_BUILD } from '../core/testMode';

// Screens he passes through every time (door, map, intro, tasks) load with the app; the rest
// load the first time they open (React Router's lazy routes), and the celebration is fetched
// in the background once the app is idle, so it is ready when the first level ends.
const celebration = () => import('../core/screens/Celebration');
const warmup = () => import('../core/screens/Warmup');
const dev = () => import('../core/screens/DevScreens');

// Hash URLs (#/map) because GitHub Pages has no fallback for deep links.
export const router = createHashRouter([
  { path: '/', element: <DoorScreen /> },
  { path: '/login', lazy: async () => ({ Component: (await import('../core/screens/Login')).LoginScreen }) },
  { path: '/map', element: <JourneyScreen /> },
  { path: '/map/:world', element: <JourneyScreen /> },
  { path: '/level/:world/:num', element: <LevelIntroScreen /> },
  { path: '/level/:world/:num/play', element: <TaskRunnerScreen /> },
  { path: '/level/:world/:num/done', lazy: async () => ({ Component: (await celebration()).CelebrationScreen }) },
  { path: '/book/:page?', lazy: async () => ({ Component: (await import('../core/screens/book/Book')).BookScreen }) },
  { path: '/album/:page?', lazy: async () => ({ Component: (await import('../core/screens/album/Album')).AlbumScreen }) },
  { path: '/warmup', lazy: async () => ({ Component: (await warmup()).WarmupScreen }) },
  { path: '/warmup/done', lazy: async () => ({ Component: (await warmup()).WarmupDoneScreen }) },
  ...(TEST_BUILD
    ? [
        { path: '/dev/task/:world/:num/:type', lazy: async () => ({ Component: (await dev()).DevTaskScreen }) },
        { path: '/dev/celebration', lazy: async () => ({ Component: (await dev()).DevCelebrationScreen }) },
        { path: '/dev/journey', lazy: async () => ({ Component: (await dev()).DevJourneyScreen }) },
      ]
    : []),
  { path: '*', element: <Navigate to="/" replace /> },
]);

// Safari had no requestIdleCallback until recently.
const idle = (fn: () => void) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(fn, { timeout: 5000 }) : setTimeout(fn, 3000));
idle(() => void celebration().then(warmup));
