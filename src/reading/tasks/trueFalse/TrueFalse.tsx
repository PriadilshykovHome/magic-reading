import { t } from '../../../core/strings';
import { useChoice } from '../../../core/tasks/useChoice';
import type { TaskProps } from '../../../core/tasks/types';
import { correctMark } from '../../../core/testMode';
import { CheckIcon, JokeIcon } from '../../../core/ui/Icons';
import { SceneView } from '../shared/SceneView';
import { useDisplayText } from '../shared/helpers';
import type { TrueFalseData } from './logic';

// Reading task: he reads the sentence and checks the picture: ✓ it shows that, or 🙃 a joke.
export function TrueFalse({ task, hint, onMiss, onComplete }: TaskProps<TrueFalseData>) {
  const show = useDisplayText();
  const { pick, stateOf, isWrong } = useChoice(task, onMiss, onComplete);
  return (
    <div className="task-layout">
      <div className="task-prompt parchment true-false-prompt">
        <span className="read-sentence">{show(task.target)}</span>
        <span className="true-false-picture scene-box">
          <SceneView scene={task.data.scene} />
        </span>
      </div>
      <div className="choices is-verdict">
        {task.options.map((id) => (
          <button
            key={id}
            type="button"
            className={`option verdict is-${id} ${stateOf(id, hint)}`}
            aria-label={id === 'yes' ? t.play.isTrue : t.play.isJoke}
            disabled={isWrong(id)}
            onClick={() => pick(id)}
            {...correctMark(id === task.answer)}
          >
            {id === 'yes' ? <CheckIcon /> : <JokeIcon />}
          </button>
        ))}
      </div>
    </div>
  );
}
