// Reads content/ from disk as a RawBundle (what Vite bundles for the game), for the scripts.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Issue, RawBundle, RawFile } from '../src/reading/engine/validate.ts';

export function readContent(root: string): { raw: RawBundle; worldIds: string[]; loadErrors: Issue[] } {
  const loadErrors: Issue[] = [];
  const rel = (path: string) => path.slice(root.length + 1);
  const load = (path: string): RawFile => {
    const file = rel(path);
    try {
      return { file, data: JSON.parse(readFileSync(path, 'utf8')) };
    } catch (e) {
      loadErrors.push({ severity: 'error', file, message: e instanceof Error ? e.message : String(e) });
      return { file, data: undefined };
    }
  };

  const content = join(root, 'content');
  const worldsDir = join(content, 'worlds');
  const worldIds = existsSync(worldsDir)
    ? readdirSync(worldsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()
    : [];
  const raw: RawBundle = {
    config: load(join(content, 'config.json')),
    templates: load(join(content, 'templates.json')),
    scenes: load(join(content, 'scenes.json')),
    cards: load(join(content, 'cards.json')),
    voice: load(join(content, 'voice.uk.json')),
    strings: load(join(content, 'strings.uk.json')),
    worlds: worldIds.map((id) => ({
      world: load(join(worldsDir, id, 'world.json')),
      lexicon: existsSync(join(worldsDir, id, 'lexicon.json')) ? load(join(worldsDir, id, 'lexicon.json')) : { file: rel(join(worldsDir, id, 'lexicon.json')), data: {} },
    })),
  };
  return { raw, worldIds, loadErrors };
}
