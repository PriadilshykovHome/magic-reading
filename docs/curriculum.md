# Curriculum and content

What he learns and in what order, and how content is written. The vision and roadmap are in [PLAN.md](PLAN.md); how the code works is in [architecture.md](architecture.md). Writing a world: the content-author skill (`.claude/skills/content-author/`) and `npm run review-list`.

## Curriculum

**Principles.**

- Letters gate everything: every item uses only letters known at that level.
- One new thing at a time: a letter, or one skill.
- A fixed unit rhythm, so only the material is new.
- About 25% review plus a daily warm-up.
- One difficulty knob turns at a time:
  - word length: 2 → 4 syllables;
  - syllable shape: CV → CVC → CCV;
  - sentence length: 2 → 7 words;
  - sentence frame;
  - letter case: upper → sentence case;
  - choices: 2 → 3;
  - answers: pictures → words.
- Growth is visible:
  - Іскрик walks the road;
  - Book of Spells pages appear;
  - a "words Мишко can read" counter appears in the parent area and the Book;
  - signs he can read appear in the world.
- Content is written in waves of 25–50 levels, just before he reaches them, and each wave is checked by a native speaker.

**Unit rhythm (templates).**

| Template | Intro | Task mix (about 9) | Door |
| --- | --- | --- | --- |
| `letters` · Нові склади | syllableMerge | merge 1, hearPick 3, bubblePop 2, readPickPicture 1, readAloud 1 | readPickPicture, newest word |
| `words` · Нові слова | wordMerge | readPickPicture 3, buildWord 2, missingSyllable 2, hearPick 1, readAloud 1 | readPickPicture or buildWord |
| `sentences` · Речення | readAlong | sentencePicture 3, trueFalse 2, buildSentence 1, readPickPicture 1, readAloud 1 | sentencePicture |
| `review` · Повторення | readAlong | spaced-repetition mix across all kinds | weakest item |
| `finale` · Чарівні двері | Соня's special intro | review mix | a fixed personal word or sentence |

A letter unit is usually letters → words → words → sentences. A review follows every 2 units, and each world ends with a finale.

**Worlds (about 290 levels, roughly 10 months at a level a day).**

| # | World | New | Levels | Examples | Personal door |
| --- | --- | --- | --- | --- | --- |
| 1 | Вежа Складів | М Л Н Т С + А О У И І | 6 | done | МАМА |
| 2 | Вежа Слів | К Р В Д П Ш | 5 | done | МИШКО |
| 3 | Сад Соняшників | practice, then Е Б З | 20 | СОВА, МІТЛА, ШАЛИК, КАЛИНА, ПИСАНКА, ВИШИВАНКА, НЕБО, ДЕРЕВО, ЗІРКА, КАЗАН, ЛЕЛЕКА, ВАРЕНИКИ, МЕТРО · «Сова на мітлі.» «Тато несе банан.» | ОЛЕКСАНДР ("Олександр — це тато!") |
| 4 | Зоряна Обсерваторія | Й Ь Я | 18 | Я, МІЙ, МОЯ, ЯБЛУКО, ВЕДМІДЬ, ТРАМВАЙ, СОНЯШНИК · «Кіт спить.» «Малий кіт спить на дивані.» | «Я МИШКО!» |
| 5 | Чарівна Кухня | Г Ж Х Ч | 22 | ХЛІБ, ЧАШКА, ЛОЖКА, ПИРІЖКИ, КНИГА, ЧАРІВНА ПАЛИЧКА, ЧАРІВНИК · «Жук на грибі.» «У сови книга.» | ХАРКІВ, then МИХАЙЛО ("Великий чарівник Михайло!") |
| 6 | Ліс Єдинорогів | Ю Є Ї, apostrophe | 22 | ЇЖАК, ЄНОТ, ЄДИНОРІГ, КЛЮЧ, М’ЯЧ, СІМ’Я · «Мишко читає книгу.» «Я люблю маму і тата.» | «Я ЧИТАЮ!» |
| 7 | Вежа Дзвонів | Ц Щ Ф Ґ ДЖ ДЗ | 24 | ЦЕ, БОРЩ, ФЕЯ, ШАРФ, ФОНТАН, ҐУДЗИК, ДЖМІЛЬ, ДЗВОНИК · «Це мій шарф.» «Мама варить борщ.» | «Я МИШКО З ХАРКОВА.» |
| 8 | Дзеркальне Озеро | lowercase letters, sentence case | 25 | familiar words re-read in lowercase | — |
| 9 | Кам’яні Мости | clusters, long words, stress marks | 25 | СТІЛ, СНІГ, КВІТКА, ЛАСТІВКА, ВЕЛОСИПЕД | — |
| 10 | Кімната Питань | Хто? Що? Де? Куди?, «?» and «!», dialogues | 25 | «— Де Іскрик? — Тут!» | — |
| 11 | Пошта Сов | 2–4 sentence stories plus a question | 35 | each level is a letter with a micro-story | — |
| 12 | Бібліотека Казок | simplified folk tales | 35 | Колобок, Рукавичка, Ріпка, Котик і Півник | — |
| 13 | Мій Харків | real-world reading: signs, labels, a trip across the city | 25 | МЕТРО, ВХІД, ВИХІД, ЗООПАРК · Держпром, Дзеркальний струмінь, Сад Шевченка | — |

