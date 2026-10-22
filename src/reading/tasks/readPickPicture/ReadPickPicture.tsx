import { pictureOf, useDisplayText } from '../shared/helpers';
import { useChoice } from '../../../core/tasks/useChoice';
import { correctMark } from '../../../core/testMode';
import type { TaskProps } from '../../../core/tasks/types';

// Reading task: the word sits on parchment, he taps its picture. Nothing is spoken until he answers.
export function ReadPickPicture({ task, hint, onMiss, onComplete }: TaskProps) {
  const show = useDisplayText();
  const { pick, stateOf, isWrong } = useChoice(task, onMiss, onComplete);
  return (
    <div className="task-layout">
      <div className="task-prompt parchment">
        <span className="read-word">{show(task.target)}</span>
      </div>
      <div className="choices is-picture">
        {task.options.map((id) => (
          <button
            key={id}
            type="button"
            className={`option ${stateOf(id, hint)}`}
            disabled={isWrong(id)}
            onClick={() => pick(id)}
            {...correctMark(id === task.target)}
          >
            <span className="emoji-picture">{pictureOf(id)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
