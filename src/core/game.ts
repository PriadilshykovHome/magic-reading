// The seam between the shared game shell and a game's domain pack. Core code reaches the active
// game only through two aliases (see vite.config.ts and tsconfig.app.json):
//   '@game'    → GameData (content, engine, task logic, item media; no UI)
//   '@game-ui' → GameUi   (task components, the level intro demo)
// so the reading game can be swapped for the English or maths one without touching core.
import type { ComponentType } from 'react';
import type { GameContent } from './engine/content';
import type { Level } from './engine/schema';
import type { DomainEngine, TaskRegistry } from './engine/taskLogic';
import type { TaskType } from './tasks/types';

export interface GameData {
  /** Also the cloud progress document: players/{uid}/games/{id}. */
  id: string;
  content: GameContent;
  engine: DomainEngine;
  logics: TaskRegistry;
  /** What Соня says for an item, and its recording under public/audio/uk/ if it has one. */
  item(id: string): { text: string; audio?: string };
  /** Every item a level may ask about, so its audio can preload. */
  levelItems(level: Level): string[];
  /** How its door looks on the journey road. */
  nodeKind(level: Level): 'door' | 'review' | 'finale';
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
