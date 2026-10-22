// The cloud copy: Firebase Auth (one family account) + Firestore, loaded only when needed so the
// first screen never waits for it. Local first: every change is already on the device
// (localCache.ts); this mirrors it to players/{uid}/games/{game id}, sending only changed fields
// at most every few seconds (and right away when a level ends). Firestore's offline cache queues
// writes made without internet. On login, app start and return to the tab, the cloud copy is
// merged in field by field (src/core/engine/merge.ts), so progress from another device appears.
import type { FirebaseOptions } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { DocumentReference, Firestore } from 'firebase/firestore';
import { game } from '@game';
import { changedPaths, mergeProfile, mergeProgress, ProfileSchema, type Profile } from '../engine/merge';
import { emptyProgress, ProgressSchema, type Progress } from '../engine/progress';
import { useAccount } from '../store/account';
import { useProgress } from '../store/progress';
import { SILENT } from '../testMode';
import { forgetProgress, GUEST, hasProgress, loadProgress, rememberAccount, saveProfile } from './localCache';

const WRITE_EVERY_MS = 5000;

/** The web config is public by design (the security rules protect the data); none in e2e runs. */
function firebaseConfig(): FirebaseOptions | null {
  const env = import.meta.env;
  if (SILENT || !env.VITE_FIREBASE_API_KEY || !env.VITE_FIREBASE_PROJECT_ID) return null;
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
}

export const cloudAvailable = (): boolean => firebaseConfig() !== null;

interface Firebase {
  auth: Auth;
  db: Firestore;
  fs: typeof import('firebase/firestore');
  authApi: typeof import('firebase/auth');
}

let loading: Promise<Firebase> | null = null;
function firebase(): Promise<Firebase> {
  loading ??= (async () => {
    const [{ initializeApp }, authApi, fs] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')]);
    const app = initializeApp(firebaseConfig()!);
    const db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
    const auth = authApi.getAuth(app);
    // Local checks against the Firebase emulators (VITE_FIREBASE_EMULATOR=true), never in production.
    if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_EMULATOR === 'true') {
      authApi.connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      fs.connectFirestoreEmulator(db, '127.0.0.1', 8080);
    }
    return { auth, db, fs, authApi };
  })();
  return loading;
}

/** Logins are email-shaped: a plain username becomes <username>@magic-reading.local. */
export const loginEmail = (login: string) => (login.includes('@') ? login.trim() : `${login.trim().toLowerCase()}@magic-reading.local`);

export async function signIn(login: string, password: string): Promise<'ok' | 'wrong' | 'offline'> {
  const { auth, authApi } = await firebase();
  try {
    await authApi.signInWithEmailAndPassword(auth, loginEmail(login), password);
    return 'ok';
  } catch (e) {
    const code = (e as { code?: string }).code ?? '';
    return code === 'auth/network-request-failed' ? 'offline' : 'wrong';
  }
}

// ---------- the running sync ----------

let session: { uid: string; doc: DocumentReference; written: Progress | null; exists: boolean } | null = null;
let timer: number | undefined;
let writing: Promise<void> = Promise.resolve();

/** Starts following the login; call once at app start. */
export function startSync(): void {
  if (!cloudAvailable()) return;
  void firebase().then(({ auth, authApi }) => {
    authApi.onAuthStateChanged(auth, (user) => void (user ? attach(user.uid) : detach()));
  });
  useProgress.subscribe((state, prev) => {
    if (!session || state.progress === prev.progress) return;
    // A finished level goes up right away; everything else at most every few seconds.
    if (state.progress.levels !== prev.progress.levels) void flush();
    else schedule();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void pull();
    else void flush();
  });
  window.addEventListener('online', () => void pull());
  window.addEventListener('offline', () => session && useAccount.getState().set({ cloud: 'offline' }));
}

async function attach(uid: string) {
  const { db, fs } = await firebase();
  const was = useAccount.getState().account;
  // A guest session on this device joins the account once (merging never loses anything).
  let local = loadProgress(uid);
  if (was === GUEST && hasProgress(GUEST)) {
    local = mergeProgress(local, useProgress.getState().progress, game.content.config.mastery.distinctDays);
    forgetProgress(GUEST);
  }
  rememberAccount(uid);
  useAccount.getState().set({ account: uid, cloud: navigator.onLine ? 'syncing' : 'offline' });
  useProgress.getState().replace(local);
  session = { uid, doc: fs.doc(db, 'players', uid, 'games', game.id), written: null, exists: false };
  await Promise.all([pull(), pullProfile(uid)]);
}

function detach() {
  session = null;
  window.clearTimeout(timer);
  if (useAccount.getState().account !== GUEST) {
    rememberAccount(GUEST);
    useAccount.getState().set({ account: GUEST, profile: null });
    useProgress.getState().replace(loadProgress(GUEST));
  }
  useAccount.getState().set({ cloud: 'off' });
}

/** Merges the cloud copy in, then sends up whatever the cloud is missing. */
async function pull() {
  if (!session) return;
  const { fs } = await firebase();
  const current = session;
  try {
    const snap = await fs.getDoc(current.doc);
    if (session !== current) return;
    const parsed = snap.exists() ? ProgressSchema.safeParse(snap.data()) : null;
    const cloud = parsed?.success ? parsed.data : emptyProgress();
    current.exists = snap.exists();
    current.written = cloud;
    const merged = mergeProgress(useProgress.getState().progress, cloud, game.content.config.mastery.distinctDays);
    useProgress.getState().replace(merged);
    await flush();
  } catch {
    // offline and nothing cached yet: try again when back online
    useAccount.getState().set({ cloud: 'offline' });
  }
}

async function pullProfile(uid: string) {
  const { db, fs } = await firebase();
  try {
    const snap = await fs.getDoc(fs.doc(db, 'players', uid));
    const parsed = ProfileSchema.safeParse(snap.data()?.profile ?? {});
    if (!parsed.success) return;
    const known = useAccount.getState().profile;
    const profile: Profile = known ? mergeProfile(known, parsed.data) : parsed.data;
    saveProfile(uid, profile);
    useAccount.getState().set({ profile });
  } catch {
    // keep the profile this device already has
  }
}

function schedule() {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void flush(), WRITE_EVERY_MS);
}

/** Sends what changed since the last write (one write at a time). */
function flush(): Promise<void> {
  window.clearTimeout(timer);
  writing = writing.then(async () => {
    const current = session;
    if (!current || current.written === null) return;
    const progress = useProgress.getState().progress;
    const changes = changedPaths(current.written, progress);
    if (changes.length === 0) {
      useAccount.getState().set({ cloud: navigator.onLine ? 'synced' : 'offline' });
      return;
    }
    const { fs } = await firebase();
    useAccount.getState().set({ cloud: navigator.onLine ? 'syncing' : 'offline' });
    // Firestore keeps the write in its offline queue, so it is safe to count it as sent.
    current.written = progress;
    const stamp = { updatedAt: fs.serverTimestamp() };
    const done = current.exists
      ? fs.updateDoc(current.doc, new fs.FieldPath('updatedAt'), stamp.updatedAt, ...changes.flatMap((c) => [new fs.FieldPath(...c.path), c.value]))
      : fs.setDoc(current.doc, { ...progress, ...stamp });
    current.exists = true;
    try {
      await done;
      if (session === current) useAccount.getState().set({ cloud: 'synced' });
    } catch {
      // rejected (e.g. signed out meanwhile): the next pull merges and tries again
      if (session === current) current.written = null;
    }
  });
  return writing;
}
