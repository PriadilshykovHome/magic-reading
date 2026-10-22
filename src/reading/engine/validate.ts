// Content validation for the reading game: derive the lexicon, expand units × templates into
// levels, then the shared checks (src/core/engine/validate.ts) plus the reading ones: letters
// known at each level, pools and demos, and the curriculum's pace. The CLI
// (scripts/validate-content.ts) feeds it the files, tests feed it broken fixtures.
import { CardsSchema, StringsSchema, VoiceSchema } from '../../core/engine/schema.ts';
import type { TaskRegistry } from '../../core/engine/taskLogic.ts';
import { seededRandom } from '../../core/engine/rng.ts';
import {
  assetChecker,
  checkDuplicates,
  checkGame,
  checkGameAssets,
  checkTasks,
  parseFile,
  type Issue,
  type RawFile,
  type Report,
  type ValidateOptions,
} from '../../core/engine/validate.ts';
import { hasItem, indexContent, kindOf, poolOf, syllablesOfWords, type Content, type ItemKind } from './content.ts';
import { expandCurriculum, warmupLevel } from './curriculum.ts';
import { readingEngine } from './domain.ts';
import { deriveLexicon, lettersOf } from './lexicon.ts';
import { ConfigSchema, LexiconFileSchema, ScenesSchema, TemplatesSchema, WorldFileSchema, type Level } from './schema.ts';

export type { Issue, RawFile, ValidateOptions } from '../../core/engine/validate.ts';

export interface RawBundle {
  config: RawFile;
  templates: RawFile;
  scenes: RawFile;
  cards: RawFile;
  voice: RawFile;
  strings: RawFile;
  worlds: { world: RawFile; lexicon: RawFile }[];
}

/** The curriculum's pace: what a unit and a level may introduce. */
const PACE = { minNewWordsPerLetterUnit: 6, maxNewItemsPerLevel: 12 };

export function validateContent(
  raw: RawBundle,
  registry: TaskRegistry,
  options: ValidateOptions & { deep?: boolean } = {},
): { issues: Issue[]; content: Content | null } {
  const issues: Issue[] = [];
  const error: Report = (file, message) => issues.push({ severity: 'error', file, message });

  // 1. Every file matches its schema.
  const config = parseFile(ConfigSchema, raw.config, error);
  const templates = parseFile(TemplatesSchema, raw.templates, error);
  const scenes = parseFile(ScenesSchema, raw.scenes, error);
  const cards = parseFile(CardsSchema, raw.cards, error);
  const voice = parseFile(VoiceSchema, raw.voice, error);
  const strings = parseFile(StringsSchema, raw.strings, error);
  const worlds = raw.worlds.map((w) => ({
    world: { file: w.world.file, data: parseFile(WorldFileSchema, w.world, error) },
    lexicon: { file: w.lexicon.file, data: parseFile(LexiconFileSchema, w.lexicon, error) },
  }));
  if (!config || !templates || !scenes || !cards || !voice || !strings) return { issues, content: null };
  if (worlds.some((w) => !w.world.data || !w.lexicon.data)) return { issues, content: null };

  // 2. Derive the lexicon and expand the curriculum (worlds in play order, so are their lexicons).
  const ordered = [...worlds].sort((a, b) => a.world.data!.order - b.world.data!.order);
  const { lexicon, drills } = deriveLexicon(
    ordered.map((w) => ({ file: w.lexicon.file, data: w.lexicon.data! })),
    config.letters,
    Object.keys(scenes.actions),
    error,
  );
  // Every thing in a picture is a word with a picture of its own.
  const pictured = new Set(lexicon.words.map((w) => w.id.slice('w-'.length)));
  for (const s of lexicon.sentences) {
    for (const thing of s.depicts) if (!pictured.has(thing)) error('content/worlds/*/lexicon.json', `${s.id}: its scene shows "${thing}", but there is no word w-${thing}`);
  }
  const curriculum = expandCurriculum(
    ordered.map((w) => ({ file: w.world.file, data: w.world.data! })),
    templates,
    lexicon,
    drills,
    config.letters,
    error,
  );
  if (issues.some((i) => i.severity === 'error')) return { issues, content: null };

  const content = indexContent({
    config,
    lexicon,
    actions: scenes.actions,
    cards: cards.cards,
    voice,
    strings,
    worlds: curriculum.worlds,
    plans: curriculum.plans,
    ...(templates.warmup ? { warmup: templates.warmup } : {}),
  });
  const fileOfLevel = (id: string) => content.plans.get(id)?.file ?? 'content/worlds';
  const files = { config: raw.config.file, cards: raw.cards.file, voice: raw.voice.file, levelFile: fileOfLevel };

  // 3. Unique ids.
  const lexiconFiles = 'content/worlds/*/lexicon.json';
  checkDuplicates(lexiconFiles, 'lexicon', [...lexicon.words.map((w) => w.id), ...lexicon.sentences.map((s) => s.id)], error);
  checkDuplicates(raw.cards.file, 'card', cards.cards.map((c) => c.id), error);
  checkDuplicates('content/worlds', 'level', curriculum.plans.map((p) => p.id), error);

  // 4. Every level uses only letters known by then; pools and demos name real items of the right kind.
  for (const level of content.levels.values()) checkLevelItems(content, level, fileOfLevel(level.id), error);
  checkPace(content, error);
  checkSigns(content, error);

  // 5. Everything every game checks: tasks, the Magic Door, Соня's lines, config references.
  checkGame(content, files, registry, readingEngine, error, { dryBuild: options.deep ?? true });

  // 6. The daily warm-up builds over every level.
  const warmup = warmupLevel(content.warmup, content.levelOrder, lexicon.sentences.at(-1)?.id);
  if (warmup && (options.deep ?? true)) {
    const ctx = readingEngine.createBuildContext(content, warmup, seededRandom(1));
    checkTasks(ctx, warmup.tasks, registry, raw.templates.file, (file, message) => error(file, `warmup: ${message}`), true);
  }

  // 7. Assets.
  if (options.hasAsset) {
    const missing = assetChecker(options, issues);
    checkItemAssets(content, lexiconFiles, missing);
    checkGameAssets(content, files, missing);
  }

  return { issues, content };
}

