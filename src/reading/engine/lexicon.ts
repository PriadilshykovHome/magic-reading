// The lexicon as written (compact rows, one file per world) → the lexicon the game uses.
// Nothing derivable is written twice: a word's text and syllables come from its hand-written
// split, syllable ids from their letters, and every audio and picture path from the item's id.
// The letter rules (vowels, Latin spellings, soft sign, digraphs) are data: content/config.json.
import { parseScene, thingsOf } from './scene.ts';
import type { Letters, Lexicon, LexiconFile, Sentence, Syllable, Word } from './schema.ts';

/** Latin key for ids and file names ("МИШ" → "mysh"); anything else becomes "-". */
export function translit(text: string, letters: Letters): string {
  return [...text.toLocaleUpperCase('uk-UA')]
    .map((ch) => letters.latin[ch] ?? (/\p{L}/u.test(ch) ? '' : '-'))
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export const syllableId = (text: string, letters: Letters) => `syl-${translit(text, letters)}`;

/** The letters a text uses (upper case, letters only). */
export const lettersOf = (text: string) => [...text.toLocaleUpperCase('uk-UA')].filter((ch) => /\p{L}/u.test(ch));

/** A sentence's words, without punctuation. */
export const sentenceWords = (text: string) => text.replace(/[^\p{L}\s'’-]/gu, '').trim().split(/\s+/);

/** One part per sound: the soft sign and apostrophe stay with their consonant, and a digraph at
 *  the start of a syllable is one sound (examples in content/config.json). */
export function letterParts(text: string, letters: Letters): string[] {
  const parts: string[] = [];
  for (const ch of text) {
    if (letters.softeners.includes(ch) && parts.length > 0) parts[parts.length - 1] += ch;
    else parts.push(ch);
  }
  if (parts.length > 2 && letters.digraphs.includes(parts[0]! + parts[1]!)) parts.splice(0, 2, parts[0]! + parts[1]!);
  return parts;
}

export interface LexiconSource {
  file: string;
  data: LexiconFile;
}

export interface DerivedLexicon {
  lexicon: Lexicon;
  /** The file each id was written in, for error messages. */
  fileOf: Map<string, string>;
  /** Drill syllables (from the "syllables" strings), in the order written. */
  drills: string[];
}

export type LexiconReport = (file: string, message: string) => void;

export function deriveLexicon(sources: readonly LexiconSource[], letters: Letters, actions: readonly string[], error: LexiconReport): DerivedLexicon {
  const { vowels } = letters;
  const syllables = new Map<string, Syllable>();
  const fileOf = new Map<string, string>();
  const drills: string[] = [];

  const syllable = (text: string, file: string): string => {
    const id = syllableId(text, letters);
    const known = syllables.get(id);
    if (known && known.text !== text) error(file, `syllables ${known.text} and ${text} would share the id ${id}`);
    if (!known) {
      const parts = letterParts(text, letters);
      const open = parts.length === 2 && vowels.includes(parts[1]!) && !vowels.includes(parts[0]!);
      const name = id.slice('syl-'.length);
      syllables.set(id, {
        id,
        text,
        parts,
        audio: `voice/syl/${name}.mp3`,
        ...(open ? { audioStretched: `voice/syl-stretched/${name}.mp3` } : {}),
      });
      fileOf.set(id, file);
    }
    return id;
  };

  const vowelCount = (text: string) => lettersOf(text).filter((ch) => vowels.includes(ch)).length;
  const words: Word[] = [];
  const sentences: Sentence[] = [];
  for (const { file, data } of sources) {
    for (const text of data.syllables.split(/\s+/).filter(Boolean)) {
      if (vowelCount(text) !== 1) error(file, `drill syllable ${text} needs exactly one vowel`);
      drills.push(syllable(text, file));
    }
    for (const row of data.words) {
      const parts = row.split.split('-');
      for (const part of parts) if (vowelCount(part) !== 1) error(file, `${row.id}: syllable ${part} in ${row.split} needs exactly one vowel`);
      if (row.stress !== undefined && row.stress >= parts.length) error(file, `${row.id}: stress ${row.stress} but only ${parts.length} syllables`);
      const name = row.id.slice('w-'.length);
      words.push({
        id: row.id,
        text: parts.join(''),
        syllables: parts.map((p) => syllable(p, file)),
        audio: `voice/words/${name}.mp3`,
        ...(parts.length > 1 ? { audioSyllables: `voice/words-syl/${name}.mp3` } : {}),
        picture: `img/words/${name}.webp`,
        emoji: row.emoji,
        tags: row.tags,
        ...(row.stress !== undefined ? { stress: row.stress } : {}),
      });
      fileOf.set(row.id, file);
    }
    for (const row of data.sentences) {
      const name = row.id.slice('s-'.length);
      const words = sentenceWords(row.text);
      if (row.wordStartsSec) {
        if (row.wordStartsSec.length !== words.length) error(file, `${row.id}: wordStartsSec needs one time per word`);
        if (row.wordStartsSec.some((t, i) => i > 0 && t <= row.wordStartsSec![i - 1]!)) error(file, `${row.id}: wordStartsSec must increase`);
      }
      let scene;
      try {
        scene = parseScene(row.scene, actions);
      } catch (e) {
        error(file, `${row.id}: scene "${row.scene}": ${e instanceof Error ? e.message : String(e)}`);
        continue;
      }
      sentences.push({
        id: row.id,
        text: row.text,
        words,
        scene,
        depicts: thingsOf(scene),
        audio: `voice/sentences/${name}.mp3`,
        ...(row.wordStartsSec ? { wordStartsSec: row.wordStartsSec } : {}),
      });
      fileOf.set(row.id, file);
    }
  }
  return { lexicon: { syllables: [...syllables.values()], words, sentences }, fileOf, drills };
}
