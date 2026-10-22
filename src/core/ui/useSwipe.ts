import { useRef, type PointerEvent } from 'react';

/** A horizontal swipe turns the page (vertical drags still scroll the page's list). */
export function useSwipe(next: () => void, prev: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: PointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: PointerEvent) => {
      const from = start.current;
      start.current = null;
      if (!from) return;
      const dx = e.clientX - from.x;
      if (Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(e.clientY - from.y)) (dx < 0 ? next : prev)();
    },
  };
}
