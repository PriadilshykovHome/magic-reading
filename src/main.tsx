import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { unlockAudio } from './audio/voice';
import { router } from './router';
import { t } from './strings';
import './styles/global.css';
import './ui/ui.css';

document.title = t.app.title;

// Sound may only start after a tap on iPhone/iPad: the magic door does it, or any first tap.
window.addEventListener('pointerdown', unlockAudio, { once: true });

// Block the long-press menu small fingers trigger by accident.
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Pause all ambient animation while the tab is hidden.
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('is-hidden', document.hidden);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
