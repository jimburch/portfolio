// The hand, loaded in node (no WebGL) with the page's own pose code, for the bake and the checks: pose it for t
// (solving the contacts, or with given curls) on the page's own path, and count skin triangles through the card.
//
// The page's path: v10's badge with its lift scaled to end at the held zoom (hand-turn-motion.ts does
// badgeAt(t, liftForZoom(zoom))) and trimmed (timeline.ts). The camera's push and pull-back are 2D moves of the
// whole view, so they don't change where the hand is on the card; the lift does (the forearm aims at an elbow
// fixed in the world).
import { createHandScene, placeBadge } from '../../src/scene/hand/hand-scene.ts';
import { createLook } from '../../src/scene/hand/look.ts';
import { createHandPoser } from '../../src/scene/hand/pose.ts';
import { cardCrossings, parseHandModel, rigHand, type DigitCurls } from '../../src/scene/hand/rig.ts';
import { badgeAt, liftForZoom } from '../../src/scene/hand/timeline.ts';

/**
 * The held zoom (`--held-zoom`, worn-scene.css): the held badge is the worn one × this at every qualifying window
 * size, 1440×900 and 800×620 included, so the page's lift ends at the same place at both.
 */
export const HELD_ZOOM = 1.18;

/** `zoom`: the held zoom the page's lift is scaled to end at. */
export async function loadHandForChecks(glb: Buffer, zoom = HELD_ZOOM) {
  const hs = createHandScene();
  const ab = glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength) as ArrayBuffer;
  const rig = rigHand(await parseHandModel(ab), hs.handPlace, createLook());
  const poser = createHandPoser(rig, hs.handPlace, hs.badgeFrame);
  const liftEnd = liftForZoom(zoom);
  const at = (t: number) => placeBadge(hs.badgeFrame, badgeAt(t, liftEnd));
  return {
    hs,
    rig,
    poseSolved(t: number) {
      at(t);
      return poser.pose(t, 'solve').curls;
    },
    pose(t: number, curls: DigitCurls) {
      at(t);
      return poser.pose(t, curls);
    },
    crossings: () => cardCrossings(rig, hs.badgeFrame),
  };
}

export type CheckHand = Awaited<ReturnType<typeof loadHandForChecks>>;

/** Crossings over `samples` evenly spaced t, the hand posed with `curlsAt(t)`. */
export function sweepCrossings(hand: CheckHand, samples: number, curlsAt: (t: number) => DigitCurls) {
  let total = 0;
  const worst: Array<{ t: number; cross: object }> = [];
  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1);
    hand.pose(t, curlsAt(t));
    const c = hand.crossings();
    const n = Object.values(c).reduce((a, b) => a + (b ?? 0), 0);
    if (n) {
      total += n;
      if (worst.length < 10) worst.push({ t: +t.toFixed(4), cross: c });
    }
  }
  return { samples, total, worst };
}
