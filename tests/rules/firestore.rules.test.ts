// Runs against the Firestore emulator (npm run test:rules), never the real project.
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, FieldPath, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, test } from 'vitest';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-magic-reading',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

test('a player reads and writes only their own documents; level ids with "/" work as field names', async () => {
  const mine = env.authenticatedContext('family').firestore();
  const other = env.authenticatedContext('someone-else').firestore();
  const nobody = env.unauthenticatedContext().firestore();
  const game = (db: typeof mine) => doc(db, 'players', 'family', 'games', 'reading-uk');

  await assertSucceeds(setDoc(game(mine), { schemaVersion: 1, levels: {} }));
  // The sync service writes one changed level or item at a time, by field path.
  await assertSucceeds(updateDoc(game(mine), new FieldPath('levels', 'tower-of-syllables/01'), { bestStars: 3, plays: 1, completedAt: null }));
  const saved = await getDoc(game(mine));
  expect(saved.data()?.levels['tower-of-syllables/01'].bestStars).toBe(3);
  await assertSucceeds(setDoc(doc(mine, 'players', 'family'), { profile: { updatedAt: null } }));

  await assertFails(getDoc(game(other)));
  await assertFails(setDoc(game(other), { schemaVersion: 1 }));
  await assertFails(getDoc(doc(other, 'players', 'family')));
  await assertFails(getDoc(game(nobody)));
  await assertFails(setDoc(doc(nobody, 'players', 'family'), { profile: {} }));
});
