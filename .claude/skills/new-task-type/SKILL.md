---
name: new-task-type
description: Add a new task type (game mechanic) to the reading game, or extend an existing one — logic, component, registration, voice lines, templates and layout checks. Use when a level needs a mechanic the engine doesn't have.
---

# Adding a task type

A task type is a plug-in: pure logic plus a React component. The engine, session builder and
validator only talk to the logic, so nothing else in the game loop changes. Look at
`src/reading/tasks/readPickPicture/` (pick one of 3) and `buildWord/` (tiles + drag) as models.

## 1. Logic: `src/reading/tasks/<typeId>/logic.ts`

Node runs this file directly: use `.ts` import extensions and only erasable TypeScript, and no
JSON, CSS or React imports.

```ts
import { z } from 'zod';
import { shuffle } from '../../../core/engine/rng.ts';
import type { ReadingTaskLogic } from '../../engine/domain.ts';

const configSchema = z.strictObject({
  type: z.literal('<typeId>'),
  count: z.number().int().min(1),
  choices: z.number().int().min(2).max(3).default(3),
});
type Config = z.output<typeof configSchema>;

export const myTask: ReadingTaskLogic<Config, MyData> = {
  id: '<typeId>',
  configSchema,
  scored: true,       // counts toward stars
  reading: true,      // true: the target audio plays only AFTER the answer
  needsParent: false, // true only for parent-judged tasks (readAloud)
  instruction: () => 'instructions.<typeId>',
  eligible: (ctx) => ctx.candidates('word'),
  build: (ctx, config, target) => ({
    target,
    options: shuffle([target, ...ctx.distractors('word', target, config.choices - 1)], ctx.rng),
    data: {},
  }),
};
```

- Choose `reading` honestly (the hard rule in CLAUDE.md): reading tasks never play the target
  before the answer. Listening tasks speak it first.
- Never more than 3 options. Set `manyOptions: true` only for bubble-style tasks.
- If the instruction line depends on the config, declare `instructionVariants`.
- `ctx.distractors` throws `ShortageError` when the content can't supply enough; let it throw.
  The validator turns that into a content error.
- Register it in `src/reading/tasks/logicRegistry.ts`.

## 2. Component: `src/reading/tasks/<typeId>/<TypeId>.tsx`

- Props: `TaskProps` (`src/core/tasks/types.ts`). Call `onMiss()` per wrong try and `onComplete()`
  once. The runner does sparks, sounds, Соня, hints and the next task.
- Use `useChoice` (`src/core/tasks/useChoice.ts`) for pick-one tasks, and `useDrag`
  (`src/core/tasks/useDrag.ts`) for drags; every drag must also work as tap-to-place.
- Spread `correctMark(isCorrect)` (`src/core/testMode.ts`) on the right option, so e2e can play it.
- Show reading text with `useDisplayText()` on a parchment card. Minimums: syllables 64 px, words
  48 px, sentences 32 px. Tap targets ≥ 64×64 with 16 px gaps. No scrolling at any test viewport.
- All text from `content/strings.uk.json` (`t.play.…`), never hard-coded.
- Animate only transform and opacity. A wrong answer wobbles, dims and disables: no red, no buzzer.
- Register it in `src/reading/tasks/registry.ts`; styles go in `src/reading/tasks/tasks.css`.

## 3. Content

- Соня's instruction in `content/voice.uk.json` → `instructions.<typeId>`. If it can be a Magic
  Door (scored, reading, no parent), also add `magicDoor.<typeId>`.
- Use it in `content/templates.json` (keep 8–10 tasks per template) or in a level's `tasks`.

## 4. Checks

- Add a screen to `e2e/layout.spec.ts`: `['<typeId>', task('<level>', '<typeId>')]`, plus a
  `&target=` variant with the longest item it can show.
- Add a unit test only if the type brings a new rule (the suite stays small: about 30 unit tests and 6 e2e).
- Run `npm run lint && npm run typecheck && npm test && npm run validate-content && npm run e2e`.
