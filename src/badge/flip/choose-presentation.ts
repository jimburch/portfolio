/* Which turn presentation shows the next turn. Asked afresh for every turn, so
   a presentation that becomes available later (the hand turn, loaded when
   idle) takes over from the next turn on, and a window that is resized into
   or out of the worn scene (scene/gate.ts) gets the turn that fits it.

   - Reduced motion: the fade. On a qualifying desktop it fades straight into
     the held close-up, which the back slot holds (HeldView.astro).
   - A qualifying desktop: the hand turn once it has loaded, else the held
     turn, both into the held close-up.
   - Everyone else (phones, touch screens, short windows): the CSS turn. */

import { wornDesktopQuery } from '../../scene/gate';
import { createCssTurn } from './css-turn';
import { createFade } from './fade';
import type { BadgeFaces } from './faces';
import type { HeldStage } from './held-stage';
import { createHeldTurn } from './held-turn';
import type { TurnPresentation } from './presentation';

export function createPresentationChooser(
  faces: BadgeFaces,
  {
    reducedMotion,
    held,
    handTurn = () => null,
  }: {
    reducedMotion: boolean;
    held: HeldStage | null;
    /** The hand turn, if it has loaded and can draw. */
    handTurn?: () => TurnPresentation | null;
  },
): () => TurnPresentation {
  const cssTurn = createCssTurn(faces);
  const fade = createFade(faces);
  const heldTurn = held && createHeldTurn(faces, held);
  const wornDesktop = wornDesktopQuery();
  return () => {
    if (reducedMotion || typeof faces.badge.animate !== 'function') return fade;
    if (!heldTurn || !wornDesktop.matches) return cssTurn;
    return handTurn() ?? heldTurn;
  };
}
