# Чарівні пригоди Мишка (Mishko's Magic Adventures)

A Ukrainian reading game made personally for one almost-5-year-old, Михайло (Мишко):
syllables → words → sentences, set in an original magic school. Static SPA on GitHub Pages, Firebase Auth + Firestore for cloud save.
The full spec is `docs/PLAN.md`. Build it phase by phase (section "Build phases"). Finish one
phase, run its "Done when" checks, then stop and wait for the go-ahead.

## Stack (do not add libraries without asking)

| Concern | Library |
| --- | --- |
| Build | Vite + TypeScript (strict) |
| UI | React |
| UI animation | Motion (`motion/react`), spring physics |
| Particles | tsParticles, one shared full-screen canvas with `pointer-events: none` |
| Audio | Howler.js (channels: voice, sfx, music; music ducks to 30% under voice) |
| State | Zustand |
| Routing | React Router with **hash** URLs (`createHashRouter`) |
| Content validation | Zod |
| Login + cloud save | Firebase Auth (email/password) + Firestore |
| Offline + install | vite-plugin-pwa |
| Tests | Vitest (logic), Playwright (screens at the plan's test viewports) |
| Lint | ESLint (flat config, typescript-eslint, react-hooks) |
| Scripts | `scripts/*.ts` run with Node 24's built-in type stripping (no tsx); use `.ts` import extensions there |

## Folder structure

```text
public/audio/uk/voice/   syllables, words, sentences, Соня's lines
public/audio/sfx/  public/audio/music/
public/img/              word pictures, scenes, characters, map
content/
  lexicon.json           every syllable, word, sentence + audio + picture (ids like syl-ma, w-mama, s-…)
  strings.uk.json        all UI text, names, voice-line ids
  worlds/<world>/world.json
  worlds/<world>/levels/NN-name.json
src/
  engine/                pure TS: session, picker, scoring, rewards
  tasks/                 registry.ts + one folder per task type
  screens/               Door Login Map LevelIntro TaskRunner Celebration Book Album Parent
  characters/            Sonya, Iskryk (layered SVG, animated in code)
  fx/                    particles, sparkles, fireworks, transitions
  audio/                 audio manager
  store/                 progress, settings (Zustand)
  sync/                  firebase.ts syncEngine.ts localCache.ts
  easter-eggs/
scripts/validate-content.ts
docs/PLAN.md
```

## Architecture rules

- Content (JSON) → engine (pure TS) → stores → UI. Audio, sync and fx are services the UI calls.
- **The engine is pure TypeScript.** No React, no DOM, no `window`, no `localStorage`, no
  `Date.now()` or `Math.random()` called directly; time and randomness are passed in so tests
  are deterministic. Every engine module has Vitest unit tests.
- **The progress store is the single source of truth.** The sync service mirrors it to
  localStorage and Firestore (`players/{uid}`); components never talk to Firebase directly.
- Items are keyed by lexicon id (`syl-ma`), never by Cyrillic text.

## Content

- All learning content lives in `content/*.json` and is validated by Zod schemas.
  `npm run validate-content` checks schemas, referenced ids, audio and picture files, task
  configs and pool sizes. A broken content file must fail the build, not the game.
- Adding a level or world means content and assets only. If a level needs a code change,
  the engine or a task type is missing something; fix that rather than special-casing the level.
- Syllable splits are written by hand in the lexicon, never auto-hyphenated.
- Every word in a world uses only that world's `allowedLetters` (v1: М Л Н Т С + А О У И І);
  the validator enforces it. Text is shown in UPPERCASE unless the parent turns on lowercase
  sentences.

## Task plug-in contract

Every task type lives in `src/tasks/<typeId>/` and is registered in `src/tasks/registry.ts`.
The game loop only talks to this interface:

```ts
interface TaskType<Config> {
  id: string;                                   // e.g. 'readPickPicture'
  configSchema: ZodType<Config>;                // validates its entry in a level file
  scored: boolean;
  build(ctx: BuildContext, config: Config): TaskInstance;  // target + distractors
  Component: React.FC<TaskProps>;               // renders it, reports onAnswer(result)
}
```

`magicDoor` is a wrapper around any scored type, not a separate mechanic.

## Hard rules

- **Reading tasks never play the target audio before the answer** (otherwise they become
  listening tasks). After the answer, the target audio always plays as confirmation.
  Reading tasks: `readPickPicture`, `sentencePicture`, `readAloud`, and `magicDoor` around any
  of them. Listening is the point of `hearPick`, `bubblePop`, `buildWord` and `syllableMerge`.
  Every level must include reading tasks he can solve alone, and every Magic Door is one.
- **Personal data:** only first names (Михайло, Мишко and their case forms, мама Аліна,
  тато Олександр) and the Kharkiv connection may appear in code, content, tests or commits.
  Surname, patronymic and birthday come only from the private profile at runtime (device +
  Firestore). Never commit them, not even in fixtures.
- **Every tap target is at least 64×64 CSS px, with 16 px gaps.** Never more than 3 answer
  options (`bubblePop` bubbles are the one exception).
- Reading text never goes below: syllables 64 px, words 48 px, sentences 32 px (use `clamp()`).
  Reading content always sits on a light parchment card with dark text.
- No scrolling during a task at any test viewport, in either orientation.
- Every drag also works as tap-to-place. Use Pointer Events only.
- Mistakes are never punished: no red crosses, no buzzers; a level can never be failed.
- Animate only `transform` and `opacity`. Respect `prefers-reduced-motion`.
- **No Ukrainian (or any user-facing) text hard-coded in components.** It goes in
  `content/strings.uk.json` or other `content/` files.
- **No Harry Potter anything:** no names, characters, places, logos, fonts, house colours,
  music or sounds from the books or films. The owl Соня is purple, never white.
- Assets use free licences only (CC0 preferred); every asset is listed in `CREDITS.md`.
- Test builds mark the correct option with `data-correct`; production builds strip it.

## Art direction (see "Art direction" in docs/PLAN.md)

Cozy and sophisticated, never busy. Night blue → velvet violet, candle gold, parchment, teal
for magic; pumpkin amber in autumn. Ambient magic: floating candles at three depths, out-of-sync
stars, rising gold dust, ground mist, seasonal extras (pumpkins Sep–Nov, snow Dec–Feb).

- At most three kinds of ambient effect on screen at once; ambient loops ≥ 3 s, small, eased.
- Nothing ambient moves near the reading card; during tasks keep 2–3 candles at the edges.
- Big, fast motion is only for feedback and celebrations.
- Light is soft radial glow, not hard shadows; one gold line weight; rounded shapes.
- Ambient animation pauses when the tab is hidden and becomes static under reduced motion.

## Commands

```bash
npm run dev               # Vite dev server
npm run build             # typecheck + production build to dist/
npm run lint              # ESLint
npm run typecheck         # tsc --noEmit
npm test                  # Vitest
npm run validate-content  # (Phase 2+) content checks
```

## Deployment

Push to `main` → GitHub Actions: `npm ci` → lint → typecheck → validate-content → test →
build → deploy to GitHub Pages. `base` in `vite.config.ts` must match the repo name.
Firebase web config comes from `VITE_FIREBASE_*` env vars (`.env.local` locally, repository
variables in Actions); never commit `.env.local`.
