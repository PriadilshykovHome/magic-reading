// npm run audio:generate
// Synthesises the game's sound effects (one Howler sprite) and music loops as WAV files.
// Everything is generated from code, so it is original and free to use (CC0). Deterministic:
// running it again produces the same files. Recorded voice clips are separate (Phase 8).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = join(import.meta.dirname, '..', 'public', 'audio');
const TAU = Math.PI * 2;

// ---------- buffers ----------

class Track {
  readonly rate: number;
  readonly data: Float32Array;
  constructor(rate: number, seconds: number) {
    this.rate = rate;
    this.data = new Float32Array(Math.ceil(rate * seconds));
  }
  get seconds() {
    return this.data.length / this.rate;
  }
  add(at: number, fn: (t: number) => number, dur: number, gain = 1) {
    const start = Math.floor(at * this.rate);
    const n = Math.floor(dur * this.rate);
    for (let i = 0; i < n && start + i < this.data.length; i++) {
      if (start + i >= 0) this.data[start + i]! += gain * fn(i / this.rate);
    }
  }
}

let seed = 7;
const noise = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
};

const env = (t: number, attack: number, decay: number) => (t < attack ? t / attack : Math.exp(-(t - attack) * decay));

// ---------- instruments ----------

/** Soft bell: a few inharmonic partials, each decaying at its own rate. */
const bell =
  (freq: number, bright = 1) =>
  (t: number) => {
    const partials: [number, number, number][] = [
      [1, 1, 2.6],
      [2.0, 0.45 * bright, 4.5],
      [3.01, 0.22 * bright, 7],
      [4.18, 0.08 * bright, 11],
    ];
    let v = 0;
    for (const [ratio, amp, decay] of partials) v += amp * Math.sin(TAU * freq * ratio * t) * env(t, 0.004, decay);
    return v * 0.5;
  };

/** Music box: brighter, quicker decay. */
const musicBox = (freq: number) => (t: number) =>
  (Math.sin(TAU * freq * t) * env(t, 0.003, 3.2) +
    0.35 * Math.sin(TAU * freq * 2 * t) * env(t, 0.003, 5.5) +
    0.12 * Math.sin(TAU * freq * 3.98 * t) * env(t, 0.002, 9)) *
  0.45;

/** Warm pad: detuned sines with a slow swell and gentle vibrato. */
const pad = (freqs: number[], dur: number) => (t: number) => {
  const a = Math.min(1, t / 1.2) * Math.min(1, Math.max(0, (dur - t) / 1.4));
  let v = 0;
  for (const f of freqs) {
    for (const detune of [-0.003, 0, 0.003]) v += Math.sin(TAU * f * (1 + detune) * t + 0.6 * Math.sin(TAU * 4.5 * t) * 0.002 * f);
  }
  return (v / (freqs.length * 3)) * a * 0.5;
};

/** Filtered noise with an envelope (whooshes, crackles, puffs). */
function noiseHit(track: Track, at: number, dur: number, opts: { attack: number; decay: number; tone: number; gain: number }) {
  let low = 0;
  track.add(
    at,
    (t) => {
      low += opts.tone * (noise() - low);
      return low * env(t, opts.attack, opts.decay);
    },
    dur,
    opts.gain,
  );
}

const sweep = (from: number, to: number, dur: number, decay: number) => {
  let phase = 0;
  let last = 0;
  return (t: number) => {
    const f = from * Math.pow(to / from, Math.min(1, t / dur));
    phase += TAU * f * (t - last);
    last = t;
    return Math.sin(phase) * env(t, 0.005, decay);
  };
};

// ---------- reverb (Schroeder) ----------

function reverb(input: Float32Array, rate: number, wet: number, size = 1): Float32Array {
  const scale = (rate / 44100) * size;
  const combs = [1116, 1188, 1277, 1356].map((d) => ({ buf: new Float32Array(Math.round(d * scale)), i: 0, store: 0 }));
  const allpasses = [556, 225].map((d) => ({ buf: new Float32Array(Math.round(d * scale)), i: 0 }));
  const out = new Float32Array(input.length);
  for (let n = 0; n < input.length; n++) {
    const x = input[n]!;
    let acc = 0;
    for (const c of combs) {
      const y = c.buf[c.i]!;
      c.store = y * 0.75 + c.store * 0.25;
      c.buf[c.i] = x + c.store * 0.84;
      c.i = (c.i + 1) % c.buf.length;
      acc += y;
    }
    let y = acc / combs.length;
    for (const a of allpasses) {
      const b = a.buf[a.i]!;
      a.buf[a.i] = y + b * 0.5;
      a.i = (a.i + 1) % a.buf.length;
      y = b - y * 0.5;
    }
    out[n] = x * (1 - wet) + y * wet * 2.2;
  }
  return out;
}