Totals: about 115 levels to all 33 letters, then about 175 levels of fluency and comprehension. About 1,200 words and 900 sentences, at 4 to 8 new words per level.

**Sentence frames,** each unlocked by the letters it needs:

1. where: «Оса на носі.»;
2. has / and: «У мами мило.»;
3. -е verbs: «Риба пливе.» (needs Е);
4. -ить verbs, adjectives and the first person: «Кіт спить.», «Я Мишко!» (needs Й Ь Я);
5. objects: «Мама варить суп.»;
6. -ає / -ює verbs: «Я читаю.»;
7. «Це …»;
8. questions and dialogue, then micro-stories, then tales.

**Realistic Ukrainian (the native-speaker checklist).**

- **Word choice:**
  - Everyday words of a 5-year-old's life first: family, home, food, toys, animals, body, clothes, nature. Then the magic school, the city and Ukraine.
  - Only picturable words until scenes can show actions and attributes.
  - Plain standard Ukrainian, no surzhyk or Russianisms; natural diminutives.
- **Grammar:**
  - Correct case forms (на дивані, у лісі, з Харкова) and agreement (малий кіт, мала мишка); vocative when addressing him.
  - Present tense first.
- **Spelling and pronunciation:** early worlds avoid words whose spelling and sound part ways (‑ться, легко), and stress homographs (за́мок / замо́к) unless the picture decides. Stress is stored per word.
- **Sentences:** what a parent would actually say, never primer nonsense; nothing scary or sad. Silly sentences only in «Правда чи жарт?».
- **Culture, lightly:**
  - борщ, вареники, пиріжки;
  - соняшник, калина, лелека, вишиванка, писанка, рушник, бандура;
  - Різдво, Великдень, Святий Миколай;
  - public-domain folk tales.
- **Personal:** first names and Kharkiv appear at milestones; surname, patronymic and birthday never appear.

**Pictures at this scale.**

- **Words:** emoji placeholders stay for now; one consistent free icon set and hand-drawn hero pictures come later.
- **Sentences:** no per-sentence illustration. A scene composer draws each scene from its spec, `who [rel what] [does action] [is attr]`:
  - relations: on, in, under, near, and, has;
  - actions: sleeps, flies, eats, reads, cooks…;
  - attributes: big, small, colours.
- **Generated distractors:** each wrong scene changes exactly one slot to another known value. Every slot is written in the sentence, so a wrong scene always differs in what he must read.

**Audio at this scale.**

- About 2,500 clips: you record syllables, Соня's lines and family messages.
- Words and sentences are recorded one world at a time (about 100–150 clips per world), or pre-generated with a Ukrainian neural TTS script and checked by ear. Decide before Phase 8.
- Browser speech covers anything missing.

## Structure for scale

**Content grows linearly, code stays flat.** A new word is one line, a new level is one line, and a new world is one file plus an art preset. Code changes only for a new mechanic. Nothing is written twice: what can be derived is derived.

- **Per-world folders.** `content/worlds/<world>/world.json` holds the world and its levels, and `content/worlds/<world>/lexicon.json` holds the items first taught there. There are no per-level files.
- **Compact lexicon rows.** Ids stay explicit, because they are the stable keys for his progress.
  - Word: `{ "id": "w-mama", "split": "МА-МА", "emoji": "👩", "tags": ["family"], "stress": 0 }`. The text, the syllable ids (from the hand-written split), the audio and picture paths (from the id) are derived. Paths are written only to override.
  - Syllable drills: one string per world (`"КА КО КУ КИ КІ"`). Closed syllables (МИШ, ПУС) come from the word splits.
  - Sentence: `{ "id": "s-kit-na-dyvani", "text": "Кіт на дивані.", "scene": "w-kit on w-dyvan" }`. The word list comes from the text, and the picture, `depicts` and distractor scenes come from the scene spec.
- **Levels are units × templates.**
  - A world lists units, and each unit is the letters it teaches plus a row of template names: `{ "key": "e", "letters": "Е", "levels": ["letters", "words", "words", "sentences"] }`.
  - `content/templates.json` defines each template's intro demo, task mix and door.
  - Level ids are stable under insertions (`garden/e-words-2`). The first 11 levels keep their ids, so his progress is untouched.
  - Any level can override its pool, tasks or door, as the МИШКО door does.
