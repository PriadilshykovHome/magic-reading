# Чарівні пригоди Мишка — Implementation Plan

Oct 21, 2026 (roadmap updated Oct 22) · @Oleksandr

This file is the vision and the roadmap; "Build phases" at the end says where things stand. What he learns and how content is written: [curriculum.md](curriculum.md). How the code works: [architecture.md](architecture.md). The rules for every change: [CLAUDE.md](../CLAUDE.md).

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

## Growth plan (after the first playtest)

Мишко played the first 11 levels and liked them. The game now grows to about 300 levels, with a steady curriculum of realistic Ukrainian. The structure is built so content grows linearly while code stays flat, and so its core can later carry an English game and a maths game.

The structure for scale and the curriculum (the worlds, the sentence-frame ladder, the Ukrainian checklist) are in [curriculum.md](curriculum.md); the core / domain split is in [architecture.md](architecture.md).

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
  - a broom by the door;
  - a quill writing letters in the air, a bubbling казан, stacked spell books, a wand drawing each new road segment;
  - **Сузір’я літер:** the letters he has learned as faint constellations, opening the Book of Spells (Phase 9). The door screen's sky is already full of candles, so they don't go there.
  - No Баба Яга (decided 22 Oct 2026).
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

- Installed as a PWA (Phase 10), the app opens full screen without browser bars. Otherwise a full-screen button appears where the browser supports it.
- Reading text uses one clear rounded sans with full Cyrillic and unambiguous letter shapes (for example Nunito). A decorative font is allowed for titles only. Fonts are self-hosted so the app works offline.
- On weak devices (low CPU core count, or reduced-motion preference) particle counts drop automatically.

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

Build in 10 phases, plus the growth steps after Phase 6 and the clean-up after Phase 7, each ending in something you can open and try on a real device. Ask Claude Code to finish one phase, show you the result and pass its "done when" checks before starting the next.

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
- G5. The scene composer, `missingSyllable`, `trueFalse`, `buildSentence` and the daily warm-up. Done: W1·06 and W2·04 already use the new games.
- G6. Props, readable signs, and Ukraine and Kharkiv touches. Done:
  - readable signposts on the road (`signs` in world.json, shown once he knows every letter; tap → Соня reads it). They need a 48 px word, so they show on tablets and laptops, not on phones;
  - Kharkiv on the door screen's horizon (the Annunciation Cathedral, rooftops, Держпром, the Ferris wheel; tapping the wheel says `eggs.kharkiv` and lights the windows);
  - the props registry (`src/core/fx/props/`, dates and chances in `config.json` → `props`): pumpkins, Миколай's gift, the carol star, a stork on Держпром, калина, a sleepy owl (tap → hoot), an owl across the moon. `?date=YYYY-MM-DD` and `?props=a,b` preview them;
  - Соня's вишиванка scarf.
- G7. Content wave 1: worlds 3 to 5. Done: 59 new levels (70 in all, 170 words, 118 sentences),
  the ОЛЕКСАНДР, «Я МИШКО!», ХАРКІВ and МИХАЙЛО doors, 13 cards, observatory and kitchen scenery.
  Review list: `docs/review/wave-1.md`.

Later waves (worlds 6 to 13) are written just in time, after Phase 9. `caseMatch` and `story` arrive with worlds 8 and 11.

**Order from Phase 7: 7 → clean-up → 9 → 8 → 10** (decided 22 Oct 2026). Phase 8 comes after Phase 9, and the installable offline app (formerly part of Phase 9) is last, as Phase 10. Until Phase 8 exists, the private profile (surname, patronymic, birthday) is typed by hand in the Firestore console under `players/{uid}` → `profile`.

