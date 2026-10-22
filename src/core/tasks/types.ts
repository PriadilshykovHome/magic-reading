import type { ComponentType } from 'react';
import type { AnyTaskLogic, TaskInstance } from '../engine/taskLogic';

/** What every task component gets. It reports misses and completion; the runner does the rest. */
export interface TaskProps<Data = unknown> {
  task: TaskInstance<Data>;
  /** After enough misses the right option gently pulses. */
  hint: boolean;
  onMiss(): void;
  onComplete(): void;
}

/** The full plug-in: pure logic (engine, validator) + its React component. */
export interface TaskType {
  logic: AnyTaskLogic;
  // Each component is only ever rendered with its own task's data.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: ComponentType<TaskProps<any>>;
}