- **Curriculum module.** `curriculum.ts` (pure) expands worlds, units and templates into levels and derives for each level:
  - the cumulative known letters;
  - the new items (those containing the unit's letter);
  - automatic review from everything earlier, weighted by spaced repetition;
  - each item's `introducedAt`.
- **Validator additions.**
  - Each letter unit teaches at least 6 new words, and no level brings more than 12 new items.
  - Sentence length stays within the world's stage limit, and scene specs are valid.
  - Door words stay out of pools and use known letters.
  - `validate-content -- --report` prints the progress curve (new and known items per level), so steady progress is measurable.
- **Runtime budgets.**
  - The app only parses and expands content at startup; dry-building every task runs in CI.
  - The content chunk stays under 150 KB gzip.
  - A test asserts that a 300-level progress document stays under 350 KB.
- **Spaced repetition at scale.** Boxes get intervals in days (same day, 1, 3, 7, 21). Review draws from the 50 most overdue items.
- **Tests.** They grow with rules, not content: about 30 unit tests and 6 e2e tests.

## Content format & adding levels

All learning content lives in JSON under `content/`. A new word is one line in a lexicon, a new level is one line in a world, and a new world is a folder. None of it needs code changes.

**Files.**

- `config.json`: every tunable number, plus the letter rules (vowels, Latin spellings for ids, the soft sign and digraphs).
- `templates.json`: what each kind of level does.
- `voice.uk.json`: Соня's lines, with placeholders such as `{nameVoc}` and `{topic}` (a level's letter).
- `strings.uk.json`, `cards.json`.
- Per world: `worlds/<world>/world.json` and `worlds/<world>/lexicon.json`.

**Lexicon (`worlds/<world>/lexicon.json`).** It holds the items first taught in that world, one compact row each. Syllable splits are written by hand, never auto-hyphenated, and every syllable has exactly one vowel. Everything else is derived:

- a word's text and syllables come from its split;
- syllable ids come from their letters (`МИШ` → `syl-mysh`);
- every audio and picture path comes from the id (`w-mama` → `voice/words/mama.mp3`, `img/words/mama.webp`);
- drill syllables are one string;
- closed syllables come from the splits.

Each sentence lists what its scene `depicts`, so a wrong scene can never also fit the sentence.

```json
{
  "syllables": "МА МО МУ МИ МІ ЛА ЛО ЛУ ЛИ ЛІ",
  "words": [
    { "id": "w-mama", "split": "МА-МА", "emoji": "👩", "tags": ["family"] },
    { "id": "w-myshka", "split": "МИШ-КА", "emoji": "🐭", "stress": 0 }
  ],
  "sentences": [
    { "id": "s-u-mamy-mylo", "text": "У мами мило.", "depicts": ["mama", "mylo"], "emoji": "👩🧼", "wordStartsSec": [0.0, 0.35, 0.9] }
  ]
}
```

`wordStartsSec` lets Соня read a sentence while each word lights up in turn.

**World (`worlds/<world>/world.json`).** A world is a list of units. Each unit names the letters it teaches and a row of level templates:

```json
{
  "id": "garden", "order": 3, "title": "Сад Соняшників", "look": "garden",
  "units": [
    { "key": "practice", "levels": ["words", "sentences"] },
    { "key": "e", "letters": "Е", "card": "card-stork", "levels": ["letters", "words", "words", "sentences"] },
    { "key": "rev1", "levels": ["review"] },
    { "key": "finale", "levels": [{ "t": "finale", "door": "w-oleksandr", "line": "magicDoor.dadName" }] }
  ]
}
```

**What each level gets.** Expanding the units gives every level:

