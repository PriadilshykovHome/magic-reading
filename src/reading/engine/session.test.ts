import { expect, test } from 'vitest';
import type { BubblePopData } from '../tasks/bubblePop/logic';
import type { BuildWordData } from '../tasks/buildWord/logic';
import { taskLogics } from '../tasks/logicRegistry';
import { emptyProgress, type Progress } from '../../core/engine/progress';
import { seededRandom } from '../../core/engine/rng';
import { buildSession } from '../../core/engine/session';
import { readingEngine } from './domain';
import type { ScenePicksData } from '../tasks/sentencePicture/logic';
import { sceneKey } from './scene';
import { testContent } from './testContent';

const content = testContent();
const session = (levelId: string, seed: number, parentNearby = true, progress: Progress = emptyProgress()) =>
  buildSession({ content, level: content.levels.get(levelId)!, domain: readingEngine, progress, settings: { parentNearby }, registry: taskLogics, rng: seededRandom(seed), now: new Date(2026, 9, 21) });
const exists = (id: string) => content.syllables.has(id) || content.words.has(id) || content.sentences.has(id);
/** An option is an item, a composed picture (sentencePicture) or a verdict (trueFalse). */
const validOption = (id: string) => exists(id) || id.startsWith('scene ') || id === 'yes' || id === 'no';

test('every level builds valid sessions, with or without a parent nearby', () => {
  for (const levelId of content.levelOrder) {
    for (let seed = 1; seed <= 25; seed++) {
      for (const parentNearby of [true, false]) {
        const { tasks } = session(levelId, seed, parentNearby);
        const regular = tasks.filter((t) => !t.boss);
        expect(regular.length).toBeGreaterThanOrEqual(8);
        expect(regular.length).toBeLessThanOrEqual(10);
        expect(tasks.at(-1)!.boss).toBe(true); // the Magic Door comes last
        if (!parentNearby) expect(tasks.some((t) => t.type === 'readAloud')).toBe(false);
        expect(tasks.some((t) => t.reading && t.type !== 'readAloud')).toBe(true); // he reads alone
        for (const t of tasks) {
          expect(t.reading).toBe(taskLogics[t.type]!.reading);
          if (t.options.length === 0) continue;
          expect(t.options).toContain(t.answer ?? t.target);
          expect(new Set(t.options).size).toBe(t.options.length);
          if (t.type !== 'bubblePop') expect(t.options.length).toBeLessThanOrEqual(3);
          expect(t.options.every(validOption)).toBe(true);
        }
      }
    }
  }
});

test('reshuffled each time, repeatable per seed', () => {
  const order = (seed: number) => session('tower-of-syllables/02', seed).tasks.map((t) => `${t.type}:${t.target}`).join();
  expect(order(42)).toBe(order(42));
  expect(new Set([1, 2, 3, 4, 5, 6].map(order)).size).toBeGreaterThan(4);
});

test('task contents: МАМА and МИШКО doors, build-a-word tiles, bubbles, sentence scenes', () => {
  for (let seed = 1; seed <= 25; seed++) {
    const l1 = session('tower-of-syllables/01', seed).tasks;
    expect(l1[0]!.type).toBe('syllableMerge');
    expect(l1.at(-1)).toMatchObject({ type: 'readPickPicture', target: 'w-mama', instruction: 'magicDoor.readPickPicture' });
    for (const t of l1.filter((x) => x.type === 'bubblePop')) {
      const { bubbles } = t.data as BubblePopData;
      expect(bubbles.filter((b) => b === t.target)).toHaveLength(3);
    }
    for (const t of session('tower-of-syllables/02', seed).tasks.filter((x) => x.type === 'buildWord')) {
      const { slots, tiles } = t.data as BuildWordData;
      expect(slots).toEqual(content.words.get(t.target)!.syllables);
      expect(slots.length).toBeGreaterThanOrEqual(2); // never ЛІС / НІС
      expect(tiles).toHaveLength(slots.length + 1);
    }
    const finale = session('tower-of-words/05', seed).tasks;
    expect(finale.at(-1)).toMatchObject({ boss: true, target: 'w-myshko' }); // his name, behind the last door…
    expect(finale.slice(0, -1).some((t) => t.target === 'w-myshko' || t.options.includes('w-myshko'))).toBe(false); // …and nowhere before
    for (const t of session('tower-of-syllables/03', seed).tasks.filter((x) => x.type === 'sentencePicture')) {
      const { scenes } = t.data as ScenePicksData;
      const own = sceneKey(content.sentences.get(t.target)!.scene);
      expect(sceneKey(scenes[t.target]!)).toBe(own); // the sentence's own picture…
      for (const id of t.options.filter((o) => o !== t.target)) expect(sceneKey(scenes[id]!)).not.toBe(own); // …and near misses
    }
  }
});

test('the Magic Door asks about his weakest word', () => {
  const progress = emptyProgress();
  progress.items['w-sany'] = { box: 1, seen: 4, firstTryOk: 0, wrong: 4, lastSeen: null, okDays: [] };
  for (const id of ['w-mama', 'w-tato', 'w-lysa', 'w-mylo', 'w-noty', 'w-lama', 'w-osa']) {
    progress.items[id] = { box: 4, seen: 6, firstTryOk: 5, wrong: 0, lastSeen: null, okDays: [] };
  }
  expect(session('tower-of-syllables/02', 1, true, progress).tasks.at(-1)).toMatchObject({ boss: true, type: 'buildWord', target: 'w-sany' });
});
