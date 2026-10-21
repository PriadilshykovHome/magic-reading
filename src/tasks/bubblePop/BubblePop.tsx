import { useState, type CSSProperties } from 'react';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { t } from '../../strings';
import { SpeakerIcon } from '../../ui/Icons';
import { correctMark, useDisplayText } from '../shared/helpers';
import type { TaskProps } from '../types';
import type { BubblePopData } from './logic';

const LANES = 4;

// Bubbles float up; he pops every one with the syllable Соня says. No time pressure: missed
// bubbles simply come round again.
export function BubblePop({ task, hint, onMiss, onComplete }: TaskProps<BubblePopData>) {
  const show = useDisplayText();
  const { bubbles } = task.data;
  const needed = bubbles.filter((b) => b === task.target).length;
  const [popped, setPopped] = useState<number[]>([]);
  const [wobbling, setWobbling] = useState<number | null>(null);

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
      <div className="bubble-field">
        {bubbles.map((id, i) => (
          <button
            key={i}
            type="button"
            className={`bubble ${popped.includes(i) ? 'is-popped' : ''} ${hint && id === task.target ? 'is-hint' : ''}`}
            style={
              {
                '--lane': (i * 3) % LANES,
                // negative delays: the first bubbles are already on their way up when the task starts
                '--delay': `${i * 1.35 - 4}s`,
                '--rise': `${10 + (i % 3) * 1.2}s`,
              } as CSSProperties
            }
            onClick={() => tap(i)}
            disabled={popped.includes(i)}
            {...correctMark(id === task.target && !popped.includes(i))}
          >
            <span className={`bubble-inner ${wobbling === i ? 'is-wobbling' : ''}`}>{show(id)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
