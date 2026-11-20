/* The held turn's motion as a pure function of one time value, t in [0, 1]:
   t = 0 is the front hanging at rest on the wearer, t = 1 the held close-up.
   Going back runs t backwards, so a turn reversed midway (Back mid-turn)
   retraces exactly the path it came by.

   Two overlapping moves:
   - the turn: the badge turns over where it hangs (t 0 → 0.5);
   - the push: the scene's camera pushes in, the blur growing, until the badge
     is held up nearly filling the window (t 0.25 → 1). The resting hand and
     the held badge's shadow come in as it arrives (the grip).
   The push starts exactly as the badge goes edge-on, so each side is only
   ever shown at the size it is laid out at or smaller: the front is laid out
   where it hangs and never moves while it shows; the back is laid out at its
   held size and is scaled down on the way, never up. Its text is crisp once
   it settles.

   poseAt(t) is the choreography; frameAt(t, framing) puts it on screen as
   plain numbers: the scene's camera, and where each face sits. It is the held
   turn's own (held-turn.ts). The hand turn has its own motion
   (hand-turn-motion.ts: v10's) on the same stage, and the held turn stands in
   for it until the 3D hand has loaded. */

import { centre, clamp01 } from '../../scene/geometry';
import type { HeldFraming } from './held-stage';

export interface TurnPose {
  /** How far over the badge has turned: 0 front up, 1 back up (180°). */
  turn: number;
  /** How far the camera has pushed in: 0 at rest, 1 the held close-up. */
  push: number;
  /** How far the hand has the badge held up: the resting hand and the held badge's shadow show this much. */
  grip: number;
}

/** The turn takes the first half of the motion. */
const TURN_END = 0.5;
/** The push starts as the badge goes edge-on: halfway through the (symmetrically eased) turn. */
const PUSH_START = TURN_END / 2;
/** The resting hand comes in quickly at the very end, as the camera settles. */
const GRIP_START = 0.8;

/** Cubic ease-in-out: still at both ends, symmetric about its midpoint (0.5 → 0.5). */
const easeInOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);

/** Eased progress of a move that runs from `start` to `end` of t. */
const between = (t: number, start: number, end: number) => easeInOut(clamp01((t - start) / (end - start)));

export function poseAt(t: number): TurnPose {
  return {
    turn: between(t, 0, TURN_END),
    push: between(t, PUSH_START, 1),
    grip: between(t, GRIP_START, 1),
  };
}

/**
 * Where a face sits: its CSS transform, about its transform origin, in the
 * order translate(x, y) scale() perspective() rotateY(). The front's origin
 * is its own centre (its box is the worn badge); the back's is the held
 * badge's centre (its box is the window, laid out as the held close-up).
 */
export interface FacePlacement {
  x: number;
  y: number;
  scale: number;
  /** px, in the face's own layout units. */
  perspective: number;
  /** Degrees. */
  rotateY: number;
  /** Whether this face is the one turned toward the visitor. */
  shown: boolean;
}

export interface TurnFrame {
  pose: TurnPose;
  /** The scene's camera: translate (px) after a scale about the worn badge's centre, and the extra blur. */
  camera: { x: number; y: number; scale: number; blur: number };
  /** How much the badge rests on the chest (the scene's contact shadow). */
  contact: number;
  front: FacePlacement;
  back: FacePlacement;
}

/** Perspective distance, in badge heights: as deep as the plain CSS turn's. */
const PERSPECTIVE_PER_HEIGHT = 2;

/**
 * The frame at time t. The camera is a zoom by `scale` about the worn badge's
 * centre, then a move by (x, y): at push 0 none, at push 1 the held close-up's
 * camera (worn box → held box). The badge is in the scene, so it moves with
 * the camera, turned by the pose.
 */
export function frameAt(t: number, { worn, held, heldBlur }: HeldFraming): TurnFrame {
  const pose = poseAt(t);
  const { turn, push } = pose;
  const zoom = held.height / worn.height;
  const from = centre(worn);
  const to = centre(held);
  const scale = 1 + push * (zoom - 1);
  const x = push * (to.x - from.x);
  const y = push * (to.y - from.y);
  const perspective = PERSPECTIVE_PER_HEIGHT * worn.height;
  const degrees = 180 * turn;
  const backUp = turn >= 0.5;

  return {
    pose,
    camera: { x, y, scale, blur: push * heldBlur },
    contact: 1 - turn,
    front: { x, y, scale, perspective, rotateY: degrees, shown: !backUp },
    // Laid out held: undo the held camera, then apply this one.
    back: {
      x: x - (to.x - from.x),
      y: y - (to.y - from.y),
      scale: scale / zoom,
      perspective: perspective * zoom,
      rotateY: degrees - 180,
      shown: backUp,
    },
  };
}

export const faceTransform = ({ x, y, scale, perspective, rotateY }: FacePlacement): string =>
  `translate(${x.toFixed(3)}px, ${y.toFixed(3)}px) scale(${scale.toFixed(5)}) ` +
  `perspective(${perspective.toFixed(1)}px) rotateY(${rotateY.toFixed(3)}deg)`;
