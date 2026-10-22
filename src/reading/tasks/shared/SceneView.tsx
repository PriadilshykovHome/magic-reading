import { content } from '../../content/load';
import type { Scene, Thing } from '../../engine/scene';

/**
 * A sentence's picture, composed from its words' pictures: who sits on, in, under or near what,
 * who has what, a small sign for what someone is doing, small or big. Placeholder art until the
 * illustrations exist, but laid out so the picture says exactly what the sentence says.
 */
export function SceneView({ scene }: { scene: Scene }) {
  const picture = (t: Thing) => content.words.get(`w-${t.word}`)?.emoji ?? '';
  const sign = scene.does ? content.actions.get(scene.does) : undefined;
  const thing = (t: Thing, role: 'who' | 'what') => (
    <span className={`scene-thing is-${role} ${t.size ? `is-${t.size}` : ''}`}>
      {picture(t)}
      {role === 'who' && sign && <span className="scene-sign">{sign}</span>}
    </span>
  );
  return (
    <span className={`scene-view is-${scene.rel ?? 'alone'}`} aria-hidden="true">
      {scene.what && thing(scene.what, 'what')}
      {thing(scene.who, 'who')}
    </span>
  );
}
