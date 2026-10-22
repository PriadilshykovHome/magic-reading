// What Соня says: voice lines by id (content/voice.uk.json, names filled in) and the game's
// items. Recorded clips when they exist (public/audio/uk/...), browser speech until then.
// Every request goes through the scheduler, so lines never overlap or get chopped.
import { game } from '@game';
import type { Level } from '../engine/schema';
import { useAccount } from '../store/account';
import { fillTemplate, templateVars } from '../engine/text';
import { clipStarter, preloadClips, scheduler } from './manager';
import { pause, ShuffleBag, type Policy, type Starter } from './scheduler';

export { unlockAudio } from './manager';
export type { Policy } from './scheduler';

const { content } = game;
let vars = templateVars(content.strings, content.config, useAccount.getState().profile ?? undefined);
// His patronymic (formal Соня) comes from the private profile once the cloud has sent it.
useAccount.subscribe((state, prev) => {
  if (state.profile !== prev.profile) vars = templateVars(content.strings, content.config, state.profile ?? undefined);
});
const rotation = new ShuffleBag();

/** Where a voice line's recording lives: lists are numbered from 1 ("praise.3"). */
const linePath = (name: string) => `uk/voice/sonya/${name}.mp3`;

/** What a level is about (e.g. its new letter): fills {topic}; such lines are recorded per topic. */
export interface Topic {
  text: string;
  key: string;
}

function lineStarter(id: string, topic?: Topic): Starter | null {
  const value = content.voice.get(id);
  if (!value) return null;
  const list = Array.isArray(value) ? value : [value];
  const index = list.length > 1 ? rotation.next(id, list.length) : 0;
  const line = list[index]!;
  const { text, missing } = fillTemplate(line, { ...vars, topic: topic?.text });
  if (missing.length > 0) return content.voice.has(`${id}Fallback`) ? lineStarter(`${id}Fallback`, topic) : null;
  const name = Array.isArray(value) ? `${id}.${index + 1}` : id;
  return clipStarter(linePath(topic && line.includes('{topic}') ? `${name}.${topic.key}` : name), text);
}

/** Speech engines read capitals as letter names ("ЕМ А"), so items are spoken in lower case. */
function itemStarter(id: string): Starter {
  const { text, audio } = game.item(id);
  return clipStarter(audio ? `uk/${audio}` : undefined, text.toLocaleLowerCase('uk-UA'), 0.8);
}

const spaced = (starters: (Starter | null)[], gapMs: number): Starter[] =>
  starters.filter((s): s is Starter => s !== null).flatMap((s, i) => (i === 0 ? [s] : [pause(gapMs), s]));

export const voice = {
  /** One or more voice lines in a row. */
  say(ids: string | string[], policy: Policy = 'after', topic?: Topic): Promise<boolean> {
    return scheduler.say(spaced((Array.isArray(ids) ? ids : [ids]).map((id) => lineStarter(id, topic)), 200), policy);
  },
  /** One of the game's items (a syllable, word or sentence). */
  item(id: string, policy: Policy = 'after'): Promise<boolean> {
    return scheduler.say([itemStarter(id)], policy);
  },
  /** A voice line followed by an item, e.g. the instruction then "МА". */
  lineThenItem(lineId: string, itemId: string, policy: Policy = 'after'): Promise<boolean> {
    return scheduler.say(spaced([lineStarter(lineId), itemStarter(itemId)], 350), policy);
  },
  /** Free text, for reading a sentence word by word. */
  text(text: string, policy: Policy = 'after'): Promise<boolean> {
    return scheduler.say([clipStarter(undefined, text.toLocaleLowerCase('uk-UA'), 0.8)], policy);
  },
  stop(): void {
    scheduler.stop();
  },
};

/** Load everything a level will say before it starts. */
export function preloadLevel(level: Level): void {
  const paths = game
    .levelItems(level)
    .flatMap((id) => game.item(id).audio ?? [])
    .map((a) => `uk/${a}`);
  const lines = [...content.voice.keys()].filter(
    (id) => id.startsWith('instructions.') || id === `magicDoor.${level.boss.inner}` || ['praise', 'retry', 'hint'].includes(id),
  );
  for (const id of lines) {
    const value = content.voice.get(id)!;
    if (Array.isArray(value)) value.forEach((_, i) => paths.push(linePath(`${id}.${i + 1}`)));
    else paths.push(linePath(id));
  }
  preloadClips(paths);
}

