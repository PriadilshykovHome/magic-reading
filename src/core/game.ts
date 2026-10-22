// The seam between the shared game shell and a game's domain pack. Core code reaches the active
// game only through two aliases (see vite.config.ts and tsconfig.app.json):
//   '@game'    → GameData (content, engine, task logic, item media; no UI)
//   '@game-ui' → GameUi   (task components, the level intro demo)
// so the reading game can be swapped for the English or maths one without touching core.
import type { ComponentType } from 'react';
import type { GameContent } from './engine/content';
import type { Progress } from './engine/progress';
import type { Level } from './engine/schema';
import type { DomainEngine, TaskRegistry } from './engine/taskLogic';
import type { TaskType } from './tasks/types';

export interface GameData<Strings extends object = object> {
  /** Also the cloud progress document: players/{uid}/games/{id}. */
  id: string;
  /** Its language, for speech and lower-casing ('uk-UA'). */
  locale: string;
  /** Its recordings' folder under public/audio/ ('uk'). */
  audioRoot: string;
  /** All UI text (core reads it as `t`, src/core/strings.ts). A game declares
   *  `GameData<typeof itsStrings>`, so core's screens are type-checked against its keys. */
  strings: Strings;
  content: GameContent;
  engine: DomainEngine;
  logics: TaskRegistry;
  /** What Соня says for an item, its recording under public/audio/<audioRoot>/ if it has one,
   *  and its picture (an emoji placeholder until the art exists). */
  item(id: string): { text: string; audio?: string; emoji?: string };
  /** Every item a level may ask about, so its audio can preload. */
  levelItems(level: Level): string[];
  /** Which items he can read by now (every letter known from the levels he has finished). */
  canRead(progress: Progress): (id: string) => boolean;
  /** The Book of Spells: a chapter for each thing he has learned so far (reading: a letter), in
   *  teaching order, with every item it holds. Its pages light up as he masters them. */
  book(progress: Progress): BookChapter[];
  /** Family portraits for the album: an item he can read (МАМА) and, optionally, Соня's line for it. */
  portraits(progress: Progress): { item: string; line?: string }[];
  /** How its door looks on the journey road. */
  nodeKind(level: Level): 'door' | 'review' | 'finale';
  /** Today's warm-up over what he has finished, or null if there's not enough yet. */
  warmup(progress: Progress): Level | null;
}

export interface BookChapter {
  id: string;
  /** Its title, shown big and drawn as a constellation on the cover (reading: the letter). */
  title: string;
  items: string[];
}

export interface IntroDemoProps {
  level: Level;
  /** Соня is introducing the level; the demo waits, showing its first step. */
  waiting: boolean;
  /** Her introduction is over: play the demo. */
  playing: boolean;
}

export interface GameUi {
  tasks: Record<string, TaskType>;
  IntroDemo: ComponentType<IntroDemoProps>;
}
