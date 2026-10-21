// All user-facing text comes from here. Never hard-code it in components.
import strings from '../content/strings.uk.json';

export type Strings = typeof strings;
export const t: Strings = strings;
