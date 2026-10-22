// Who is playing on this device and how the cloud copy is doing. The sync service
// (src/core/sync/cloud.ts) keeps it up to date; screens only read it.
import { create } from 'zustand';
import type { Profile } from '../engine/merge';
import { GUEST, lastAccount, loadProfile } from '../sync/localCache';

/**
 * off: no cloud on this build (or play without login); syncing: a change is on its way;
 * synced: the cloud has everything; offline: saved here, uploads when back online.
 */
export type CloudState = 'off' | 'syncing' | 'synced' | 'offline';

interface AccountState {
  /** An account id, or "guest". */
  account: string;
  cloud: CloudState;
  /** The private profile (surname, patronymic, birthday), from his cloud document only. */
  profile: Profile | null;
  set(patch: Partial<Omit<AccountState, 'set'>>): void;
}

const start = lastAccount();

export const useAccount = create<AccountState>()((set) => ({
  account: start,
  cloud: 'off',
  profile: start === GUEST ? null : loadProfile(start),
  set: (patch) => set(patch),
}));
