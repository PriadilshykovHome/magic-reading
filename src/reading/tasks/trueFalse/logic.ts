// «Правда чи жарт?» A sentence and one picture: either the sentence's own scene or a near miss
// with one thing changed. He taps ✓ if the picture shows the sentence, 🙃 if it's a joke.
import { z } from 'zod';
import { sceneSwaps, type ReadingTaskLogic } from '../../engine/domain.ts';
import { wrongScenes, type Scene } from '../../engine/scene.ts';

const configSchema = z.strictObject({
  type: z.literal('trueFalse'),
  count: z.number().int().min(1),
});
type Config = z.output<typeof configSchema>;

export interface TrueFalseData {
  scene: Scene;
  /** Whether the picture shows what the sentence says. */
  truth: boolean;
}

export const VERDICTS = ['yes', 'no'] as const;

export const trueFalse: ReadingTaskLogic<Config, TrueFalseData> = {
  id: 'trueFalse',
  configSchema,
  scored: true,
  reading: true,
  needsParent: false,
  instruction: () => 'instructions.trueFalse',
  eligible: (ctx) => ctx.candidates('sentence'),
  build: (ctx, _config, target) => {
    const own = ctx.content.sentences.get(target)!.scene;
    const joke = ctx.rng() < 0.5 ? wrongScenes(own, 1, sceneSwaps(ctx), ctx.rng)[0] : undefined;
    const truth = joke === undefined;
    return { target, options: [...VERDICTS], answer: truth ? 'yes' : 'no', data: { scene: joke ?? own, truth } };
  },
};
