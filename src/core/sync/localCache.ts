// Local-first save: progress is written to this device on every change, so nothing is lost
// offline or when the tab closes. (Phase 7 adds the cloud copy and per-account keys.)
import { emptyProgress, ProgressSchema, type Progress } from '../engine/progress';

const KEY = 'magic-reading:progress:guest';

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = ProgressSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
    // Keep an unreadable save aside instead of silently destroying it.
    localStorage.setItem(`${KEY}:unreadable:${Date.now()}`, raw);
  } catch {
    // storage blocked (private mode) or corrupt JSON: start fresh
  }
  return emptyProgress();
}

export function saveProgress(progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // storage full or blocked: the game keeps working, this session just isn't saved
  }
}
