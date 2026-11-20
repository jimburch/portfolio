/* The hand turn, on a qualifying desktop (scene/gate.ts), once the 3D hand
   has loaded: v10's motion, which Jim locked. The wearer's hand reaches up
   from below the frame, grips the badge like a phone (four fingertips over
   the left edge, the thumb on the face), turns it over and lifts it while
   the camera pushes in, until it is held up in the held close-up: the same
   one a direct load of the back page shows. HOME and Back run it
   backwards, from wherever it is.

   One time value per frame (turn-clock.ts) drives it all: hand-turn-motion.ts
   turns t into one badge placement for the DOM faces, the page scene's
   camera and the 3D hand's camera, and the hand's pose comes from the same
   t, so hand and badge stay locked. The stage is the held turn's
   (held-stage.ts, which also runs the turn), with the back slot clipped to
   the badge the whole way; the hand is two canvases split at the card's plane (scene/hand/hand-view.ts),
   placed behind and in front of the badge while it turns. Once it settles
   the canvases go and the resting hand's static images (HeldView.astro), the
   same pose, take over; turning back, the canvases take over from them.

   This module, three.js and the model are loaded in the background
   (hand-turn-loader.ts); until then, or if they can't load, the held turn
   runs instead. Held, swapping one back page for another is the
   controller's (back-swap.ts). */

import { createHandView, type HandView } from '../../scene/hand/hand-view';
import { HAND_TURN_MS } from '../../scene/hand/timeline';
import modelUrl from '../../scene/hand/hand.glb?url';
import type { BadgeFaces } from './faces';
import { createHeldStage, type HeldStage, type StageFrame } from './held-stage';
import { handFrameAt, type HandTurnFrame } from './hand-turn-motion';
import type { TurnPresentation } from './presentation';

export interface HandTurn extends TurnPresentation {
  /** False once the hand can't be drawn any more (the WebGL context lost): use another presentation. */
  usable(): boolean;
}

/** The whole turn happens on the badge itself: the held view's own scene, hand and shadow wait for it to land. */
const stageFrameOf = ({ scene, front, back }: HandTurnFrame): StageFrame => ({
  scene,
  heldBlur: scene.blur,
  front,
  back,
  turning: true,
  inset: 0,
  grip: 0,
});

export function createHandTurn(faces: BadgeFaces, held: HeldStage, hand: HandView): HandTurn {
  const stage = createHeldStage(faces, held);
  return {
    run: (to) =>
      stage.play(to, {
        flipping: 'hand-turn',
        ms: HAND_TURN_MS,
        frameAt(t, framing) {
          const frame = handFrameAt(t, framing);
          hand.draw(frame);
          return stageFrameOf(frame);
        },
        // Behind the badge's faces and in front of them, over the page's scene, only while it turns.
        enter() {
          faces.badge.before(hand.behind);
          faces.badge.after(hand.front);
        },
        leave() {
          hand.behind.remove();
          hand.front.remove();
        },
      }),
    usable: hand.usable,
  };
}

/** Fetches the model and readies the hand to draw; rejects if it can't (no WebGL, the model failing to load). */
export async function loadHandTurn(faces: BadgeFaces, stage: HeldStage): Promise<HandTurn> {
  const res = await fetch(modelUrl);
  if (!res.ok) throw new Error(`hand model: HTTP ${res.status}`);
  return createHandTurn(faces, stage, await createHandView(await res.arrayBuffer()));
}
