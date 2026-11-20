/* The hand's 3D scene, as in the v10 spike: the eye, the lamp, the fog the
   sleeve recedes into, and the badge's frame the hand is placed in. Shared
   by the hand turn's canvases and the resting-hand images (scripts/hand),
   so both draw the same thing.

   World units are spike px (timeline.ts). three.js frame: origin at the
   badge's resting centre, x right, y UP, z toward the eye. The badge's own
   matrix is v10's CSS composition (y down) conjugated into this frame, so
   the DOM badge and the 3D badge are placed by the same numbers. */

import * as THREE from 'three';
import { CARD, EYE_DISTANCE, magnificationAt, type BadgeState } from './timeline.ts';

const D = Math.PI / 180;

/** The hand's soft shadow on the card's face: the near side of the hand, blacked out, blurred, offset, 30% opaque. */
export const HAND_SHADOW = {
  /** Blur (σ), world units. */
  blur: 5,
  /** Offset at the badge's resting depth, world units (it grows with the lift). */
  dx: 6,
  dy: 12,
  opacity: 0.3,
} as const;

/**
 * Paints the hand's soft shadow from `nearSide` (the near-side render) onto `ctx`, inside whatever clip `ctx` has:
 * black at the shadow's opacity, offset (dx, dy) and blurred by σ = `blur`, all in `ctx` px. Done with the canvas's
 * own shadow (every engine has it; WebKit ignores a canvas `filter`): the image is drawn off the canvas and only its
 * shadow lands, offset back on.
 */
export function paintHandShadow(
  ctx: CanvasRenderingContext2D,
  nearSide: CanvasImageSource & { width: number },
  { dx, dy, blur }: { dx: number; dy: number; blur: number },
): void {
  const away = ctx.canvas.width + nearSide.width + 4 * blur + 100;
  ctx.save();
  ctx.shadowColor = `rgba(0, 0, 0, ${HAND_SHADOW.opacity})`;
  ctx.shadowBlur = 2 * blur; // the canvas's shadow blur is twice its σ
  ctx.shadowOffsetX = dx + away;
  ctx.shadowOffsetY = dy;
  ctx.drawImage(nearSide, -away, 0);
  ctx.restore();
}

/** The badge's corner radius, a share of its width (as the DOM badge's 4.5cqw). */
export const BADGE_RADIUS = 0.045;

export interface HandScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  /** Carries the badge's matrix; the hand lives under it, in badge-local units. */
  badgeFrame: THREE.Object3D;
  /** The wrist joint's place in the badge's frame. */
  handPlace: THREE.Object3D;
}

export function createHandScene(): HandScene {
  const scene = new THREE.Scene();
  // Key light from the warm lamp at the upper left of the room, a little in front of the wearer.
  const sun = new THREE.DirectionalLight(0xffffff, Math.PI);
  sun.position.set(-0.55, 0.75, 0.62).multiplyScalar(1000);
  scene.add(sun);
  // The sleeve recedes toward the wearer's body: fog (view depth) toward the jacket.
  scene.fog = new THREE.Fog(0x1d232d, EYE_DISTANCE - 100, EYE_DISTANCE + 1500);

  const camera = new THREE.PerspectiveCamera();
  camera.position.set(0, 0, EYE_DISTANCE);
  camera.near = 10;
  camera.far = 6000;
  camera.updateMatrixWorld(true);

  const badgeFrame = new THREE.Object3D();
  badgeFrame.matrixAutoUpdate = false;
  scene.add(badgeFrame);
  const handPlace = new THREE.Object3D();
  badgeFrame.add(handPlace);
  return { scene, camera, badgeFrame, handPlace };
}

const FLIP_Y = new THREE.Matrix4().makeScale(1, -1, 1);
const _r = new THREE.Matrix4();

/** The badge's matrix in v10's CSS composition (y down): move, then roll, then the turn about its long axis. */
export function badgeMatrixCss(b: BadgeState, out = new THREE.Matrix4()): THREE.Matrix4 {
  const k0 = magnificationAt(b.tz);
  out.makeTranslation(b.tx / k0, b.ty / k0, b.tz);
  out.multiply(_r.makeRotationZ(b.roll * D)).multiply(_r.makeRotationY(b.th * D));
  return out;
}

/** Places the badge's frame (and the hand in it) for `b`. */
export function placeBadge(badgeFrame: THREE.Object3D, b: BadgeState): void {
  badgeFrame.matrix.copy(FLIP_Y).multiply(badgeMatrixCss(b)).multiply(FLIP_Y);
  badgeFrame.updateMatrixWorld(true);
}

/** A region of the screen (or an image), in px, and where the eye is over it. */
export interface ViewRegion {
  left: number;
  top: number;
  width: number;
  height: number;
  /** The point the eye looks straight at (the badge's resting centre), px, same space as left/top. */
  eyeX: number;
  eyeY: number;
  /** px per world unit on the badge's resting plane. */
  pxPerUnit: number;
}

/**
 * Frames `camera` so it draws `region`: a world point (x, y) on the badge's resting plane lands at
 * (eyeX + x · pxPerUnit, eyeY − y · pxPerUnit). An off-axis frustum, so the eye can sit anywhere over the region.
 */
export function frameCamera(camera: THREE.PerspectiveCamera, r: ViewRegion): void {
  const k = camera.near / EYE_DISTANCE / r.pxPerUnit;
  const left = (r.left - r.eyeX) * k;
  const right = (r.left + r.width - r.eyeX) * k;
  const top = (r.eyeY - r.top) * k;
  const bottom = (r.eyeY - r.top - r.height) * k;
  camera.projectionMatrix.makePerspective(left, right, top, bottom, camera.near, camera.far);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}

const _n = new THREE.Vector3();
const _c = new THREE.Vector3();
const _e = new THREE.Vector3();

/** The card's mid-plane, its normal toward the eye: what is in front of it is the hand's near side. */
export function nearPlane(hs: HandScene, out = new THREE.Plane()): THREE.Plane {
  _n.set(0, 0, 1).transformDirection(hs.badgeFrame.matrixWorld);
  _c.setFromMatrixPosition(hs.badgeFrame.matrixWorld);
  const side = _n.dot(_e.copy(hs.camera.position).sub(_c)) >= 0 ? 1 : -1;
  return out.setFromNormalAndCoplanarPoint(_n.multiplyScalar(side), _c);
}

/**
 * The badge's outline (rounded corners) on its mid-plane, projected: points in px of `region`. The hand's shadow
 * falls only inside it.
 */
export function badgeOutline(hs: HandScene, r: ViewRegion, perCorner = 6): Array<{ x: number; y: number }> {
  const w = CARD.BW2;
  const h = CARD.BH2;
  const rad = BADGE_RADIUS * 2 * w;
  const pts: Array<[number, number]> = [];
  const corners: Array<[number, number, number]> = [
    [w - rad, h - rad, 0],
    [-w + rad, h - rad, 90],
    [-w + rad, -h + rad, 180],
    [w - rad, -h + rad, 270],
  ];
  for (const [cx, cy, a0] of corners)
    for (let i = 0; i <= perCorner; i++) {
      const a = (a0 + (90 * i) / perCorner) * D;
      pts.push([cx + rad * Math.cos(a), cy + rad * Math.sin(a)]);
    }
  const v = new THREE.Vector3();
  return pts.map(([x, y]) => {
    v.set(x, y, 0).applyMatrix4(hs.badgeFrame.matrixWorld).project(hs.camera);
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
  });
}
