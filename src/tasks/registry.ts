// Every task type: pure logic + component. Add a folder, register it here, and level files can use it.
import { taskLogics } from './logicRegistry';
import { BubblePop } from './bubblePop/BubblePop';
import { BuildWord } from './buildWord/BuildWord';
import { HearPick } from './hearPick/HearPick';
import { ReadAloud } from './readAloud/ReadAloud';
import { ReadPickPicture } from './readPickPicture/ReadPickPicture';
import { SentencePicture } from './sentencePicture/SentencePicture';
import { SyllableMerge } from './syllableMerge/SyllableMerge';
import type { TaskType } from './types';

const components: Record<string, TaskType['Component']> = {
  syllableMerge: SyllableMerge,
  hearPick: HearPick,
  bubblePop: BubblePop,
  readPickPicture: ReadPickPicture,
  buildWord: BuildWord,
  sentencePicture: SentencePicture,
  readAloud: ReadAloud,
};

export const taskTypes: Record<string, TaskType> = Object.fromEntries(
  Object.entries(taskLogics).map(([id, logic]) => {
    const Component = components[id];
    if (!Component) throw new Error(`Task type ${id} has no component`);
    return [id, { logic, Component }];
  }),
);
