// The hand, loaded in node (no WebGL) with the page's own pose code, for the bake and the checks: pose it for t
// (solving the contacts, or with given curls) and count skin triangles through the card.
import { createHandScene, placeBadge } from '../../src/scene/hand/hand-scene.ts';
import { createLook } from '../../src/scene/hand/look.ts';
import { createHandPoser } from '../../src/scene/hand/pose.ts';
import { cardCrossings, parseHandModel, rigHand, type DigitCurls } from '../../src/scene/hand/rig.ts';
import { badgeAt } from '../../src/scene/hand/timeline.ts';

export async function loadHandForChecks(glb: Buffer) {
  const hs = createHandScene();
  const ab = glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength) as ArrayBuffer;
  const rig = rigHand(await parseHandModel(ab), hs.handPlace, createLook());
  const poser = createHandPoser(rig, hs.handPlace, hs.badgeFrame);
  const at = (t: number) => placeBadge(hs.badgeFrame, badgeAt(t));
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
