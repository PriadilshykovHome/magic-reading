# Чарівні пригоди Мишка — Implementation Plan

Oct 21, 2026 · @Oleksandr

## Overview & goals

Build a browser game, **Чарівні пригоди Мишка** (Mishko's Magic Adventures), that teaches Михайло (Мишко), almost 5, to read Ukrainian. He starts with syllables, then words, then short sentences, all in an original magic-school world. It runs on phone, tablet and laptop, is hosted free on GitHub Pages, and saves progress to a free Firebase account so play continues on any device.

**Player.** One child: Михайло, called Мишко, almost 5, born in Kharkiv. He knows the letters and their sounds but cannot read instructions yet, so every instruction is spoken and the UI is icon-driven. The game is made for him personally; see Personal touches.

**v1 scope (start small).**

- 1 world (the Tower of Syllables) with 3 levels: syllables, words, sentences.
- Each level takes about 5 to 8 minutes, can be replayed, and its tasks are reshuffled every time.
- Full polish on what exists: animations, sound, a mascot, an end-of-level celebration and Easter eggs.
- Simple login (username + password) and cloud save across devices.

**Built to grow.** Levels are JSON data files, and new task types plug into a registry. Adding a level or a world needs content and audio files only, no code changes.

**Not in v1.** Voice recognition, a public sign-up, multiple players, leaderboards, ads and purchases.

**Done means.**

- He can finish a level with a parent nearby but without help on the controls.
- The first screen loads in under 3 seconds on a mid-range phone.
- Animations run smoothly at 60 fps.
- After logging in on a second device, progress is identical.

## Theme & world

The setting is an original magic school with a cozy wizard feel. It must not use any names, characters, places, logos, fonts or house colours from Harry Potter, so the world is ours and safe to publish.

| Element | Ukrainian name | Role in the game |
| --- | --- | --- |
| The school | Академія Чарівних Літер | The whole app; a floating castle at night |
| World 1 | Вежа Складів (Tower of Syllables) | v1 content; future towers: Вежа Слів, Бібліотека Казок |
| Guide mascot | Сова Соня | Small round purple owl with glasses and a tiny hat; speaks every instruction, reacts to answers |
| Companion | Дракончик Іскрик | Starts as an egg, hatches after Level 1, grows with stars; tap it for reactions |
| Currency | Іскорки (sparks) | Earned per correct answer; they fly into a glass jar |
| Collection | Книга Чар (Book of Spells) | One glowing page per mastered syllable or word |
| Rewards | Чарівні картки | Collectible creature cards, one per finished level |

### Art direction

The look is cozy and sophisticated: a quiet, candlelit night where magic moves slowly, and big motion is saved for his successes.

- **Palette.** Near-black aubergine night (#0E0B14) lifting to dusky plum near the top of the sky, antique gold (#C9A24A, highlights #F0D68A), warm candle and ember orange, and parchment cream for reading. No saturated blues, violets or oranges. Reading content always sits on a light parchment card with dark text, because contrast matters more than atmosphere when he is reading.
- **Ambient magic.** Floating wax candles drift at different depths (smaller, dimmer and slower when farther away), and their flames flicker in uneven steps inside a soft halo. Stars twinkle out of sync and fade out toward the ground, a shooting star crosses the sky now and then, warm embers drift slowly upward, two layers of mist drift along the ground, and a vignette darkens the edges.
- **Seasons.** Friendly carved pumpkin lanterns and the odd falling leaf from September to November, snow in winter, blossoms and pysanky in spring, fireflies on summer evenings. Seasonal pieces are shaded and toned down to sit in the night, not pop out of it.
- **Restraint rules.**
  - Ambient layers are quiet: low contrast, slow drift, small movements.
  - One focal element per screen gets the only gentle pulse: the door on the start screen, the reading card in tasks.
  - Candles stay at the sides. They never cross titles, the door or the reading card at any test viewport.
  - Nothing ambient moves near the reading card. During tasks the embers thin out and the candles dim.
  - Fast, big motion is reserved for feedback and celebrations, so it keeps its meaning.
- **Craft.** Depth from scale, opacity and speed; shading with soft gradients and radial glows rather than flat fills; antique gold with light-to-dark gradients. Titles use Cormorant Garamond and Cormorant SC (free licence, full Cyrillic, self-hosted). Reading text always uses the rounded sans.
- **No borrowed imagery.** Floating candles and pumpkins are classic fairy-tale and autumn motifs. Use them in our own style, with no house banners, crests or scenes copied from the films.

**Mascot behaviour.** Соня blinks, tilts her head and ruffles her feathers when idle. She hops when he answers correctly, gives an encouraging shrug when he's wrong, and does a loop-the-loop at the celebration. The owl is purple, never white, to stay clear of the books.

All names are placeholders you can change later in one strings file.

## Personal touches

The game is made for one boy, Михайло, called Мишко, and it should feel that way.

**Privacy.** The repo and the website are public. Only first names may appear in code or content: Михайло and Мишко (with their Ukrainian case forms), мама Аліна and тато Олександр, plus the Kharkiv connection in the art. His surname, patronymic and birthday are entered once in the parent area and kept only on the device and in his private Firestore document.

**Everyday.**

- The title is **Чарівні пригоди Мишка**. Соня greets him by name ("Привіт, Мишку!") and now and then praises him by name ("Мишку, ти справжній чарівник!").
- Ceremonial moments use the full name. His first 3-star level brings "Великий чарівник Михайло!", and the first page of the Book of Spells carries his name in gold.
- The card album is "Колекція Мишка".
- Ukrainian changes names by case, so every form lives in `content/strings.uk.json`: Мишко, Мишку, Мишка, Михайло, Михайле.

**Family magic.**

- **Чарівна пошта (owl post).** Mum and Dad record short voice messages in the recording studio. After some levels Соня flies in with a sealed letter. The envelope says МАМА or ТАТО, both readable with v1 letters, so he reads who it is from, taps the wax seal and hears the message.
- **Family portraits.** Two magic frames hang on the map, signed МАМА and ТАТО. Tapping one plays that parent's recorded hello. After Level 2 a third frame is signed АЛІНА: Mum's name uses only v1 letters (А-ЛІ-НА), so he reads it himself, and Соня says "Аліна — це мама!".
- **His own name as a goal.** МИШКО needs Ш and К, so it can't be read in v1. When a later world teaches them, that world's last Magic Door is his own name. ОЛЕКСАНДР unlocks the same way as a bonus word once Е, К, Д and Р are learned.

**Personal Easter eggs.**

- **Very formal Соня.** Tap her glasses 3 times and she bows and addresses him very formally by first name and patronymic ("Шановний Михайле …, прошу до читання!"), then giggles. The patronymic comes from the private profile at runtime; without it she says "Шановний чарівнику Михайле!".
- **Kharkiv on the horizon.** Far behind the tower glows a small night city inspired by Kharkiv's skyline (Держпром and a Ferris wheel). Tap it and its windows light up while Соня says "Це Харків — місто, де народився Мишко!".
- **Ukrainian touches.** Sunflowers along the tower path, and a вишиванка pattern on Соня's tiny scarf.
- **Quiet family nods.** A little синичка (blue tit), Соня's friend, sometimes lands on the tower and chirps, and a magic spinning wheel spins the golden thread for the celebration stars. The game never explains these; the family will know.
- **Birthday.** On his birthday the start screen has as many floating candles as his new age, Соня wears a party hat, and she says "З днем народження, Мишку!".

## Screens & core game loop

One play session is: magic door → castle map → level (intro, 8 to 10 tasks, a mini-boss) → celebration → back to the map. A level can never be failed. Mistakes only cost stars.

&#91;embedded content: screen flow · one play session\]

A wrong answer loops back inside the task step with a hint, so the only way out of a level is forward to the celebration.

1. **Magic door (start).** A big glowing door with the instruction "tap to enter". The tap also unlocks audio, which iPhones and iPads require. Соня greets him by name ("Привіт, Мишку!").
2. **Login (parent, once per device).** Username and password, remembered on that device after the first login. A "play without cloud" link lets him play locally if you're offline; that progress merges into the account after the next login.
3. **Castle map (home).** One continuous journey road through the Academy (see "Growth plan"); level doors sit along it.
   - Locked doors show a padlock, and finished doors show their 1 to 3 stars.
   - Around the path are Іскрик, the spark jar, the Book of Spells and the card album.
   - A tiny gear opens the parent area.
4. **Level intro.** Соня says one sentence about today's goal. A demo then shows the new syllables merging.
5. **Task loop.** 8 to 10 tasks drawn from the level's task pool.
   - A row of candles at the top lights one per task as progress.
   - A speaker button repeats the spoken instruction.
   - The home button needs a 1-second hold, so accidental taps don't exit.
6. **Mini-boss: the Magic Door.** A locked door with a word or sentence on it. Reading it correctly opens the door with a burst of light.
7. **Celebration.** Stars, fireworks and music. Sparks are counted into the jar, a card is revealed, and Іскрик reacts or grows a stage. Buttons: play again, back to map.
8. **Book of Spells and card album.** Browse everything collected; tapping a page plays the syllable or word.
9. **Parent area.** Behind a gate, described in its own section.

**Scoring.** Stars come from first-try accuracy: 90% or more earns 3 stars, 70% or more earns 2, and anything else earns 1. Finishing a level with any number of stars unlocks the next one. Answers already given are saved even if he leaves mid-level, but the level itself restarts next time.

- The Magic Door counts as one more scored task.
- In `buildWord`, first try means every tile placed correctly with no wrong tile.
- Unscored types (`syllableMerge`) don't count toward stars.

## Task types (mechanics)

v1 ships 7 task types. All of them check reading without voice recognition, by making the right answer reachable only through reading or listening. Each type is a plug-in in a registry, so new types can be added later without touching the game loop.

| Type id | What he sees and does | What it trains | Scored |
| --- | --- | --- | --- |
| `syllableMerge` | A consonant card and a vowel card. He taps or drags the consonant; it flies into the vowel, they glow and fuse, and the voice says "М… А… МА". | Blending (the teaching moment) | No |
| `hearPick` | The voice says a syllable or word. He taps the matching written card out of 2 or 3. | Sound to written form | Yes |
| `bubblePop` | Bubbles with syllables float up. The voice says "МА" and he pops every МА bubble before they float away (no time pressure: missed ones come round again). | Fast syllable recognition | Yes |
| `readPickPicture` | A word on a parchment card. He taps the matching picture out of 2 or 3. | Reading with understanding | Yes |
| `buildWord` | A picture plus the spoken word. He puts syllable tiles into slots in the right order (the target syllables + 1 extra). | Syllable order, word structure | Yes |
| `sentencePicture` | A short sentence. He taps the scene that matches it out of 2 or 3. | Sentence reading | Yes |
| `readAloud` | A syllable, word or sentence. He reads it aloud, and you tap a small tick or "again" button; then he can tap to hear the correct reading. | Pronunciation, fluency | Yes, by parent |

The mini-boss **Magic Door** (`magicDoor`) is a wrapper. It takes any scored type, picks the newest or weakest item, and dresses it in door visuals.

**Rules shared by all types.**

- **Reading vs listening.** Reading tasks (`readPickPicture`, `sentencePicture`, `readAloud`, and `magicDoor` around any of them) never play the target audio before he answers, otherwise they turn into listening tasks. After the answer, the audio always plays as confirmation. Listening tasks (`hearPick`, `bubblePop`, `buildWord`, `syllableMerge`) speak the target first, because that is their point.
- **He reads alone in every level.** Every level includes reading tasks he can solve without anyone reading to him, and every Magic Door is one of them.
- Never more than 3 options, with big tap targets.
- Distractors are chosen to be confusable on purpose: same consonant (МА / МО) or same vowel (МА / ЛА).
- A wrong option wobbles, dims and becomes disabled, with a soft "hmm" and Соня saying "Спробуй ще!". After 2 misses the correct option gently pulses as a hint.
- Every drag also works as tap-to-place: tap a tile and it jumps to the next empty slot; tap a placed tile to send it back.
- `readAloud` appears only when the "parent nearby" setting is on. Otherwise each one is replaced by another scored task from the level's mix, so a level always has 8 to 10 tasks.

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

## Growth plan (after the first playtest)

Мишко played the first 11 levels and liked them. The game now grows to about 300 levels, with a steady curriculum of realistic Ukrainian. The structure is built so content grows linearly while code stays flat, and so its core can later carry an English game and a maths game.

### Navigation

- **Home everywhere.** A Home button with a small door icon sits top-left in the same spot on every screen except the door, and leads back to the magic door.
  - In tasks it is the existing 1-second hold button.
  - The level intro also has a castle button back to the map, and the celebration keeps "До мапи".
- **One journey road.** The map is one continuous road through the Academy, with every world as a distinct region.
  - Direction: it climbs vertically in portrait and runs horizontally in landscape.
  - It opens centred on his next door. A "back to my door" button appears when that door is off screen.
  - Each region starts at a gate landmark with the world's name, which Соня says when tapped. Each region has its own scenery, a muted accent within the palette rules, and music.
  - The road is a thick stepping-stone path: lit gold where he has been, travelling sparkles on the segment to the next door (the screen's one focal pulse), dim stone ahead.
  - Іскрик waits at the next door and walks along the road to each newly opened one.
  - Node kinds: level door, bigger Magic Door (world finale), book (review), scroll (story) and cauldron (daily warm-up). Level numbers count globally (1…300).
  - The road scrolls inside its own element. Only regions near the viewport are rendered, and tasks never scroll.

### Structure for scale

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
  - A test asserts that a 300-level progress document stays under 300 KB.
- **Spaced repetition at scale.** Boxes get intervals in days (same day, 1, 3, 7, 21). Review draws from the 50 most overdue items.
- **Tests.** They grow with rules, not content: about 30 unit tests and 6 e2e tests.
- **Core and domain.** `src/core/` is game-agnostic: engine skeleton, spaced repetition, feedback events, rewards, progress, audio, effects, characters, UI, sync and the shared screens. `src/reading/` is this game's domain pack: lexicon, letters, distractors, curriculum, task types and intro demos.
  - A lint rule stops core from importing reading.
  - The English and maths games will reuse core, Соня, Іскрик and the private profile, each with its own domain pack and progress document. Core moves to a shared package only when game 2 starts.

### Curriculum

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

### New and extended game flows

| Type | What he does | Kind | Arrives |
| --- | --- | --- | --- |
| `missingSyllable` · Загублений склад | A picture and a word with one syllable missing; he picks the syllable (2–3 options) | Reading | World 3 |
| `trueFalse` · Правда чи жарт? | A sentence and a composed picture; he taps ✓ or 🙃. Some sentences are funny («Кіт на місяці.») | Reading | World 3 |
| `caseMatch` · Велика і мала | A capital letter or word; he picks its lowercase twin (out of 3) | Reading | World 8 |
| `story` · Історія | 2 to 10 sentences on pages, then 1 or 2 Хто? / Що? / Де? picture questions | Reading (world 11); Соня reads along in world 12 | Worlds 11–12 |

**Extensions of existing types:**
- `buildSentence` («Склади речення») is `buildWord` with word tiles.
- `bubblePop` gets words.
- `buildWord` goes up to 4 syllables.
- `readAloud` shows stress marks.
- Magic Door skins change per world: door, chest, bridge, egg.

**Daily warm-up («Чарівна розминка»):** once a day a cauldron on the road offers 4 due review tasks (about 90 seconds) and lights a castle window. Later, only if wanted: `fillWord` and `wordHunt`.

### Magic details, Ukraine and Kharkiv

- **Props.** Small layered SVGs, each with:
  - the screens it may appear on;
  - placement: edge, sky or ground;
  - season and time-of-day conditions, and a chance of appearing;
  - an optional tap reaction (a tiny Easter egg).

  At most 2 props per screen, under the restraint rules.
- **Magic props:**
  - a sleepy owl on a ledge, and owl silhouettes crossing the moon;
  - Соня's вишиванка-embroidered scarf;
  - a broom by the door, and a far-off Баба Яга broom flight;
  - a quill writing letters in the air, a bubbling казан, stacked spell books, a wand drawing each new road segment;
  - **Сузір’я літер:** the letters he has learned as faint constellations.
- **Readable signs:** a sign shows its word only once all its letters are known, so text he can read appears around the world as he learns. Tapping a sign says its word.
- **Ukraine:**
  - sunflowers along the road, калина, a stork's nest in spring, Petrykivka-style borders on the Book and the cards;
  - a carol star at Christmas, and Святий Миколай on 6 December.
- **Kharkiv:**
  - the skyline (Держпром, the Ferris wheel), a tram crossing a far bridge at night, the Mirror Stream fountain and the metro sign;
  - world 13 is a trip across the city.
- **Never (Harry Potter look-alikes):** flying keys, sorting hats, a snitch-like ball, striped house scarves, lightning scars, moving staircases, a white owl.

## Rewards, animations, sound & Easter eggs

Rewards come in three layers: instant feedback on every answer, a big celebration at the end of each level, and long-term collections that make him want to come back. Mistakes are never punished with sound or loss, only with a gentle retry.

### Every answer

- **Correct.**
  - The card springs up, gold sparkles burst from the tap point, and one іскорка flies on a curve into the jar, which bounces and counts up.
  - The chime rotates through 3 pitches so it never gets boring.
  - Соня hops. Every 2 or 3 correct answers she says a random praise line ("Чудово!", "Молодець!", "Ти справжній чарівник!").
- **Wrong.** The card wobbles sideways for 300 ms, dims and makes a soft "хм". Соня says "Спробуй ще!" with a shrug. There is no red cross and no buzzer.
- **Streaks in a level.** 3 correct in a row send a wand trail swooshing across the screen. 5 in a row add a shimmering magic wave over the background.
- **Between tasks.** The parchment card rolls up and the next unrolls (about 400 ms), and one more candle lights with a flicker.
- **Rare golden spark.** About 1 in 30 correct answers drops a golden spark worth 5.

### Level celebration (about 8 to 10 seconds, skippable after 2)

1. The screen dims and the Magic Door swings open with light rays.
2. Stars land one by one (1 to 3), each with a rising chime and a tiny screen shake.
3. Fireworks: 3 to 5 bursts in gold, violet and teal, with crackles, kids' cheers and a short magic fanfare.
4. Sparks earned stream into the jar while the counter rolls up.
5. A card spins in face-down. He taps it to flip it, it glows, the creature makes its sound, and it flies into the album.
6. Іскрик dances. If he reached a growth stage, he evolves (the egg wobbles, cracks and hatches in a flash of light).
7. The buttons pop in: play again, or back to the map.

One-time extras: the egg hatches after the very first level, and his first ever 3-star level brings a golden confetti rain and Соня's ceremonial "Великий чарівник Михайло!".

### Long-term collections

- **Book of Spells.** A page lights up when a syllable or word is mastered: answered right on the first try 3 times, on at least 2 different days.
- **Іскрик's growth.** Egg → hatchling (after Level 1) → young dragon (150 sparks) → big dragon (400 sparks). The thresholds live in config and are easy to tune.
- **Castle windows.** Each day he plays lights one window. 7 lit windows bring a weekly surprise card. A missed day just leaves a window dark; nothing is taken away.
- **Later:** wand colours and hats for Іскрик bought with sparks.

### Easter eggs (hidden surprises)

- Tap Соня 5 times quickly: she spins, her hat flies off and lands back on her head.
- Tap the moon on the map: a shooting star crosses the sky, and catching it gives a bonus spark.
- Long-press Іскрик: he sneezes a puff of glitter.
- A small cat sometimes peeks out of a castle window and giggles when tapped.
- Time of day: after 19:00 the castle windows glow and fireflies appear; mornings use a sunrise palette.
- Birthday (date set in the parent area): Соня wears a party hat and confetti falls on the start screen.
- Personal Easter eggs are listed under Personal touches.
- Seasons: pumpkin lanterns and falling leaves from September to November, snow from December to February. Around Великдень (Orthodox Easter, calculated each year), 5 pysanky hide on the map, and finding all 5 gives a special card.
- Parent secret: tapping the 4 map corners clockwise launches a fireworks show over the castle.

### Sound design

- **Three channels with their own volumes: voice, effects, music.** Music ducks to 30% whenever the voice speaks.
- **Music.** A calm magical loop on the map, a very quiet loop during tasks (off by default, since reading needs focus), and a fanfare for celebrations.
- **Effects list.** Tap, correct chime (×3 pitches), soft wrong, whoosh, sparkle, jar clink, candle light, door open, star (×3 rising), firework launch and burst, kids' cheer, card flip, egg crack, dragon chirp, owl hoot, bubble pop.

### Animation rules

- UI motion uses spring physics. Particles (sparkles, fireworks, confetti) share one full-screen canvas layer that ignores taps.
- Animate only transform and opacity. Cap particles at about 150 on phones, and pause everything when the tab is hidden.
- Соня and Іскрик are layered SVGs (eyes, wings, hat as separate parts) animated in code. A Rive state-machine character is a possible upgrade later.
- If the device asks for reduced motion, particle storms become gentle fades.
- A short vibration on a correct answer where the device supports it (Android browsers; iPhones ignore it).

## Responsive design (phone, tablet, laptop)

The whole app is one responsive "stage": a parchment card for the reading content plus a choices area. The choices area sits below the card in portrait and to its right in landscape. Every screen must work at the test sizes below, in both orientations, with no scrolling during a task.

| Device | Test viewports (CSS px) | Layout |
| --- | --- | --- |
| Phone, portrait | 360×640, 390×844 | Card on top, choices stacked below |
| Phone, landscape | 844×390 | Card left, choices right; mascot shrinks to a corner |
| Tablet | 768×1024, 1024×768, 820×1180 | Main target: roomy card, big choices, full mascot |
| Laptop | 1366×768, 1920×1080 | Stage capped at about 1200 px wide and centred on the night sky |

**Sizes.**

- Reading text scales with `clamp()` and never goes below: syllables 64 px, words 48 px, sentences 32 px. On tablets syllables reach about 120 px.
- Every tap target is at least 64×64 px with 16 px gaps. That is larger than the adult guideline, because 5-year-old fingers are less precise.
- Respect the notch and home bar with the safe-area insets.

**Input.**

- Use Pointer Events, so mouse, touch and pen behave the same, and tap-to-place works for every drag.
- Block things kids trigger by accident: text selection, the long-press menu, double-tap zoom (`touch-action: manipulation`) and pull-to-refresh (`overscroll-behavior: none`).
- On a laptop, keys 1, 2 and 3 pick options and Space repeats the instruction. That's handy when you're helping.

**Screen and fonts.**

- Installed as a PWA, the app opens full screen without browser bars. Otherwise a full-screen button appears where the browser supports it.
- Reading text uses one clear rounded sans with full Cyrillic and unambiguous letter shapes (for example Nunito). A decorative font is allowed for titles only. Fonts are self-hosted so the app works offline.
- On weak devices (low CPU core count, or reduced-motion preference) particle counts drop automatically.

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
| Offline + install | vite-plugin-pwa | Installable, caches app and audio |
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
  lexicon.json         every syllable, word, sentence + its audio and picture
  strings.uk.json      names and voice-line ids
  worlds/tower-of-syllables/world.json
  worlds/tower-of-syllables/levels/01-syllables.json  02-words.json  03-sentences.json
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

**Task plug-in contract.** Every task type implements the same interface, so adding one never touches the game loop:

```ts
interface TaskType<Config> {
  id: string;                                   // e.g. 'readPickPicture'
  configSchema: ZodType<Config>;                // validates its entry in a level file
  scored: boolean;
  build(ctx: BuildContext, config: Config): TaskInstance;  // target + distractors
  Component: React.FC<TaskProps>;               // renders it, reports onAnswer(result)
}
```

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

**Data model.** `players/{uid}` holds the private profile, shared by all of his games (the English and maths games come later). Each game's progress is one small document under it, `players/{uid}/games/reading-uk`; the security rule above matches `players/{uid}/{document=**}`. Items are keyed by lexicon id rather than by Cyrillic text, so field paths stay simple. To stay far below Firestore's 1 MiB limit at 300 levels (about 2,500 items), an item keeps only its last `mastery.distinctDays` okDays as day keys, and writes update changed field paths only (about 175 KB in total).

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
2. **Cloud write, batched.** The cloud copy is written after each task (debounced to at most one write per 5 seconds) and at level end. Firestore's offline cache queues writes made without internet.
3. **Merge on login and app start.** Load the cloud and local copies and merge them field by field:
   - Counters only ever go up and take the higher value (sparksEarned, sparksSpent, plays, best stars). The spark balance he sees is sparksEarned − sparksSpent, so spending sparks later (hats, wand colours) still merges safely.
   - The private profile (surname, patronymic, birthday) keeps the most recently edited version.
   - Lists take the union (cards, lit windows, found eggs, okDays).
   - Each item keeps the version with the later `lastSeen`.
   - The merged result is written back.
4. **Play without cloud.** Progress is kept under a local guest key and merged into the account at the next login.

These merge rules are enough because one child plays on one device at a time. A `schemaVersion` field lets later versions migrate old saves. Іскрик's growth stage is derived from completed levels and `sparksEarned`, never stored, so devices can't disagree about it.

## Content format & adding levels

All learning content lives in JSON under `content/`. A new level is a new JSON file plus its audio and pictures. A new world is a folder. Neither needs code changes.

**Lexicon (`content/lexicon.json`).** Every syllable, word and sentence is defined once, with its audio and picture (and an emoji placeholder until the art exists). Syllable splits are written by hand, never auto-hyphenated. Each sentence lists what its scene `depicts`, so a wrong scene can never also fit the sentence.

**Other content files.** `config.json` holds every tunable number (boxes, stars, sparks, streaks, Іскрик's thresholds, Easter egg dates). `voice.uk.json` holds all of Соня's lines, with placeholders such as `{nameVoc}` filled from `strings.uk.json` and the private profile. `cards.json` lists the creature cards.

```json
{
  "syllables": [
    { "id": "syl-ma", "text": "МА", "parts": ["М", "А"], "audio": "voice/syl/ma.mp3" }
  ],
  "words": [
    { "id": "w-mama", "text": "МАМА", "syllables": ["syl-ma", "syl-ma"],
      "audio": "voice/words/mama.mp3", "picture": "img/words/mama.webp" }
  ],
  "sentences": [
    { "id": "s-u-mamy-mylo", "text": "У мами мило.", "words": ["У", "мами", "мило"],
      "audio": "voice/sentences/u-mamy-mylo.mp3", "wordStartsSec": [0.0, 0.35, 0.9],
      "scene": "img/scenes/u-mamy-mylo.webp" }
  ]
}
```

`wordStartsSec` lets Соня read a sentence while each word lights up in turn.

**Level file (`content/worlds/<world>/levels/02-words.json`).**

```json
{
  "id": "tower-of-syllables/02",
  "title": "Перші слова",
  "unlockAfter": "tower-of-syllables/01",
  "intro": { "voice": "sonya/l02-intro", "demo": { "type": "syllableMerge", "items": ["syl-na", "syl-ta", "syl-sa"] } },
  "pool": { "syllables": ["syl-na", "syl-ta", "syl-sa"], "words": ["w-mama", "w-tato", "w-lysa", "w-mylo"] },
  "reviewFrom": ["tower-of-syllables/01"],
  "tasks": [
    { "type": "readPickPicture", "count": 3, "choices": 3 },
    { "type": "buildWord", "count": 3, "extraTiles": 1 },
    { "type": "hearPick", "count": 1, "itemKind": "word", "choices": 3 },
    { "type": "readAloud", "count": 1 }
  ],
  "boss": { "type": "magicDoor", "inner": "buildWord", "pick": "weakest" },
  "reward": { "card": "fox-01" }
}
```

`world.json` lists the levels in order, plus the world's title, map art, colours and music.

**Item picking (spaced repetition).** Each item sits in a box from 1 to 5. A first-try correct answer moves it up one box; a wrong answer sends it back to box 1. The picker favours low boxes and items not seen for a while. `reviewFrom` mixes in about 25% of items from earlier levels.

**Adding a level, step by step.**

1. Add any new syllables, words or sentences to `lexicon.json`.
2. Add their audio and pictures with exactly the filenames in the lexicon.
3. Create the level file and add it to `world.json`.
4. Run `npm run validate-content`. It checks that:
   - the JSON matches the schemas;
   - every id referenced exists;
   - every audio and picture file exists;
   - every task config is valid;
   - each pool has enough items for the requested number of choices.
5. Commit and push; GitHub Actions validates, builds and deploys.

**Adding a task type.** Create a folder in `src/reading/tasks/` that implements the plug-in contract and register it. Level files can then use its id.

**Content roadmap (later worlds).** See "Growth plan": about 300 levels over 13 worlds, written in waves just before he reaches them.

## Audio production

Record the voice yourself with a recording studio built into the parent area. Syllables in particular should be recorded by a person: text-to-speech often reads "МА" as letter names or with odd stress. v1 needs about 120 short clips, roughly 1 to 2 hours of recording including retakes.

**What to record.**

| Group | Clips | Notes |
| --- | --- | --- |
| Syllables | 25 normal + 25 stretched | Stretched version for the merge demo: "М-м-м… А-а… МА" |
| Words | 10 normal + 10 by syllables | By syllables: "МА… МА", used in buildWord hints |
| Sentences | 9 | Steady pace; word start times noted for highlighting |
| Соня's lines | about 45 | Greeting by name, 1 instruction per task type, 8 praise lines (some with his name), 4 retry lines, level intros, celebration, goodbye, personal Easter egg lines |
| Family messages | as many as you like | Short messages from Mum and Dad for Чарівна пошта and the portrait frames |

Example lines for Соня, to adjust in your own words: "Привіт! Готовий до чарів?", "Послухай і знайди склад", "Прочитай слово і знайди картинку", "Склади слово з частинок", "Щоб відчинити двері, прочитай чарівне слово!".

**Recording studio (parent area).**

1. It lists every lexicon item and voice line that has no audio yet, with the text to say shown large.
2. Record with the device microphone, play it back, and re-record if needed.
3. Silence at the start and end is trimmed automatically.
4. **Export all** downloads a zip with the exact filenames the lexicon expects.
5. You unzip it into `public/audio/uk/voice/` and commit. No cloud storage is needed.

A script (`npm run audio:prepare`) then uses ffmpeg to normalise loudness so every clip sounds equally loud, and converts to mono MP3 at about 64 kbps, which plays on every browser. With that, all v1 voice audio stays around 3 MB.

**Recording tips.** Use a quiet room and keep the phone about 20 cm away, at the same distance every time. Say syllables as sounds ("МА"), never as letter names, and keep the pace calm and even.

**Fallbacks.**

- If a clip is missing during development, the browser's Ukrainian speech voice reads it, where the device has one. The content validator warns about every missing clip.
- A cloud text-to-speech service with Ukrainian neural voices can pre-generate words, sentences and Соня's lines as a stopgap. Check each one by ear.

**Effects and music.** v1's effects and music are synthesised from code by `npm run audio:generate` (original, CC0), so nothing needs licensing; the one gap is real kids' cheers, which a bell shimmer stands in for until a CC0 recording is added. Any added assets use only free-licensed sources such as Kenney.nl (CC0), Freesound (filtered to CC0) and Pixabay's sound library. Keep `CREDITS.md` listing every asset and its licence, and never use music or sounds from the Harry Potter films.

## Parent area

The parent area holds progress, settings, the recording studio and the account. It sits behind a two-step gate so he can't wander in: hold the small gear for 3 seconds (a ring fills up), then answer a sum such as 14 + 9 on a number pad.

**Progress.**

- Stars and plays per level.
- A grid of every syllable and word, coloured by its spaced-repetition box (red = new or shaky, green = solid).
- The 5 weakest items, with how often each was missed.
- Minutes played per day over the last 14 days.

**Settings.**

- **Parent nearby:** turns `readAloud` tasks on or off.
- **Show lowercase in sentences** (off by default).
- **Volumes:** voice, effects and music, plus a switch for music during tasks.
- **Session limit:** off, 1 level, 2 levels or 15 minutes. When it's reached, Соня yawns and says it's time to rest until tomorrow.
- **Reduced effects:** for older tablets, or if the fireworks are too exciting before bed.
- **Child (private):** surname, patronymic and birthday, used for the formal-Соня Easter egg and the birthday surprise. They are stored only on the device and in his Firestore document, never in the repo. First names live in `content/strings.uk.json`.
- **Testing:** unlock all levels, and reset progress (asks twice).

**Recording studio.** As described in Audio production.

**Account.**

- Shows the logged-in user, last sync time, and whether any changes are still waiting to upload.
- Log out.
- Export progress as a JSON file and import it back, as an extra backup independent of Firebase.

**Credits.** Lists every asset and its licence, read from `CREDITS.md`.

## Build phases for Claude Code

Build in 9 phases, plus the growth steps after Phase 6, each ending in something you can open and try on a real device. Ask Claude Code to finish one phase, show you the result and pass its "done when" checks before starting the next.

1. **Scaffold & deploy.** Set up Vite + React + TypeScript, linting, the folder structure, hash routing, and a GitHub Actions workflow that deploys to GitHub Pages with the right base path. A placeholder magic-door screen goes live.
   - Done when: a push to `main` deploys automatically and the page opens on a phone.
2. **Content model & engine.** Write the Zod schemas, the lexicon and the 3 v1 level files, and the `validate-content` script. Build the pure engine: session builder, item picker with boxes 1 to 5, distractor picker, scoring, stars and sparks.
   - Done when: unit tests pass, the validator passes, and it catches a deliberately broken level file.
3. **Screens & task types (plain visuals).** Build the magic door, map, level intro, task runner and a simple celebration screen. Implement all 7 task types plus the Magic Door wrapper, with tap-to-place for drags. Save progress locally. Use browser speech and emoji placeholders for audio and pictures. Соня greets and praises him by name.
   - Done when: all 3 levels can be played start to finish, and progress survives a page reload.
4. **Responsive & input hardening.** Apply the layout rules for portrait and landscape, the minimum sizes, the touch protections and the keyboard shortcuts.
   - Done when: Playwright screenshots at every test viewport show no overflow or scrolling, and an automated check finds no tap target under 64 px.
5. **Audio system.** Build the audio manager with channels, ducking, preloading per level, iOS unlock on the door tap, effects, music and rotating praise lines.
   - Done when: sounds never stack or cut each other off, and audio works on an iPhone after tapping the door.
6. **Characters, animation & celebration.** Animate Соня and Іскрик with their states. Add the particle layer, the ambient magic layer (floating candles, stars, dust, mist, seasonal pumpkins) under the Art direction restraint rules, answer feedback, streak effects and card transitions. Build the full celebration sequence with card reveal and creature growth, plus reduced-motion mode.
   - Done when: animations hold 60 fps on a mid-range phone and the celebration can be skipped after 2 seconds.
**Growth steps (between Phases 6 and 7).** These come from "Growth plan". Each one runs locally and passes all checks before the next.

- G1. Home button on every screen.
- G2. Core / reading split, with a lint rule for the boundary. No behaviour change.
- G3. Content v2 and the curriculum module:
  - compact per-world lexicons, templates, derived pools and stable ids;
  - World 1 and World 2 migrated with the same ids;
  - the curve report, lighter startup and spaced-repetition due intervals.
- G4. The journey map: road, regions, Іскрик walking, auto-centre. Tested with a generated 300-level fixture.
- G5. The scene composer, `missingSyllable`, `trueFalse`, `buildSentence` and the daily warm-up.
- G6. Props, readable signs, and Ukraine and Kharkiv touches.
- G7. Content wave 1: worlds 3 to 5 (about 60 levels), with a native-speaker review list.

Later waves (worlds 6 to 13) are written just in time, after Phase 9. `caseMatch` and `story` arrive with worlds 8 and 11.

7. **Login & cloud sync.** Write step-by-step Firebase setup notes for you. Build the login screen, the security rules file and the sync engine with merge and play-without-cloud mode, and show sync status.
   - Done when: progress made on the laptop appears on the phone after login, offline play uploads once back online, and a rules test in the Firebase emulator shows another user can't read the document.
8. **Parent area & recording studio.** Build the gate, progress views and settings, including the private child profile.
   - Progress views are grouped by world and letter, with a "words he can read" curve.
   - Add the recording studio (with family messages). It works one world at a time ("record the next world") and has zip export.
   - Add JSON export/import and the `audio:prepare` script.
   - Done when: dropping your recorded zip into the project replaces the placeholder voice with no code change.
9. **Collections, Easter eggs & PWA.** Build the Book of Spells (one chapter per letter), card album (one page per world), castle windows (lit by the daily warm-up) and every Easter egg (ambient ones use the props system), including the seasonal ones with the Orthodox Easter date calculation and all Personal touches (Чарівна пошта, family portraits, Kharkiv on the horizon, formal Соня). Make the app installable and offline-capable.
   - Done when: it installs on a tablet and phone and launches offline, and a debug date override can trigger each seasonal surprise.

After phase 9, run a final check: a Playwright playthrough of every level at phone, tablet and laptop sizes, a Lighthouse audit, credits complete, and a real session with your son.

## Testing & deployment

Every push to `main` runs validation and tests, and only a green build is deployed to GitHub Pages.

**Deployment.**

- In the repo, set Settings → Pages → Source to **GitHub Actions**. In `vite.config.ts`, set `base` to `'/<repo-name>/'`.
- Workflow steps on push to `main`: `npm ci` → `validate-content` → `test` → `build` → upload the Pages artifact → deploy.
- Firebase web config goes in `VITE_FIREBASE_*` variables: `.env.local` on your laptop, and repository variables in GitHub Actions. These values are public by design; keeping them out of the code just makes switching projects easy.
- Deploy the security rules from the repo with the Firebase CLI (`firebase deploy --only firestore:rules`), so the rules are versioned with the code.
- The PWA updates itself on the next launch after a deploy. The parent area shows the app version, so you can confirm which build is running.

**Automated tests.**

| Kind | Tool | Covers |
| --- | --- | --- |
| Unit | Vitest | Engine (session, picker, scoring, rewards), sync merge rules, Orthodox Easter date, content schemas |
| Security rules | Firebase emulator | A user can read and write only their own document |
| End to end | Playwright | Every level played start to finish on iPhone-, iPad- (landscape) and laptop-sized viewports; no overflow; tap-target sizes |

Test builds mark the correct option with a `data-correct` attribute so Playwright can play through levels. Production builds strip it.

**On-device checklist (manual, before showing him a new version).**

- [ ] iPhone Safari: audio starts after the door tap, and nothing zooms on double-tap.
- [ ] iPad in landscape: layout is roomy, and drag and tap-to-place both work.
- [ ] Android Chrome: installs as an app and opens full screen.
- [ ] Laptop: mouse drag and the keyboard shortcuts work.
- [ ] Airplane mode: a whole level plays, and progress uploads afterwards.
- [ ] Two devices: progress from one appears on the other after a reload.

## Kick-off prompt for Claude Code

Export this doc as Markdown and save it in a new repo as `docs/PLAN.md`. Then open Claude Code in that repo and paste the prompt below.

```text
Read docs/PLAN.md fully. It is the implementation plan for "Чарівні пригоди Мишка", a Ukrainian
reading game for a 5-year-old (syllables → words → sentences), hosted on GitHub Pages with
Firebase login and cloud save.

Before writing code:
1. Create CLAUDE.md with the key conventions from the plan: stack, folder structure, the task
   plug-in contract, content lives in content/*.json validated by Zod, the engine is pure TS
   with unit tests, minimum tap target 64 px, reading tasks never play the target audio
   before the answer, and no Harry Potter names, characters, logos, fonts or music.
2. List anything in the plan that is ambiguous or that you would change, and ask me.

Then implement Phase 1 only. When it is done:
- run its "Done when" checks and show me the results;
- tell me exactly what to try on my phone;
- stop and wait for my go-ahead before Phase 2.

Keep to the libraries in the plan unless you ask first. Keep all Ukrainian text in
content/ or strings files, never hard-coded in components.
```

For each later phase, tell Claude Code: "Implement Phase N from docs/PLAN.md, run its Done-when checks, then stop."
