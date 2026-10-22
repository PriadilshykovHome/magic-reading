# Architecture

How the game is built. The rules every change follows are in [CLAUDE.md](../CLAUDE.md); the vision and roadmap in [PLAN.md](PLAN.md); content in [curriculum.md](curriculum.md).

## Tech stack & architecture

The app is a static single-page site built with Vite, React and TypeScript, hosted on GitHub Pages, with Firebase for login and cloud save. There is no server to run.

| Concern | Choice | Why |
| --- | --- | --- |
| Build | Vite + TypeScript | Fast dev server, static output for GitHub Pages |
| UI | React | Component per screen and per task type |
| UI animation | Motion (`motion/react`) | Spring physics, layout and exit animations |
| Particles | tsParticles (confetti and fireworks presets) on one canvas; ambient embers use a tiny custom canvas loop | Sparkles, fireworks, confetti without heavy DOM; embers stay light enough for the 3-second first load |
| Audio | Howler.js | Sound sprites, separate channels, unlocks audio on iOS |
| State | Zustand | Small stores for game, progress and settings |
| Routing | React Router with hash URLs | GitHub Pages has no fallback for deep links |
| Content validation | Zod schemas | A typo in a level file fails the build, not the game |
| Login + cloud save | Firebase Auth (email/password) + Firestore | Free tier, works from a static site |
| Offline + install | vite-plugin-pwa (Phase 10) | Installable, caches app and audio |
| Tests | Vitest (logic), Playwright (screens on phone/tablet/laptop sizes) | Catch layout and flow regressions |
| Scripts | Node 24's built-in TypeScript support | Runs `scripts/*.ts` such as `validate-content` with no extra tool |

**Layers.** Content (JSON) feeds a pure TypeScript engine. The engine feeds stores, which feed the UI. Audio, sync and effects are services the UI calls. The engine has no React and no browser APIs, so it is fully unit-tested.

- **Engine:** builds a session from a level file, picks items (favouring weak ones), picks distractors, scores answers, and computes stars, sparks and unlocks.
- **Task registry:** maps a type id to its plug-in.
- **Stores:** the progress store is the single source of truth and is mirrored to local storage and Firestore by the sync service.

**Folder structure.**

```text
public/
  audio/uk/voice/      syllables, words, sentences, Соня's lines
  audio/sfx/  audio/music/
  img/                 word pictures, scenes, characters, map
content/
  config.json  templates.json  strings.uk.json  voice.uk.json  cards.json
  worlds/tower-of-syllables/world.json     units of levels
  worlds/tower-of-syllables/lexicon.json   items first taught there
src/
  app/                 main.tsx, router.tsx
  core/                the game-agnostic shell, shared later with the English and maths games
    engine/            session, picker, run, rewards, progress (pure TS)
    screens/           Door Login Map LevelIntro TaskRunner Celebration Book Album Parent
    characters/        Sonya, Iskryk (layered SVG + animation states)
    fx/ audio/ ui/ store/ sync/ styles/
    game.ts            the seam to the active game ('@game', '@game-ui')
  reading/             this game's domain pack: lexicon, letters, distractors, task types, intro demos
scripts/validate-content.ts
.github/workflows/deploy.yml
```

**Task plug-in contract.** Every task type implements the same interface, so adding one never touches the game loop: its pure `TaskLogic` (`src/core/engine/taskLogic.ts`) plus a React `Component`. The full contract is in [CLAUDE.md](../CLAUDE.md) ("Task plug-in contract"); the new-task-type skill (`.claude/skills/new-task-type/`) walks through adding one.

## Core and the game seam

- **Core and domain.** `src/core/` is game-agnostic: engine skeleton, spaced repetition, feedback events, rewards, progress, audio, effects, characters, UI, sync and the shared screens. `src/reading/` is this game's domain pack: lexicon, letters, distractors, curriculum, task types and intro demos.
  - A lint rule stops core from importing reading.
  - The English and maths games will reuse core, Соня, Іскрик and the private profile, each with its own domain pack and progress document. Core moves to a shared package only when game 2 starts.

**The seam.** Core reaches the active game only through two aliases, set in one `GAME` constant in `vite.config.ts` (and `tsconfig.app.json`):

- `@game` → `GameData` (`src/core/game.ts`): the game's `id` (also its cloud document, `players/{uid}/games/{id}`), `locale` (`'uk-UA'`: speech and lower-casing), `audioRoot` (`'uk'`: its folder under `public/audio/`), `strings` (core's `t`; typed by the game's own strings file, so core's screens are checked against its keys), the indexed `content`, the `DomainEngine`, the task logics, and what Соня says for each item;
- `@game-ui` → `GameUi`: the task components and the level-intro demo.

