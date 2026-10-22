// Units × templates → the levels he plays. A world lists units: the letters each teaches plus a
// row of level templates (content/templates.json). Expanding them derives, for every level, the
// letters known so far, the items it introduces, review from everything earlier, its intro and
// Magic Door, its card and what unlocks it. Content grows by a line per word and per level.
import type { WorldContent } from '../../core/engine/content.ts';
import { WARMUP_ID } from '../../core/engine/rewards.ts';
import type { World } from '../../core/engine/schema.ts';
import { lettersOf, translit } from './lexicon.ts';
import {
  LevelSchema,
  type ItemKindName,
  type Letters,
  type Level,
  type LevelEntry,
  type Lexicon,
  type Template,
  type Templates,
  type Unit,
  type WorldFile,
} from './schema.ts';

export interface WorldSource {
  file: string;
  data: WorldFile;
}

export type Fresh = Record<ItemKindName, string[]>;

export interface LevelPlan {
  id: string;
  world: string;
  file: string;
  unit: string;
  /** The template it was made from (none for a level written out in full). */
  template?: string;
  /** Every letter known by this level, in teaching order. */
  known: string;
  /** What this level introduces: its own pool, for template levels assigned automatically. */
  fresh: Fresh;
}

export interface Curriculum {
  worlds: WorldContent<World, Level>[];
  /** One per level, in play order. */
  plans: LevelPlan[];
}

type Report = (file: string, message: string) => void;

interface Slot {
  source: WorldSource;
  unit: Unit;
  unitIndex: number;
  /** Position in play order. */
  index: number;
  id: string;
  entry: Exclude<LevelEntry, string>;
  templateName?: string;
  template?: Template;
  lastInUnit: boolean;
}

const KINDS: readonly ItemKindName[] = ['syllable', 'word', 'sentence'];
const POOL_KEY = { syllable: 'syllables', word: 'words', sentence: 'sentences' } as const;
const emptyFresh = (): Fresh => ({ syllable: [], word: [], sentence: [] });

/** What Соня names in her intro: the unit's letters ("Е"; a unit of two says "К, Р"). */
const topicText = (letters: string[]) => letters.join(', ');

