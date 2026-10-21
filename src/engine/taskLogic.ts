// The pure half of the task plug-in contract. Each task type in src/tasks/<id>/logic.ts
// implements TaskLogic; its React Component (Phase 3) lives next to it. The engine only ever
// talks to this interface, so adding a task type never touches the game loop.
import type { z } from 'zod';
import type { Content, ItemKind } from './content.ts';
import type { Rng } from './rng.ts';
import type { Level } from './schema.ts';

export interface TaskConfigBase {
  type: string;
  count: number;
}

export interface BuildContext {
  content: Content;
  level: Level;
  rng: Rng;
  /** Items of a kind this level may use: its own pool plus review items from earlier levels. */
  candidates(kind: ItemKind): string[];
  /**
   * `n` confusable wrong options for `target`, best first-ish (weighted random).
   * Throws ShortageError if the content can't supply enough.
   */
  distractors(kind: ItemKind, target: string, n: number, opts?: { exclude?: readonly string[] }): string[];
}

export interface Built<Data> {
  target: string;
  /** Answer options including the target, already shuffled. Empty for tasks without choices. */
  options: string[];
  data: Data;
}

export interface TaskLogic<Config extends TaskConfigBase = TaskConfigBase, Data = unknown> {
  id: string;
  /** Validates (and fills defaults for) this type's entry in a level file. */
  configSchema: z.ZodType<Config>;
  /** Counts toward stars. */
  scored: boolean;
  /** A reading task: the target audio plays only after he answers. */
  reading: boolean;
  /** Only offered when the parent-nearby setting is on (readAloud). */
  needsParent: boolean;
  /** Voice line id of Соня's spoken instruction. */
  instruction(config: Config): string;
  /** Every item this task could ask about. */
  eligible(ctx: BuildContext, config: Config): string[];
  build(ctx: BuildContext, config: Config, target: string): Built<Data>;
}

// Registries hold task types with different Config/Data; each is only called with its own config.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTaskLogic = TaskLogic<any, any>;
export type TaskRegistry = Readonly<Record<string, AnyTaskLogic>>;

export class ShortageError extends Error {}

export interface TaskInstance<Data = unknown> {
  /** Unique within the session, stable for React keys and saved answers. */
  key: string;
  index: number;
  type: string;
  /** Dressed as the Magic Door mini-boss. */
  boss: boolean;
  scored: boolean;
  reading: boolean;
  kind: ItemKind;
  target: string;
  options: string[];
  data: Data;
  instruction: string;
}

export interface Session {
  levelId: string;
  tasks: TaskInstance[];
}
