/* The hand turn's motion as a pure function of one time value t in [0, 1]:
   v10's choreography (scene/hand/timeline.ts) put on this page's framing.
   t = 0 is the front hanging at rest on the wearer, t = 1 the held
   close-up; going back runs t backwards.

   One badge state per t (v10's one matrix: lift toward the eye, screen
   offsets, roll, turn) places everything:
   - the DOM faces, each projected about the eye as v10's CSS did;
   - the 3D hand's camera and badge (the canvases, scene/hand/hand-view.ts):
     the same eye, the same perspective, the same matrix;
   - the page scene's camera.

   Re-tuned for this page's framing, not re-choreographed:
   - World units are v10's, the badge 500 tall: one unit is the worn badge's
     height / 500 on screen, and the eye sits 1400 units in front of the
     worn badge's centre, as in v10.
   - The lift is scaled so it ends with the badge exactly the held
     close-up's size (v10's lift ends at 1.184 ×; the held zoom is 1.18).
   - The camera pushes in with the lift: the scene zooms as the badge grows
     and follows its screen offsets, and the eye moves (a 2D shift of the
     whole view) from the worn badge's centre so the badge lands on the held
     badge. So the wearer, the lanyard's clip and the badge stay together,
     and the scene arrives at the held close-up's own camera. */

import {
  badgeAt,
  EYE_DISTANCE,
  liftAt,
  liftForZoom,
  magnificationAt,
  type BadgeState,
} from '../../scene/hand/timeline';
import type { FaceView } from './held-stage';
import type { HeldFraming } from './held-turn-motion';

export interface HandTurnFrame {
  t: number;
  /** The badge, in world units (the lift re-scaled for the held zoom). */
  badge: BadgeState;
  /** Where the eye looks (viewport px): the badge's resting centre moved with the camera. And px per world unit. */
  eye: { x: number; y: number };
  pxPerUnit: number;
  scene: {
    /** translate (px) after a zoom about the worn badge's centre. */
    camera: { x: number; y: number; scale: number };
    blur: number;
    contact: number;
    /** How much of the lifted badge's drop shadow shows. */
    lift: number;
    roll: number;
  };
  front: FaceView;
  back: FaceView;
}

const centre = (b: { x: number; y: number; width: number; height: number }) => ({
  x: b.x + b.width / 2,
  y: b.y + b.height / 2,
});

const px = (n: number) => `${n.toFixed(3)}px`;

export function handFrameAt(t: number, { worn, held, heldBlur }: HeldFraming): HandTurnFrame {
  const u = worn.height / 500;
  const zoom = held.height / worn.height;
  const liftEnd = liftForZoom(zoom);
  const c0 = centre(worn);
  const c1 = centre(held);

  const b = badgeAt(t, liftEnd);
  const k0 = magnificationAt(b.tz);
  // How far the camera has pushed in: 0 at rest, 1 held (it follows the lift, so it overshoots with it).
  const push = zoom > 1 ? (k0 - 1) / (zoom - 1) : liftAt(t);
  // The eye moves so the badge lands on the held badge: by then it is shifted by its own last screen offset too.
  const end = badgeAt(1, liftEnd);
  const shiftX = ((c1.x - c0.x) / u - end.tx) * push;
  const shiftY = ((c1.y - c0.y) / u - end.ty) * push;
  const eye = { x: c0.x + shiftX * u, y: c0.y + shiftY * u };

  // v10's badge matrix in px about the eye, `perspective(P) translate3d(tx/k0, ty/k0, tz) rotate rotateY`, written
  // without the translateZ: lifted by tz, the badge is magnified k0 = P / (P - tz) and seen from P - tz, so
  // `scale(k0) perspective(P - tz) translate(tx/k0, ty/k0)` is the same projection, point for point. (Headless
  // WebKit draws a translateZ under perspective() unmagnified, though it measures it right.)
  const place =
    `scale(${k0.toFixed(6)}) perspective(${px((EYE_DISTANCE - b.tz) * u)}) ` +
    `translate(${px((b.tx / k0) * u)}, ${px((b.ty / k0) * u)}) ` +
    `rotate(${b.roll.toFixed(3)}deg)`;
  const turn = (deg: number) => `rotateY(${deg.toFixed(3)}deg)`;

  // Which face the eye sees: the front's normal against the line from the badge's centre to the eye.
  const th = (b.th * Math.PI) / 180;
  const roll = (b.roll * Math.PI) / 180;
  const facing =
    -Math.sin(th) * (Math.cos(roll) * (b.tx / k0) + Math.sin(roll) * (b.ty / k0)) +
    Math.cos(th) * (EYE_DISTANCE - b.tz);
  const frontUp = facing >= 0;

  return {
    t,
    badge: b,
    eye,
    pxPerUnit: u,
    scene: {
      camera: { x: (shiftX + b.tx) * u, y: (shiftY + b.ty) * u, scale: k0 },
      blur: Math.max(0, push) * heldBlur,
      contact: Math.pow(1 - liftAt(t), 1.6),
      // The lifted badge's shadow: as far as it is lifted, and as wide as it is face on (thin edge-on).
      lift: liftAt(t) * Math.abs(Math.cos(th)),
      roll: b.roll,
    },
    // About the front's own centre, the worn badge's: the eye is there, moved by the shift.
    front: { transform: `translate(${px(shiftX * u)}, ${px(shiftY * u)}) ${place} ${turn(b.th)}`, shown: frontUp },
    // About the held badge's centre: moved to the eye, then the badge as the front, turned over and laid out held.
    back: {
      transform:
        `translate(${px(eye.x - c1.x)}, ${px(eye.y - c1.y)}) ${place} ${turn(b.th - 180)} ` +
        `scale(${(1 / zoom).toFixed(6)})`,
      shown: !frontUp,
    },
  };
}