export function expandCurriculum(
  worlds: readonly WorldSource[],
  templates: Templates,
  lexicon: Lexicon,
  drills: readonly string[],
  letterRules: Letters,
  error: Report,
): Curriculum {
  const sorted = [...worlds].sort((a, b) => a.data.order - b.data.order);

  // 1. Units in order, each with every letter known by then.
  const known: string[] = [];
  const unitKnown: Set<string>[] = [];
  const slots: Slot[] = [];
  for (const source of sorted) {
    for (const unit of source.data.units) {
      for (const ch of lettersOf(unit.letters)) {
        if (known.includes(ch)) error(source.file, `unit ${unit.key}: ${ch} was already taught earlier`);
        else known.push(ch);
      }
      unitKnown.push(new Set(known));
      const unitIndex = unitKnown.length - 1;
      const repeats = new Map<string, number>();
      unit.levels.forEach((raw, i) => {
        const entry = typeof raw === 'string' ? { t: raw } : raw;
        const templateName = entry.t;
        const template = templateName ? templates[templateName] : undefined;
        if (templateName && !template) error(source.file, `unit ${unit.key}: unknown template ${templateName}`);
        let id = entry.id;
        if (!id && templateName) {
          const n = (repeats.get(templateName) ?? 0) + 1;
          repeats.set(templateName, n);
          id = `${source.data.id}/${unit.key}-${templateName}${n > 1 ? `-${n}` : ''}`;
        }
        id ??= `${source.data.id}/${unit.key}-${i + 1}`;
        slots.push({ source, unit, unitIndex, index: slots.length, id, entry, templateName, template, lastInUnit: i === unit.levels.length - 1 });
      });
    }
  }
  const knownAt = (s: Slot) => [...unitKnown[s.unitIndex]!].join('');

  // 2. Items the levels written out in full teach themselves, and items saved for a Magic Door.
  const taughtByHand = new Set<string>();
  const doorAt = new Map<string, number>();
  for (const s of slots) {
    if (!s.template && s.entry.pool) for (const kind of KINDS) for (const id of s.entry.pool[POOL_KEY[kind]]) taughtByHand.add(id);
    const door = s.entry.door ?? s.entry.boss?.item;
    if (door) doorAt.set(door, s.index);
  }

  // 3. When each item becomes readable: the first unit that has taught all its letters.
  const texts = new Map<string, string>();
  for (const s of lexicon.syllables) texts.set(s.id, s.text);
  for (const w of lexicon.words) texts.set(w.id, w.text);
  for (const s of lexicon.sentences) texts.set(s.id, s.text);
  const readyUnit = new Map<string, number>();
  const allKnown = unitKnown.at(-1) ?? new Set<string>();
  for (const [id, text] of texts) {
    const letters = lettersOf(text);
    readyUnit.set(id, unitKnown.findIndex((set) => letters.every((ch) => set.has(ch))));
    const untaught = [...new Set(letters.filter((ch) => !allKnown.has(ch)))];
    if (untaught.length && !taughtByHand.has(id)) error('content/worlds', `${id} uses ${untaught.join(', ')}, which no unit teaches yet`);
  }
  const pending: Record<ItemKindName, string[]> = {
    syllable: drills.filter((id) => !taughtByHand.has(id)),
    word: lexicon.words.map((w) => w.id).filter((id) => !taughtByHand.has(id)),
    sentence: lexicon.sentences.map((s) => s.id).filter((id) => !taughtByHand.has(id)),
  };
  for (const kind of KINDS) {
    const order = new Map(pending[kind].map((id, i) => [id, i]));
    pending[kind] = pending[kind]
      .filter((id) => readyUnit.get(id)! >= 0)
      .sort((a, b) => readyUnit.get(a)! - readyUnit.get(b)! || order.get(a)! - order.get(b)!);
  }

  // 4. Each template level introduces what has become readable, shared evenly with the unit's
  //    later levels that teach the same kind. A door's item waits until after its door.
  const fresh = new Map<number, Fresh>();
  for (const s of slots) {
    const own = emptyFresh();
    if (s.template) {
      for (const kind of s.template.teaches) {
        const available = pending[kind].filter((id) => readyUnit.get(id)! <= s.unitIndex && (doorAt.get(id) ?? -1) < s.index);
        const teachersLeft = slots.filter((o) => o.unitIndex === s.unitIndex && o.index >= s.index && o.template?.teaches.includes(kind)).length;
        own[kind] = available.slice(0, Math.ceil(available.length / teachersLeft));
        const taken = new Set(own[kind]);
        pending[kind] = pending[kind].filter((id) => !taken.has(id));
      }
    } else if (s.entry.pool) {
      for (const kind of KINDS) own[kind] = [...s.entry.pool[POOL_KEY[kind]]];
    }
    fresh.set(s.index, own);
  }
  for (const kind of KINDS) {
    for (const id of pending[kind]) {
      if (doorAt.has(id)) continue; // met at its Magic Door; later levels will review it
      error('content/worlds', `${id} is never taught: no level teaches ${kind}s once its letters are known`);
    }
  }

  // 5. The levels themselves.
  const levels: Level[] = [];
  const plans: LevelPlan[] = [];
  const recentSentence = (before: number) => {
    for (let i = before - 1; i >= 0; i--) {
      const sentences = fresh.get(i)!.sentence;
      if (sentences.length) return sentences.at(-1);
    }
    return undefined;
  };
  for (const s of slots) {
    const own = fresh.get(s.index)!;
    const { entry, template: t } = s;
    const card = entry.card ?? (s.lastInUnit ? s.unit.card : undefined);
    const base = { id: s.id, unlockAfter: levels.at(-1)?.id ?? null, reward: { card } };
    let draft: unknown;
    if (!t) {
      draft = { ...base, title: entry.title, intro: entry.intro, pool: entry.pool, reviewFrom: entry.reviewFrom ?? [], tasks: entry.tasks, boss: entry.boss };
    } else {
      const letters = lettersOf(s.unit.letters);
      const topic = letters.length ? { text: topicText(letters), key: letters.map((ch) => translit(ch, letterRules)).join('-') } : undefined;
      const twoParts = (id: string) => lexicon.syllables.find((x) => x.id === id)?.parts.length === 2;
      const longWord = (id: string) => (lexicon.words.find((x) => x.id === id)?.syllables.length ?? 0) > 1;
      const demoItems =
        t.intro.from === 'recent'
          ? [recentSentence(s.index)].filter((x) => x !== undefined)
          : t.intro.demo === 'syllableMerge'
            ? own.syllable.filter(twoParts).slice(0, 2)
            : t.intro.demo === 'wordMerge'
              ? own.word.filter(longWord).slice(0, 2)
              : own.sentence.slice(0, 1);
      if (!entry.intro && demoItems.length === 0) error(s.source.file, `${s.id}: its ${t.intro.demo} demo has nothing to show`);
      draft = {
        ...base,
        title: entry.title ?? (topic ? `${t.title} · ${topic.text}` : t.title),
        intro: entry.intro ?? { voice: t.intro.voice, ...(topic ? { topic } : {}), demo: { type: t.intro.demo, items: demoItems } },
        pool: entry.pool ?? { syllables: own.syllable, words: own.word, sentences: own.sentence },
        // review every earlier level, without listing them all (290 levels would mean ~40,000 ids)
        ...(entry.reviewFrom ? { reviewFrom: entry.reviewFrom } : { reviewEarlier: true }),
        tasks: entry.tasks ?? t.tasks,
        boss: entry.boss ?? {
          type: 'magicDoor',
          inner: t.boss.inner,
          pick: t.boss.pick,
          ...(entry.door ? { item: entry.door } : {}),
          ...(entry.line ? { openedLine: entry.line } : {}),
        },
      };
    }
    const parsed = LevelSchema.safeParse(draft);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) error(s.source.file, `${s.id}: ${issue.path.join('.') || '(root)'}: ${issue.message}`);
      continue;
    }
    levels.push(parsed.data);
    plans.push({ id: s.id, world: s.source.data.id, file: s.source.file, unit: s.unit.key, template: s.templateName, known: knownAt(s), fresh: own });
  }

  const byId = new Map(levels.map((l) => [l.id, l]));
  return {
    worlds: sorted.map(({ data }) => ({
      world: { id: data.id, order: data.order, title: data.title, look: data.look, signs: data.signs },
      levels: slots.filter((s) => s.source.data === data).flatMap((s) => byId.get(s.id) ?? []),
    })),
    plans,
  };
}

