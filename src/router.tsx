import { createHashRouter, Navigate } from 'react-router';
import { DoorScreen } from './screens/Door';
import { MapScreen } from './screens/Map';

// Hash URLs (#/map) because GitHub Pages has no fallback for deep links.
export const router = createHashRouter([
  { path: '/', element: <DoorScreen /> },
  { path: '/map', element: <MapScreen /> },
  { path: '*', element: <Navigate to="/" replace /> },
]);
