import { LazyMotion, MotionConfig } from 'motion/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { setVolumes } from './audio/manager';
import { unlockAudio } from './audio/voice';
import { useProgress } from './store/progress';
import { router } from './router';
import { t } from './strings';
import './styles/global.css';
import './ui/ui.css';

document.title = t.app.title;

const motionFeatures = () => import('./fx/motionFeatures').then((m) => m.default);

// Sound may only start after a tap on iPhone/iPad: the magic door does it, or any first tap.
window.addEventListener('pointerdown', unlockAudio, { once: true });

// Voice, effects and music volumes follow the parent settings.
const applyVolumes = () => {
  const { voice, sfx, music } = useProgress.getState().progress.settings;
  setVolumes({ voice, sfx, music });
};
applyVolumes();
useProgress.subscribe(applyVolumes);

// Block the long-press menu small fingers trigger by accident.
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Pause all ambient animation while the tab is hidden.
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('is-hidden', document.hidden);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Spring physics for UI motion; animation features load after the first paint. Respects reduced motion. */}
    <MotionConfig reducedMotion="user">
      <LazyMotion features={motionFeatures} strict>
        <RouterProvider router={router} />
      </LazyMotion>
    </MotionConfig>
  </StrictMode>,
);
