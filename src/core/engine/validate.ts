// Content validation, as pure functions. These are the checks every game shares (levels, tasks,
// the Magic Door, Соня's lines, config and card references, assets); each domain pack composes
// them with its own item checks (reading: src/reading/engine/validate.ts). Errors fail the
// build; missing audio and pictures are warnings until release.
import type { z } from 'zod';
import type { GameContent, LevelOf } from './content.ts';
import { seededRandom } from './rng.ts';
import { ShortageError, type AnyTaskLogic, type BuildContext, type DomainEngine, type TaskRegistry } from './taskLogic.ts';
import { TEMPLATE_KEYS, templateKeys } from './text.ts';

export interface Issue {
  severity: 'error' | 'warning';
  file: string;
  message: string;
}

export interface RawFile {
  file: string;
  data: unknown;
}

export interface ValidateOptions {
  /** Whether a public asset exists, e.g. ('audio', 'voice/syl/ma.mp3'). Omit to skip asset checks. */
  hasAsset?: (kind: 'audio' | 'image', path: string) => boolean;
  /** Treat missing assets as errors (for release builds). */
  strictAssets?: boolean;
}

export type Report = (file: string, message: string) => void;

/** Parses one file, reporting every schema issue with its path. */
export function parseFile<S extends z.ZodType>(schema: S, { file, data }: RawFile, error: Report): z.output<S> | undefined {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  for (const issue of result.error.issues) error(file, `${issue.path.join('.') || '(root)'}: ${issue.message}`);
  return undefined;
}

export function checkDuplicates(file: string, label: string, ids: readonly string[], error: Report) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) error(file, `duplicate ${label} id ${id}`);
    seen.add(id);
  }
}

/** Where each kind of shared content lives, for error messages. */
export interface GameFiles {
  config: string;
  cards: string;
  voice: string;
  levelFile(levelId: string): string;
}

/**
 * Every check that doesn't depend on what the game teaches. `dryBuild` builds every task each
 * level could ask (seconds at 300 levels), so CI, tests and dev do it; production startup doesn't.
 */
export function checkGame<C extends GameContent>(
  content: C,
  files: GameFiles,
  registry: TaskRegistry,
  domain: DomainEngine<C>,
  error: Report,
  { dryBuild = true }: { dryBuild?: boolean } = {},
) {
  for (const level of content.levels.values()) {
    checkLevel(content, level as LevelOf<C>, files.levelFile(level.id), registry, domain, error, dryBuild);
  }
  checkVoice(content, files.voice, registry, error);

  const { config } = content;
  if (!content.cards.has(config.windows.surpriseCard)) error(files.config, `windows.surpriseCard: unknown card ${config.windows.surpriseCard}`);
  if (!content.cards.has(config.eggs.pysankyCard)) error(files.config, `eggs.pysankyCard: unknown card ${config.eggs.pysankyCard}`);
  if (!content.levels.has(config.creature.hatchAfterLevel)) {
    error(files.config, `creature.hatchAfterLevel: unknown level ${config.creature.hatchAfterLevel}`);
  }
}

function checkLevel<C extends GameContent>(
  content: C,
  level: LevelOf<C>,
  file: string,
  registry: TaskRegistry,
  domain: DomainEngine<C>,
  error: Report,
  deep: boolean,
) {
  const { config } = content;
  const order = content.levelOrder;
  const at = order.indexOf(level.id);
  const earlier = (id: string) => order.indexOf(id) >= 0 && order.indexOf(id) < at;

  if (level.unlockAfter !== null && !earlier(level.unlockAfter)) error(file, `unlockAfter: ${level.unlockAfter} must be an earlier level`);
  if (level.unlockAfter === null && at > 0) error(file, 'unlockAfter: only the very first level may be open from the start');
  for (const id of level.reviewFrom) if (!earlier(id)) error(file, `reviewFrom: ${id} must be an earlier level`);
  if (!content.voice.has(level.intro.voice)) error(file, `intro.voice: no voice line ${level.intro.voice}`);
  if (level.reward.card && !content.cards.has(level.reward.card)) error(file, `reward.card: unknown card ${level.reward.card}`);

  // Tasks: known type, valid config, enough content to build every possible target.
  const ctx = domain.createBuildContext(content, level, seededRandom(1));
  let total = 0;
  let readsAlone = false;
  let parentTasks = 0;
  let fallbacks = 0;
  let tasksValid = true;
  level.tasks.forEach((entry, i) => {
    const where = `tasks[${i}] ${entry.type}`;
    total += entry.count;
    const logic = registry[entry.type];
    if (!logic) {
      tasksValid = false;
      return error(file, `${where}: unknown task type`);
    }
    const parsed = logic.configSchema.safeParse(entry);
    if (!parsed.success) {
      tasksValid = false;
      for (const issue of parsed.error.issues) error(file, `${where}: ${issue.path.join('.') || '(root)'}: ${issue.message}`);
      return;
    }
    if (logic.reading && !logic.needsParent) readsAlone = true;
    if (logic.needsParent) parentTasks += entry.count;
    if (logic.scored && !logic.needsParent) fallbacks++;
    if (deep) dryBuild(ctx, logic, parsed.data, where, file, error);
  });
  if (total < config.session.minTasks || total > config.session.maxTasks) {
    error(file, `tasks add up to ${total}; a level needs ${config.session.minTasks}–${config.session.maxTasks}`);
  }
  if (tasksValid && parentTasks > 0 && fallbacks === 0) {
    error(file, 'readAloud needs another scored task to stand in when no parent is nearby');
  }

  // The Magic Door: a scored task he can solve alone.
  const inner = registry[level.boss.inner];
  if (!inner) error(file, `boss.inner: unknown task type ${level.boss.inner}`);
  else if (!inner.scored || inner.needsParent) error(file, `boss.inner: ${inner.id} must be scored and playable without a parent`);
  else {
    const entry = level.tasks.find((t) => t.type === inner.id) ?? { type: inner.id, count: 1 };
    const parsed = inner.configSchema.safeParse(entry);
    if (parsed.success) {
      if (inner.reading) readsAlone = true;
      if (level.boss.item) {
        // A fixed door item may stay out of the pool (a surprise kept for the door), but must build.
        if (!domain.hasItem(content, level.boss.item)) error(file, `boss.item: unknown item ${level.boss.item}`);
        else if (deep) dryBuildOne(ctx, inner, parsed.data, level.boss.item, 'boss', file, error);
      } else if (deep && inner.eligible(ctx, parsed.data).length === 0) error(file, `boss: ${inner.id} has nothing to ask about`);
      if (level.boss.openedLine && !content.voice.has(level.boss.openedLine)) error(file, `boss.openedLine: no voice line ${level.boss.openedLine}`);
    }
  }
  if (tasksValid && !readsAlone) error(file, 'every level needs a reading task he can solve alone (reading vs listening rule)');
}

