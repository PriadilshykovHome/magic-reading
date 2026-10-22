// All user-facing text comes from here (the active game's strings file). Never hard-code it in components.
import { game } from '@game';

export const t = game.strings;

/** Fills {placeholders} in a UI string: fmt(t.map.level, { n: 2 }). */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in vars ? String(vars[key]) : whole));
}
