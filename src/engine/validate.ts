// Content validation, as a pure function: the CLI (scripts/validate-content.ts) feeds it the
// files, tests feed it broken fixtures. Errors fail the build; missing audio and pictures are
// warnings until release (the app falls back to browser speech and emoji meanwhile).
import type { z } from 'zod';
import { hasItem, indexContent, kindOf, poolOf, syllablesOfWords, type Content, type ItemKind } from './content.ts';
import { seededRandom } from './rng.ts';
import {
  CardsSchema,
  ConfigSchema,
  LevelSchema,
  LexiconSchema,
  StringsSchema,
  VoiceSchema,
  WorldSchema,
  type Level,
  type World,
} from './schema.ts';
import { createBuildContext } from './session.ts';
import { ShortageError, type TaskRegistry } from './taskLogic.ts';
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

export interface RawBundle {
  config: RawFile;
  lexicon: RawFile;
  cards: RawFile;
  voice: RawFile;
  strings: RawFile;
  worlds: { world: RawFile; levels: RawFile[] }[];
}

export interface ValidateOptions {
  /** Whether a public asset exists, e.g. ('audio', 'voice/syl/ma.mp3'). Omit to skip asset checks. */
  hasAsset?: (kind: 'audio' | 'image', path: string) => boolean;
  /** Treat missing assets as errors (for release builds). */
  strictAssets?: boolean;
}

export function validateContent(
  raw: RawBundle,
  registry: TaskRegistry,
  options: ValidateOptions = {},
): { issues: Issue[]; content: Content | null } {
  const issues: Issue[] = [];
  const error = (file: string, message: string) => issues.push({ severity: 'error', file, message });

  // 1. Every file matches its schema.
  const parse = <S extends z.ZodType>(schema: S, { file, data }: RawFile): z.output<S> | undefined => {
    const result = schema.safeParse(data);
    if (result.success) return result.data;
    for (const issue of result.error.issues) error(file, `${issue.path.join('.') || '(root)'}: ${issue.message}`);
    return undefined;
  };
  const config = parse(ConfigSchema, raw.config);
  const lexicon = parse(LexiconSchema, raw.lexicon);
  const cards = parse(CardsSchema, raw.cards);
  const voice = parse(VoiceSchema, raw.voice);
  const strings = parse(StringsSchema, raw.strings);
  const worlds = raw.worlds.map((w) => ({
    world: parse(WorldSchema, w.world),
    file: w.world.file,
    levels: w.levels.map((l) => ({ level: parse(LevelSchema, l), file: l.file })),
  }));
  if (!config || !lexicon || !cards || !voice || !strings) return { issues, content: null };
  if (worlds.some((w) => !w.world || w.levels.some((l) => !l.level))) return { issues, content: null };

  const content = indexContent({
    config,
    lexicon,
    cards: cards.cards,
    voice,
    strings,
    worlds: worlds.map((w) => ({ world: w.world!, levels: w.levels.map((l) => l.level!) })),
  });
  const levelFile = new Map(worlds.flatMap((w) => w.levels.map((l) => [l.level!.id, l.file] as const)));

  // 2. Unique ids.
  const dupes = (file: string, label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) error(file, `duplicate ${label} id ${id}`);
      seen.add(id);
    }
  };
  dupes(raw.lexicon.file, 'lexicon', [
    ...lexicon.syllables.map((s) => s.id),
    ...lexicon.words.map((w) => w.id),
    ...lexicon.sentences.map((s) => s.id),
  ]);
  dupes(raw.cards.file, 'card', cards.cards.map((c) => c.id));
  dupes('content/worlds', 'level', worlds.flatMap((w) => w.levels.map((l) => l.level!.id)));

  // 3. Lexicon: hand-written splits must add up.
  checkLexicon(content, raw.lexicon.file, error);

  // 4. Worlds and levels.
  for (const w of worlds) checkWorld(content, w.world!, w.file, error);
  for (const level of content.levels.values()) {
    checkLevel(content, level, levelFile.get(level.id) ?? 'content/worlds', registry, error);
  }

  // 5. Voice lines: Соня needs an instruction for every task type and only known placeholders.
  checkVoice(content, raw.voice.file, registry, error);

  // 6. Config and card references.
  if (!content.cards.has(config.windows.surpriseCard)) error(raw.config.file, `windows.surpriseCard: unknown card ${config.windows.surpriseCard}`);
  if (!content.cards.has(config.eggs.pysankyCard)) error(raw.config.file, `eggs.pysankyCard: unknown card ${config.eggs.pysankyCard}`);
  if (!content.levels.has(config.creature.hatchAfterLevel)) error(raw.config.file, `creature.hatchAfterLevel: unknown level ${config.creature.hatchAfterLevel}`);

  // 7. Assets.
  if (options.hasAsset) checkAssets(content, raw, options.hasAsset, options.strictAssets ?? false, issues);

  return { issues, content };
}

