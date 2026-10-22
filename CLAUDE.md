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
  config.json            every tunable number + the letter rules (vowels, Latin spellings, digraphs)
  templates.json         what each kind of level does: letters, words, sentences, review, finale
  strings.uk.json        all UI text, names
  voice.uk.json          Соня's lines
  cards.json
  worlds/<world>/world.json     the world: units (letters taught + a row of templates)
  worlds/<world>/lexicon.json   items first taught there, one compact row each
src/
  app/                   main.tsx, router.tsx (wiring)
  core/                  the game-agnostic shell (shared later with the English and maths games)
    engine/              pure TS: session, picker, run, rewards, progress, calendar, validate framework
    game.ts              the seam: GameData ('@game') and GameUi ('@game-ui') interfaces
    screens/             Door, journey/ (the map: one road), LevelIntro TaskRunner Celebration (later Login Book Album Parent)
    tasks/               TaskProps/TaskType, useChoice, useDrag
    audio/ characters/ fx/ ui/ store/ sync/ styles/
  reading/               this game's domain pack
    engine/              lexicon schema, content index, distractors, display, domain engine, validate
    tasks/               logicRegistry.ts, registry.ts + one folder per task type
    intro/               the level intro demos
    content/             loads content/ (files.ts, load.ts)
    game.ts gameUi.ts    what '@game' and '@game-ui' resolve to
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
- **The engine decides, the UI choreographs.** In-level feedback comes from `src/core/engine/run.ts`
  as `FeedbackEvent`s (wrong + hint, correct with chime pitch / sparks / golden spark / praise,
  streak wand / wave, door open) and the celebration's running order from `finishLevel` in
  `src/core/engine/rewards.ts` (`CelebrationStep`s). Animations, sounds and Соня's lines react to
  those events; never re-derive game rules in components.
- Code that Node runs directly (`src/core/engine/`, `src/reading/engine/`,
  `src/reading/tasks/*/logic.ts`, `scripts/`) uses explicit `.ts` import extensions and only
  erasable TypeScript; it must not import JSON, CSS or React.
- **Core vs domain.** `src/core/` never imports `src/reading/` (ESLint enforces it; tests may use
  the real content as a fixture). It reaches the active game only through the `@game` and
  `@game-ui` aliases (`vite.config.ts`, `tsconfig.app.json`), typed by `src/core/game.ts`.
  Anything about letters, syllables, words or sentences belongs in `src/reading/`. A domain pack
  implements `DomainEngine` (`kindOf`, `hasItem`, `createBuildContext`: candidates, review,
  distractors); core owns ordering, spaced repetition, fallbacks, the Magic Door and rewards.

## Content

- All learning content lives in `content/` and is validated by Zod schemas
  (`src/core/engine/schema.ts`, extended in `src/reading/engine/schema.ts`). `config.json` holds
  every tunable number (boxes and their intervals, stars, sparks, streaks, creature thresholds,
  Easter egg dates) and the letter rules; `voice.uk.json` holds Соня's lines, with `{nameVoc}`-style
  placeholders filled from `strings.uk.json` and the private profile, and `{topic}` (a level's
  letter) for template lines, which then need a `…Fallback` line.
- **Content grows linearly; derive, don't duplicate.** A word is one row
  (`{ "id": "w-mama", "split": "МА-МА", "emoji": "👩", "tags": [], "stress": 0 }`); its text,
  syllables and every audio/picture path are derived (`src/reading/engine/lexicon.ts`). Syllable
  ids come from their letters (`syl-mysh`). Drill syllables are one string per world lexicon.
