/** Test builds (the dev server, or a build with VITE_MARK_CORRECT=true) mark correct answers and
 *  expose /dev routes for automated checks. Production builds strip both. */
export const TEST_BUILD = import.meta.env.DEV || import.meta.env.VITE_MARK_CORRECT === 'true';

/** Automated runs (VITE_E2E=true): no speech or sound, so play-throughs are fast and repeatable. */
export const SILENT = import.meta.env.VITE_E2E === 'true';

/** Test builds mark the correct option for automated play-throughs; production builds strip it. */
export function correctMark(isCorrect: boolean): { 'data-correct'?: 'true' } {
  return TEST_BUILD && isCorrect ? { 'data-correct': 'true' } : {};
}