/** Levels he must have finished before the daily warm-up has enough to review. */
export const WARMUP_AFTER_LEVELS = 3;

/**
 * Today's warm-up: a few tasks from the warm-up template over everything he has finished (the
 * picker favours what is most overdue), plus a small door. Null until he has finished enough.
 */
export function warmupLevel(template: Template | undefined, finished: readonly string[], recentSentence: string | undefined): Level | null {
  if (!template || finished.length < WARMUP_AFTER_LEVELS || !recentSentence) return null;
  return LevelSchema.parse({
    id: WARMUP_ID,
    title: template.title,
    unlockAfter: null,
    intro: { voice: template.intro.voice, demo: { type: 'readAlong', items: [recentSentence] } },
    pool: {},
    reviewFrom: [...finished],
    tasks: template.tasks,
    boss: { type: 'magicDoor', inner: template.boss.inner, pick: template.boss.pick },
  });
}

export interface CurveRow {
  n: number;
  id: string;
  template: string;
  newSyllables: number;
  newWords: number;
  newSentences: number;
  knownWords: number;
  knownSentences: number;
}

/** The progress curve: what each level adds and how much he can read by then. */
export function curve(levels: readonly Level[], plans: readonly LevelPlan[]): CurveRow[] {
  const seen: Record<ItemKindName, Set<string>> = { syllable: new Set(), word: new Set(), sentence: new Set() };
  const kindOf = (id: string): ItemKindName | undefined =>
    id.startsWith('syl-') ? 'syllable' : id.startsWith('w-') ? 'word' : id.startsWith('s-') ? 'sentence' : undefined;
  return levels.map((level, i) => {
    const before = KINDS.map((k) => seen[k].size);
    for (const kind of KINDS) for (const id of level.pool[POOL_KEY[kind]]) seen[kind].add(id);
    const door = level.boss.item;
    if (door) seen[kindOf(door) ?? 'word'].add(door);
    return {
      n: i + 1,
      id: level.id,
      template: plans[i]?.template ?? '—',
      newSyllables: seen.syllable.size - before[0]!,
      newWords: seen.word.size - before[1]!,
      newSentences: seen.sentence.size - before[2]!,
      knownWords: seen.word.size,
      knownSentences: seen.sentence.size,
    };
  });
}
