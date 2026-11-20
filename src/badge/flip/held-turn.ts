/* The held turn, on a qualifying desktop (scene/gate.ts): the badge turns
   over where it hangs on the wearer, and the scene's camera pushes in, the
   blur growing, until the badge is held up in the held close-up: the same one
   a direct load of the back page shows (HeldView.astro, which the back slot
   holds ahead of the lifted face). HOME and Back run it backwards, from
   wherever it is. It is the hand turn's stand-in (hand-turn.ts) until the
   3D hand has loaded, and wherever it can't.

   The motion is held-turn-motion.ts (one time value → one frame); the
   stage it plays on, which also runs it, is held-stage.ts. While the badge
   turns, the back slot is clipped to the badge; once it faces the visitor
   the held view's own scene, pushed in by the same camera, frames it as on
   a direct load, and the resting hand comes in. Once it settles nothing is left transformed,
   so the back is laid out at its real on-screen size and its text is crisp.

   Held, the back's links to other back pages swap the page in the window
   (back-swap.ts, the controller's); the badge stays held and the hand stays
   put. */

import type { BadgeFaces } from './faces';
import { createHeldStage, type HeldStage, type StageFrame } from './held-stage';
import { faceTransform, frameAt, type TurnFrame } from './held-turn-motion';
import type { TurnPresentation } from './presentation';

/** The whole motion, one way. */
const TURN_MS = 1100;

/**
 * How far inside its edge the back slot is clipped, in px, at a scale: 2px
 * while it is scaled down (its edge is on screen), easing to none as it
 * comes to fill the window.
 */
const slotInset = (scale: number) => Math.min(2, Math.max(0, (1 - scale) * 400));

function stageFrameOf({ camera, contact, front, back, pose }: TurnFrame): StageFrame {
  return {
    scene: { camera, blur: camera.blur, contact },
    heldBlur: camera.blur,
    front: { transform: faceTransform(front), shown: front.shown },
    back: { transform: faceTransform(back), shown: back.shown },
    turning: pose.turn < 1,
    inset: slotInset(back.scale),
    grip: pose.grip,
  };
}

export function createHeldTurn(faces: BadgeFaces, held: HeldStage): TurnPresentation {
  const stage = createHeldStage(faces, held);
  return {
    run: (to) =>
      stage.play(to, {
        flipping: 'held-turn',
        ms: TURN_MS,
        frameAt: (t, framing) => stageFrameOf(frameAt(t, framing)),
      }),
  };
}