- the letters known by then;
- the items that just became readable, shared evenly over the unit's levels that teach that kind;
- review from every earlier level;
- Соня's intro about its letter;
- its Magic Door;
- a card (the unit's last level);
- what unlocks it.

**Level ids and overrides.**

- Generated ids are `world/unitkey-template` (`garden/e-words-2` for a repeat), so a played unit key is never renamed.
- A finale's door item stays out of every pool before its door.
- Any level can override its pool, tasks or door, or be written out in full. The first 11 levels are written out in full, keeping their ids, which his saved progress is keyed by.

**Item picking (spaced repetition).** Each item sits in a box from 1 to 5, and each box has an interval in days (same day, 1, 3, 7, 21).

- A first-try correct answer moves an item up one box; a wrong answer sends it back to box 1.
- The picker favours low boxes and overdue items.
- About 25% of tasks review earlier levels, drawing from their 50 most overdue items.

**Adding content, step by step.**

1. Add the new words and sentences to the world's `lexicon.json`, and the unit to its `world.json`.
2. Run `npm run validate-content -- --report`. It checks:
   - the schemas, ids and splits;
   - that every level uses only letters taught by then;
   - the pace: a letter unit brings at least 6 new words, and no level more than 12 new items;
   - every task config and pool size;
   - Соня's lines and the assets.

   It prints the progress curve, so you can see that progress stays steady.
3. Add the audio and pictures with the filenames the validator lists as missing.
4. Commit and push; GitHub Actions validates, builds and deploys.

**Adding a task type.** Create a folder in `src/reading/tasks/` that implements the plug-in contract and register it. Level files can then use its id.

**Content roadmap (later worlds).** See "Curriculum" above: about 300 levels over 13 worlds, written in waves just before he reaches them.

## Starter content (v1 levels)

v1 uses only 5 consonants (М, Л, Н, Т, С) and 5 vowels (А, О, У, И, І). That is enough for 25 syllables (plus vowel-only syllables such as the О in О-СА), 10 picture words and 10 sentences, and it puts the И / І contrast in from day one.

| Level | New material | Items | Task mix (about 9 tasks) |
| --- | --- | --- | --- |
| 1 · Перші склади | М, Л with А О У И І | МА МО МУ МИ МІ, ЛА ЛО ЛУ ЛИ ЛІ; first words МАМА, ЛАМА, МИЛО (М and Л only) | Intro merge (МА, ЛА); hearPick ×3, bubblePop ×2, syllableMerge ×1, readPickPicture ×1 (МАМА / ЛАМА / МИЛО), readAloud ×2; Magic Door: readPickPicture with МАМА, the first word he reads alone |
| 2 · Перші слова | Н, Т, С with the same vowels | НА…НІ, ТА…ТІ, СА…СІ; words МАМА, ТАТО, ЛИСА, МИЛО, НОТИ, САНИ, ЛАМА, ОСА, plus closed words ЛІС, НІС | Intro merge (НА, ТА, СА); readPickPicture ×3, buildWord ×3, hearPick ×1, readAloud ×1; Magic Door: buildWord |
| 3 · Перші речення | Short sentences from known words | Тато тут. Мама там. Лама тут. Оса там. Лиса у лісі. Оса на носі. Мама і тато. У мами мило. У мами ноти. У тата ноти. | Intro: Соня reads a sentence while each word lights up; sentencePicture ×3, readPickPicture ×2 (review), buildWord ×1, readAloud ×2; Magic Door: sentencePicture |

**Added after the first playtest (same 10 letters).** Level 4 · Довші слова (ЛИ-МОН, ТО-МАТ, СА-ЛАТ, МАС-ЛО, НА-МИС-ТО, МІСТ), Level 5 · Нові речення («Оса на лимоні.», «Лама на мосту.», «У мами намисто.» …), Level 6 · Велике повторення (mixed review). New intro demo `wordMerge`: syllables slide together into the word.

**World 2 · Вежа Слів (new letters К Р, В Д, П Ш).** Five levels: К і Р (РУ-КА, КО-РО-НА, КО-МАР, КІТ…), В і Д (ВО-ДА, ДИ-ВАН, ДРА-КОН, ВИД-РА…), П і Ш (МИШ-КА, ПОШ-ТА, ШО-КО-ЛАД, КА-ПУС-ТА…), sentences («Кіт на дивані.», «У мишки шоколад.» …), and «Чарівне ім’я»: its Magic Door is his own name, МИШКО (with МИШКА as the look-alike), kept out of the level's pool so it stays a surprise, and Соня says "Це твоє ім’я, Мишку! Ти сам його прочитав!". Closed and cluster syllables (МИШ, ДРА, КОН) are hand-split for reading; please check them as a native speaker.

**Only v1 letters.** Every word in v1 uses only М, Л, Н, Т, С and А, О, У, И, І. The earlier "Ось лиса" and "Ось сани" were replaced because "Ось" needs Ь. Each `world.json` lists its `allowedLetters`, and the content validator rejects any word that uses other letters.

**Closed words.** ЛІС and НІС are single closed syllables, so they appear only in `readPickPicture` and `hearPick`, never in `buildWord`.

**How sentence choices are built.** The 2 or 3 scenes differ in exactly what he must read, never in things like тут / там that a picture can't show. For example, "У мами мило", "У мами ноти" and "У тата ноти" differ by who and what.

**Letter case.** Everything is shown in UPPERCASE by default, like a children's alphabet book. A parent setting, "Show lowercase in sentences", switches Level 3 to normal sentence case once he recognises the small letters too (м, л, н, т, с, а, о, у, и, і).

**Pictures needed (v1).** 10 word pictures, 9 sentence scenes, and art for Соня, Іскрик (4 growth stages), the castle map and 3 creature cards. Use one consistent illustration style. For prototyping, open-licensed emoji sets such as OpenMoji or Twemoji are fine placeholders, with their attribution kept in the credits.
