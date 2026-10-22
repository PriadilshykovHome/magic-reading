import react from '@vitejs/plugin-react';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

// GitHub Pages serves the project site at https://<user>.github.io/<repo>/
const REPO_BASE = '/magic-reading/';

// The active game (see src/core/game.ts): swap these to build another game (and the same two
// aliases in tsconfig.app.json).
const GAME = {
  data: './src/reading/game.ts',
  ui: './src/reading/gameUi.ts',
  strings: './content/strings.uk.json',
};

const pkg = JSON.parse(readFileSync('./package.json', 'utf8')) as { version: string };

// index.html is not a component, but its text still comes from the strings file.
function htmlStrings(): Plugin {
  return {
    name: 'html-strings',
    transformIndexHtml(html) {
      const strings = JSON.parse(readFileSync(GAME.strings, 'utf8')) as {
        app: { title: string; description: string };
      };
      return html
        .replaceAll('%APP_TITLE%', strings.app.title)
        .replaceAll('%APP_DESCRIPTION%', strings.app.description);
    },
  };
}

/** `virtual:audio-manifest`: every audio file under public/audio, so the game knows which
 *  recordings exist (and falls back to speech for the rest) without probing the network. */
function audioManifest(): Plugin {
  const id = 'virtual:audio-manifest';
  const resolved = `\0${id}`;
  const root = join(process.cwd(), 'public', 'audio');
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : /\.(mp3|wav|ogg|m4a|webm)$/.test(e.name) ? [relative(root, join(dir, e.name))] : [],
    );
  return {
    name: 'audio-manifest',
    resolveId: (source) => (source === id ? resolved : undefined),
    load: (source) => (source === resolved ? `export default ${JSON.stringify(walk(root).sort())};` : undefined),
    configureServer(server) {
      server.watcher.add(root);
      const refresh = (file: string) => {
        if (!file.startsWith(root)) return;
        const mod = server.moduleGraph.getModuleById(resolved);
        if (mod) server.moduleGraph.invalidateModule(mod);
      };
      server.watcher.on('add', refresh);
      server.watcher.on('unlink', refresh);
    },
  };
}

/** Vitest caches transformed modules across runs, keyed by their source, so a file whose
 *  `import.meta.glob` finds content/worlds/* would miss a world added later: key it by the
 *  world folders too. */
function globCacheKey(): Plugin {
  return {
    name: 'glob-cache-key',
    configureVitest({ defineCacheKeyGenerator }) {
      defineCacheKeyGenerator(({ sourceCode }) =>
        sourceCode.includes('import.meta.glob') ? readdirSync('./content/worlds', { recursive: true }).sort().join('|') : undefined,
      );
    },
  };
}

export default defineConfig({
  base: REPO_BASE,
  plugins: [react(), htmlStrings(), audioManifest(), globCacheKey()],
  resolve: {
    alias: {
      '@game': fileURLToPath(new URL(GAME.data, import.meta.url)),
      '@game-ui': fileURLToPath(new URL(GAME.ui, import.meta.url)),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_ID__: JSON.stringify(process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev'),
  },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
