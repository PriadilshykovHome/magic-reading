// Builds one play-through of a level: 8–10 tasks reshuffled every time, plus the Magic Door.
// Game-agnostic: the domain pack supplies the items (candidates, review, distractors).
import type { GameContent, LevelOf } from './content.ts';
import { newest, pickTarget, weakest } from './picker.ts';
import type { Progress, Settings } from './progress.ts';
import { pickOne, shuffle, type Rng } from './rng.ts';
import type { TaskEntry } from './schema.ts';
import {
  ShortageError,
  type AnyTaskLogic,
  type DomainEngine,
  type Session,
  type TaskInstance,
  type TaskRegistry,
} from './taskLogic.ts';

export interface SessionInput<C extends GameContent> {
  content: C;
  level: LevelOf<C>;
  domain: DomainEngine<C>;
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

export function buildSession<C extends GameContent>(input: SessionInput<C>): Session {
  const { content, level, domain, progress, settings, registry, rng, now } = input;
  const ctx = domain.createBuildContext(content, level, rng);

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
      kind: domain.kindOf(target) ?? '',
      target,
      options: built.options,
      ...(built.answer !== undefined ? { answer: built.answer } : {}),
      data: built.data,
      instruction: boss ? `magicDoor.${logic.id}` : logic.instruction(config),
    };
  };

  for (const { logic, config } of ordered) {
    let eligible = logic.eligible(ctx, config);
    while (eligible.length > 0) {
      const review = new Set(eligible.filter((id) => ctx.isReview(id)));
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
