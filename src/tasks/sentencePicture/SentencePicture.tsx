import { correctMark, pictureOf, useChoice, useDisplayText } from '../shared/helpers';
import type { TaskProps } from '../types';

// Reading task: a short sentence, he taps the matching scene. Spoken only after he answers.
export function SentencePicture({ task, hint, onMiss, onComplete }: TaskProps) {
  const show = useDisplayText();
  const { pick, stateOf, isWrong } = useChoice(task, onMiss, onComplete);
  return (
    <div className="task-layout">
      <div className="task-prompt parchment">
        <span className="read-sentence">{show(task.target)}</span>
      </div>
      <div className="choices is-picture is-scene">
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
