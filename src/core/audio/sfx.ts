// Sound effects by meaning; the audio manager plays them from the generated sprite.
import { playFanfare, playSfx } from './manager';

export const sfx = {
  /** The correct-answer chime rotates through 3 pitches so it never gets boring. */
  correct: (pitch: 0 | 1 | 2) => playSfx(`correct${pitch}`),
  golden: () => playSfx('golden'),
  wrong: () => playSfx('wrong'),
  pop: () => playSfx('pop'),
  tap: () => playSfx('tap'),
  place: () => playSfx('place'),
  whoosh: () => playSfx('whoosh'),
  sparkle: () => playSfx('sparkle'),
  clink: () => playSfx('clink'),
  candle: () => playSfx('candle'),
  star: (index: number) => playSfx(`star${Math.min(2, Math.max(0, index)) as 0 | 1 | 2}`),
  doorOpen: () => playSfx('doorOpen'),
  fireworkLaunch: () => playSfx('fireworkLaunch'),
  fireworkBurst: () => playSfx('fireworkBurst'),
  cheer: () => playSfx('shimmer'),
  flip: () => playSfx('cardFlip'),
  eggCrack: () => playSfx('eggCrack'),
  chirp: () => playSfx('dragonChirp'),
  hoot: () => playSfx('owlHoot'),
  sneeze: () => playSfx('sneeze'),
  fanfare: playFanfare,
};
