import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { t } from '../../strings';
import { SpeakerIcon } from '../../ui/Icons';
import { correctMark, useDisplayText } from '../shared/helpers';
import type { TaskProps } from '../types';
import type { BubblePopData } from './logic';

/** Calm rising speed. There is no time pressure: missed bubbles come round again. */
const SPEED_PX_PER_S = 48;
const SWAY_PX = 10;
const GAP_PX = 16;

interface Geometry {
  size: number;
  lanes: number;
  riseS: number;
}

/** Each bubble rises during this share of its cycle, then waits hidden above the field. */
const RISE_SHARE = 0.6;

/**
 * Bubble size and lanes from the real field: big enough for 64 px syllables, and lanes far
 * enough apart that swaying neighbours keep a 16 px gap. Bubbles in one lane are spread evenly
 * around a loop that is 1 / RISE_SHARE times the visible path, so they never overlap.
 */
function geometry(width: number, height: number): Geometry {
  const vmin = Math.min(window.innerWidth, window.innerHeight);
  const size = Math.round(Math.min(150, Math.max(116, vmin * 0.22)));
  const lanes = Math.max(2, Math.min(4, Math.floor((width + GAP_PX) / (size + GAP_PX + 2 * SWAY_PX))));
  const travel = height + size * 1.1;
  return { size, lanes, riseS: travel / RISE_SHARE / SPEED_PX_PER_S };
}

// Bubbles float up; he pops every one with the syllable Соня says.
export function BubblePop({ task, hint, onMiss, onComplete }: TaskProps<BubblePopData>) {
  const show = useDisplayText();
  const { bubbles } = task.data;
  const needed = bubbles.filter((b) => b === task.target).length;
  const [popped, setPopped] = useState<number[]>([]);
  const [wobbling, setWobbling] = useState<number | null>(null);
  const field = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<Geometry | null>(null);

  useLayoutEffect(() => {
    const el = field.current;
    if (!el) return;
    const measure = () => setGeo(geometry(el.clientWidth, el.clientHeight));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [bubbles.length]);

  const tap = (i: number) => {
    if (popped.includes(i) || popped.length === needed) return;
    if (bubbles[i] === task.target) {
      sfx.pop();
      const next = [...popped, i];
      setPopped(next);
      if (next.length === needed) onComplete();
    } else {
      setWobbling(i);
      window.setTimeout(() => setWobbling(null), 320);
      onMiss();
    }
  };

  const perLane = geo ? Math.ceil(bubbles.length / geo.lanes) : 1;

  return (
    <div className="bubble-task">
      <button type="button" className="listen-chip" aria-label={t.play.repeat} onClick={() => voice.item(task.target)}>
        <SpeakerIcon />
        <span className="bubble-count">
          {Array.from({ length: needed }, (_, i) => (
            <span key={i} className={`bubble-dot ${i < popped.length ? 'is-on' : ''}`} />
          ))}
        </span>
      </button>
      <div
        ref={field}
        className="bubble-field"
        style={geo ? ({ '--size': `${geo.size}px`, '--lanes': geo.lanes, '--rise': `${geo.riseS}s` } as CSSProperties) : undefined}
      >
        {geo &&
          bubbles.map((id, i) => {
            const lane = i % geo.lanes;
            // Even spacing around each lane's loop, lanes staggered; negative delay = already rising.
            const phase = (Math.floor(i / geo.lanes) + lane / geo.lanes) / perLane;
            return (
              <button
                key={i}
                type="button"
                className={`bubble ${popped.includes(i) ? 'is-popped' : ''} ${hint && id === task.target ? 'is-hint' : ''}`}
                style={{ '--lane': lane, '--delay': `${-phase * geo.riseS}s` } as CSSProperties}
                onClick={() => tap(i)}
                disabled={popped.includes(i)}
                {...correctMark(id === task.target && !popped.includes(i))}
              >
                <span className={`bubble-inner ${wobbling === i ? 'is-wobbling' : ''}`}>{show(id)}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
