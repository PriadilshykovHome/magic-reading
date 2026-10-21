import { describe, expect, it } from 'vitest';
import { SfxGate, ShuffleBag, VoiceScheduler, type Playback, type Starter } from './scheduler';

/** A fake clip we finish by hand, recording how many clips sound at once. */
function harness() {
  let sounding = 0;
  let maxSounding = 0;
  const log: string[] = [];
  const clips = new Map<string, () => void>();
  const clip =
    (name: string): Starter =>
    (): Playback => {
      sounding++;
      maxSounding = Math.max(maxSounding, sounding);
      log.push(`start ${name}`);
      let finish = () => {};
      const done = new Promise<void>((resolve) => {
        finish = () => {
          if (!clips.has(name)) return;
          clips.delete(name);
          sounding--;
          resolve();
        };
      });
      clips.set(name, () => {
        log.push(`end ${name}`);
        finish();
      });
      return {
        done,
        stop: () => {
          if (!clips.has(name)) return;
          log.push(`stop ${name}`);
          finish();
        },
      };
    };
  const end = async (name: string) => {
    clips.get(name)?.();
    await new Promise((r) => setTimeout(r, 0));
  };
  return { clip, end, log, max: () => maxSounding, playing: () => [...clips.keys()] };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('VoiceScheduler: Соня never talks over herself', () => {
  it('plays a sequence one clip at a time', async () => {
    const h = harness();
    const s = new VoiceScheduler();
    const done = s.say([h.clip('instruction'), h.clip('МА')]);
    await tick();
    expect(h.playing()).toEqual(['instruction']);
    await h.end('instruction');
    expect(h.playing()).toEqual(['МА']);
    await h.end('МА');
    expect(await done).toBe(true);
    expect(h.max()).toBe(1);
  });

  it('"after" lets the current clip finish (no cut-off), drops the rest, then plays', async () => {
    const h = harness();
    const s = new VoiceScheduler();
    const first = s.say([h.clip('ЛАМА'), h.clip('praise')]);
    await tick();
    const second = s.say([h.clip('next instruction')], 'after');
    await tick();
    expect(h.playing()).toEqual(['ЛАМА']); // not stopped
    await h.end('ЛАМА');
    expect(h.playing()).toEqual(['next instruction']);
    expect(await first).toBe(false); // its praise was dropped
    await h.end('next instruction');
    expect(await second).toBe(true);
    expect(h.log).not.toContain('stop ЛАМА');
    expect(h.max()).toBe(1);
  });

  it('only the newest waiting request survives', async () => {
    const h = harness();
    const s = new VoiceScheduler();
    void s.say([h.clip('a')]);
    await tick();
    const b = s.say([h.clip('b')], 'after');
    const c = s.say([h.clip('c')], 'after');
    expect(await b).toBe(false);
    await h.end('a');
    expect(h.playing()).toEqual(['c']);
    await h.end('c');
    expect(await c).toBe(true);
  });

  it('"ifIdle" is dropped while she is talking, so quick misses don\'t pile up "Спробуй ще!"', async () => {
    const h = harness();
    const s = new VoiceScheduler();
    void s.say([h.clip('retry 1')], 'ifIdle');
    await tick();
    expect(await s.say([h.clip('retry 2')], 'ifIdle')).toBe(false);
    await h.end('retry 1');
    expect(h.log.filter((l) => l.startsWith('start'))).toEqual(['start retry 1']);
  });

  it('"interrupt" stops the current clip at once (the replay button)', async () => {
    const h = harness();
    const s = new VoiceScheduler();
    const first = s.say([h.clip('long line')]);
    await tick();
    void s.say([h.clip('replay')], 'interrupt');
    await tick();
    expect(await first).toBe(false);
    expect(h.log).toEqual(['start long line', 'stop long line', 'start replay']);
    expect(h.max()).toBe(1);
  });

  it('reports speaking on/off once per stretch of talk, for music ducking', async () => {
    const h = harness();
    const s = new VoiceScheduler();
    const events: boolean[] = [];
    s.onSpeaking((v) => events.push(v));
    void s.say([h.clip('a')]);
    await tick();
    void s.say([h.clip('b')], 'after');
    await h.end('a');
    await h.end('b');
    expect(events).toEqual([true, false]);
    s.stop();
    expect(events).toEqual([true, false, false]);
  });
});

describe('SfxGate: effects never stack up', () => {
  it('skips the same effect within 60 ms and caps simultaneous effects at 4', () => {
    const gate = new SfxGate(60, 4);
    const a = gate.tryPlay('pop', 0);
    expect(a).not.toBeNull();
    expect(gate.tryPlay('pop', 30)).toBeNull();
    expect(gate.tryPlay('pop', 80)).not.toBeNull();
    expect(gate.tryPlay('chime', 81)).not.toBeNull();
    expect(gate.tryPlay('star', 82)).not.toBeNull();
    expect(gate.tryPlay('clink', 83)).toBeNull(); // 4 already playing
    a!();
    expect(gate.tryPlay('clink', 84)).not.toBeNull();
  });
});

describe('ShuffleBag: rotating praise lines', () => {
  it('uses every line before repeating, and never the same line twice in a row', () => {
    const bag = new ShuffleBag(() => 0.42);
    const picks = Array.from({ length: 24 }, () => bag.next('praise', 8));
    for (let round = 0; round < 3; round++) {
      expect(new Set(picks.slice(round * 8, round * 8 + 8)).size).toBe(8);
    }
    for (let i = 1; i < picks.length; i++) expect(picks[i]).not.toBe(picks[i - 1]);
  });
});