7. **Login & cloud sync.** Write step-by-step Firebase setup notes for you. Build the login screen, the security rules file and the sync engine with merge and play-without-cloud mode, and show sync status.
   - Done when: progress made on the laptop appears on the phone after login, offline play uploads once back online, and a rules test in the Firebase emulator shows another user can't read the document.
   - Done (22 Oct 2026): `src/core/sync/cloud.ts` (Firebase loads lazily; per-account local copies; field-path writes at most every 5 s and right after a level; merge on login, app start, return to the tab and coming back online), `src/core/engine/merge.ts` (unit-tested), the login screen with «Грати без входу» (a guest's progress joins the account at login), the cloud state on the door, `firestore.rules` with an emulator test (`npm run test:rules`, also in CI). Checked with two browser profiles against the emulators: laptop → phone, offline → online.

**Clean-up (after Phase 7, done 22 Oct 2026).** Smaller, faster and ready to carry the English and maths games, with his progress and every feature kept:

- O1. CI in parallel jobs, e2e inside Playwright's image (no 12-minute browser install).
- O2. `npm run bundle-report`; size budgets in `check-prod-build` (CI).
- O3. Effects and music as small MP3s (2.86 MB → 0.48 MB), loops cut to their exact length.
- O4. Firestore Lite, lazy screens, `reviewEarlier` instead of long review lists. The site went from 4.8 to 1.8 MB, first-load JS from 220 to 207 KB gzip.
- O6. Speech Chrome refuses before the first tap is said on that tap; a stale-test-cache fix; dead code removed; a saved-progress fixture test guarding every level, item and card id.
- O7. The core is game-agnostic: locale, audio folder and strings come from `@game`, and a tiny second game (`src/core/engine/fixtures/countStars/`) runs on core alone.
- O8. `npm run review-list -- <world>` writes the native-speaker review of a world.
- O9. These docs split into PLAN, curriculum and architecture.
- Kept on purpose: React Router and Zod. Replacing the router (about −28 KB gzip) or moving to `zod/mini` (about −20 KB gzip) isn't worth the rewrite.

9\. **Collections & Easter eggs.** Build the Book of Spells (one chapter per letter, opening with «Сузір’я літер»), card album (one page per world), castle windows (lit by the daily warm-up) and every Easter egg (ambient ones use the props system), including the seasonal ones with the Orthodox Easter date calculation and all Personal touches (Чарівна пошта, family portraits, formal Соня; Kharkiv on the horizon is done in G6). The Book and the album are lazy screens, within the size budgets.
   - Done when: a debug date override (`?date=YYYY-MM-DD`, already there for props) can trigger each seasonal surprise.

8\. **Parent area & recording studio.** Build the gate, progress views and settings, including the private child profile.
   - Progress views are grouped by world and letter, with a "words he can read" curve.
   - Add the recording studio (with family messages). It works one world at a time ("record the next world") and has zip export.
   - Add JSON export/import and the `audio:prepare` script (ffmpeg, like `audio:generate`).
   - Done when: dropping your recorded zip into the project replaces the placeholder voice with no code change.

10\. **Install & offline (PWA).** `vite-plugin-pwa`: precache the app shell, fonts and effects; cache music and voice clips on first play; a manifest (name, icons from the door art, standalone, both orientations). A new version is applied at the next start, never mid-level; the parent area shows the app version.
   - Done when: it installs on a tablet and phone and launches offline, a whole level plays in airplane mode, and a Lighthouse PWA audit passes.

After phases 9, 8 and 10, run a final check: a Playwright playthrough of every level at phone, tablet and laptop sizes, a Lighthouse audit, credits complete, and a real session with your son.

**Later.**

- **Android app (Play Market)** with Capacitor, which wraps this web build. A web-app wrapper (TWA) won't do: it needs a file at the domain root, which a `/magic-reading/` project site can't serve, and Android's WebView has no Ukrainian browser speech. Capacitor brings native text-to-speech and full offline play.
  - Needs: a Google Play developer account (25 USD once), Android Studio, an icon, screenshots and a feature graphic, a privacy-policy page, and the Data safety form (one login email and his progress; no ads, no tracking). A closed testing track (up to 100 testers, the family) avoids the full "Designed for Families" review; a public release needs it.
  - iOS later: the same Capacitor project, with an Apple developer account (99 USD a year).
- **Shared core and the next games.** `src/core` moves to `packages/core` (npm workspaces); the games become `apps/reading-uk`, `apps/english`, `apps/maths`, each with its own `content/` and domain pack, sharing Соня, Іскрик, the journey, rewards, sync and the parent area. One login serves all of them (`players/{uid}/games/{gameId}`).
