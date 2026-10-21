// Placeholder sound effects, synthesised with Web Audio: soft bells and pops, never a buzzer.
// Phase 5 replaces these with recorded, free-licensed effects through the audio manager.
import { SILENT } from '../testMode';

let ctx: AudioContext | null = null;
let volume = SILENT ? 0 : 0.8;

function audio(): AudioContext | null {
  if (SILENT || typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx ??= new AudioContext();
  return ctx;
}

export function unlockSfx(): void {
  void audio()?.resume();
}

export function setSfxVolume(value: number): void {
  volume = value;
}

function tone(freq: number, start: number, duration: number, opts: { type?: OscillatorType; gain?: number; glide?: number } = {}) {
  const ac = audio();
  if (!ac || volume <= 0) return;
  const t = ac.currentTime + start;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (opts.glide) osc.frequency.exponentialRampToValueAtTime(freq * opts.glide, t + duration);
  const peak = (opts.gain ?? 0.18) * volume;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.05);
}

const bell = (freq: number, start = 0, gain = 0.16) => {
  tone(freq, start, 0.9, { gain });
  tone(freq * 2.01, start, 0.5, { gain: gain * 0.35 });
  tone(freq * 3.02, start, 0.25, { gain: gain * 0.12, type: 'triangle' });
};

/** The correct-answer chime rotates through 3 pitches so it never gets boring. */
const CHIMES = [784, 880, 988];

export const sfx = {
  correct(pitch: 0 | 1 | 2) {
    bell(CHIMES[pitch]!);
    bell(CHIMES[pitch]! * 1.5, 0.09, 0.1);
  },
  golden() {
    [1047, 1319, 1568, 2093].forEach((f, i) => bell(f, i * 0.07, 0.12));
  },
  wrong() {
    tone(220, 0, 0.32, { gain: 0.12, glide: 0.8 });
  },
  pop() {
    tone(620, 0, 0.12, { gain: 0.14, glide: 2.2 });
  },
  tap() {
    tone(520, 0, 0.08, { gain: 0.08, type: 'triangle' });
  },
  place() {
    tone(440, 0, 0.14, { gain: 0.12, type: 'triangle', glide: 1.5 });
  },
  whoosh() {
    tone(300, 0, 0.35, { gain: 0.05, type: 'triangle', glide: 3 });
  },
  candle() {
    tone(1200, 0, 0.18, { gain: 0.05, glide: 0.7 });
  },
  star(index: number) {
    bell([659, 784, 988][index] ?? 988, 0, 0.18);
  },
  doorOpen() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => bell(f, i * 0.09, 0.12));
  },
  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => bell(f, i * 0.12, 0.14));
    bell(1047, 0.6, 0.18);
    bell(1319, 0.6, 0.12);
  },
  flip() {
    tone(700, 0, 0.2, { gain: 0.08, type: 'triangle', glide: 1.6 });
  },
};
