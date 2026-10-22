// The pure half of the plug-in contract. Each task type implements TaskLogic (its React
// Component lives next to it), and each game's domain pack implements DomainEngine. The session
// builder and validator only talk to these interfaces, so adding a task type or a whole new game
// never touches the game loop.
import type { z } from 'zod';
import type { GameContent, LevelOf } from './content.ts';
import type { Rng } from './rng.ts';

export interface TaskConfigBase {
  type: string;
  count: number;
}

export interface BuildContext<C extends GameContent = GameContent> {
  content: C;
  level: LevelOf<C>;
  rng: Rng;
  /** Items of a kind this level may use: its own pool plus review items from earlier levels. */
  candidates(kind: string): string[];
  /** Whether an item comes from earlier levels (review) rather than this level's own pool. */
  isReview(id: string): boolean;
  /**
   * `n` confusable wrong options for `target`, best first-ish (weighted random).
   * Throws ShortageError if the content can't supply enough.
   */
  distractors(kind: string, target: string, n: number, opts?: { exclude?: readonly string[] }): string[];
}

export interface Built<Data> {
  target: string;
  /** Answer options including the right one, already shuffled. Empty for tasks without choices. */
  options: string[];
  /** The right option, when it isn't the target itself (the missing syllable of a word, "yes"). */
  answer?: string;
  data: Data;
}

export interface TaskLogic<Config extends TaskConfigBase = TaskConfigBase, Data = unknown, C extends GameContent = GameContent> {
  id: string;
  /** Validates (and fills defaults for) this type's entry in a level file. */
  configSchema: z.ZodType<Config>;
  /** Counts toward stars. */
  scored: boolean;
  /** A reading task: the target audio plays only after he answers. */
  reading: boolean;
  /** A listening task that plays the target itself (syllableMerge: "М… А… МА"), so Соня's
   *  instruction doesn't end with it. */
  playsTarget?: boolean;
  /** Only offered when the parent-nearby setting is on (readAloud). */
  needsParent: boolean;
  /** May show more than the usual 3 options (bubblePop's bubbles are the one exception). */
  manyOptions?: boolean;
  /** Config variants whose instruction line must exist, when it depends on the config. */
  instructionVariants?: Partial<Config>[];
  /** Voice line id of Соня's spoken instruction. */
  instruction(config: Config): string;
  /** Every item this task could ask about. */
  eligible(ctx: BuildContext<C>, config: Config): string[];
  build(ctx: BuildContext<C>, config: Config, target: string): Built<Data>;
}

// Registries hold task types with different Config/Data; each is only called with its own config.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTaskLogic = TaskLogic<any, any, any>;
export type TaskRegistry = Readonly<Record<string, AnyTaskLogic>>;

export class ShortageError extends Error {}

/** What a game's domain pack tells the engine about its items. */
export interface DomainEngine<C extends GameContent = GameContent> {
  /** The kind of an item id (reading: syllable, word, sentence), or undefined if it isn't one. */
  kindOf(id: string): string | undefined;
  hasItem(content: C, id: string): boolean;
  /** Candidates, review and confusable distractors for one level. */
  createBuildContext(content: C, level: LevelOf<C>, rng: Rng): BuildContext<C>;
}

export interface TaskInstance<Data = unknown> {
  /** Unique within the session, stable for React keys and saved answers. */
  key: string;
  index: number;
  type: string;
  /** Dressed as the Magic Door mini-boss. */
  boss: boolean;
  scored: boolean;
  reading: boolean;
  /** Соня's instruction ends with the target (listening tasks, unless they play it themselves). */
  sayTarget: boolean;
  kind: string;
  target: string;
  options: string[];
  /** The right option, when it isn't the target. */
  answer?: string;
  data: Data;
  instruction: string;
}

export interface Session {
  levelId: string;
  tasks: TaskInstance[];
}
