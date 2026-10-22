// The reading game's UI for the shared shell (imported as '@game-ui'): task components and the
// level intro demo.
import type { GameUi } from '../core/game';
import { IntroDemo } from './intro/IntroDemo';
import { taskTypes } from './tasks/registry';
import './tasks/tasks.css';

export const gameUi: GameUi = { tasks: taskTypes, IntroDemo };
