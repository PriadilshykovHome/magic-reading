// What Соня says: voice lines by id (from content/voice.uk.json, names filled in) and the
// lexicon items themselves. Phase 5 plays recorded clips here; until then, browser speech.
import { content } from '../content/load';
import { itemText } from '../engine/content';
import { fillTemplate, templateVars } from '../engine/text';
import { speak, stopSpeech, unlockSpeech } from './speech';
import { unlockSfx } from './sfx';

const vars = templateVars(content.strings, content.config);

/** The text of a voice line; lists pick one at random. Lines missing a private value use `<id>Fallback`. */
export function lineText(id: string): string | null {
  const value = content.voice.get(id);
  if (!value) return null;
  const template = Array.isArray(value) ? value[Math.floor(Math.random() * value.length)]! : value;
  const { text, missing } = fillTemplate(template, vars);
  if (missing.length === 0) return text;
  const fallback = content.voice.get(`${id}Fallback`);
  return typeof fallback === 'string' ? fillTemplate(fallback, vars).text : null;
}

/** Speech engines read capitals as letter names ("ЕМ А"), so items are spoken in lower case. */
const spoken = (id: string) => itemText(content, id).toLocaleLowerCase('uk-UA');

export const voice = {
  /** Says one or more voice lines in a row. */
  say(...ids: string[]): Promise<boolean> {
    return speak(ids.map(lineText).filter((t): t is string => t !== null), { gapMs: 200 });
  },
  /** Says a syllable, word or sentence. */
  item(id: string): Promise<boolean> {
    return speak(spoken(id), { rate: 0.8 });
  },
  /** A voice line followed by an item, e.g. the instruction then "МА". */
  lineThenItem(lineId: string, itemId: string): Promise<boolean> {
    const line = lineText(lineId);
    return speak([...(line ? [line] : []), spoken(itemId)], { gapMs: 350 });
  },
  /** Free text, for word-by-word reading along. */
  text(text: string, rate = 0.8): Promise<boolean> {
    return speak(text.toLocaleLowerCase('uk-UA'), { rate });
  },
  stop: stopSpeech,
};

let unlocked = false;

/** iPhones and iPads only allow sound after a tap: the magic door (or any first tap) unlocks it. */
export function unlockAudio(): void {
  if (unlocked) return;
  unlocked = true;
  unlockSpeech();
  unlockSfx();
}
