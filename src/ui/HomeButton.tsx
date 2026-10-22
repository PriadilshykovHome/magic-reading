import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { sfx } from '../audio/sfx';
import { t } from '../strings';
import { HoldButton } from './HoldButton';
import { CastleIcon, DoorIcon } from './Icons';

/**
 * "Home" is the magic door, on every screen, with the same icon in the same corner. In tasks it
 * needs a 1 s hold so a stray tap doesn't end the level.
 */
export function HomeButton({ hold = false }: { hold?: boolean }) {
  const navigate = useNavigate();
  const goHome = () => {
    sfx.whoosh();
    navigate('/', { replace: true });
  };
  if (hold) {
    return (
      <HoldButton holdMs={1000} onHold={goHome} label={t.nav.homeHold} className="home-button">
        <DoorIcon />
      </HoldButton>
    );
  }
  return (
    <button type="button" className="icon-button home-button" aria-label={t.nav.home} onClick={goHome} data-home>
      <DoorIcon />
    </button>
  );
}

/** Back to the map, next to Home where a screen has one. */
export function MapButton({ to = '/map' }: { to?: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={t.nav.map}
      onClick={() => {
        sfx.tap();
        navigate(to);
      }}
    >
      <CastleIcon />
    </button>
  );
}

/** The top-left corner where Home (and Map) live on screens without their own top bar. */
export function ScreenNav({ children }: { children: ReactNode }) {
  return <nav className="screen-nav">{children}</nav>;
}
