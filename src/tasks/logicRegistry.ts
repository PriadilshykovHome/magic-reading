// Every task type's pure logic, by id. Level files can use any id registered here.
// (Phase 3 adds registry.ts, which pairs each logic with its React component.)
import type { TaskRegistry } from '../engine/taskLogic.ts';
import { bubblePop } from './bubblePop/logic.ts';
import { buildWord } from './buildWord/logic.ts';
import { hearPick } from './hearPick/logic.ts';
import { readAloud } from './readAloud/logic.ts';
import { readPickPicture } from './readPickPicture/logic.ts';
import { sentencePicture } from './sentencePicture/logic.ts';
import { syllableMerge } from './syllableMerge/logic.ts';

export const taskLogics: TaskRegistry = Object.fromEntries(
  [syllableMerge, hearPick, bubblePop, readPickPicture, buildWord, sentencePicture, readAloud].map((logic) => [
    logic.id,
    logic,
  ]),
);
