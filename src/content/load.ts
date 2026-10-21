// Loads and validates everything in content/ once, at startup. The same validator runs in CI,
// so in practice this never fails; if it does (a bad edit in dev), it fails loudly.
import cards from '../../content/cards.json';
import config from '../../content/config.json';
import lexicon from '../../content/lexicon.json';
import strings from '../../content/strings.uk.json';
import voice from '../../content/voice.uk.json';
import type { Content } from '../engine/content';
import { validateContent, type RawBundle } from '../engine/validate';
import { taskLogics } from '../tasks/logicRegistry';

const worldFiles = import.meta.glob<unknown>('../../content/worlds/*/world.json', { eager: true, import: 'default' });
const levelFiles = import.meta.glob<unknown>('../../content/worlds/*/levels/*.json', { eager: true, import: 'default' });

function rawBundle(): RawBundle {
  const worlds = Object.entries(worldFiles)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, data]) => {
      const dir = path.slice(0, -'world.json'.length);
      const listed = (data as { levels?: unknown }).levels;
      const levels = (Array.isArray(listed) ? listed : []).map((file: string) => ({
        file: `${dir}${file}`.replace('../../', ''),
        data: levelFiles[`${dir}${file}`],
      }));
      return { world: { file: path.replace('../../', ''), data }, levels };
    });
  return {
    config: { file: 'content/config.json', data: config },
    lexicon: { file: 'content/lexicon.json', data: lexicon },
    cards: { file: 'content/cards.json', data: cards },
    voice: { file: 'content/voice.uk.json', data: voice },
    strings: { file: 'content/strings.uk.json', data: strings },
    worlds,
  };
}

function load(): Content {
  const { issues, content } = validateContent(rawBundle(), taskLogics);
  const errors = issues.filter((i) => i.severity === 'error');
  if (!content || errors.length > 0) {
    throw new Error(`Content is invalid:\n${errors.map((e) => `${e.file}: ${e.message}`).join('\n')}`);
  }
  return content;
}

export const content: Content = load();

/** "tower-of-syllables/01" ⇄ route params. */
export const levelPath = (levelId: string) => `/level/${levelId}`;
