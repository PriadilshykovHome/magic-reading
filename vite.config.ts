import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

// GitHub Pages serves the project site at https://<user>.github.io/<repo>/
const REPO_BASE = '/magic-reading/';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8')) as { version: string };

// index.html is not a component, but its text still comes from the strings file.
function htmlStrings(): Plugin {
  return {
    name: 'html-strings',
    transformIndexHtml(html) {
      const strings = JSON.parse(readFileSync('./content/strings.uk.json', 'utf8')) as {
        app: { title: string; description: string };
      };
      return html
        .replaceAll('%APP_TITLE%', strings.app.title)
        .replaceAll('%APP_DESCRIPTION%', strings.app.description);
    },
  };
}

export default defineConfig({
  base: REPO_BASE,
  plugins: [react(), htmlStrings()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_ID__: JSON.stringify(process.env.GITHUB_SHA?.slice(0, 7) ?? 'dev'),
  },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
