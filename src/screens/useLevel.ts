import { useParams } from 'react-router';
import { content } from '../content/load';
import type { Level } from '../engine/schema';

/** The level named by /level/:world/:num, or null. */
export function useLevel(): Level | null {
  const { world, num } = useParams();
  return content.levels.get(`${world}/${num}`) ?? null;
}
