// The scenery of each world's stretch of the journey road, named by its world's "look": a muted
// accent for the wash and the gate (within the palette: no saturated blues or violets) and the
// silhouettes repeated along the edges. Add a look here; a world names it in content.
import type { ComponentType } from 'react';
import { Books, Cauldron, Hills, Observatory, Planets, ScrollTower, Shelf, Spire, Sunflowers, Tower } from './motifs';

export interface Look {
  /** "r g b" of the accent. */
  accent: string;
  motifs: ComponentType[];
}

export const LOOKS: Record<string, Look> = {
  'stone-tower': { accent: '201 162 74', motifs: [Tower, Spire] },
  'scroll-tower': { accent: '216 199 156', motifs: [ScrollTower, Books] },
  garden: { accent: '150 160 90', motifs: [Sunflowers, Hills] },
  observatory: { accent: '176 168 196', motifs: [Observatory, Planets] },
  kitchen: { accent: '196 140 90', motifs: [Cauldron, Shelf] },
};

export const DEFAULT_LOOK: Look = { accent: '201 162 74', motifs: [Hills] };

export const lookOf = (name: string): Look => LOOKS[name] ?? DEFAULT_LOOK;
