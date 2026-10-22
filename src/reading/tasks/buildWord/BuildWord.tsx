import { useState } from 'react';
import { sfx } from '../../../core/audio/sfx';
import { voice } from '../../../core/audio/voice';
import { content } from '../../content/load';
import { itemText } from '../../engine/content';
import { displayText } from '../../engine/display';
import { useProgress } from '../../../core/store/progress';
import { SceneView } from '../shared/SceneView';
import { fmt, t } from '../../../core/strings';
import { pictureOf, useDisplayText } from '../shared/helpers';
import { correctMark } from '../../../core/testMode';
import { useDrag } from '../../../core/tasks/useDrag';
import type { TaskProps } from '../../../core/tasks/types';
import type { BuildWordData } from './logic';

// He hears the word, sees its picture, and puts the syllable tiles into the slots in order (or,
// for buildSentence, a sentence's words). Tap a tile: it jumps to the next empty slot. Tap a
// placed tile: it goes back. Drag works too.
export function BuildWord({ task, hint, onMiss, onComplete }: TaskProps<BuildWordData>) {
  const showItem = useDisplayText();
  const lowercaseSentences = useProgress((s) => s.progress.settings.lowercaseSentences);
  const { slots, tiles, words } = task.data;
  const text = (id: string) => (words ? id.toLocaleLowerCase('uk-UA') : itemText(content, id));
  const show = (id: string) => (words ? displayText(id, 'sentence', { lowercaseSentences }) : showItem(id));
  const say = (id: string) => (words ? voice.text(id, 'interrupt') : voice.item(id, 'interrupt'));
  const textClass = words ? 'read-sentence' : 'read-word';
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
    void say(tiles[tile]!);
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
    <div className={`task-layout is-build ${words ? 'is-sentence' : ''}`}>
      <div className="task-prompt parchment build-picture">
        <button type="button" className="picture-button scene-box" aria-label={t.play.repeat} onClick={() => voice.item(task.target, 'interrupt')}>
          {words ? <SceneView scene={content.sentences.get(task.target)!.scene} /> : <span className="emoji-picture">{pictureOf(task.target)}</span>}
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
                    <span className={textClass}>{show(tiles[tile]!)}</span>
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
                textClass={textClass}
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

function Tile(props: {
  label: string;
  textClass: string;
  correct: boolean;
  hint: boolean;
  shaking: boolean;
  onTap: () => void;
  onDrop: (slot: string) => void;
}) {
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
      <span className={props.textClass}>{props.label}</span>
    </button>
  );
}
