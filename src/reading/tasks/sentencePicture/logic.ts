// A short sentence; he taps the picture that shows it. The wrong pictures are the same scene with
// exactly one thing changed that the sentence says (who, what, where, doing what, how big), so the
// only way to the right one is to read every word.
import { z } from 'zod';
import { shuffle } from '../../../core/engine/rng.ts';
import { ShortageError } from '../../../core/engine/taskLogic.ts';
import { sceneSwaps, type ReadingTaskLogic } from '../../engine/domain.ts';
import { sceneKey, wrongScenes, type Scene } from '../../engine/scene.ts';

const configSchema = z.strictObject({
  type: z.literal('sentencePicture'),
  count: z.number().int().min(1),
  choices: z.number().int().min(2).max(3).default(3),
});
type Config = z.output<typeof configSchema>;

export interface ScenePicksData {
  /** The picture for each option: the target sentence's own scene and the near misses. */
  scenes: Record<string, Scene>;
}

export const sentencePicture: ReadingTaskLogic<Config, ScenePicksData> = {
  id: 'sentencePicture',
  configSchema,
  scored: true,
  reading: true,
  needsParent: false,
  instruction: () => 'instructions.sentencePicture',
  eligible: (ctx) => ctx.candidates('sentence'),
  build: (ctx, config, target) => {
    const scene = ctx.content.sentences.get(target)!.scene;
    const wrong = wrongScenes(scene, config.choices - 1, sceneSwaps(ctx), ctx.rng);
    if (wrong.length < config.choices - 1) throw new ShortageError(`${ctx.level.id}: only ${wrong.length} wrong pictures for ${target}`);
    const scenes: Record<string, Scene> = { [target]: scene, ...Object.fromEntries(wrong.map((s) => [sceneKey(s), s])) };
    return { target, options: shuffle(Object.keys(scenes), ctx.rng), data: { scenes } };
  },
};
