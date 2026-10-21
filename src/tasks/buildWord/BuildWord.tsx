import { useState } from 'react';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { content } from '../../content/load';
import { itemText } from '../../engine/content';
import { fmt, t } from '../../strings';
import { correctMark, pictureOf, useDisplayText } from '../shared/helpers';
import { useDrag } from '../shared/useDrag';
import type { TaskProps } from '../types';
import type { BuildWordData } from './logic';

// He hears the word, sees its picture, and puts the syllable tiles into the slots in order.
// Tap a tile: it jumps to the next empty slot. Tap a placed tile: it goes back. Drag works too.
export function BuildWord({ task, hint, onMiss, onComplete }: TaskProps<BuildWordData>) {
  const show = useDisplayText();
  const { slots, tiles } = task.data;
  const text = (id: string) => itemText(content, id);
  /** placed[slotIndex] = tile index, or null */
  const [placed, setPlaced] = useState<(number | null)[]>(() => slots.map(() => null));
  const [shaking, setShaking] = useState<number | null>(null);
  const done = placed.every((p) => p !== null);
  const nextSlot = placed.indexOf(null);

  const reject = (tile: number) => {
    setShaking(tile);
    window.setTimeout(() => setShaking(null), 320);
    onMiss();
  };
  const place = (tile: number, slot: number) => {
    if (done || placed.includes(tile)) return;
    if (slot < 0 || placed[slot] !== null) return;
    if (text(tiles[tile]!) !== text(slots[slot]!)) return reject(tile);
    sfx.place();
    void voice.item(tiles[tile]!, 'interrupt');
    const next = placed.map((p, i) => (i === slot ? tile : p));
    setPlaced(next);
    if (next.every((p) => p !== null)) onComplete();
  };
  const unplace = (slot: number) => {
    if (done) return;
    sfx.tap();
    setPlaced((p) => p.map((v, i) => (i === slot ? null : v)));
  };

  return (
    <div className="task-layout is-build">
      <div className="task-prompt parchment build-picture">
        <button type="button" className="picture-button" aria-label={t.play.repeat} onClick={() => voice.item(task.target, 'interrupt')}>
          <span className="emoji-picture">{pictureOf(task.target)}</span>
        </button>
      </div>
      <div className="build-work">
        <div className={`build-slots ${done ? 'is-done' : ''}`}>
          {slots.map((_, s) => {
            const tile = placed[s];
            return (
              <div key={s} className={`build-slot ${tile !== null ? 'is-filled' : ''}`} data-drop={String(s)} aria-label={fmt(t.play.slot, { n: s + 1 })}>
                {tile !== null && tile !== undefined && (
                  <button type="button" className="option tile" onClick={() => unplace(s)}>
                    <span className="read-word">{show(tiles[tile]!)}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="build-tray">
          {tiles.map((id, i) =>
            placed.includes(i) ? (
              <span key={i} className="tile-gap" />
            ) : (
              <Tile
                key={i}
                label={show(id)}
                correct={!done && nextSlot >= 0 && text(id) === text(slots[nextSlot]!)}
                hint={hint}
                shaking={shaking === i}
                onTap={() => place(i, nextSlot)}
                onDrop={(slot) => place(i, Number(slot))}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function Tile(props: { label: string; correct: boolean; hint: boolean; shaking: boolean; onTap: () => void; onDrop: (slot: string) => void }) {
  const drag = useDrag({ onTap: props.onTap, onDrop: props.onDrop });
  return (
    <button
      type="button"
      className={`option tile ${props.shaking ? 'is-shaking' : ''} ${props.hint && props.correct ? 'is-hint' : ''}`}
      aria-label={fmt(t.play.tile, { text: props.label })}
      style={drag.style}
      {...drag.handlers}
      {...correctMark(props.correct)}
    >
      <span className="read-word">{props.label}</span>
    </button>
  );
}
