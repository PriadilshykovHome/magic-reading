// Every content file as a RawBundle (Vite bundles them). Worlds and levels are discovered from
// content/worlds/*/world.json, so a new level or world needs no code change.
import cards from '../../../content/cards.json';
import config from '../../../content/config.json';
import lexicon from '../../../content/lexicon.json';
import strings from '../../../content/strings.uk.json';
import voice from '../../../content/voice.uk.json';
import type { RawBundle } from '../engine/validate';

const worldFiles = import.meta.glob<unknown>('../../../content/worlds/*/world.json', { eager: true, import: 'default' });
const levelFiles = import.meta.glob<unknown>('../../../content/worlds/*/levels/*.json', { eager: true, import: 'default' });

export function contentFiles(): RawBundle {
  const worlds = Object.entries(worldFiles).map(([path, data]) => {
    const dir = path.slice(0, -'world.json'.length);
    const listed = (data as { levels?: unknown }).levels;
    const levels = (Array.isArray(listed) ? listed : []).map((file: string) => ({
      file: `${dir}${file}`.replace(/^(\.\.\/)+/, ''),
      data: levelFiles[`${dir}${file}`],
    }));
    return { world: { file: path.replace(/^(\.\.\/)+/, ''), data }, levels };
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
