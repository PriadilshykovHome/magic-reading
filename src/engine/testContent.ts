// Test helper: the real content files as a RawBundle, and validated + indexed. Only tests import it.
import cards from '../../content/cards.json';
import config from '../../content/config.json';
import lexicon from '../../content/lexicon.json';
import strings from '../../content/strings.uk.json';
import voice from '../../content/voice.uk.json';
import level1 from '../../content/worlds/tower-of-syllables/levels/01-syllables.json';
import level2 from '../../content/worlds/tower-of-syllables/levels/02-words.json';
import level3 from '../../content/worlds/tower-of-syllables/levels/03-sentences.json';
import world from '../../content/worlds/tower-of-syllables/world.json';
import { taskLogics } from '../tasks/logicRegistry.ts';
import type { Content } from './content.ts';
import { validateContent, type RawBundle } from './validate.ts';

/** A fresh deep copy each call, so tests can break it freely. */
export function rawBundle(): RawBundle {
  const copy = <T>(data: T): T => structuredClone(data);
  const dir = 'content/worlds/tower-of-syllables';
  return {
    config: { file: 'content/config.json', data: copy(config) },
    lexicon: { file: 'content/lexicon.json', data: copy(lexicon) },
    cards: { file: 'content/cards.json', data: copy(cards) },
    voice: { file: 'content/voice.uk.json', data: copy(voice) },
    strings: { file: 'content/strings.uk.json', data: copy(strings) },
    worlds: [
      {
        world: { file: `${dir}/world.json`, data: copy(world) },
        levels: [
          { file: `${dir}/levels/01-syllables.json`, data: copy(level1) },
          { file: `${dir}/levels/02-words.json`, data: copy(level2) },
          { file: `${dir}/levels/03-sentences.json`, data: copy(level3) },
        ],
      },
    ],
  };
}

export function testContent(): Content {
  const { issues, content } = validateContent(rawBundle(), taskLogics);
  const errors = issues.filter((i) => i.severity === 'error');
  if (!content || errors.length) throw new Error(`content invalid: ${errors.map((e) => e.message).join('; ')}`);
  return content;
}

export const LEVEL_IDS = ['tower-of-syllables/01', 'tower-of-syllables/02', 'tower-of-syllables/03'] as const;
