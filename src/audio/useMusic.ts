import { useEffect } from 'react';
import { setMusic, type MusicTrack } from './manager';

/** The music for a screen; switching screens crossfades. */
export function useMusic(track: MusicTrack | null): void {
  useEffect(() => setMusic(track), [track]);
}
