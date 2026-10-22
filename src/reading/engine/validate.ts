// Content validation for the reading game: the shared checks (src/core/engine/validate.ts) plus
// the lexicon, the letters each world may use, pools and intro demos. The CLI
// (scripts/validate-content.ts) feeds it the files, tests feed it broken fixtures.
import { assetChecker, checkDuplicates, checkGame, checkGameAssets, parseFile, type Issue, type RawFile, type Report, type ValidateOptions } from '../../core/engine/validate.ts';
import { CardsSchema, StringsSchema, VoiceSchema } from '../../core/engine/schema.ts';
import type { TaskRegistry } from '../../core/engine/taskLogic.ts';
import { hasItem, indexContent, kindOf, poolOf, syllablesOfWords, type Content, type ItemKind } from './content.ts';
import { readingEngine } from './domain.ts';
import { ConfigSchema, LevelSchema, LexiconSchema, WorldSchema, type Level, type World } from './schema.ts';

export type { Issue, RawFile, ValidateOptions } from '../../core/engine/validate.ts';

export interface RawBundle {
  config: RawFile;
  lexicon: RawFile;
  cards: RawFile;
  voice: RawFile;
  strings: RawFile;
  worlds: { world: RawFile; levels: RawFile[] }[];
}

export function validateContent(
  raw: RawBundle,
  registry: TaskRegistry,
  options: ValidateOptions = {},
): { issues: Issue[]; content: Content | null } {
  const issues: Issue[] = [];
  const error: Report = (file, message) => issues.push({ severity: 'error', file, message });

  // 1. Every file matches its schema.
  const config = parseFile(ConfigSchema, raw.config, error);
  const lexicon = parseFile(LexiconSchema, raw.lexicon, error);
  const cards = parseFile(CardsSchema, raw.cards, error);
  const voice = parseFile(VoiceSchema, raw.voice, error);
  const strings = parseFile(StringsSchema, raw.strings, error);
  const worlds = raw.worlds.map((w) => ({
    world: parseFile(WorldSchema, w.world, error),
    file: w.world.file,
    levels: w.levels.map((l) => ({ level: parseFile(LevelSchema, l, error), file: l.file })),
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
  const files = {
    config: raw.config.file,
    cards: raw.cards.file,
    voice: raw.voice.file,
    levelFile: (id: string) => levelFile.get(id) ?? 'content/worlds',
  };

  // 2. Unique ids.
  checkDuplicates(raw.lexicon.file, 'lexicon', [
    ...lexicon.syllables.map((s) => s.id),
    ...lexicon.words.map((w) => w.id),
    ...lexicon.sentences.map((s) => s.id),
  ], error);
  checkDuplicates(raw.cards.file, 'card', cards.cards.map((c) => c.id), error);
  checkDuplicates('content/worlds', 'level', worlds.flatMap((w) => w.levels.map((l) => l.level!.id)), error);

  // 3. Lexicon: hand-written splits must add up.
  checkLexicon(content, raw.lexicon.file, error);

  // 4. Worlds use only their letters; pools and demos name real items of the right kind.
  for (const w of worlds) checkWorld(content, w.world!, w.file, error);
  for (const level of content.levels.values()) checkLevelItems(content, level, files.levelFile(level.id), error);

  // 5. Everything every game checks: tasks, the Magic Door, Соня's lines, config references.
  checkGame(content, files, registry, readingEngine, error);

  // 6. Assets.
  if (options.hasAsset) {
    const missing = assetChecker(options, issues);
    checkItemAssets(content, raw.lexicon.file, missing);
    checkGameAssets(content, files, missing);
  }

  return { issues, content };
}

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

const DEMO_KIND: Record<Level['intro']['demo']['type'], ItemKind> = { syllableMerge: 'syllable', wordMerge: 'word', readAlong: 'sentence' };

function checkLevelItems(content: Content, level: Level, file: string, error: Report) {
  for (const kind of ['syllable', 'word', 'sentence'] as const) {
    for (const id of poolOf(level, kind)) if (!itemOfKind(content, id, kind)) error(file, `pool: unknown ${kind} ${id}`);
  }
  const demoKind = DEMO_KIND[level.intro.demo.type];
  for (const id of level.intro.demo.items) if (!itemOfKind(content, id, demoKind)) error(file, `intro.demo: unknown ${demoKind} ${id}`);
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
  for (const s of content.sentences.values()) {
    missing(file, 'audio', s.audio, s.id);
    missing(file, 'image', s.scene, s.id);
  }
}
