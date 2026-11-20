/* The held turn, on a qualifying desktop (scene/gate.ts): the badge turns
   over where it hangs on the wearer, and the scene's camera pushes in, the
   blur growing, until the badge is held up in the held close-up: the same one
   a direct load of the back page shows (HeldView.astro, which the back slot
   holds ahead of the lifted face). HOME and Back run it backwards, from
   wherever it is.

   The motion is held-turn-motion.ts (one time value → one frame). This
   module measures its two ends on the page, runs the time value on animation
   frames and puts each frame on the page:
   - the page's own scene (#worn-scene) takes the camera;
   - the front face turns in its box where it hangs;
   - the back slot, laid out as the held close-up over the whole window
     (badge-front.css, "The held turn"), turns and scales as one piece. While
     it turns it is clipped to the badge; once it faces the visitor the held
     view's own scene, pushed in by the same camera, frames it as on a direct
     load, and the resting hand comes in.
   Once it settles nothing is left transformed, so the back is laid out at its
   real on-screen size and its text is crisp. */

import { frameScene, releaseScene } from '../../scene/camera';
import type { BadgeFaces, Side } from './faces';
import { faceTransform, frameAt, type HeldFraming, type ScreenBox, type TurnFrame } from './held-turn-motion';
import type { RunningTurn, TurnPresentation } from './presentation';

/** The whole motion, one way. */
const TURN_MS = 1100;

/** The held close-up the back lands in: the held view in the back slot. */
export interface HeldStage {
  /** The page's own scene, the badge worn at rest (#worn-scene). */
  scene: HTMLElement;
  /** The held view ahead of the back face in the back slot. */
  heldView: HTMLElement;
}

/**
 * How far inside its edge the back slot is clipped, in px, at a scale: 2px
 * while it is scaled down (its edge is on screen), easing to none as it
 * comes to fill the window.
 */
const slotInset = (scale: number) => Math.min(2, Math.max(0, (1 - scale) * 400));

const boxOf = (el: Element): ScreenBox => {
  const { x, y, width, height } = el.getBoundingClientRect();
  return { x, y, width, height };
};

export function createHeldTurn(faces: BadgeFaces, { scene, heldView }: HeldStage): TurnPresentation {
  const { badge, front, backSlot } = faces;
  const heldScene = heldView.querySelector<HTMLElement>('.worn-scene')!;
  const heldBadge = heldView.querySelector<HTMLElement>('.held-view__badge')!;

  /** The two ends, with both faces laid out for the turn and nothing transformed. */
  function measure(): HeldFraming {
    return {
      worn: boxOf(front),
      held: boxOf(heldBadge),
      heldBlur: parseFloat(getComputedStyle(heldScene).getPropertyValue('--scene-blur')) || 0,
    };
  }

  function show({ camera, contact, front: f, back: b, pose }: TurnFrame) {
    frameScene(scene, { camera, blur: camera.blur, contact });
    // The face turned away is see-through, not hidden: hiding the front would
    // take focus off the control that started the turn.
    front.style.transform = faceTransform(f);
    front.style.opacity = f.shown ? '' : '0';
    backSlot.style.transform = faceTransform(b);
    backSlot.style.opacity = b.shown ? '' : '0';
    backSlot.toggleAttribute('data-turning', pose.turn < 1);
    backSlot.style.setProperty('--held-turn-inset', `${slotInset(b.scale).toFixed(2)}px`);
    // Seen through the back slot the held scene is pushed in only as far as
    // the page's: blurred as much, so the two meet without a seam.
    frameScene(heldScene, { blur: camera.blur });
    heldView.style.setProperty('--held-grip', pose.grip.toFixed(4));
  }

  function release() {
    releaseScene(scene);
    releaseScene(heldScene);
    heldView.style.removeProperty('--held-grip');
    backSlot.style.removeProperty('--held-turn-inset');
    for (const el of [front, backSlot]) {
      for (const name of ['transform', 'opacity']) el.style.removeProperty(name);
    }
    backSlot.removeAttribute('data-turning');
  }

  function run(to: Side): RunningTurn {
    release();
    badge.dataset.flipping = 'held-turn';
    front.hidden = false;
    backSlot.hidden = false;
    const framing = measure();

    // t: 0 the front at rest, 1 the back held up.
    let t = to === 'back' ? 0 : 1;
    let heading: Side = to;
    let done = false;
    show(frameAt(t, framing));

    const settled = new Promise<Side>((resolve) => {
      function land() {
        done = true;
        release();
        faces.layOut(heading);
        delete badge.dataset.flipping;
        resolve(heading);
      }

      let last: number | null = null;
      function tick(now: number) {
        try {
          const goal = heading === 'back' ? 1 : 0;
          if (last !== null) {
            const step = (now - last) / TURN_MS;
            t = goal > t ? Math.min(goal, t + step) : Math.max(goal, t - step);
          }
          last = now;
          if (t === goal) return land();
          show(frameAt(t, framing));
          requestAnimationFrame(tick);
        } catch {
          // Never leave the badge half-turned: land where it was heading.
          land();
        }
      }
      requestAnimationFrame(tick);
    });

    return {
      settled,
      steer(side) {
        if (!done) heading = side;
      },
    };
  }

  return { run };
}
