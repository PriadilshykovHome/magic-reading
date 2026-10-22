// All user-facing text comes from here. Never hard-code it in components.
import strings from '../../content/strings.uk.json';

export type Strings = typeof strings;
export const t: Strings = strings;

/** Fills {placeholders} in a UI string: fmt(t.map.level, { n: 2 }). */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => (key in vars ? String(vars[key]) : whole));
}
