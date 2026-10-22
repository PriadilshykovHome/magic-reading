import { useParams } from 'react-router';
import { game } from '@game';
import type { Level } from '../engine/schema';

/** The level named by /level/:world/:num, or null. */
export function useLevel(): Level | null {
  const { world, num } = useParams();
  return game.content.levels.get(`${world}/${num}`) ?? null;
}

/** "tower-of-syllables/01" → its route. */
export const levelPath = (levelId: string) => `/level/${levelId}`;

/** The map of the world a level belongs to. */
export const mapPath = (levelId?: string) => (levelId ? `/map/${levelId.split('/')[0]}` : '/map');
