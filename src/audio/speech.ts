// Fallback voice: the browser's Ukrainian speech, for every line or item that has no recording
// yet. The voice scheduler decides when it plays; this only knows how.
import { SILENT } from '../testMode';
import type { Playback } from './scheduler';

const supported = !SILENT && typeof window !== 'undefined' && 'speechSynthesis' in window;
let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('uk')) ?? null;
}

if (supported) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function hasUkrainianVoice(): boolean {
  return voice !== null;
}

export function speechPlayback(text: string, rate: number, volume: number): Playback {
  if (!supported || !text.trim()) return { done: Promise.resolve(), stop() {} };
  let finish = () => {};
  const done = new Promise<void>((resolve) => (finish = resolve));
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'uk-UA';
  if (voice) u.voice = voice;
  u.rate = rate;
  u.pitch = 1.1;
  u.volume = volume;
  // Never hang the game on a silent or broken speech engine.
  const timer = window.setTimeout(finish, 1500 + text.length * 120);
  u.onend = u.onerror = () => {
    window.clearTimeout(timer);
    finish();
  };
  speechSynthesis.speak(u);
  return {
    done,
    stop() {
      window.clearTimeout(timer);
      speechSynthesis.cancel();
      finish();
    },
  };
}

/** iOS only lets speech start from a tap: call this from the first one. */
export function unlockSpeech(): void {
  if (!supported) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  speechSynthesis.speak(u);
}
