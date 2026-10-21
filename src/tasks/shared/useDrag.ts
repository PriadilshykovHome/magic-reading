import { useRef, useState, type PointerEvent } from 'react';

const TAP_SLOP = 8;

/**
 * Pointer-events drag that also works as a tap (tap-to-place): mouse, touch and pen behave the
 * same. On release over an element with `data-drop`, `onDrop(dropValue)` runs; a short press
 * without movement calls `onTap()`.
 */
export function useDrag({ onTap, onDrop, disabled = false }: { onTap: () => void; onDrop: (target: string) => void; disabled?: boolean }) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);

  const handlers = {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      if (disabled) return;
      start.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      if (!start.current) return;
      const x = e.clientX - start.current.x;
      const y = e.clientY - start.current.y;
      if (offset || Math.hypot(x, y) > TAP_SLOP) setOffset({ x, y });
    },
    onPointerUp(e: PointerEvent<HTMLElement>) {
      if (!start.current) return;
      const dragged = offset !== null;
      start.current = null;
      setOffset(null);
      if (!dragged) return onTap();
      const el = e.currentTarget;
      el.style.visibility = 'hidden'; // look underneath the dragged element
      const below = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-drop]');
      el.style.visibility = '';
      if (below?.dataset.drop) onDrop(below.dataset.drop);
    },
    onPointerCancel() {
      start.current = null;
      setOffset(null);
    },
  };

  const style = offset
    ? { transform: `translate(${offset.x}px, ${offset.y}px) scale(1.08)`, zIndex: 5, transition: 'none' }
    : undefined;
  return { handlers, style, dragging: offset !== null };
}
