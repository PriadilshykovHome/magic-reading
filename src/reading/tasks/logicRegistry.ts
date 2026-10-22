// Every task type's pure logic, by id. Level files can use any id registered here.
import type { TaskRegistry } from '../../core/engine/taskLogic.ts';
import { bubblePop } from './bubblePop/logic.ts';
import { buildSentence } from './buildSentence/logic.ts';
import { buildWord } from './buildWord/logic.ts';
import { hearPick } from './hearPick/logic.ts';
import { missingSyllable } from './missingSyllable/logic.ts';
import { readAloud } from './readAloud/logic.ts';
import { readPickPicture } from './readPickPicture/logic.ts';
import { sentencePicture } from './sentencePicture/logic.ts';
import { syllableMerge } from './syllableMerge/logic.ts';
import { trueFalse } from './trueFalse/logic.ts';

export const taskLogics: TaskRegistry = Object.fromEntries(
  [syllableMerge, hearPick, bubblePop, readPickPicture, buildWord, sentencePicture, readAloud, missingSyllable, trueFalse, buildSentence].map((logic) => [
    logic.id,
    logic,
  ]),
);
