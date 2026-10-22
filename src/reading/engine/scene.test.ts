import { expect, test } from 'vitest';
import { seededRandom } from '../../core/engine/rng';
import { parseScene, sceneKey, wrongScenes, type Scene } from './scene';
import { testContent } from './testContent';

const content = testContent();
const slots = (s: Scene) => [s.who.word, s.who.size, s.does, s.rel, s.what?.word, s.what?.size];

test('a wrong picture changes exactly one thing the sentence says, and never matches it', () => {
  const things = [...content.words.keys()].map((id) => id.slice(2));
  const swaps = { things, actions: [...content.actions.keys()], samePicture: (a: string, b: string) => content.words.get(`w-${a}`)?.emoji === content.words.get(`w-${b}`)?.emoji };
  const rng = seededRandom(5);
  for (const sentence of content.sentences.values()) {
    const wrong = wrongScenes(sentence.scene, 2, swaps, rng);
    expect(wrong, sentence.id).toHaveLength(2);
    for (const w of wrong) {
      const changed = slots(w).filter((v, i) => v !== slots(sentence.scene)[i]).length;
      expect(changed, `${sentence.id}: ${sceneKey(w)}`).toBe(1);
      expect(sceneKey(w)).not.toBe(sceneKey(sentence.scene));
    }
  }
  expect(() => parseScene('kit beside dyvan', [])).toThrow(/unknown relation/);
  expect(parseScene('kit:small sleeps on dyvan', ['sleeps'])).toEqual({ who: { word: 'kit', size: 'small' }, does: 'sleeps', rel: 'on', what: { word: 'dyvan' } });
});
