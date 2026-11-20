/* Which turn presentation shows the next turn. Asked afresh for every turn, so
   a presentation that becomes available later (one loaded when idle) can take
   over from the next turn on. */

import { createCssTurn } from './css-turn';
import { createFade } from './fade';
import type { BadgeFaces } from './faces';
import type { TurnPresentation } from './presentation';

export function createPresentationChooser(
  faces: BadgeFaces,
  { reducedMotion }: { reducedMotion: boolean },
): () => TurnPresentation {
  const cssTurn = createCssTurn(faces);
  const fade = createFade(faces);
  return () => (reducedMotion || typeof faces.badge.animate !== 'function' ? fade : cssTurn);
}
