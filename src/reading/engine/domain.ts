// What the reading game tells the shared engine about its items: which kind an id is, which items
// a level may use (its pool, review from earlier levels, syllables of its words) and how
// confusable two items are.
import type { BuildContext, DomainEngine, TaskLogic, TaskConfigBase } from '../../core/engine/taskLogic.ts';
import { ShortageError } from '../../core/engine/taskLogic.ts';
import { weightedSample, type Rng } from '../../core/engine/rng.ts';
import { hasItem, kindOf, poolOf, reviewPoolOf, syllablesOfWords, type Content, type ItemKind } from './content.ts';
import { sentenceScore, syllableScore, wordScore } from './distractors.ts';
import type { Swaps } from './scene.ts';
import type { Level } from './schema.ts';

export type ReadingBuildContext = BuildContext<Content>;
export type ReadingTaskLogic<Config extends TaskConfigBase, Data> = TaskLogic<Config, Data, Content>;

const asKind = (kind: string): ItemKind => {
  if (kind !== 'syllable' && kind !== 'word' && kind !== 'sentence') throw new Error(`Unknown item kind ${kind}`);
  return kind;
};

function createBuildContext(content: Content, level: Level, rng: Rng): ReadingBuildContext {
  const exists = (kind: ItemKind, id: string) =>
    (kind === 'syllable' ? content.syllables : kind === 'word' ? content.words : content.sentences).has(id);
  // Review spans every earlier level, so each kind is gathered once per level and remembered.
  const cache = new Map<ItemKind, string[]>();
  const candidates = (kindName: string): string[] => {
    const kind = asKind(kindName);
    const cached = cache.get(kind);
    if (cached) return cached;
    const own = poolOf(level, kind);
    const review = reviewPoolOf(content, level, kind);
    // Syllables also come from the level's words (e.g. the О in ОСА) for tiles and distractors.
    const fromWords =
      kind === 'syllable' ? syllablesOfWords(content, [...poolOf(level, 'word'), ...reviewPoolOf(content, level, 'word')]) : [];
    // Unknown ids are the validator's to report; never let them reach a task.
    const all = [...new Set([...own, ...review, ...fromWords])].filter((id) => exists(kind, id));
    cache.set(kind, all);
    return all;
  };

  const score = (kind: ItemKind, target: string, other: string): number => {
    const { syllables, words, sentences, config } = content;
    if (kind === 'syllable') return syllableScore(syllables.get(target)!, syllables.get(other)!, config.letters.vowels);
    if (kind === 'word') return wordScore(words.get(target)!, words.get(other)!);
    return sentenceScore(sentences.get(target)!, sentences.get(other)!);
  };

  return {
    content,
    level,
    rng,
    candidates,
    isReview(id) {
      const kind = kindOf(id);
      return kind ? !poolOf(level, kind).includes(id) : false;
    },
    distractors(kindName, target, n, opts) {
      const kind = asKind(kindName);
      const exclude = new Set(opts?.exclude ?? []);
      const pool = candidates(kind).filter((id) => id !== target && !exclude.has(id));
      const scored = pool.map((id) => ({ id, s: score(kind, target, id) })).filter((c) => Number.isFinite(c.s));
      if (scored.length < n) {
        throw new ShortageError(`${level.id}: only ${scored.length} usable wrong options for ${target}, need ${n}`);
      }
      return weightedSample(scored, n, (c) => (c.s + 1) ** 2, rng).map((c) => c.id);
    },
  };
}

export const readingEngine: DomainEngine<Content> = {
  kindOf,
  hasItem,
  createBuildContext,
};

/** What a wrong picture may swap in: the words this level knows that have a picture, and the actions. */
export function sceneSwaps(ctx: ReadingBuildContext): Swaps {
  const { words, actions } = ctx.content;
  const picture = (thing: string) => words.get(`w-${thing}`)?.emoji;
  return {
    things: ctx.candidates('word').map((id) => id.slice('w-'.length)).filter((thing) => picture(thing)),
    actions: [...actions.keys()],
    samePicture: (a, b) => picture(a) === picture(b),
  };
}