A domain pack implements `DomainEngine` (`kindOf`, `hasItem`, `createBuildContext`: candidates, review, distractors); core owns ordering, spaced repetition, fallbacks, the Magic Door, feedback events and rewards.

**Proof and template.** `src/core/engine/secondGame.test.ts` runs a tiny counting game (`src/core/engine/fixtures/countStars/`: its own content, a `DomainEngine`, one `TaskLogic`) through core alone: core's content checks, sessions, a level played and finished, the next one unlocked. It is the starting point for the maths game.

## Login & cross-device progress

Use Firebase Authentication with email/password, plus one Firestore document per player. It's free at this scale, works from GitHub Pages, and never pauses, unlike Supabase's free tier, which pauses after a week without use. The [Firebase Spark plan](https://firebase.google.com/pricing) covers 20,000 writes and 50,000 reads a day; one session uses a few dozen.

**The account.**

- You create the single account yourself in the Firebase console (Authentication → Users → Add user). The app has a login screen but no sign-up screen.
- The login screen asks for a username and password. The app turns the username into an internal email, for example `sashko` → `sashko@magic-reading.local`, because Firebase logins are email-shaped. If you'd rather have password reset by email, use your real email as the login instead.
- Firebase keeps the device logged in, so you type the password once per device.
- Add your `<username>.github.io` domain and `localhost` to Firebase's authorised domains.

**Security rules.** The Firebase web config (including its API key) is public by design. What protects the data is the rule that each signed-in user can touch only their own document:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

**Data model.** `players/{uid}` holds the private profile, shared by all of his games (the English and maths games come later). Each game's progress is one small document under it, `players/{uid}/games/reading-uk`; the security rule above matches `players/{uid}/{document=**}`. Items are keyed by lexicon id rather than by Cyrillic text, so field paths stay simple. To stay far below Firestore's 1 MiB limit at 300 levels (about 2,500 items), an item keeps only its last `mastery.distinctDays` okDays, dates are day keys, and writes update changed field paths only (under 350 KB in total, checked by a unit test).

```json
{
  "schemaVersion": 1,
  "updatedAt": "<server timestamp>",
  "profile":  { "surname": "…", "patronymic": "…", "birthday": "YYYY-MM-DD" },
  "settings": { "parentNearby": true, "lowercaseSentences": false, "music": 0.3, "sfx": 0.8, "voice": 1.0 },
  "levels":   { "tower-of-syllables/01": { "bestStars": 3, "plays": 4, "completedAt": "…" } },
  "items":    { "syl-ma": { "box": 3, "seen": 12, "firstTryOk": 9, "wrong": 3, "lastSeen": "…", "okDays": ["…"] } },
  "rewards":  { "sparksEarned": 152, "sparksSpent": 15, "cards": ["card-hedgehog"], "litWindows": ["…"], "milestones": ["firstThreeStars"] },
  "easterEggs": { "found": ["moon-star"] }
}
```

**Sync rules.**

1. **Local first.** Every answer updates the progress store and is written to local storage immediately, so nothing is lost offline or if the tab closes.
2. **Cloud write, batched.** The cloud copy is written after each task (debounced to at most one write per 5 seconds) and right after a level, as changed field paths only. The app uses Firestore Lite (no offline cache of its own, a fifth of the size): a write that fails is simply sent again, merged with the cloud copy, when the device is back online, the tab returns, or after 30 seconds, because the local copy already holds everything.
3. **Merge on login and app start.** Load the cloud and local copies and merge them field by field:
   - Counters only ever go up and take the higher value (sparksEarned, sparksSpent, plays, best stars). The spark balance he sees is sparksEarned − sparksSpent, so spending sparks later (hats, wand colours) still merges safely.
   - The private profile (surname, patronymic, birthday) keeps the most recently edited version.
   - Lists take the union (cards, lit windows, found eggs, okDays).
   - Each item keeps the version with the later `lastSeen`.
   - The merged result is written back.
4. **Play without cloud.** Progress is kept under a local guest key and merged into the account at the next login.

These merge rules are enough because one child plays on one device at a time. A `schemaVersion` field lets later versions migrate old saves. Іскрик's growth stage is derived from completed levels and `sparksEarned`, never stored, so devices can't disagree about it.

## Loading and size budgets

The first screen waits only for what the everyday path needs: the door, the map, the level intro and the task runner, with React, the router, Zod, Howler, Motion's core and the content. Everything else loads when first needed:

- Screens off the everyday path are React Router `lazy` routes: login, celebration, warm-up and the test-only dev screens (later the Book and the album). The celebration is fetched in the background once the app is idle, so it is ready when the first level ends.
- Firebase loads after the first screen (Auth + Firestore Lite, about 276 KB).
- Motion's animation features and the particle engine load after the first paint; each music track loads when a screen first plays it.

`scripts/check-prod-build.ts` (CI) fails the build when it outgrows its budgets: first-load JS 215 KB gzip, any lazy chunk 60 KB gzip, audio 520 KB, the whole site 2.4 MB (Oct 2026: 207 KB, ≤ 38 KB, 480 KB, 1.8 MB). Raise one only on purpose. `npm run bundle-report` shows what each package and source folder costs in every chunk.

Content stays in the main bundle: about 50 KB gzip at 290 levels, parsed and expanded at startup in a few milliseconds. Split it per world only if the bundle report says so.

## Audio pipeline

- Everything plays through `src/core/audio/`: `voice` (Соня's lines and items, one at a time through `VoiceScheduler`), `sfx` (one sprite) and `useMusic(track)`. Music ducks to 30% while she speaks.
- Effects and music are generated by `npm run audio:generate` (`scripts/make-audio.ts`): synthesised, original, CC0 and deterministic, then encoded by ffmpeg as mono MP3 (effects 64 kbps, music 40 kbps). Music loops play as a Howler sprite of their exact length (`music-lengths.json`), so the encoder's padding never leaves a gap (checked in Chromium and WebKit).
- Recordings live under `public/audio/uk/` at the paths the lexicon derives; `virtual:audio-manifest` lists what exists, and anything missing falls back to browser speech. Chrome refuses speech before the page's first tap; whatever it refused is said on that tap.
- Audio unlocks on the door tap (iOS). `npx playwright test --config e2e/audio.config.ts` checks the unlock, the music and the ducking in WebKit.

## Testing & deployment

Every push to `main` runs validation and tests, and only a green build is deployed to GitHub Pages.

**Deployment.**

- In the repo, set Settings → Pages → Source to **GitHub Actions**. In `vite.config.ts`, set `base` to `'/<repo-name>/'`.
- The workflow (`.github/workflows/deploy.yml`) runs three jobs on every push and pull request:
  - **checks:** `npm ci` → lint → `validate-content` → unit tests → the rules test (Java 21, Firestore emulator) → build → `check-prod-build` → upload the Pages artifact;
  - **e2e:** in Playwright's own image (`mcr.microsoft.com/playwright:v<version>-noble`, whose tag must match `@playwright/test` in `package.json`), so no browser install;
  - **deploy:** on `main` only, after both.
- Firebase web config goes in `VITE_FIREBASE_*` variables: `.env.local` on your laptop, and repository variables in GitHub Actions. These values are public by design; keeping them out of the code just makes switching projects easy.
- Deploy the security rules from the repo with the Firebase CLI (`firebase deploy --only firestore:rules`), so the rules are versioned with the code.
- Once the PWA exists (Phase 10), it updates itself on the next launch after a deploy. The door screen shows the build id, so you can confirm which build is running.

**Automated tests.**

| Kind | Tool | Covers |
| --- | --- | --- |
| Unit | Vitest | Engine (session, picker, scoring, rewards), sync merge rules, Orthodox Easter date, content schemas |
| Security rules | Firebase emulator | A user can read and write only their own document |
| End to end | Playwright | The layout rules on every screen and task type at 360×640, 844×390, 768×1024 and 1024×768 (no scroll, nothing cut off, tap targets, text sizes); three levels played start to finish; the celebration; audio unlock and ducking (WebKit, separate config) |

Test builds mark the correct option with a `data-correct` attribute so Playwright can play through levels. Production builds strip it.

**On-device checklist (manual, before showing him a new version).**

- [ ] iPhone Safari: audio starts after the door tap, and nothing zooms on double-tap.
- [ ] iPad in landscape: layout is roomy, and drag and tap-to-place both work.
- [ ] Android Chrome: installs as an app and opens full screen.
- [ ] Laptop: mouse drag and the keyboard shortcuts work.
- [ ] Airplane mode: a whole level plays, and progress uploads afterwards.
- [ ] Two devices: progress from one appears on the other after a reload.
