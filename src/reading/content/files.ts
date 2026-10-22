// Every content file as a RawBundle (Vite bundles them). Worlds are discovered from
// content/worlds/*/, so a new world or level needs no code change.
import cards from '../../../content/cards.json';
import config from '../../../content/config.json';
import strings from '../../../content/strings.uk.json';
import templates from '../../../content/templates.json';
import voice from '../../../content/voice.uk.json';
import type { RawBundle } from '../engine/validate';

const worldFiles = import.meta.glob<unknown>('../../../content/worlds/*/world.json', { eager: true, import: 'default' });
const lexiconFiles = import.meta.glob<unknown>('../../../content/worlds/*/lexicon.json', { eager: true, import: 'default' });
const repoPath = (path: string) => path.replace(/^(\.\.\/)+/, '');

export function contentFiles(): RawBundle {
  return {
    config: { file: 'content/config.json', data: config },
    templates: { file: 'content/templates.json', data: templates },
    cards: { file: 'content/cards.json', data: cards },
    voice: { file: 'content/voice.uk.json', data: voice },
    strings: { file: 'content/strings.uk.json', data: strings },
    worlds: Object.entries(worldFiles).map(([path, data]) => {
      const lexicon = path.replace(/world\.json$/, 'lexicon.json');
      return {
        world: { file: repoPath(path), data },
        lexicon: { file: repoPath(lexicon), data: lexiconFiles[lexicon] ?? {} },
      };
    }),
  };
}