type Report = (file: string, message: string) => void;

const letters = (text: string) => [...text.toLocaleUpperCase('uk-UA')].filter((ch) => /\p{L}/u.test(ch));
const sentenceWords = (text: string) => text.replace(/[^\p{L}\s'’-]/gu, '').trim().split(/\s+/);

function checkLexicon(content: Content, file: string, error: Report) {
  for (const s of content.syllables.values()) {
    if (s.parts.join('') !== s.text) error(file, `${s.id}: parts ${s.parts.join('+')} don't spell ${s.text}`);
  }
  for (const w of content.words.values()) {
    const missing = w.syllables.filter((id) => !content.syllables.has(id));
    if (missing.length) error(file, `${w.id}: unknown syllables ${missing.join(', ')}`);
    else {
      const spelled = w.syllables.map((id) => content.syllables.get(id)!.text).join('');
      if (spelled !== w.text) error(file, `${w.id}: syllables spell ${spelled}, not ${w.text}`);
    }
  }
  for (const s of content.sentences.values()) {
    const words = sentenceWords(s.text);
    if (words.join(' ') !== s.words.join(' ')) error(file, `${s.id}: words [${s.words.join(' ')}] don't match "${s.text}"`);
    if (s.wordStartsSec) {
      if (s.wordStartsSec.length !== s.words.length) error(file, `${s.id}: wordStartsSec needs one time per word`);
      if (s.wordStartsSec.some((t, i) => i > 0 && t <= s.wordStartsSec![i - 1]!)) error(file, `${s.id}: wordStartsSec must increase`);
    }
  }
}

function checkWorld(content: Content, world: World, file: string, error: Report) {
  const levels = content.worlds.find((w) => w.world.id === world.id)?.levels ?? [];
  for (const level of levels) {
    if (!level.id.startsWith(`${world.id}/`)) error(file, `level ${level.id} doesn't belong to world ${world.id}`);
  }
  // Every word he meets in this world uses only the letters taught so far.
  const allowed = new Set(letters(world.allowedLetters));
  const used = new Set<string>();
  for (const level of levels) {
    for (const kind of ['syllable', 'word', 'sentence'] as const) for (const id of poolOf(level, kind)) used.add(id);
    for (const id of syllablesOfWords(content, level.pool.words)) used.add(id);
    for (const id of level.intro.demo.items) used.add(id);
    if (level.boss.item) used.add(level.boss.item);
  }
  for (const id of used) {
    if (!hasItem(content, id)) continue; // reported per level
    const text = content.syllables.get(id)?.text ?? content.words.get(id)?.text ?? content.sentences.get(id)!.text;
    const extra = [...new Set(letters(text).filter((ch) => !allowed.has(ch)))];
    if (extra.length) error(file, `${id} "${text}" uses letters not taught in this world: ${extra.join(' ')}`);
  }
}

function checkLevel(content: Content, level: Level, file: string, registry: TaskRegistry, error: Report) {
  const { config } = content;
  const order = content.levelOrder;
  const at = order.indexOf(level.id);

  // Pools and references.
  for (const kind of ['syllable', 'word', 'sentence'] as const) {
    for (const id of poolOf(level, kind)) if (!itemOfKind(content, id, kind)) error(file, `pool: unknown ${kind} ${id}`);
  }
  if (level.unlockAfter !== null && !(order.indexOf(level.unlockAfter) >= 0 && order.indexOf(level.unlockAfter) < at)) {
    error(file, `unlockAfter: ${level.unlockAfter} must be an earlier level`);
  }
  if (level.unlockAfter === null && at > 0) error(file, 'unlockAfter: only the very first level may be open from the start');
  for (const id of level.reviewFrom) {
    if (!(order.indexOf(id) >= 0 && order.indexOf(id) < at)) error(file, `reviewFrom: ${id} must be an earlier level`);
  }
  const demoKind: ItemKind = level.intro.demo.type === 'syllableMerge' ? 'syllable' : 'sentence';
  for (const id of level.intro.demo.items) if (!itemOfKind(content, id, demoKind)) error(file, `intro.demo: unknown ${demoKind} ${id}`);
  if (!content.voice.has(level.intro.voice)) error(file, `intro.voice: no voice line ${level.intro.voice}`);
  if (!content.cards.has(level.reward.card)) error(file, `reward.card: unknown card ${level.reward.card}`);

  // Tasks: known type, valid config, enough content to build every possible target.
  const ctx = createBuildContext(content, level, seededRandom(1));
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
    dryBuild(ctx, logic, parsed.data, where, file, error);
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
      const eligible = inner.eligible(ctx, parsed.data);
      if (level.boss.item && !eligible.includes(level.boss.item)) error(file, `boss.item: ${level.boss.item} can't be used by ${inner.id} here`);
      if (eligible.length === 0) error(file, `boss: ${inner.id} has nothing to ask about`);
    }
  }
  if (tasksValid && !readsAlone) error(file, 'every level needs a reading task he can solve alone (reading vs listening rule)');
}

