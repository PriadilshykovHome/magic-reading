// Local-first save: progress is written to this device on every change, so nothing is lost
// offline or when the tab closes. Each account has its own copy (`guest` before any login), and
// the device remembers whose it was, so the right progress shows before the cloud has answered.
import { ProfileSchema, type Profile } from '../engine/merge';
import { emptyProgress, ProgressSchema, type Progress } from '../engine/progress';

const PREFIX = 'magic-reading';
export const GUEST = 'guest';

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage blocked (private mode)
  }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // storage full or blocked: the game keeps working, this session just isn't saved here
  }
};

/** Whose progress this device showed last: an account id, or "guest". */
export const lastAccount = (): string => read(`${PREFIX}:account`) ?? GUEST;
export const rememberAccount = (account: string) => write(`${PREFIX}:account`, account);

/** The parent chose to play without logging in on this device. */
export const choseGuest = (): boolean => read(`${PREFIX}:guest-chosen`) === '1';
export const rememberGuestChoice = () => write(`${PREFIX}:guest-chosen`, '1');

export function loadProgress(account: string = lastAccount()): Progress {
  const key = `${PREFIX}:progress:${account}`;
  const raw = read(key);
  if (!raw) return emptyProgress();
  try {
    const parsed = ProgressSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    // corrupt JSON: kept aside below
  }
  // Keep an unreadable save aside instead of silently destroying it.
  write(`${key}:unreadable:${Date.now()}`, raw);
  return emptyProgress();
}

export const hasProgress = (account: string) => read(`${PREFIX}:progress:${account}`) !== null;
export const saveProgress = (account: string, progress: Progress) => write(`${PREFIX}:progress:${account}`, JSON.stringify(progress));
export const forgetProgress = (account: string) => write(`${PREFIX}:progress:${account}`, null);

export function loadProfile(account: string): Profile | null {
  const raw = read(`${PREFIX}:profile:${account}`);
  if (!raw) return null;
  try {
    const parsed = ProfileSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export const saveProfile = (account: string, profile: Profile) => write(`${PREFIX}:profile:${account}`, JSON.stringify(profile));
