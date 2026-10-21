import { describe, expect, it } from 'vitest';
import { taskLogics } from '../tasks/logicRegistry';
import type { BuildWordData } from '../tasks/buildWord/logic';
import type { BubblePopData } from '../tasks/bubblePop/logic';
import { emptyProgress } from './progress';
import { seededRandom } from './rng';
import { buildSession } from './session';
import { LEVEL_IDS, testContent } from './testContent';

const content = testContent();
const now = new Date(2026, 9, 21, 12);
const session = (levelId: string, seed: number, parentNearby = true) =>
  buildSession({
    content,
    level: content.levels.get(levelId)!,
    progress: emptyProgress(),
    settings: { parentNearby },
    registry: taskLogics,
    rng: seededRandom(seed),
    now,
  });

describe.each(LEVEL_IDS)('%s sessions', (levelId) => {
  const seeds = Array.from({ length: 60 }, (_, i) => i + 1);

  it('has 8–10 tasks plus the Magic Door last', () => {
    for (const seed of seeds) {
      const { tasks } = session(levelId, seed);
      const regular = tasks.filter((t) => !t.boss);
      expect(regular.length).toBeGreaterThanOrEqual(content.config.session.minTasks);
      expect(regular.length).toBeLessThanOrEqual(content.config.session.maxTasks);
      expect(tasks.at(-1)!.boss).toBe(true);
      expect(tasks.filter((t) => t.boss)).toHaveLength(1);
    }
  });

  it('gives every choice task the target plus up to 2 distinct, existing options', () => {
    for (const seed of seeds) {
      for (const t of session(levelId, seed).tasks) {
        if (t.options.length === 0) continue;
        expect(t.options).toContain(t.target);
        expect(new Set(t.options).size).toBe(t.options.length);
        if (t.type !== 'bubblePop') expect(t.options.length).toBeLessThanOrEqual(3);
        for (const id of t.options) expect(content.syllables.has(id) || content.words.has(id) || content.sentences.has(id)).toBe(true);
      }
    }
  });

  it('replaces readAloud with a reading task when no parent is nearby', () => {
    for (const seed of seeds) {
      const withParent = session(levelId, seed, true).tasks;
      const alone = session(levelId, seed, false).tasks;
      expect(alone.some((t) => t.type === 'readAloud')).toBe(false);
      expect(alone.length).toBe(withParent.length);
      expect(alone.some((t) => t.reading)).toBe(true);
    }
  });

  it('is reshuffled each time but repeatable for the same seed', () => {
    const order = (seed: number) => session(levelId, seed).tasks.map((t) => `${t.type}:${t.target}`).join(',');
    expect(order(42)).toBe(order(42));
    expect(new Set(seeds.slice(0, 10).map(order)).size).toBeGreaterThan(5);
  });

  it('marks reading tasks so their audio waits until after the answer', () => {
    for (const t of session(levelId, 3).tasks) expect(t.reading).toBe(taskLogics[t.type]!.reading);
  });
});

describe('level specifics', () => {
  it('Level 1 opens with the merge demo and ends at the МАМА door', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { tasks } = session('tower-of-syllables/01', seed);
      expect(tasks[0]!.type).toBe('syllableMerge');
      expect(tasks.at(-1)).toMatchObject({ boss: true, type: 'readPickPicture', target: 'w-mama', instruction: 'magicDoor.readPickPicture' });
    }
  });

  it('buildWord tiles hold the word in order plus confusable extras, never one-syllable words', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const t of session('tower-of-syllables/02', seed).tasks.filter((x) => x.type === 'buildWord')) {
        const data = t.data as BuildWordData;
        expect(data.slots).toEqual(content.words.get(t.target)!.syllables);
        expect(data.slots.length).toBeGreaterThanOrEqual(2);
        expect(data.tiles).toHaveLength(data.slots.length + 1);
        for (const s of data.slots) expect(data.tiles).toContain(s);
      }
    }
  });

  it('bubblePop launches the target 3 times among 8 bubbles', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const t of session('tower-of-syllables/01', seed).tasks.filter((x) => x.type === 'bubblePop')) {
        const { bubbles } = t.data as BubblePopData;
        expect(bubbles).toHaveLength(8);
        expect(bubbles.filter((b) => b === t.target)).toHaveLength(3);
      }
    }
  });

  it('never offers a sentence scene that also fits the target', () => {
    for (let seed = 1; seed <= 60; seed++) {
      for (const t of session('tower-of-syllables/03', seed).tasks.filter((x) => x.type === 'sentencePicture')) {
        const target = content.sentences.get(t.target)!;
        for (const id of t.options.filter((o) => o !== t.target)) {
          const other = content.sentences.get(id)!;
          expect(target.depicts.every((d) => other.depicts.includes(d))).toBe(false);
        }
      }
    }
  });

  it('the Magic Door asks about the weakest word', () => {
    const progress = emptyProgress();
    progress.items['w-sany'] = { box: 1, seen: 4, firstTryOk: 0, wrong: 4, lastSeen: null, okDays: [] };
    for (const id of ['w-mama', 'w-tato', 'w-lysa', 'w-mylo', 'w-noty', 'w-lama', 'w-osa']) {
      progress.items[id] = { box: 4, seen: 6, firstTryOk: 5, wrong: 0, lastSeen: null, okDays: [] };
    }
    const { tasks } = buildSession({
      content,
      level: content.levels.get('tower-of-syllables/02')!,
      progress,
      settings: { parentNearby: true },
      registry: taskLogics,
      rng: seededRandom(1),
      now,
    });
    expect(tasks.at(-1)).toMatchObject({ boss: true, type: 'buildWord', target: 'w-sany' });
  });
});
