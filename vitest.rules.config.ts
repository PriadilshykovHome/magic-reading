// The security-rules test: runs inside `firebase emulators:exec` (npm run test:rules).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/rules/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30_000,
  },
});
