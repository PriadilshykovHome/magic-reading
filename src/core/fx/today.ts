// The date the ambient details look at. `?date=2026-12-06` in the URL (before the #/ part of the
// address) previews another day's seasonal surprises; `?props=owlMoon,stork` shows those props.
const params = () => new URLSearchParams(window.location.search);

export function today(): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(params().get('date') ?? '');
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12) : new Date();
}

export function forcedProps(): string[] | null {
  const value = params().get('props');
  return value === null ? null : value.split(',').filter(Boolean);
}

/** `?birthday=2021-10-22` previews the birthday surprises (his real birthday stays in the private profile). */
export function birthdayOverride(): string | undefined {
  return /^\d{4}-\d{2}-\d{2}$/.exec(params().get('birthday') ?? '')?.[0];
}
