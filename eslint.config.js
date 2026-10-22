import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'dist-e2e', 'coverage', 'e2e-report', 'test-results']),
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    // The shared shell knows nothing about reading: it reaches the active game only through the
    // '@game' and '@game-ui' aliases (src/core/game.ts). Tests may use the real content as a fixture.
    files: ['src/core/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['**/reading/**', '**/app/**'], message: 'src/core must not import a game; use @game / @game-ui.' }] },
      ],
    },
  },
  {
    files: ['src/**/*.test.ts', '*.config.{js,ts}', 'scripts/**/*.ts', 'e2e/**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
  },
]);
