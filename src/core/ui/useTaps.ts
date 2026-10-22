import { useRef } from 'react';

/** For the hidden surprises: calls `onReach` when tapped `count` times, each within `gapMs` of the last. */
export function useTaps(count: number, onReach: () => void, gapMs = 600): () => void {
  const taps = useRef({ n: 0, at: 0 });
  return () => {
    const now = performance.now();
    const n = now - taps.current.at < gapMs ? taps.current.n + 1 : 1;
    taps.current = { n: n >= count ? 0 : n, at: now };
    if (n >= count) onReach();
  };
}