- **Levels are units × templates** (`src/reading/engine/curriculum.ts`). A unit is
  `{ "key", "letters", "card"?, "levels": ["letters", "words", "words", "sentences"] }`; each
  level gets the cumulative known letters, the items that just became readable (shared over the
  unit's levels that teach that kind), review from every earlier level, an intro about its
  letter, a door, a card (unit's last level) and its unlock. Generated ids are
  `world/unitkey-template[-n]`: never rename a played unit key. A finale is
  `{ "t": "finale", "door": "w-…", "line": "…" }`; its door item stays out of every earlier pool.
  A level can override anything, or be written out in full (the first 11 levels are, keeping their
  ids `tower-of-syllables/01`…, which his saved progress is keyed by).
- `npm run validate-content` checks schemas, ids, splits (one vowel per syllable), that every level
  uses only letters taught by then, the pace (a letter unit brings ≥ 6 new words, no level more
  than 12 new items), task configs, pool sizes (it dry-builds every possible task), voice lines
  and assets. `-- --report` prints the progress curve. Missing audio/pictures are warnings
  (`--strict` makes them errors). A broken content file must fail the build, not the game.
- Adding a level or world means content and assets only. If a level needs a code change,
  the engine or a task type is missing something; fix that rather than special-casing the level.
- Syllable splits are written by hand in the lexicon, never auto-hyphenated.
- A sentence's picture is a scene spec, `"scene": "kit:small sleeps on dyvan"` (who[:size]
  [action] [on|in|under|near|and|has what[:size]]; things are word ids without `w-`, actions come
  from `content/scenes.json`). `SceneView` composes it from the words' pictures, and wrong pictures
  change exactly one thing the sentence says (`src/reading/engine/scene.ts`), so no sentence needs
  hand-made distractors.
- The daily warm-up («Чарівна розминка», the `warmup` template) reviews finished levels once a day
  from the map's cauldron; it lights the day's castle window and records no level progress.
- Text is shown in UPPERCASE unless the parent turns on lowercase sentences.

## Task plug-in contract

Every task type lives in `src/reading/tasks/<typeId>/`. Its pure half, `logic.ts`, implements
`TaskLogic` (`src/core/engine/taskLogic.ts`; reading tasks use `ReadingTaskLogic`) and is listed
in `src/reading/tasks/logicRegistry.ts`; its React `Component` sits next to it and
`src/reading/tasks/registry.ts` pairs the two. The engine, session builder and validator only
talk to the logic:

```ts
interface TaskLogic<Config, Data> {
  id: string;                         // e.g. 'readPickPicture'
  configSchema: ZodType<Config>;      // validates its entry in a level file
  scored: boolean;                    // counts toward stars
  reading: boolean;                   // target audio only after the answer
  needsParent: boolean;               // readAloud: replaced when no parent is nearby
  manyOptions?: boolean;              // bubblePop: may show more than 3 options
  instructionVariants?: Partial<Config>[];  // configs whose instruction line must exist
  instruction(config): string;        // voice line id for Соня's instruction
  eligible(ctx, config): string[];    // every item it could ask about
  build(ctx, config, target): { target; options; data: Data };  // ctx.distractors() etc.
}
// + Component: React.FC<TaskProps>  (renders it, reports misses and completion)
```

`magicDoor` is a wrapper around any scored type, not a separate mechanic: the session builder
builds the level's `boss.inner` type on the weakest/newest (or fixed) item and marks it `boss`.

## Animation

- UI motion: Motion via `LazyMotion` + `strict`, so use `m.div` (not `motion.div`); springs for
  anything that lands or pops. Simple loops stay in CSS. `MotionConfig reducedMotion="user"`.
- Particles: `particles` in `src/core/fx/particles.ts` (tsParticles on one tap-through canvas, loaded
  lazily, ~150 alive on phones, off under reduced motion / "reduced effects"). Sparks flying to
  the jar: `SparkFlights`. Never add another canvas or particle loop.
- Characters: `Sonya` (moods idle/happy/shrug/talk/celebrate) and `Iskryk` (stages 0–3, moods
  idle/dance, `cracking`) are layered SVGs animated in CSS; animate parts, not the whole SVG.
- Frame budget: keep 60 fps on a 4×-throttled phone (see the FPS check in the Phase 6 notes).

## Audio

- Everything goes through `src/core/audio/`: `voice` (Соня's lines and items), `sfx` (effects by
  meaning), `useMusic(track)` per screen. Never use `speechSynthesis`, `Audio` or Howler directly.
- `VoiceScheduler` (`src/core/audio/scheduler.ts`, unit-tested) keeps voice calm: one clip at a time,
  never cut mid-word. Pick a policy: `interrupt` (replay buttons), `after` (default), `ifIdle`
  ("Спробуй ще!"). Music ducks to 30% while she speaks; `SfxGate` stops effects stacking.
- Recorded clips live at the lexicon's `audio` path under `public/audio/uk/`, Соня's lines at
  `public/audio/uk/voice/sonya/<line id>[.<n>].mp3`; anything missing falls back to browser
  speech (`virtual:audio-manifest` lists what exists).
- Effects and music are generated by `npm run audio:generate` (`scripts/make-audio.ts`): original,
  CC0, deterministic. Edit the script, don't hand-edit the WAVs or `src/core/audio/sfx-sprite.json`.
- Audio unlocks on the door tap (iOS). Check with `npx playwright test --config e2e/audio.config.ts`.

## Hard rules

- **Reading tasks never play the target audio before the answer** (otherwise they become
  listening tasks). After the answer, the target audio always plays as confirmation.
  Reading tasks: `readPickPicture`, `sentencePicture`, `missingSyllable`, `trueFalse`,
  `readAloud`, and `magicDoor` around any of them. Listening is the point of `hearPick`,
  `bubblePop`, `buildWord`, `buildSentence` and `syllableMerge`.
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
- **No Ukrainian (or any user-facing) text hard-coded in code.** It goes in
  `content/strings.uk.json` or other `content/` files. Comments may quote Ukrainian examples;
  `src/no-hardcoded-text.test.ts` checks everything else.
- **No Harry Potter anything:** no names, characters, places, logos, fonts, house colours,
  music or sounds from the books or films. The owl Соня is purple, never white.
- Assets use free licences only (CC0 preferred); every asset is listed in `CREDITS.md`.
- Test builds mark the correct option with `data-correct`; production builds strip it.

## Art direction (see "Art direction" in docs/PLAN.md)

Cozy and sophisticated, never busy: a candlelit night. Use the tokens in `src/core/styles/global.css`
(`--night` #0e0b14, `--stone`, `--dusk`, antique `--gold` #c9a24a / `--gold-light`, `--parchment`,
`--ink`); don't introduce saturated blues, violets or oranges. The shared backdrop is
`src/core/fx/ambient/Scene.tsx` (sky, stars, moon, floating candles, mist, embers, vignette).

- Ambient layers are quiet: low contrast, slow drift, small amplitude; farther = smaller,
  dimmer, slower. Flames may flicker faster, but in uneven steps and only slightly.
- One focal element per screen gets the only gentle pulse (the door now; the card in tasks).
- Candles stay at the sides, never over titles, the door or the reading card; check every
  test viewport, both orientations.
- Nothing ambient moves near the reading card; during tasks embers thin out and candles dim.
- Big, fast motion is only for feedback and celebrations.
- Shading with soft gradients and radial glows, not flat fills or hard shadows.
- Titles: Cormorant Garamond / Cormorant SC (self-hosted in `src/assets/fonts`). Reading text:
  the rounded sans (`--font-reading`), never the serif.
- Ambient animation pauses when the tab is hidden and is off/static under reduced motion.

## Commands

```bash
npm run dev               # Vite dev server
npm run build             # typecheck + production build to dist/
npm run lint              # ESLint
npm run typecheck         # tsc --noEmit
npm test                  # Vitest (engine, content, rules)
npm run e2e               # Playwright: layout rules at 4 viewports + one full play-through (6 tests)
npm run check-prod-build  # dist/ must not contain data-correct, /dev routes or __audio
npm run audio:generate    # regenerate effects sprite + music (WAV) from scripts/make-audio.ts
npm run validate-content  # content checks; -- --strict (assets are errors), --verbose, --root <dir>
```

## Testing conventions

- Keep the suite small: one test per rule that matters. Unit tests (Vitest, ~30) cover the
  engine, content validator and audio scheduler; e2e (Playwright, 6) covers layout, one full
  play-through and the celebration. Add a test only for a new rule, not for every case.
- `e2e/checks.ts` (`layoutProblems`) enforces the layout rules: no page scroll, nothing cut off,
  tap targets ≥ 64×64 with ≥ 16 px gaps, reading text minimums. The map's road scrolls inside
  `[data-scroll-region]`: its doors may sit past the edge and are only compared with each other;
  `journeyLayout.ts` keeps the spacing by construction (unit-tested for ~290 levels). It runs at the extremes
  (360×640, 844×390, 768×1024, 1024×768). Add any new screen or task type to `e2e/layout.spec.ts`.
- Test builds (`TEST_BUILD` in `src/testMode.ts`: dev server or `VITE_MARK_CORRECT=true`) mark
  correct answers with `data-correct` and add `#/dev/task/<world>/<num>/<type>?seed=N[&boss=1]`,
  `#/dev/celebration` and `#/dev/journey?done=N` (the planned ~290-level road). `VITE_E2E=true`
  silences speech and sound. Production strips all of it.
- Engine code uses explicit seeds; UI picks a random seed per session.

## Deployment

Push to `main` → GitHub Actions: `npm ci` → lint → validate-content → test → build →
check-prod-build → e2e → deploy to GitHub Pages. `base` in `vite.config.ts` must match the repo name.
Firebase web config comes from `VITE_FIREBASE_*` env vars (`.env.local` locally, repository
variables in Actions); never commit `.env.local`.
