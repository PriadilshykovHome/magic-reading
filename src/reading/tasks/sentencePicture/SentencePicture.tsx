import { useChoice } from '../../../core/tasks/useChoice';
import type { TaskProps } from '../../../core/tasks/types';
import { correctMark } from '../../../core/testMode';
import { SceneView } from '../shared/SceneView';
import { useDisplayText } from '../shared/helpers';
import type { ScenePicksData } from './logic';

// Reading task: a short sentence, he taps the matching picture. Spoken only after he answers.
export function SentencePicture({ task, hint, onMiss, onComplete }: TaskProps<ScenePicksData>) {
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
            className={`option scene-box ${stateOf(id, hint)}`}
            disabled={isWrong(id)}
            onClick={() => pick(id)}
            {...correctMark(id === task.target)}
          >
            <SceneView scene={task.data.scenes[id]!} />
          </button>
        ))}
      </div>
    </div>
  );
}