function dryBuild(
  ctx: ReturnType<typeof createBuildContext>,
  logic: TaskRegistry[string],
  config: unknown,
  where: string,
  file: string,
  error: Report,
) {
  const eligible = logic.eligible(ctx, config);
  if (eligible.length === 0) return error(file, `${where}: nothing to ask about (check the pool)`);
  for (const target of eligible) {
    try {
      const built = logic.build(ctx, config, target);
      if (built.options.length > ctx.content.config.answers.maxChoices && logic.id !== 'bubblePop') {
        error(file, `${where}: ${built.options.length} options for ${target}; never more than ${ctx.content.config.answers.maxChoices}`);
      }
    } catch (e) {
      if (e instanceof ShortageError) error(file, `${where}: ${e.message}`);
      else throw e;
    }
  }
}

function itemOfKind(content: Content, id: string, kind: ItemKind): boolean {
  return kindOf(id) === kind && hasItem(content, id);
}

function checkVoice(content: Content, file: string, registry: TaskRegistry, error: Report) {
  for (const logic of Object.values(registry)) {
    const kinds = logic.id === 'hearPick' ? ['syllable', 'word'] : [undefined];
    for (const itemKind of kinds) {
      const id = logic.instruction({ type: logic.id, count: 1, itemKind });
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

function checkAssets(
  content: Content,
  raw: RawBundle,
  hasAsset: NonNullable<ValidateOptions['hasAsset']>,
  strict: boolean,
  issues: Issue[],
) {
  const missing = (file: string, kind: 'audio' | 'image', path: string, what: string) => {
    if (!hasAsset(kind, path)) issues.push({ severity: strict ? 'error' : 'warning', file, message: `missing ${kind} ${path} (${what})` });
  };
  for (const s of content.syllables.values()) {
    missing(raw.lexicon.file, 'audio', s.audio, s.id);
    if (s.audioStretched) missing(raw.lexicon.file, 'audio', s.audioStretched, `${s.id} stretched`);
  }
  for (const w of content.words.values()) {
    missing(raw.lexicon.file, 'audio', w.audio, w.id);
    if (w.audioSyllables) missing(raw.lexicon.file, 'audio', w.audioSyllables, `${w.id} by syllables`);
    missing(raw.lexicon.file, 'image', w.picture, w.id);
  }
  for (const s of content.sentences.values()) {
    missing(raw.lexicon.file, 'audio', s.audio, s.id);
    missing(raw.lexicon.file, 'image', s.scene, s.id);
  }
  for (const c of content.cards.values()) missing(raw.cards.file, 'image', c.art, c.id);
  for (const [id, value] of content.voice) {
    const count = Array.isArray(value) ? value.length : 1;
    for (let i = 0; i < count; i++) {
      const name = Array.isArray(value) ? `${id}.${i + 1}` : id;
      missing(raw.voice.file, 'audio', `voice/sonya/${name}.mp3`, `voice line ${name}`);
    }
  }
}
