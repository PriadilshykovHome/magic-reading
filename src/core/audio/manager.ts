// The audio manager: three channels (voice, effects, music) with their own volumes. Music ducks
// to 30% while Соня speaks. Recorded clips play through Howler; missing ones fall back to speech.
import { Howl, Howler } from 'howler';
import manifest from 'virtual:audio-manifest';
import { SILENT, TEST_BUILD } from '../testMode';
import { pause, SfxGate, VoiceScheduler, type Playback, type Starter } from './scheduler';
import musicLengths from './music-lengths.json';
import spriteJson from './sfx-sprite.json';
import { speechPlayback, takeRefused, unlockSpeech } from './speech';

export type SfxName = keyof typeof spriteJson;
/** [start ms, duration ms] of each effect in the generated sprite (scripts/make-audio.ts). */
const sprite = spriteJson as unknown as Record<SfxName, [number, number]>;
export type MusicTrack = 'map' | 'tasks';

const BASE = `${import.meta.env.BASE_URL}audio/`;
const DUCK = 0.3;
const available = new Set(manifest);
const volumes = { voice: 1, sfx: 0.8, music: 0.3 };
const silentPlayback = (): Playback => ({ done: Promise.resolve(), stop() {} });

export const scheduler = new VoiceScheduler();

export function hasRecording(path: string): boolean {
  return available.has(path);
}

export function setVolumes(next: Partial<typeof volumes>): void {
  Object.assign(volumes, next);
  if (currentTrack) music(currentTrack).volume(musicLevel());
}

// ---------- voice ----------

const voiceClips = new Map<string, Howl>();

function voiceClip(path: string): Howl {
  let clip = voiceClips.get(path);
  if (!clip) {
    clip = new Howl({ src: [BASE + path], preload: true });
    voiceClips.set(path, clip);
  }
  return clip;
}

function playClip(clip: Howl): Playback {
  let finish = () => {};
  const done = new Promise<void>((resolve) => (finish = resolve));
  clip.volume(volumes.voice);
  const id = clip.play();
  const end = () => {
    window.clearTimeout(safety);
    finish();
  };
  const safety = window.setTimeout(end, 20_000);
  clip.once('end', end, id);
  clip.once('stop', end, id);
  clip.once('playerror', end, id);
  clip.once('loaderror', end);
  return {
    done,
    stop() {
      clip.stop(id);
      end();
    },
  };
}

/** A recorded clip under public/audio if it exists, otherwise the browser reads `text`. */
export function clipStarter(path: string | undefined, text: string, rate = 0.85): Starter {
  if (SILENT) return silentPlayback;
  if (path && available.has(path)) return () => playClip(voiceClip(path));
  return () => speechPlayback(text, rate, volumes.voice);
}

/** Load a level's clips ahead of time so they start instantly. */
export function preloadClips(paths: string[]): void {
  if (SILENT) return;
  for (const path of paths) if (available.has(path)) voiceClip(path);
}

// ---------- effects ----------

let effects: Howl | null = null;
const gate = new SfxGate();

function effectsSprite(): Howl | null {
  if (SILENT) return null;
  effects ??= new Howl({ src: [`${BASE}sfx/sfx.mp3`], sprite, preload: true });
  return effects;
}

export function playSfx(name: SfxName): void {
  const howl = effectsSprite();
  if (!howl || volumes.sfx <= 0) return;
  const release = gate.tryPlay(name, performance.now());
  if (!release) return;
  howl.volume(volumes.sfx);
  const id = howl.play(name);
  howl.once('end', release, id);
  window.setTimeout(release, sprite[name][1] + 250);
}

// ---------- music ----------

const tracks = new Map<string, Howl>();
let currentTrack: MusicTrack | null = null;
let ducked = false;

/** A track is fetched only when its screen first plays it. It plays as a sprite of its exact
 *  length (scripts/make-audio.ts), so the MP3 encoder's padding never leaves a gap in the loop. */
function music(name: MusicTrack | 'fanfare'): Howl {
  let howl = tracks.get(name);
  if (!howl) {
    const sprite = { [TRACK]: [0, musicLengths[name], name !== 'fanfare'] as [number, number, boolean] };
    howl = new Howl({ src: [`${BASE}music/${name}.mp3`], sprite, preload: true, volume: 0 });
    tracks.set(name, howl);
  }
  return howl;
}

const TRACK = 'track';

const musicLevel = () => volumes.music * (ducked ? DUCK : 1);

/** Crossfades to a looping track (or to silence). */
export function setMusic(track: MusicTrack | null): void {
  if (SILENT || track === currentTrack) return;
  const previous = currentTrack;
  currentTrack = track;
  if (previous) {
    const old = music(previous);
    old.fade(old.volume(), 0, 700);
    window.setTimeout(() => {
      if (currentTrack !== previous) old.pause();
    }, 750);
  }
  if (track) {
    const howl = music(track);
    if (!howl.playing()) howl.play(TRACK);
    howl.fade(howl.volume(), musicLevel(), 900);
  }
}

/** The short celebration fanfare, on the music channel. */
export function playFanfare(): void {
  if (SILENT || volumes.music <= 0) return;
  const howl = music('fanfare');
  howl.volume(Math.min(1, volumes.music * 2.4));
  howl.play(TRACK);
}

scheduler.onSpeaking((speaking) => {
  ducked = speaking;
  if (!currentTrack) return;
  const howl = music(currentTrack);
  howl.fade(howl.volume(), musicLevel(), speaking ? 200 : 600);
});

// ---------- unlock & visibility ----------

let unlocked = false;

/** iPhones and iPads only allow sound after a tap: the magic door (or any first tap) unlocks it. */
export function unlockAudio(): void {
  if (SILENT || unlocked) return;
  unlocked = true;
  unlockSpeech();
  const refused = takeRefused();
  if (refused.length) void scheduler.say(refused.map((r) => () => speechPlayback(r.text, r.rate, volumes.voice)), 'ifIdle');
  effectsSprite(); // creating a Howl inside the tap sets up and resumes the audio context
  void Howler.ctx?.resume();
}

if (!SILENT && typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    Howler.mute(document.hidden);
    if (document.hidden) scheduler.stop();
  });
}

// Test builds: let automated checks see the audio state (production strips this).
if (TEST_BUILD && !SILENT && typeof window !== 'undefined') {
  (window as unknown as { __audio: object }).__audio = {
    context: () => Howler.ctx?.state ?? 'none',
    effects: () => effects?.state() ?? 'none',
    music: () => (currentTrack ? { track: currentTrack, state: music(currentTrack).state(), volume: music(currentTrack).volume(), playing: music(currentTrack).playing() } : null),
    speaking: () => scheduler.speaking,
    /** Occupies the voice channel for `ms` (as a line would), to check the music ducks. */
    holdVoice: (ms: number) => scheduler.say([pause(ms)], 'interrupt'),
  };
}
