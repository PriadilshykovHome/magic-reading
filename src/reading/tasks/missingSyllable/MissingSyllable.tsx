import { useChoice } from '../../../core/tasks/useChoice';
import type { TaskProps } from '../../../core/tasks/types';
import { correctMark } from '../../../core/testMode';
import { pictureOf, useDisplayText } from '../shared/helpers';
import type { MissingSyllableData } from './logic';

// Reading task: the picture and its word with a gap; he picks the syllable that fills it.
export function MissingSyllable({ task, hint, onMiss, onComplete }: TaskProps<MissingSyllableData>) {
  const show = useDisplayText();
  const { pick, stateOf, isWrong, solved } = useChoice(task, onMiss, onComplete);
  const { syllables, missing } = task.data;
  return (
    <div className="task-layout">
      <div className="task-prompt parchment missing-prompt">
        <span className="emoji-picture">{pictureOf(task.target)}</span>
        <span className="missing-word">
          {syllables.map((id, i) =>
            i === missing ? (
              <span key={i} className={`missing-gap ${solved ? 'is-filled' : ''}`}>
                <span className="read-word">{solved ? show(id) : ''}</span>
              </span>
            ) : (
              <span key={i} className="read-word">
                {show(id)}
              </span>
            ),
          )}
        </span>
      </div>
      <div className="choices is-text">
        {task.options.map((id) => (
          <button
            key={id}
            type="button"
            className={`option ${stateOf(id, hint)}`}
            disabled={isWrong(id)}
            onClick={() => pick(id)}
            {...correctMark(id === task.answer)}
          >
            <span className="read-syllable">{show(id)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
