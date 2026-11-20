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
     close-up's size (v10's lift ends at 1.184 ×; the held zoom is 1.18), and
     trimmed so it never lifts past that (timeline.ts).
   - The camera pushes in with the lift: the scene zooms as the badge grows
     and follows its screen offsets, and the eye moves (a 2D shift of the
     whole view) from the worn badge's centre so the badge lands on the held
     badge. So the wearer, the lanyard's clip and the badge stay together,
     and the scene arrives at the held close-up's own camera.
   - The camera pulls back during the turn (Jim, 2026-11-20): at rest the
     badge fills more of the window than v10's did (77% against 63%), which
     would leave the hand's reach and grip below the window and the clip
     above it. So the whole view (scene, badge, eye) zooms out as the hand
     reaches, to v10's own framing (a window 800 units tall, the badge
     centred in it), and back in as the badge settles, on one smooth curve of
     the same t. The two ends are untouched. */

import { centre } from '../../scene/geometry';
import {
  badgeAt,
  EYE_DISTANCE,
  liftAt,
  liftForZoom,
  magnificationAt,
  seg,
  smooth,
  type BadgeState,
} from '../../scene/hand/timeline';
import type { FaceView, HeldFraming } from './held-stage';

export interface HandTurnFrame {
  t: number;
  /** The badge, in world units (the lift re-scaled for the held zoom). */
  badge: BadgeState;
  /** Where the eye looks (viewport px): the badge's resting centre moved with the camera. And px per world unit. */
  eye: { x: number; y: number };
  pxPerUnit: number;
  /** How far the camera has pulled back: the whole view's scale, 1 at both ends. */
  pullBack: number;
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

/** v10's window, in world units: the frame the camera pulls back to. */
const V10_WINDOW_UNITS = 800;
/** The pull-back eases in as the hand reaches (done before its fist shows) and out as the badge settles. */
const PULL_IN: readonly [number, number] = [0, 0.12];
const PULL_OUT: readonly [number, number] = [0.6, 1];

/** How far the pull-back has gone at t, 0 to 1 (still at both ends). */
const pullAt = (t: number) => smooth(seg(t, ...PULL_IN)) * (1 - smooth(seg(t, ...PULL_OUT)));

const px = (n: number) => `${n.toFixed(3)}px`;

export function handFrameAt(t: number, { worn, held, heldBlur, view }: HeldFraming): HandTurnFrame {
  const u = worn.height / 500;
  const zoom = held.height / worn.height;
  const liftEnd = liftForZoom(zoom);
  const c0 = centre(worn);
  const c1 = centre(held);

  const b = badgeAt(t, liftEnd);
  const k0 = magnificationAt(b.tz);
  // How far the camera has pushed in: 0 at rest, 1 held (it follows the lift).
  const push = zoom > 1 ? (k0 - 1) / (zoom - 1) : liftAt(t);
  const pull = pullAt(t);
  // The eye moves so the badge lands on the held badge (by then shifted by its own last screen offset too). It
  // moves as the camera comes back in, so while it is pulled back the badge keeps v10's place in the frame.
  const end = badgeAt(1, liftEnd);
  const moved = push * (1 - pull);
  const pushed = {
    x: c0.x + ((c1.x - c0.x) / u - end.tx) * moved * u,
    y: c0.y + ((c1.y - c0.y) / u - end.ty) * moved * u,
  };

  // The pull-back: the whole view scaled by m about the point that puts the resting badge's centre in the middle
  // of the window at the deepest pull (where the window is v10's 800 units tall). None if the window is that tall
  // already.
  const deepest = Math.min(1, view.height / (V10_WINDOW_UNITS * u));
  const m = 1 - (1 - deepest) * pull;
  const about =
    deepest < 1
      ? {
          x: (view.width / 2 - deepest * c0.x) / (1 - deepest),
          y: (view.height / 2 - deepest * c0.y) / (1 - deepest),
        }
      : c0;
  const eye = { x: about.x + m * (pushed.x - about.x), y: about.y + m * (pushed.y - about.y) };

  // v10's badge matrix in px about the eye, `perspective(P) translate3d(tx/k0, ty/k0, tz) rotate rotateY`, written
  // without the translateZ: lifted by tz, the badge is magnified k0 = P / (P - tz) and seen from P - tz, so
  // `scale(k0) perspective(P - tz) translate(tx/k0, ty/k0)` is the same projection, point for point. (Playwright's
  // WebKit screenshots drop the perspective divide, so with the magnification in scale() they stay closer to what
  // WebKit actually paints; see the #32 report, "Fix round 1".) The pull-back scales it all about the eye.
  const place =
    `scale(${(m * k0).toFixed(6)}) perspective(${px((EYE_DISTANCE - b.tz) * u)}) ` +
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
    pxPerUnit: u * m,
    pullBack: m,
    scene: {
      // The scene moves with the badge: zoomed as it is, at its screen offset from the eye.
      camera: { x: eye.x - c0.x + m * b.tx * u, y: eye.y - c0.y + m * b.ty * u, scale: m * k0 },
      blur: Math.max(0, push) * heldBlur,
      contact: Math.pow(1 - liftAt(t), 1.6),
      // The lifted badge's shadow: as far as it is lifted, and as wide as it is face on (thin edge-on).
      lift: liftAt(t) * Math.abs(Math.cos(th)),
      roll: b.roll,
    },
    // About the front's own centre, the worn badge's: moved to the eye.
    front: { transform: `translate(${px(eye.x - c0.x)}, ${px(eye.y - c0.y)}) ${place} ${turn(b.th)}`, shown: frontUp },
    // About the held badge's centre: moved to the eye, then the badge as the front, turned over and laid out held.
    back: {
      transform:
        `translate(${px(eye.x - c1.x)}, ${px(eye.y - c1.y)}) ${place} ${turn(b.th - 180)} ` +
        `scale(${(1 / zoom).toFixed(6)})`,
      shown: !frontUp,
    },
  };
}

/**
 * Where a point on the badge's mid-plane lands on screen at this frame (viewport px): badge-local world units, x
 * right and y up as seen at rest. The projection the faces' transforms and the 3D camera both make.
 */
export function badgeToScreen({ badge: b, eye, pxPerUnit }: HandTurnFrame, x: number, y: number): { x: number; y: number } {
  const k0 = magnificationAt(b.tz);
  const th = (b.th * Math.PI) / 180;
  const r = (b.roll * Math.PI) / 180;
  // CSS frame (y down): rotateY, then the roll, then the screen offset; then the perspective from P - tz away.
  const ry = { x: x * Math.cos(th), y: -y, z: -x * Math.sin(th) };
  const rx = ry.x * Math.cos(r) - ry.y * Math.sin(r) + b.tx / k0;
  const rr = ry.x * Math.sin(r) + ry.y * Math.cos(r) + b.ty / k0;
  const d = EYE_DISTANCE - b.tz;
  const f = (k0 * d) / (d - ry.z);
  return { x: eye.x + pxPerUnit * f * rx, y: eye.y + pxPerUnit * f * rr };
}
