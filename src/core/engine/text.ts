// The {placeholders} in Соня's lines: his name and its case forms, the family, his home city.
import type { CoreConfig as Config, Strings } from './schema.ts';

export const TEMPLATE_KEYS = [
  'name',
  'nameVoc',
  'nameGen',
  'fullName',
  'fullNameVoc',
  'patronymicVoc',
  'mom',
  'dad',
  'birthCity',
  'mascot',
  'companion',
  /** What a level is about, e.g. its new letter (from the level, not the strings file). */
  'topic',
] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];
export type TemplateVars = Partial<Record<TemplateKey, string>>;

export function templateKeys(template: string): string[] {
  return [...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
}

/** Fills {placeholders}; `missing` lists any without a value (the caller then uses a fallback line). */
export function fillTemplate(template: string, vars: TemplateVars): { text: string; missing: string[] } {
  const missing: string[] = [];
  const text = template.replace(/\{(\w+)\}/g, (whole, key: string) => {
    const value = vars[key as TemplateKey];
    if (value === undefined) {
      missing.push(key);
      return whole;
    }
    return value;
  });
  return { text, missing };
}

export function patronymicVocative(patronymic: string, rules: Config['grammar']['patronymicVocative']): string {
  for (const [ending, vocative] of rules) {
    if (patronymic.endsWith(ending)) return patronymic.slice(0, -ending.length) + vocative;
  }
  return patronymic;
}

/** First names come from the public strings file; the patronymic only from the private profile. */
export function templateVars(strings: Strings, config: Config, profile?: { patronymic?: string }): TemplateVars {
  const patronymic = profile?.patronymic?.trim();
  return {
    name: strings.child.short,
    nameVoc: strings.child.vocative,
    nameGen: strings.child.genitive,
    fullName: strings.child.name,
    fullNameVoc: strings.child.vocativeFull,
    patronymicVoc: patronymic ? patronymicVocative(patronymic, config.grammar.patronymicVocative) : undefined,
    mom: strings.family.mom,
    dad: strings.family.dad,
    birthCity: strings.places.birthCity,
    mascot: strings.names.mascot,
    companion: strings.names.companion,
  };
}