function dryBuild(ctx: BuildContext<GameContent>, logic: AnyTaskLogic, config: unknown, where: string, file: string, error: Report) {
  const eligible = logic.eligible(ctx, config);
  if (eligible.length === 0) return error(file, `${where}: nothing to ask about (check the pool)`);
  const max = ctx.content.config.answers.maxChoices;
  for (const target of eligible) {
    try {
      const built = logic.build(ctx, config, target);
      if (built.options.length > max && !logic.manyOptions) {
        error(file, `${where}: ${built.options.length} options for ${target}; never more than ${max}`);
      }
    } catch (e) {
      if (e instanceof ShortageError) error(file, `${where}: ${e.message}`);
      else throw e;
    }
  }
}

function dryBuildOne(ctx: BuildContext<GameContent>, logic: AnyTaskLogic, config: unknown, target: string, where: string, file: string, error: Report) {
  try {
    logic.build(ctx, config, target);
  } catch (e) {
    if (e instanceof ShortageError) error(file, `${where}: ${e.message}`);
    else throw e;
  }
}

function checkVoice(content: GameContent, file: string, registry: TaskRegistry, error: Report) {
  for (const logic of Object.values(registry)) {
    for (const variant of logic.instructionVariants ?? [{}]) {
      const id = logic.instruction({ type: logic.id, count: 1, ...variant });
      if (!content.voice.has(id)) error(file, `no instruction line ${id} for task type ${logic.id}`);
    }
  }
  for (const level of content.levels.values()) {
    const id = `magicDoor.${level.boss.inner}`;
    if (!content.voice.has(id)) error(file, `no Magic Door line ${id} (used by ${level.id})`);
  }
  for (const id of ['greeting', 'praise', 'retry', 'hint', 'streak.wand', 'streak.wave', 'goldenSpark']) {
    if (!content.voice.has(id)) error(file, `missing voice line ${id}`);
  }
  const known = new Set<string>(TEMPLATE_KEYS);
  for (const [id, value] of content.voice) {
    for (const line of Array.isArray(value) ? value : [value]) {
      for (const key of templateKeys(line)) if (!known.has(key)) error(file, `${id}: unknown placeholder {${key}}`);
    }
  }
}

/** Reports a missing asset as a warning (or an error with strictAssets). */
export function assetChecker(options: ValidateOptions, issues: Issue[]) {
  const { hasAsset, strictAssets = false } = options;
  return (file: string, kind: 'audio' | 'image', path: string, what: string) => {
    if (hasAsset && !hasAsset(kind, path)) {
      issues.push({ severity: strictAssets ? 'error' : 'warning', file, message: `missing ${kind} ${path} (${what})` });
    }
  };
}

/** Card art and Соня's recorded lines. */
export function checkGameAssets(content: GameContent, files: GameFiles, missing: ReturnType<typeof assetChecker>) {
  for (const c of content.cards.values()) missing(files.cards, 'image', c.art, c.id);
  const topics = new Map<string, Set<string>>(); // line id → topic keys it is said with
  for (const level of content.levels.values()) {
    const { voice, topic } = level.intro;
    if (topic) topics.set(voice, (topics.get(voice) ?? new Set()).add(topic.key));
  }
  for (const [id, value] of content.voice) {
    const list = Array.isArray(value) ? value : [value];
    list.forEach((line, i) => {
      const name = Array.isArray(value) ? `${id}.${i + 1}` : id;
      // A line about a level's topic ("…літера {topic}") is recorded once per topic.
      const variants = line.includes('{topic}') ? [...(topics.get(id) ?? [])].map((key) => `${name}.${key}`) : [name];
      for (const variant of variants) missing(files.voice, 'audio', `voice/sonya/${variant}.mp3`, `voice line ${variant}`);
    });
  }
}
