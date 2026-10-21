// The rules that keep sound calm: Соня's lines never overlap and are never chopped mid-word,
// and effects can't pile up. Pure TypeScript (no Howler, no DOM), so it is unit-tested.

/** One sound that is playing: `done` settles when it ends or is stopped. */
export interface Playback {
  done: Promise<void>;
  stop(): void;
}

export type Starter = () => Playback;

/**
 * How a new voice request treats what is already playing:
 * - `interrupt`: stop now and play this (he tapped "hear it again", or left the screen).
 * - `after`: let the current clip finish, drop whatever was still waiting, then play this.
 * - `ifIdle`: only if nothing is playing or waiting (e.g. "Спробуй ще!" after a quick second miss).
 */
export type Policy = 'interrupt' | 'after' | 'ifIdle';

interface Request {
  starters: Starter[];
  next: number;
  /** Stop after the clip that is playing now. */
  winding: boolean;
  resolve(completed: boolean): void;
}

export class VoiceScheduler {
  private active: Request | null = null;
  private playing: Playback | null = null;
  private waiting: Request | null = null;
  private listeners = new Set<(speaking: boolean) => void>();

  /** Resolves true once every clip has played, false if it was dropped or cut short. */
  say(starters: Starter[], policy: Policy = 'after'): Promise<boolean> {
    return new Promise((resolve) => {
      if (starters.length === 0) return resolve(true);
      const request: Request = { starters, next: 0, winding: false, resolve };
      const busy = this.active !== null;
      if (policy === 'ifIdle') {
        if (busy) return resolve(false);
        return this.start(request);
      }
      this.dropWaiting();
      if (policy === 'interrupt' || !busy) {
        this.cutActive();
        return this.start(request, busy); // an interruption is still the same stretch of talk
      }
      this.active!.winding = true;
      this.waiting = request;
    });
  }

  /** Silence now (leaving a screen). */
  stop(): void {
    this.dropWaiting();
    this.cutActive();
    this.emit(false);
  }

  get speaking(): boolean {
    return this.active !== null;
  }

  /** For ducking: true when Соня starts talking, false when she has finished everything. */
  onSpeaking(listener: (speaking: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private start(request: Request, wasSpeaking = this.active !== null) {
    this.active = request;
    if (!wasSpeaking) this.emit(true);
    void this.run(request);
  }

  private async run(request: Request) {
    while (request.next < request.starters.length && !request.winding) {
      const playback = request.starters[request.next++]!();
      this.playing = playback;
      await playback.done;
      if (this.active !== request) return; // cut off by an interrupt; already resolved
    }
    this.playing = null;
    request.resolve(request.next >= request.starters.length);
    const next = this.waiting;
    this.waiting = null;
    if (next) {
      // Hand straight over: she is still talking, so the music stays ducked.
      this.active = next;
      void this.run(next);
    } else {
      this.active = null;
      this.emit(false);
    }
  }

  private cutActive() {
    const request = this.active;
    if (!request) return;
    this.active = null;
    this.playing?.stop();
    this.playing = null;
    request.resolve(false);
  }

  private dropWaiting() {
    this.waiting?.resolve(false);
    this.waiting = null;
  }

  private emit(speaking: boolean) {
    for (const listener of this.listeners) listener(speaking);
  }
}

/** A silent gap between clips. */
export function pause(ms: number): Starter {
  return () => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let finish = () => {};
    const done = new Promise<void>((resolve) => {
      finish = resolve;
      timer = setTimeout(resolve, ms);
    });
    return {
      done,
      stop: () => {
        clearTimeout(timer);
        finish();
      },
    };
  };
}

/**
 * Effects may overlap each other (a chime over a pop is fine) but can't stack up: the same
 * effect at most once per `minGapMs`, and at most `maxConcurrent` at a time.
 */
export class SfxGate {
  private lastPlayed = new Map<string, number>();
  private playing = 0;
  private readonly minGapMs: number;
  private readonly maxConcurrent: number;

  constructor(minGapMs = 60, maxConcurrent = 4) {
    this.minGapMs = minGapMs;
    this.maxConcurrent = maxConcurrent;
  }

  /** Returns a release callback if the effect may play, or null to skip it. */
  tryPlay(name: string, now: number): (() => void) | null {
    const last = this.lastPlayed.get(name);
    if (last !== undefined && now - last < this.minGapMs) return null;
    if (this.playing >= this.maxConcurrent) return null;
    this.lastPlayed.set(name, now);
    this.playing++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.playing--;
    };
  }
}

/** Rotates through a list without repeats until every entry has been used (praise lines). */
export class ShuffleBag {
  private bags = new Map<string, number[]>();
  private last = new Map<string, number>();
  private readonly random: () => number;

  constructor(random: () => number = Math.random) {
    this.random = random;
  }

  next(key: string, size: number): number {
    let bag = this.bags.get(key);
    if (!bag || bag.length === 0) {
      bag = Array.from({ length: size }, (_, i) => i);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j]!, bag[i]!];
      }
      // never the same line twice in a row across refills (the bag pops from the end)
      if (bag.length > 1 && bag[bag.length - 1] === this.last.get(key)) {
        [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1]!, bag[0]!];
      }
      this.bags.set(key, bag);
    }
    const value = bag.pop()!;
    this.last.set(key, value);
    return value;
  }
}