function normalize(data: Float32Array, peakDb: number): Float32Array {
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const target = Math.pow(10, peakDb / 20);
  return peak > 0 ? data.map((v) => (v / peak) * target) : data;
}

function writeWav(path: string, data: Float32Array, rate: number) {
  const buf = Buffer.alloc(44 + data.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + data.length * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(data.length * 2, 40);
  data.forEach((v, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
  writeFileSync(path, buf);
  console.log(`  ${path.slice(OUT.length + 1)}  ${(buf.length / 1024).toFixed(0)} KB, ${(data.length / rate).toFixed(1)} s`);
}

const NOTE = (name: string) => {
  const m = name.match(/^([A-G])(#?)(\d)$/)!;
  const semis = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1] as 'C'] + (m[2] ? 1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * Math.pow(2, semis / 12);
};

// ---------- sound effects (one sprite) ----------

const SFX_RATE = 22050;
type Sfx = { name: string; seconds: number; render: (t: Track) => void };

const SFX: Sfx[] = [
  { name: 'tap', seconds: 0.12, render: (t) => t.add(0, (x) => Math.sin(TAU * 620 * x) * env(x, 0.002, 40), 0.1, 0.5) },
  ...(['G5', 'A5', 'B5'] as const).map((n, i) => ({
    name: `correct${i}`,
    seconds: 1.1,
    render: (t: Track) => {
      t.add(0, bell(NOTE(n)), 1.0, 0.8);
      t.add(0.09, bell(NOTE(n) * 1.5), 0.9, 0.5);
    },
  })),
  {
    name: 'golden',
    seconds: 1.6,
    render: (t) => ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => t.add(i * 0.07, bell(NOTE(n), 1.3), 1.2, 0.55)),
  },
  {
    name: 'wrong',
    seconds: 0.5,
    render: (t) => t.add(0, (x) => Math.sin(TAU * (220 - 50 * x) * x) * env(x, 0.04, 7) * (1 + 0.15 * Math.sin(TAU * 7 * x)), 0.45, 0.45),
  },
  { name: 'whoosh', seconds: 0.5, render: (t) => noiseHit(t, 0, 0.45, { attack: 0.12, decay: 9, tone: 0.18, gain: 0.9 }) },
  {
    name: 'sparkle',
    seconds: 0.9,
    render: (t) => {
      for (let i = 0; i < 9; i++) t.add(i * 0.05, bell(1800 + ((i * 523) % 1700), 0.6), 0.5, 0.18);
    },
  },
  {
    name: 'clink',
    seconds: 0.5,
    render: (t) => {
      t.add(0, bell(2400, 0.4), 0.45, 0.4);
      t.add(0.03, bell(3330, 0.3), 0.35, 0.25);
    },
  },
  {
    name: 'candle',
    seconds: 0.5,
    render: (t) => {
      noiseHit(t, 0, 0.3, { attack: 0.01, decay: 18, tone: 0.08, gain: 0.7 });
      t.add(0.02, (x) => Math.sin(TAU * 180 * x) * env(x, 0.02, 10), 0.4, 0.3);
    },
  },
  {
    name: 'place',
    seconds: 0.25,
    render: (t) => {
      t.add(0, (x) => Math.sin(TAU * 440 * x) * env(x, 0.002, 28), 0.2, 0.55);
      noiseHit(t, 0, 0.05, { attack: 0.001, decay: 80, tone: 0.5, gain: 0.25 });
    },
  },
  {
    name: 'pop',
    seconds: 0.2,
    render: (t) => t.add(0, sweep(500, 1400, 0.06, 30), 0.18, 0.6),
  },
  {
    name: 'doorOpen',
    seconds: 2.2,
    render: (t) => {
      t.add(0, pad([NOTE('C3'), NOTE('G3')], 2.1), 2.1, 0.8);
      ['C5', 'E5', 'G5', 'C6', 'E6'].forEach((n, i) => t.add(0.1 + i * 0.09, bell(NOTE(n)), 1.5, 0.45));
    },
  },
  ...(['C6', 'E6', 'G6'] as const).map((n, i) => ({
    name: `star${i}`,
    seconds: 1.3,
    render: (t: Track) => {
      t.add(0, bell(NOTE(n), 1.2), 1.2, 0.7);
      for (let k = 0; k < 4; k++) t.add(0.05 + k * 0.04, bell(NOTE(n) * 2 + k * 90, 0.5), 0.4, 0.12);
    },
  })),
  {
    name: 'fireworkLaunch',
    seconds: 0.9,
    render: (t) => {
      t.add(0, sweep(350, 1300, 0.8, 1.2), 0.85, 0.25);
      noiseHit(t, 0, 0.8, { attack: 0.3, decay: 3, tone: 0.3, gain: 0.25 });
    },
  },
  {
    name: 'fireworkBurst',
    seconds: 1.6,
    render: (t) => {
      noiseHit(t, 0, 0.6, { attack: 0.002, decay: 9, tone: 0.12, gain: 1.1 });
      for (let i = 0; i < 26; i++) noiseHit(t, 0.08 + ((i * 0.37) % 1.1), 0.03, { attack: 0.001, decay: 120, tone: 0.7, gain: 0.35 });
    },
  },
  {
    name: 'shimmer', // stands in for kids' cheers until a CC0 recording is added
    seconds: 1.8,
    render: (t) => {
      for (let i = 0; i < 12; i++) t.add(i * 0.06, bell(NOTE('C5') * Math.pow(2, i / 5), 0.8), 1.0, 0.25);
    },
  },
  {
    name: 'cardFlip',
    seconds: 0.35,
    render: (t) => {
      noiseHit(t, 0, 0.18, { attack: 0.02, decay: 22, tone: 0.45, gain: 0.7 });
      t.add(0.06, sweep(500, 900, 0.1, 18), 0.25, 0.2);
    },
  },
  {
    name: 'eggCrack',
    seconds: 0.7,
    render: (t) => {
      for (const at of [0, 0.12, 0.3]) noiseHit(t, at, 0.06, { attack: 0.001, decay: 70, tone: 0.6, gain: 0.8 });
    },
  },
  {
    name: 'dragonChirp',
    seconds: 0.6,
    render: (t) => {
      t.add(0, sweep(900, 1700, 0.12, 9), 0.25, 0.4);
      t.add(0.2, sweep(1000, 1900, 0.12, 9), 0.3, 0.35);
    },
  },
  {
    name: 'owlHoot',
    seconds: 1.1,
    render: (t) => {
      for (const [at, f] of [[0, 420], [0.42, 390]] as const) {
        t.add(at, (x) => Math.sin(TAU * f * x + 0.3 * Math.sin(TAU * 5 * x)) * Math.min(1, x / 0.06) * Math.exp(-x * 4), 0.5, 0.45);
      }
    },
  },
  {
    name: 'sneeze',
    seconds: 0.7,
    render: (t) => {
      t.add(0, sweep(500, 900, 0.25, 2), 0.25, 0.15);
      noiseHit(t, 0.27, 0.35, { attack: 0.005, decay: 12, tone: 0.35, gain: 0.9 });
    },
  },
];

function makeSfx() {
  const gap = 0.1;
  const total = SFX.reduce((s, x) => s + x.seconds + gap, 0);
  const track = new Track(SFX_RATE, total);
  const sprite: Record<string, [number, number]> = {};
  let at = 0;
  for (const s of SFX) {
    const one = new Track(SFX_RATE, s.seconds);
    s.render(one);
    const wet = reverb(one.data, SFX_RATE, 0.12, 0.6);
    track.data.set(wet.subarray(0, one.data.length), Math.floor(at * SFX_RATE));
    sprite[s.name] = [Math.round(at * 1000), Math.round(s.seconds * 1000)];
    at += s.seconds + gap;
  }
  mkdirSync(join(OUT, 'sfx'), { recursive: true });
  writeWav(join(OUT, 'sfx', 'sfx.wav'), normalize(track.data, -2), SFX_RATE);
  writeFileSync(join(import.meta.dirname, '..', 'src', 'core', 'audio', 'sfx-sprite.json'), `${JSON.stringify(sprite, null, 2)}\n`);
}

// ---------- music ----------

const MUSIC_RATE = 16000;
const BEAT = 60 / 72;
const CHORDS: string[][] = [
  ['C3', 'E3', 'G3'],
  ['A2', 'C3', 'E3'],
  ['F2', 'A2', 'C3'],
  ['G2', 'B2', 'D3'],
  ['C3', 'E3', 'G3'],
  ['A2', 'C3', 'E3'],
  ['D3', 'F3', 'A3'],
  ['G2', 'B2', 'D3'],
];
// A gentle lullaby line (two notes per bar), pentatonic so nothing clashes.
const MELODY = ['E5', 'G5', 'C5', 'E5', 'A4', 'C5', 'D5', 'B4', 'E5', 'G5', 'A5', 'G5', 'F5', 'D5', 'D5', 'G4'];

/** Renders `bars` of music plus its reverb tail, then folds the tail onto the start: a seamless loop. */
function loop(render: (t: Track) => void, wet: number): Float32Array {
  const length = CHORDS.length * 4 * BEAT;
  const t = new Track(MUSIC_RATE, length + 4);
  render(t);
  const reverbed = reverb(t.data, MUSIC_RATE, wet, 1.4);
  const n = Math.round(length * MUSIC_RATE);
  const out = reverbed.slice(0, n);
  for (let i = n; i < reverbed.length; i++) out[i - n]! += reverbed[i]!;
  return out;
}

function makeMusic() {
  mkdirSync(join(OUT, 'music'), { recursive: true });

  const map = loop((t) => {
    CHORDS.forEach((chord, bar) => {
      const at = bar * 4 * BEAT;
      t.add(at, pad(chord.map(NOTE), 4 * BEAT + 1.2), 4 * BEAT + 1.2, 0.55);
      // music-box arpeggio: up the chord and back, eighth notes
      const tones = [...chord.map((n) => NOTE(n) * 4), NOTE(chord[0]!) * 8];
      [0, 1, 2, 3, 2, 1, 2, 3].forEach((k, i) => t.add(at + i * (BEAT / 2), musicBox(tones[k]!), 1.6, 0.28));
      // melody
      t.add(at, bell(NOTE(MELODY[bar * 2]!), 0.7), 2.5, 0.42);
      t.add(at + 2 * BEAT, bell(NOTE(MELODY[bar * 2 + 1]!), 0.7), 2.5, 0.38);
    });
  }, 0.32);
  writeWav(join(OUT, 'music', 'map.wav'), normalize(map, -6), MUSIC_RATE);

  // During tasks: almost nothing, so reading keeps its focus.
  const tasks = loop((t) => {
    CHORDS.forEach((chord, bar) => {
      const at = bar * 4 * BEAT;
      t.add(at, pad(chord.map(NOTE), 4 * BEAT + 1.2), 4 * BEAT + 1.2, 0.5);
      if (bar % 2 === 0) t.add(at + BEAT, musicBox(NOTE(MELODY[bar * 2]!)), 2, 0.12);
    });
  }, 0.4);
  writeWav(join(OUT, 'music', 'tasks.wav'), normalize(tasks, -12), MUSIC_RATE);

  const fanfare = new Track(MUSIC_RATE, 4.2);
  ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => fanfare.add(i * 0.14, bell(NOTE(n), 1.1), 1.4, 0.5));
  fanfare.add(0.62, pad(['C4', 'E4', 'G4', 'C5'].map(NOTE), 3.4), 3.4, 0.9);
  ['C6', 'E6', 'G6'].forEach((n) => fanfare.add(0.62, bell(NOTE(n), 1.2), 2.6, 0.35));
  writeWav(join(OUT, 'music', 'fanfare.wav'), normalize(reverb(fanfare.data, MUSIC_RATE, 0.3, 1.2), -3), MUSIC_RATE);
}

console.log('Generating audio:');
makeSfx();
makeMusic();
