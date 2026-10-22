// A sentence's picture, written as a tiny spec instead of drawn: "kit:small sleeps on dyvan" is a
// small cat (w-kit), sleeping, on a sofa (w-dyvan). The scene composer draws it from the words'
// pictures, and wrong pictures are made by changing exactly one thing the sentence says (who,
// what, where, doing what, how big), so the only way to the right one is to read every word.
import { shuffle, type Rng } from '../../core/engine/rng.ts';

export const RELATIONS = ['on', 'in', 'under', 'near', 'and', 'has'] as const;
export type Relation = (typeof RELATIONS)[number];
/** Relations a wrong picture may swap between (a different place). */
const PLACES: readonly Relation[] = ['on', 'in', 'under', 'near'];
export const SIZES = ['small', 'big'] as const;
export type Size = (typeof SIZES)[number];

export interface Thing {
  /** A word's id without "w-" (its picture is the word's). */
  word: string;
  size?: Size;
}

export interface Scene {
  who: Thing;
  /** An action from content/scenes.json, shown as a small sign by whoever does it. */
  does?: string;
  rel?: Relation;
  what?: Thing;
}

const thing = (token: string): Thing => {
  const [word, size] = token.split(':');
  return size ? { word: word!, size: size as Size } : { word: word! };
};

/** "kit:small sleeps on dyvan" → Scene; throws with a readable message when malformed. */
export function parseScene(spec: string, actions: readonly string[]): Scene {
  const tokens = spec.trim().split(/\s+/);
  const scene: Scene = { who: thing(tokens.shift() ?? '') };
  if (tokens[0] && actions.includes(tokens[0])) scene.does = tokens.shift();
  if (tokens.length) {
    const rel = tokens.shift() as Relation;
    if (!RELATIONS.includes(rel)) throw new Error(`unknown relation "${rel}" (one of ${RELATIONS.join(', ')}, or an action)`);
    const what = tokens.shift();
    if (!what) throw new Error(`"${rel}" needs something after it`);
    scene.rel = rel;
    scene.what = thing(what);
  }
  if (tokens.length) throw new Error(`unexpected "${tokens.join(' ')}"`);
  for (const t of [scene.who, scene.what]) {
    if (t && t.size && !SIZES.includes(t.size)) throw new Error(`unknown size "${t.size}" (small or big)`);
    if (t && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.word)) throw new Error(`"${t.word}" should be a word id without "w-"`);
  }
  return scene;
}

export const sceneKey = (s: Scene): string => {
  const t = (x: Thing) => (x.size ? `${x.word}:${x.size}` : x.word);
  return ['scene', t(s.who), s.does, s.rel, s.what && t(s.what)].filter(Boolean).join(' ');
};

export const thingsOf = (s: Scene): string[] => [s.who.word, ...(s.what ? [s.what.word] : [])];

export interface Swaps {
  /** Things that could stand in for whoever or whatever: ones he knows, with their own pictures. */
  things: readonly string[];
  actions: readonly string[];
  /** Two words share a picture: never swap one for the other (the pictures would match). */
  samePicture(a: string, b: string): boolean;
}

/**
 * `n` wrong pictures for a scene, each differing in exactly one thing the sentence says. Swapping
 * who or what comes first (easiest to read), then the place or the action, then the size.
 */
export function wrongScenes(scene: Scene, n: number, swaps: Swaps, rng: Rng): Scene[] {
  const used = new Set(thingsOf(scene));
  const others = shuffle(swaps.things.filter((w) => !used.has(w) && !thingsOf(scene).some((u) => swaps.samePicture(u, w))), rng);
  const out: Scene[] = [];
  const seen = new Set([sceneKey(scene)]);
  const add = (s: Scene) => {
    const key = sceneKey(s);
    if (out.length < n && !seen.has(key)) {
      seen.add(key);
      out.push(s);
    }
  };
  const swapWho = () => others.length && add({ ...scene, who: { ...scene.who, word: others.shift()! } });
  const swapWhat = () => scene.what && others.length && add({ ...scene, what: { ...scene.what, word: others.shift()! } });
  // Alternate who / what so two wrong pictures don't both change the same slot.
  for (let i = 0; i < n && others.length; i++) (i % 2 === 0 || !scene.what ? swapWho : swapWhat)();
  if (scene.rel && PLACES.includes(scene.rel)) for (const rel of shuffle(PLACES.filter((r) => r !== scene.rel), rng)) add({ ...scene, rel });
  if (scene.does) for (const does of shuffle(swaps.actions.filter((a) => a !== scene.does), rng)) add({ ...scene, does });
  for (const key of ['who', 'what'] as const) {
    const t = scene[key];
    if (t?.size) add({ ...scene, [key]: { ...t, size: t.size === 'small' ? 'big' : 'small' } });
  }
  return out;
}
