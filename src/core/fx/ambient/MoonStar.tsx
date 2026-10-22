import { useEffect, useRef, useState } from 'react';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { useProgress } from '../../store/progress';
import { t } from '../../strings';
import { particles } from '../particles';
import { today } from '../today';

const FLIGHT_MS = 3600;

/**
 * Tap the moon and a shooting star crosses the sky («Лови падучу зірку!»). Catch it before it
 * fades and it's a bonus spark, once a day; after that it still sparkles. Sits over the backdrop's moon.
 */
export function MoonStar() {
  const [flying, setFlying] = useState(0);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const launch = () => {
    if (flying) return;
    sfx.whoosh();
    void voice.say('eggs.moonStar', 'interrupt');
    setFlying(Date.now());
    timer.current = window.setTimeout(() => setFlying(0), FLIGHT_MS);
  };

  const caught = (e: React.MouseEvent) => {
    window.clearTimeout(timer.current);
    setFlying(0);
    particles.sparkle(e.clientX, e.clientY);
    if (useProgress.getState().catchStar(today())) sfx.golden();
    else sfx.sparkle();
  };

  return (
    <>
      <button type="button" className="moon-button" aria-label={t.door.moon} onClick={launch} data-moon />
      {flying > 0 && (
        <button key={flying} type="button" className="moon-star" aria-label={t.door.star} onClick={caught} data-star>
          <span className="moon-star-tail" />
          <span className="moon-star-head" />
        </button>
      )}
    </>
  );
}
