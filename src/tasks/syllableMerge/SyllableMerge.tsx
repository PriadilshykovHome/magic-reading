import { useState } from 'react';
import { sfx } from '../../audio/sfx';
import { t } from '../../strings';
import { correctMark, useDisplayText } from '../shared/helpers';
import { useDrag } from '../shared/useDrag';
import type { TaskProps } from '../types';
import type { SyllableMergeData } from './logic';

// The teaching moment: tap (or drag) the consonant; it flies into the vowel and they fuse.
export function SyllableMerge({ task, onComplete }: TaskProps<SyllableMergeData>) {
  const show = useDisplayText();
  const [consonant, vowel] = task.data.parts.map((p) => p.toLocaleUpperCase('uk-UA'));
  const [phase, setPhase] = useState<'apart' | 'flying' | 'fused'>('apart');

  const merge = () => {
    if (phase !== 'apart') return;
    setPhase('flying');
    sfx.whoosh();
    window.setTimeout(() => {
      setPhase('fused');
      onComplete();
    }, 520);
  };
  const drag = useDrag({ onTap: merge, onDrop: (target) => target === 'vowel' && merge(), disabled: phase !== 'apart' });

  return (
    <div className={`merge merge-${phase}`}>
      {phase !== 'fused' ? (
        <>
          <button
            type="button"
            className="option merge-card merge-consonant"
            aria-label={t.play.mergeHint}
            style={drag.style}
            {...drag.handlers}
            {...correctMark(true)}
          >
            <span className="read-syllable">{consonant}</span>
          </button>
          <div className="option merge-card merge-vowel" data-drop="vowel">
            <span className="read-syllable">{vowel}</span>
          </div>
        </>
      ) : (
        <div className="option merge-card merge-fused is-correct">
          <span className="read-syllable">{show(task.target)}</span>
        </div>
      )}
    </div>
  );
}
