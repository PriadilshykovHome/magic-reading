import { useState } from 'react';
import { voice } from '../../../core/audio/voice';
import { t } from '../../../core/strings';
import { AgainIcon, CheckIcon } from '../../../core/ui/Icons';
import { useDisplayText } from '../shared/helpers';
import { correctMark } from '../../../core/testMode';
import type { TaskProps } from '../../../core/tasks/types';

// He reads aloud; the parent nearby taps the tick or "again". After "again" he hears it read
// correctly and tries once more (that counts as a miss for the stars).
export function ReadAloud({ task, onMiss, onComplete }: TaskProps) {
  const show = useDisplayText();
  const [done, setDone] = useState(false);
  const textClass = task.kind === 'sentence' ? 'read-sentence' : task.kind === 'word' ? 'read-word' : 'read-syllable';
  return (
    <div className="task-layout is-read-aloud">
      <div className={`task-prompt parchment ${done ? 'is-glowing' : ''}`}>
        <span className={textClass}>{show(task.target)}</span>
      </div>
      <div className="parent-controls">
        <button
          type="button"
          className="parent-button"
          aria-label={t.play.parentAgain}
          disabled={done}
          onClick={() => {
            onMiss();
            void voice.item(task.target);
          }}
        >
          <AgainIcon />
        </button>
        <button
          type="button"
          className="parent-button is-yes"
          aria-label={t.play.parentYes}
          disabled={done}
          onClick={() => {
            setDone(true);
            onComplete();
          }}
          {...correctMark(true)}
        >
          <CheckIcon />
        </button>
      </div>
    </div>
  );
}
