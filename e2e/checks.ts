import { expect, type Page } from '@playwright/test';

/** Minimum reading text sizes from the plan (px). */
const TEXT_MIN = { 'read-syllable': 64, 'read-word': 48, 'read-sentence': 32, 'bubble-inner': 64 } as const;

/**
 * The layout rules, checked in the page: no scrolling, nothing cut off, every tap target at
 * least 64×64 with 16 px between neighbours, reading text never below its minimum.
 */
export async function expectGoodLayout(page: Page, label: string) {
  await page.evaluate(() => document.fonts.ready);
  const problems = await page.evaluate((textMin) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const out: string[] = [];
    const root = document.documentElement;
    if (root.scrollWidth > vw + 1 || root.scrollHeight > vh + 1) out.push(`page scrolls (${root.scrollWidth}×${root.scrollHeight} in ${vw}×${vh})`);

    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[aria-hidden="true"]');
    };
    const name = (el: Element) =>
      `${el.tagName.toLowerCase()}.${[...el.classList].filter((c) => !c.startsWith('is-')).join('.')}${el.getAttribute('aria-label') ? ` "${el.getAttribute('aria-label')}"` : ''}`;
    const moving = (el: Element) => el.closest('.bubble') !== null;
    const rect = (el: Element) => el.getBoundingClientRect();

    const targets = [...document.querySelectorAll('button, a[href], [role="button"], [data-drop]')].filter(visible);
    for (const el of targets) {
      const r = rect(el);
      if (r.width < 63.5 || r.height < 63.5) out.push(`tap target ${Math.round(r.width)}×${Math.round(r.height)} px: ${name(el)}`);
    }

    const content = [...targets, ...document.querySelectorAll('.read-syllable, .read-word, .read-sentence, .parchment, .option')];
    for (const el of content.filter(visible)) {
      if (moving(el)) continue;
      const r = rect(el);
      if (r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1) {
        out.push(`cut off: ${name(el)} at ${Math.round(r.left)},${Math.round(r.top)}–${Math.round(r.right)},${Math.round(r.bottom)}`);
      }
    }

    const still = targets.filter((el) => !moving(el));
    for (let i = 0; i < still.length; i++) {
      for (let j = i + 1; j < still.length; j++) {
        const a = still[i]!;
        const b = still[j]!;
        if (a.contains(b) || b.contains(a)) continue;
        const ra = rect(a);
        const rb = rect(b);
        const dx = Math.max(0, Math.max(ra.left, rb.left) - Math.min(ra.right, rb.right));
        const dy = Math.max(0, Math.max(ra.top, rb.top) - Math.min(ra.bottom, rb.bottom));
        const gap = Math.max(dx, dy);
        if (gap < 15.5) out.push(`${dx === 0 && dy === 0 ? 'overlap' : `gap ${Math.round(gap)} px`}: ${name(a)} ↔ ${name(b)}`);
      }
    }

    for (const [cls, min] of Object.entries(textMin)) {
      for (const el of document.querySelectorAll(`.${cls}`)) {
        if (!visible(el)) continue;
        const size = parseFloat(getComputedStyle(el).fontSize);
        if (size < min - 0.5) out.push(`${cls} text ${size} px < ${min} px`);
      }
    }
    return out;
  }, TEXT_MIN);
  expect(problems, label).toEqual([]);
}

/** Every level open, so any screen can be visited directly. */
export async function unlockEverything(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('magic-reading:progress:guest')) {
      localStorage.setItem('magic-reading:progress:guest', JSON.stringify({ settings: { unlockAll: true } }));
    }
  });
}
