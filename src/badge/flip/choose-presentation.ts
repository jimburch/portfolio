/* Which turn presentation shows the next turn. Asked afresh for every turn, so
   a presentation that becomes available later (one loaded when idle) can take
   over from the next turn on, and a window that is resized into or out of the
   worn scene (scene/gate.ts) gets the turn that fits it.

   - Reduced motion: the fade. On a qualifying desktop it fades straight into
     the held close-up, which the back slot holds (HeldView.astro).
   - A qualifying desktop: the held turn, into the held close-up.
   - Everyone else (phones, touch screens, short windows): the CSS turn. */

import { wornDesktopQuery } from '../../scene/gate';
import { createCssTurn } from './css-turn';
import { createFade } from './fade';
import type { BadgeFaces } from './faces';
import { createHeldTurn, type HeldStage } from './held-turn';
import type { TurnPresentation } from './presentation';

export function createPresentationChooser(
  faces: BadgeFaces,
  { reducedMotion, held }: { reducedMotion: boolean; held: HeldStage | null },
): () => TurnPresentation {
  const cssTurn = createCssTurn(faces);
  const fade = createFade(faces);
  const heldTurn = held && createHeldTurn(faces, held);
  const wornDesktop = wornDesktopQuery();
  return () => {
    if (reducedMotion || typeof faces.badge.animate !== 'function') return fade;
    return heldTurn && wornDesktop.matches ? heldTurn : cssTurn;
  };
}