const DEMO_KIND: Record<Level['intro']['demo']['type'], ItemKind> = { syllableMerge: 'syllable', wordMerge: 'word', readAlong: 'sentence' };

function itemText(content: Content, id: string): string | undefined {
  return (content.syllables.get(id) ?? content.words.get(id) ?? content.sentences.get(id))?.text;
}

function checkLevelItems(content: Content, level: Level, file: string, error: Report) {
  for (const kind of ['syllable', 'word', 'sentence'] as const) {
    for (const id of poolOf(level, kind)) if (!itemOfKind(content, id, kind)) error(file, `${level.id}: pool: unknown ${kind} ${id}`);
  }
  const demoKind = DEMO_KIND[level.intro.demo.type];
  for (const id of level.intro.demo.items) if (!itemOfKind(content, id, demoKind)) error(file, `${level.id}: intro.demo: unknown ${demoKind} ${id}`);

  // He meets only letters he has been taught.
  const known = new Set(content.plans.get(level.id)?.known ?? '');
  const used = new Set([
    ...poolOf(level, 'syllable'),
    ...poolOf(level, 'word'),
    ...poolOf(level, 'sentence'),
    ...syllablesOfWords(content, level.pool.words),
    ...level.intro.demo.items,
    ...(level.boss.item ? [level.boss.item] : []),
  ]);
  for (const id of used) {
    const text = itemText(content, id);
    if (text === undefined) continue; // reported above
    const extra = [...new Set(lettersOf(text).filter((ch) => !known.has(ch)))];
    if (extra.length) error(file, `${level.id}: ${id} "${text}" uses letters not taught yet: ${extra.join(' ')}`);
  }
}

/** Steady progress: each letter unit brings enough new words, and no level floods him. */
function checkPace(content: Content, error: Report) {
  const newWordsByUnit = new Map<string, { file: string; count: number; letters: boolean }>();
  for (const plan of content.plans.values()) {
    if (!plan.template) continue;
    const added = plan.fresh.syllable.length + plan.fresh.word.length + plan.fresh.sentence.length;
    if (added > PACE.maxNewItemsPerLevel) error(plan.file, `${plan.id} introduces ${added} new items; at most ${PACE.maxNewItemsPerLevel}`);
    const key = `${plan.world}/${plan.unit}`;
    const unit = newWordsByUnit.get(key) ?? { file: plan.file, count: 0, letters: false };
    unit.count += plan.fresh.word.length;
    unit.letters ||= plan.fresh.syllable.length > 0;
    newWordsByUnit.set(key, unit);
  }
  for (const [key, unit] of newWordsByUnit) {
    if (unit.letters && unit.count < PACE.minNewWordsPerLetterUnit) {
      error(unit.file, `unit ${key} teaches only ${unit.count} new words; a letter needs at least ${PACE.minNewWordsPerLetterUnit}`);
    }
  }
}

function itemOfKind(content: Content, id: string, kind: ItemKind): boolean {
  return kindOf(id) === kind && hasItem(content, id);
}

function checkItemAssets(content: Content, file: string, missing: ReturnType<typeof assetChecker>) {
  for (const s of content.syllables.values()) {
    missing(file, 'audio', s.audio, s.id);
    if (s.audioStretched) missing(file, 'audio', s.audioStretched, `${s.id} stretched`);
  }
  for (const w of content.words.values()) {
    missing(file, 'audio', w.audio, w.id);
    if (w.audioSyllables) missing(file, 'audio', w.audioSyllables, `${w.id} by syllables`);
    missing(file, 'image', w.picture, w.id);
  }
  for (const s of content.sentences.values()) missing(file, 'audio', s.audio, s.id);
}

/** A world's signposts name real words he can read by the end of that world. */
function checkSigns(content: Content, error: Report) {
  for (const { world, levels } of content.worlds) {
    const file = content.plans.get(levels[0]?.id ?? '')?.file ?? 'content/worlds';
    const known = content.plans.get(levels.at(-1)?.id ?? '')?.known ?? '';
    for (const id of world.signs) {
      const word = content.words.get(id);
      if (!word) error(file, `signs: unknown word ${id}`);
      else if (lettersOf(word.text).some((ch) => !known.includes(ch))) error(file, `signs: ${id} uses letters not taught by the end of ${world.id}`);
    }
  }
}
