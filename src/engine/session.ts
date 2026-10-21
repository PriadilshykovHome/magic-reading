// Builds one play-through of a level: 8–10 tasks reshuffled every time, plus the Magic Door.
import { kindOf, poolOf, reviewPoolOf, syllablesOfWords, type Content, type ItemKind } from './content.ts';
import { sentenceScore, syllableScore, wordScore } from './distractors.ts';
import { newest, pickTarget, weakest } from './picker.ts';
import type { Progress, Settings } from './progress.ts';
import { pickOne, shuffle, weightedSample, type Rng } from './rng.ts';
import type { Level, TaskEntry } from './schema.ts';
import {
  ShortageError,
  type AnyTaskLogic,
  type BuildContext,
  type Session,
  type TaskInstance,
  type TaskRegistry,
} from './taskLogic.ts';

export function createBuildContext(content: Content, level: Level, rng: Rng): BuildContext {
  const exists = (kind: ItemKind, id: string) =>
    (kind === 'syllable' ? content.syllables : kind === 'word' ? content.words : content.sentences).has(id);
  const candidates = (kind: ItemKind): string[] => {
    const own = poolOf(level, kind);
    const review = reviewPoolOf(content, level, kind);
    // Syllables also come from the level's words (e.g. the О in ОСА) for tiles and distractors.
    const fromWords =
      kind === 'syllable' ? syllablesOfWords(content, [...poolOf(level, 'word'), ...reviewPoolOf(content, level, 'word')]) : [];
    // Unknown ids are the validator's to report; never let them reach a task.
    return [...new Set([...own, ...review, ...fromWords])].filter((id) => exists(kind, id));
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
    distractors(kind, target, n, opts) {
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

export interface SessionInput {
  content: Content;
  level: Level;
  progress: Progress;
  settings: Pick<Settings, 'parentNearby'>;
  registry: TaskRegistry;
  rng: Rng;
  now: Date;
}

interface Slot {
  logic: AnyTaskLogic;
  config: TaskEntry;
}

export function buildSession(input: SessionInput): Session {
  const { content, level, progress, settings, registry, rng, now } = input;
  const ctx = createBuildContext(content, level, rng);

  const entries: Slot[] = level.tasks.map((entry) => {
    const logic = registry[entry.type];
    if (!logic) throw new Error(`${level.id}: unknown task type ${entry.type}`);
    return { logic, config: logic.configSchema.parse(entry) as TaskEntry };
  });

  // Expand counts; without a parent nearby, readAloud becomes another scored task (reading first).
  const fallbacks = entries.filter((e) => e.logic.scored && !e.logic.needsParent);
  const preferred = fallbacks.filter((e) => e.logic.reading);
  const slots: Slot[] = [];
  for (const entry of entries) {
    for (let i = 0; i < entry.config.count; i++) {
      if (entry.logic.needsParent && !settings.parentNearby) {
        if (fallbacks.length > 0) slots.push(pickOne(preferred.length > 0 ? preferred : fallbacks, rng));
      } else {
        slots.push(entry);
      }
    }
  }

  const ordered = orderSlots(slots, rng);
  const used = new Map<string, number>();
  const tasks: TaskInstance[] = [];
  let last: string | undefined;

  const instance = (logic: AnyTaskLogic, config: TaskEntry, target: string, boss: boolean): TaskInstance => {
    const built = logic.build(ctx, config, target);
    used.set(target, (used.get(target) ?? 0) + 1);
    last = target;
    return {
      key: `${level.id}#${tasks.length}`,
      index: tasks.length,
      type: logic.id,
      boss,
      scored: logic.scored,
      reading: logic.reading,
      kind: kindOf(target)!,
      target,
      options: built.options,
      data: built.data,
      instruction: boss ? `magicDoor.${logic.id}` : logic.instruction(config),
    };
  };

  for (const { logic, config } of ordered) {
    let eligible = logic.eligible(ctx, config);
    while (eligible.length > 0) {
      const review = new Set(eligible.flatMap((id) => (isReview(level, id) ? [id] : [])));
      const target = pickTarget({ eligible, review, progress, used, last, rng, now, config: content.config });
      try {
        tasks.push(instance(logic, config, target, false));
        break;
      } catch (error) {
        if (!(error instanceof ShortageError)) throw error;
        eligible = eligible.filter((id) => id !== target);
      }
    }
  }

  // The Magic Door: a scored task type dressed as a locked door, on the newest or weakest item.
  const inner = registry[level.boss.inner];
  if (!inner) throw new Error(`${level.id}: unknown boss task type ${level.boss.inner}`);
  const innerEntry = level.tasks.find((t) => t.type === inner.id) ?? { type: inner.id, count: 1 };
  const innerConfig = inner.configSchema.parse(innerEntry) as TaskEntry;
  const eligible = inner.eligible(ctx, innerConfig);
  const bossTarget =
    level.boss.item ?? (level.boss.pick === 'newest' ? newest(eligible, progress) : weakest(eligible, progress));
  tasks.push(instance(inner, innerConfig, bossTarget, true));

  return { levelId: level.id, tasks };
}

function isReview(level: Level, id: string): boolean {
  const kind = kindOf(id);
  return kind ? !poolOf(level, kind).includes(id) : false;
}

/** Unscored teaching tasks first, then the rest shuffled so the same type rarely repeats back to back. */
function orderSlots(slots: Slot[], rng: Rng): Slot[] {
  const teaching = slots.filter((s) => !s.logic.scored);
  const rest = slots.filter((s) => s.logic.scored);
  let best = shuffle(rest, rng);
  let bestRepeats = repeats(best);
  for (let attempt = 0; attempt < 30 && bestRepeats > 0; attempt++) {
    const candidate = shuffle(rest, rng);
    const r = repeats(candidate);
    if (r < bestRepeats) [best, bestRepeats] = [candidate, r];
  }
  return [...teaching, ...best];
}

function repeats(slots: Slot[]): number {
  let n = 0;
  for (let i = 1; i < slots.length; i++) if (slots[i]!.logic.id === slots[i - 1]!.logic.id) n++;
  return n;
}
