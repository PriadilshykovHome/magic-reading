---
name: content-author
description: Add or change reading content for Чарівні пригоди Мишка — words, sentences, units, worlds or a whole content wave (content/worlds/*). Use whenever the task touches lexicon.json, world.json, templates.json or the curriculum plan.
---

# Writing content for the reading game

The curriculum lives in `docs/PLAN.md` → "Growth plan" → "Curriculum" (the worlds table, the
sentence-frame ladder and the Ukrainian checklist). Read that section first; it is the brief.
How content is expanded: `src/reading/engine/curriculum.ts` and `lexicon.ts`.

## 1. Lexicon rows (`content/worlds/<world>/lexicon.json`)

Put an item in the lexicon of the world where it is first taught.

- Word: `{ "id": "w-<latin>", "split": "МИШ-КА", "emoji": "🐭", "tags": ["animal"], "stress": 0 }`
  - `split` is written by hand. Every syllable has exactly one vowel (validator-enforced). Prefer
    the split a Ukrainian primer uses (open syllables: МА-ШИ-НА; ПОШ-ТА, МИШ-КА where a closed
    syllable is natural).
  - The id is the Latin spelling from `config.json` → `letters.latin` (Й/Ь = j, Ш = sh, Щ = shch,
    Х = kh, Ц = ts, Ч = ch, Ж = zh, Я = ya, Ю = yu, Є = ye, Ї = yi, apostrophe dropped).
  - `stress`: the stressed syllable (0 = first) for every word of 2+ syllables.
  - `tags`: themes (family, home, food, animal, toy, body, clothes, nature, magic, city, ukraine).
  - `emoji`: the clearest single emoji. Two words with the same emoji can never be each other's
    wrong option, which is fine, but avoid it within one level.
- Sentence: `{ "id": "s-<latin-words>", "text": "Кіт на дивані.", "scene": "kit on dyvan" }`
  - `scene` is the picture: `who[:small|big] [action] [on|in|under|near|and|has what[:size]]`;
    things are word ids without `w-` (they need a lexicon row with an emoji), actions come from
    `content/scenes.json`. Wrong pictures change exactly one slot, so sentences must differ in
    what he reads (who / what / where / doing), never in things a picture can't show (тут / там).
  - «Х несе Y» is drawn as `x has y`; «Дід пасе козу» as `did near koza`.
- Drill syllables: one space-separated string, `"syllables": "БА БО БУ БИ БІ БЕ"`. For a new vowel,
  list about 6 drills, not every consonant (the pace rule caps a level at 12 new items).
- Never write paths or derived fields; they come from the id.

## 2. Units (`content/worlds/<world>/world.json`)

```json
{ "key": "b", "letters": "Б", "card": "card-…", "levels": ["letters", "words", "words", "sentences"] }
```

- One letter per unit. Rhythm: letters → words → words → sentences. Add `review` after every two
  units, and end each world with `{ "t": "finale", "door": "w-…", "line": "magicDoor.…" }`.
- A unit without `letters` (practice) teaches whatever is readable but not yet taught: every
  word and sentence in any lexicon that uses only known letters goes to the first teaching level
  after it becomes readable. So put each item in the unit of the newest letter it uses; a second
  practice unit later in the same world would get nothing.
- A finale's door can be a sentence: give it `"boss": {"type": "magicDoor", "inner":
  "sentencePicture", "item": "s-…", "openedLine": "magicDoor.…"}` as well as `door`.
- An item using a letter no unit teaches yet is an error (e.g. «Чай у чашці» before Ц).
- **Never rename or reorder a unit key that has shipped**: level ids are `world/key-template[-n]`
  and his saved progress is keyed by them. Append new units at the end of a world, or start a new world.
- Personal doors are listed in the worlds table (ОЛЕКСАНДР, «Я МИШКО!», ХАРКІВ, МИХАЙЛО, «Я ЧИТАЮ!»…).
  Add the door's line to `content/voice.uk.json` under `magicDoor`.
- New cards: `content/cards.json` (`card-<latin>`, a Ukrainian name, an emoji, an `img/cards/…` path).

## 3. Ukrainian checklist (every item, before validating)

- Everyday words of a 5-year-old first; picturable nouns until scenes can show actions.
- Standard Ukrainian: no surzhyk or Russianisms; natural diminutives; correct case forms
  (на дивані, у лісі, з Харкова) and agreement (малий кіт, мала мишка).
- Early worlds avoid words whose spelling and sound differ (‑ться, легко, зч, стн), and stress
  homographs (за́мок/замо́к) unless the picture decides.
- Sentences sound like something a parent would say. Nothing scary or sad. Silly only in trueFalse.
- Use only letters known by that unit (the validator checks every level).
- Personal data: only first names (Михайло, Мишко and their case forms, Аліна, Олександр) and
  Kharkiv. Never a surname, patronymic or birthday.
- No Harry Potter names, places or objects.

## 4. Validate and look at the curve

```bash
npm run validate-content -- --report   # errors + the progress curve
npm test                               # includes the curriculum and session builds
```

Read the curve: about 4–8 new words per level, never more than 12 new items, at least 6 new
words per letter unit, and known words rising steadily. Words up to about 9 letters fit the
360 px phone at the 48 px minimum (ВИШИВАНКА, the widest so far, is 321 px). If a new word or
sentence is longer than any before, point a layout screen at it in `e2e/layout.spec.ts`
(`&target=w-…`, e.g. on the world's `rev2-review` level) and run `npm run e2e`.

## 5. Hand over a review list

End with a native-speaker review list in `docs/review/wave-<n>.md` (see `wave-1.md`): every new
word with its split and stress mark, every new sentence with its scene, any new Соня line and
card name, and a short list of the choices you were unsure about. Check stress and у/в yourself
first (бо́бер, авто́бус, не́бо, моро́зиво, пи́санка, ка́мінь, чо́боти were all wrong in the first draft).
