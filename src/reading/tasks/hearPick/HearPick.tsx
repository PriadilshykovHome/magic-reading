import { voice } from '../../../core/audio/voice';
import { t } from '../../../core/strings';
import { SpeakerIcon } from '../../../core/ui/Icons';
import { useDisplayText } from '../shared/helpers';
import { useChoice } from '../../../core/tasks/useChoice';
import { correctMark } from '../../../core/testMode';
import type { TaskProps } from '../../../core/tasks/types';

// Listening task: Соня says it, he finds the written card. The ear button replays it.
export function HearPick({ task, hint, onMiss, onComplete }: TaskProps) {
  const show = useDisplayText();
  const { pick, stateOf, isWrong } = useChoice(task, onMiss, onComplete);
  return (
    <div className="task-layout">
      <div className="task-prompt is-listen">
        <button type="button" className="listen-button" aria-label={t.play.repeat} onClick={() => voice.item(task.target, 'interrupt')}>
          <SpeakerIcon />
        </button>
      </div>
      <div className={`choices is-text is-${task.kind}`}>
        {task.options.map((id) => (
          <button
            key={id}
            type="button"
            className={`option ${stateOf(id, hint)}`}
            disabled={isWrong(id)}
            onClick={() => pick(id)}
            {...correctMark(id === task.target)}
          >
            <span className={task.kind === 'word' ? 'read-word' : 'read-syllable'}>{show(id)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
