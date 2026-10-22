import { expect, test } from 'vitest';
import { SfxGate, ShuffleBag, VoiceScheduler, type Playback, type Starter } from './scheduler';

/** Fake clips we finish by hand, recording how many sound at once. */
function harness() {
  let sounding = 0;
  let max = 0;
  const log: string[] = [];
  const finishers = new Map<string, () => void>();
  const clip =
    (name: string): Starter =>
    (): Playback => {
      max = Math.max(max, ++sounding);
      log.push(`start ${name}`);
      let resolve = () => {};
      const done = new Promise<void>((r) => (resolve = r));
      const finish = (how: string) => {
        if (!finishers.delete(name)) return;
        log.push(`${how} ${name}`);
        sounding--;
        resolve();
      };
      finishers.set(name, () => finish('end'));
      return { done, stop: () => finish('stop') };
    };
  const end = async (name: string) => {
    finishers.get(name)?.();
    await new Promise((r) => setTimeout(r, 0));
  };
  return { clip, end, log, max: () => max, playing: () => [...finishers.keys()] };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

test('Соня never talks over herself and is never cut mid-word ("after")', async () => {
  const h = harness();
  const s = new VoiceScheduler();
  const first = s.say([h.clip('ЛАМА'), h.clip('praise')]);
  await tick();
  const dropped = s.say([h.clip('old instruction')], 'after');
  const next = s.say([h.clip('instruction')], 'after'); // only the newest waiting request survives
  expect(await dropped).toBe(false);
  expect(h.playing()).toEqual(['ЛАМА']);
  await h.end('ЛАМА'); // finishes naturally, never stopped
  expect(h.playing()).toEqual(['instruction']);
  expect(await first).toBe(false); // its praise was dropped
  await h.end('instruction');
  expect(await next).toBe(true);
  expect(h.log).not.toContain('stop ЛАМА');
  expect(h.max()).toBe(1);
});

test('"ifIdle" never piles up; "interrupt" stops at once; ducking reports one stretch of talk', async () => {
  const h = harness();
  const s = new VoiceScheduler();
  const speaking: boolean[] = [];
  s.onSpeaking((v) => speaking.push(v));
  void s.say([h.clip('retry')], 'ifIdle');
  await tick();
  expect(await s.say([h.clip('retry again')], 'ifIdle')).toBe(false);
  void s.say([h.clip('replay')], 'interrupt');
  await tick();
  expect(h.log).toEqual(['start retry', 'stop retry', 'start replay']);
  await h.end('replay');
  expect(speaking).toEqual([true, false]);
  expect(h.max()).toBe(1);
});

test('effects can not stack up; praise lines rotate without repeats', () => {
  const gate = new SfxGate(60, 4);
  const release = gate.tryPlay('pop', 0);
  expect(gate.tryPlay('pop', 30)).toBeNull(); // same effect within 60 ms
  for (const [name, at] of [['pop', 80], ['chime', 81], ['star', 82]] as const) expect(gate.tryPlay(name, at)).not.toBeNull();
  expect(gate.tryPlay('clink', 83)).toBeNull(); // 4 already playing
  release!();
  expect(gate.tryPlay('clink', 84)).not.toBeNull();

  const bag = new ShuffleBag(() => 0.42);
  const picks = Array.from({ length: 24 }, () => bag.next('praise', 8));
  for (let round = 0; round < 3; round++) expect(new Set(picks.slice(round * 8, round * 8 + 8)).size).toBe(8);
  for (let i = 1; i < picks.length; i++) expect(picks[i]).not.toBe(picks[i - 1]);
});
