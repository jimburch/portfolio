/* The CSS 3D turn: both faces back to back while the badge rotates 180° and
   grows or shrinks between the two sides' on-screen boxes (FLIP), e.g. from
   the phone-sized badge to the reading column on desktop. Styles live under
   "The flip" in badge-front.css. From one back page to another the badge
   doesn't turn: the page crossfades in place (back-swap.ts). */

import { crossfadeBack } from './back-swap';
import { oppositeSide, type BadgeFaces, type Side } from './faces';
import type { RunningTurn, TurnPresentation } from './presentation';

const TURN_MS = 600;
const TURN_EASING = 'cubic-bezier(.2,.7,.2,1)';
const PERSPECTIVE_PX = 1400;

/** The on-screen part of the badge: its size and where its top sits. */
interface Box {
  width: number;
  height: number;
  marginTop: number;
}

function frame(box: Box, deg: number): Keyframe {
  return {
    transform: `perspective(${PERSPECTIVE_PX}px) rotateY(${deg}deg)`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    marginTop: `${box.marginTop}px`,
  };
}

const SWAP_OUT: Keyframe[] = [{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }];
const SWAP_IN: Keyframe[] = [{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1, offset: 0.5 }, { opacity: 1 }];

export function createCssTurn(faces: BadgeFaces): TurnPresentation {
  const { badge, front, backSlot } = faces;

  /** Measures the on-screen badge box for the side it is laid out as. */
  function visibleBox(): Box {
    const badgeRect = badge.getBoundingClientRect();
    const face = faces.laidOutAs() === 'back' ? faces.backFace() : null;
    const rect = face ? face.getBoundingClientRect() : badgeRect;
    return {
      width: rect.width,
      height: Math.min(rect.height, window.innerHeight - rect.top),
      marginTop: parseFloat(getComputedStyle(badge).marginTop) + rect.top - badgeRect.top,
    };
  }

  function run(to: Side): RunningTurn {
    // Measure both ends (FLIP), then turn from one to the other.
    const origin = oppositeSide(to);
    const from = visibleBox();
    faces.layOut(to);
    const target = visibleBox();
    faces.layOut(origin);

    badge.dataset.flipping = 'turn';
    front.hidden = false;
    backSlot.hidden = false;
    const [fromDeg, toDeg] = to === 'back' ? [0, 180] : [180, 0];
    const [leaving, arriving] = to === 'back' ? [front, backSlot] : [backSlot, front];
    // 'both' so a turn reversed back to its start still holds its first frame.
    const timing: KeyframeAnimationOptions = { duration: TURN_MS, easing: TURN_EASING, fill: 'both' };
    const animations = [
      badge.animate([frame(from, fromDeg), frame(target, toDeg)], timing),
      // Swap faces exactly edge-on (offsets are in eased progress, like the
      // rotation), so the turn never relies on backface-visibility alone.
      leaving.animate(SWAP_OUT, timing),
      arriving.animate(SWAP_IN, timing),
    ];

    let heading: Side = to;
    let done = false;
    const settled = Promise.all(animations.map((a) => a.finished))
      .catch(() => {})
      .then(() => {
        done = true;
        delete badge.dataset.flipping;
        faces.layOut(heading);
        for (const a of animations) a.cancel();
        return heading;
      });

    return {
      settled,
      steer(side) {
        if (done || side === heading) return;
        heading = side;
        for (const a of animations) a.reverse();
      },
    };
  }

  return { run, swapBack: (content) => crossfadeBack(faces, content) };
}
