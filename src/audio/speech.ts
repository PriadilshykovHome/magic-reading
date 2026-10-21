// Placeholder voice: the browser's Ukrainian speech (Phase 5 swaps in recorded clips).
// Speaking always cancels what was playing, so lines never stack.
const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
let voice: SpeechSynthesisVoice | null = null;
let generation = 0;

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  voice = voices.find((v) => v.lang.toLowerCase().startsWith('uk')) ?? null;
}

if (supported) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function hasUkrainianVoice(): boolean {
  return voice !== null;
}

export function stopSpeech(): void {
  generation++;
  if (supported) speechSynthesis.cancel();
}

function utter(text: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'uk-UA';
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = 1.1;
    // Never hang the game on a silent or broken speech engine.
    const timer = window.setTimeout(() => resolve(), 1200 + text.length * 110);
    const done = () => {
      window.clearTimeout(timer);
      resolve();
    };
    u.onend = done;
    u.onerror = done;
    speechSynthesis.speak(u);
  });
}

/**
 * Speaks the parts one after another (a short pause between them). Resolves when finished, or
 * early with `false` if something else started speaking meanwhile.
 */
export async function speak(parts: string | string[], opts: { rate?: number; gapMs?: number } = {}): Promise<boolean> {
  const list = (Array.isArray(parts) ? parts : [parts]).filter((p) => p.trim().length > 0);
  stopSpeech();
  const mine = generation;
  if (!supported || list.length === 0) return true;
  for (let i = 0; i < list.length; i++) {
    if (mine !== generation) return false;
    await utter(list[i]!, opts.rate ?? 0.9);
    if (i < list.length - 1 && opts.gapMs) await new Promise((r) => window.setTimeout(r, opts.gapMs));
  }
  return mine === generation;
}

/** iOS only lets speech start from a tap: call this from the first one. */
export function unlockSpeech(): void {
  if (!supported) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  speechSynthesis.speak(u);
}
