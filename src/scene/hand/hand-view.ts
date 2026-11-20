/* The hand turn's 3D hand on the page: two transparent canvases over the
   window, one behind the badge and one in front of it, split at the card's
   plane, as in v10. One WebGL renderer (off the page) draws the hand twice
   a frame and each drawing is copied onto its canvas:
   - behind: the whole hand and sleeve (the badge covers what is behind it,
     so beside the card both canvases draw the same pixels: no seam);
   - in front: the hand's soft shadow on the card's face, then what is on the
     eye's side of the card's plane (the fingertips over the edge, the thumb).
   The same scene, look, rig and pose as the resting-hand images
   (scripts/hand), so the turn's last frame is those images.

   The canvases are decorative: aria-hidden, never focusable, no pointer
   events (badge-front.css). Whoever shows them places them in the page. */

import * as THREE from 'three';
import { curlsAt } from './contacts.ts';
import {
  HAND_SHADOW,
  badgeOutline,
  createHandScene,
  frameCamera,
  nearPlane,
  paintHandShadow,
  placeBadge,
  type ViewRegion,
} from './hand-scene.ts';
import { createLook, scaleOutlines } from './look.ts';
import { createHandPoser } from './pose.ts';
import { parseHandModel, rigHand, type DigitCurls } from './rig.ts';
import { magnificationAt, type BadgeState } from './timeline.ts';

/** What the hand needs from a frame of the turn. */
export interface HandFrame {
  t: number;
  badge: BadgeState;
  /** Where the eye looks (viewport px) and px per world unit. */
  eye: { x: number; y: number };
  pxPerUnit: number;
}

export interface HandView {
  /** Under the badge. */
  readonly behind: HTMLCanvasElement;
  /** Over the badge. */
  readonly front: HTMLCanvasElement;
  /** Draws the hand for `frame`, sizing the canvases to the window first if it changed. */
  draw(frame: HandFrame): void;
  /** False once the WebGL context is gone: the hand can't be drawn any more. */
  usable(): boolean;
}

function layer(name: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.className = `hand-layer hand-layer--${name}`;
  // Hidden from assistive tech; a canvas without a tabindex never takes focus.
  c.setAttribute('aria-hidden', 'true');
  return c;
}

/**
 * Builds the hand from the model (a meshopt-compressed GLB) and readies it to draw: the WebGL context, the
 * shaders for both passes compiled, the canvases made. Rejects if any of that fails (no WebGL, say).
 */
export async function createHandView(glb: ArrayBuffer): Promise<HandView> {
  const hs = createHandScene();
  const look = createLook();
  const rig = rigHand(await parseHandModel(glb), hs.handPlace, look);
  const poser = createHandPoser(rig, hs.handPlace, hs.badgeFrame);

  const gl = document.createElement('canvas');
  // Throws where there is no WebGL.
  const renderer = new THREE.WebGLRenderer({ canvas: gl, alpha: true, antialias: true, premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  let lost = false;
  gl.addEventListener('webglcontextlost', () => {
    lost = true;
  });

  const behind = layer('behind');
  const front = layer('front');
  const behindCtx = behind.getContext('2d')!;
  const frontCtx = front.getContext('2d')!;
  const curls = {} as DigitCurls;
  const clipPlane = new THREE.Plane();

  let size = { width: 0, height: 0, ratio: 0 };
  function fit(width: number, height: number) {
    const ratio = window.devicePixelRatio || 1;
    if (size.width === width && size.height === height && size.ratio === ratio) return;
    size = { width, height, ratio };
    renderer.setPixelRatio(ratio);
    renderer.setSize(width, height, false);
    for (const c of [behind, front]) {
      c.width = Math.round(width * ratio);
      c.height = Math.round(height * ratio);
    }
  }

  function draw({ t, badge, eye, pxPerUnit }: HandFrame) {
    if (lost) throw new Error('hand: WebGL context lost');
    // The canvases cover the window (fixed, inset 0); before they are placed, the window's size.
    const width = front.clientWidth || document.documentElement.clientWidth;
    const height = front.clientHeight || document.documentElement.clientHeight;
    fit(width, height);
    const view: ViewRegion = { left: 0, top: 0, width, height, eyeX: eye.x, eyeY: eye.y, pxPerUnit };
    const ratio = size.ratio;

    placeBadge(hs.badgeFrame, badge);
    poser.pose(t, curlsAt(t, curls));
    hs.scene.updateMatrixWorld(true);
    frameCamera(hs.camera, view);
    scaleOutlines(look, gl.width, gl.height, pxPerUnit * ratio);

    renderer.clippingPlanes = [];
    renderer.render(hs.scene, hs.camera);
    behindCtx.clearRect(0, 0, behind.width, behind.height);
    behindCtx.drawImage(gl, 0, 0);

    renderer.clippingPlanes = [nearPlane(hs, clipPlane)];
    renderer.render(hs.scene, hs.camera);
    frontCtx.clearRect(0, 0, front.width, front.height);
    // The shadow falls only on the card's face: blacked out, blurred, offset (more as the badge is lifted).
    const k0 = magnificationAt(badge.tz);
    const s = pxPerUnit * ratio;
    frontCtx.save();
    frontCtx.beginPath();
    for (const p of badgeOutline(hs, view)) frontCtx.lineTo(p.x * ratio, p.y * ratio);
    frontCtx.closePath();
    frontCtx.clip();
    paintHandShadow(frontCtx, gl, { dx: HAND_SHADOW.dx * s * k0, dy: HAND_SHADOW.dy * s * k0, blur: HAND_SHADOW.blur * s });
    frontCtx.restore();
    frontCtx.drawImage(gl, 0, 0);
  }

  // Ready to draw at once: compile both passes' shaders now (the clip plane is a shader variant), on a tiny target,
  // so the first frame of a turn doesn't stall and loading costs the page little.
  fit(16, 16);
  placeBadge(hs.badgeFrame, { th: 180, tz: 0, tx: 0, ty: 0, roll: 0 });
  poser.pose(1, curlsAt(1, curls));
  frameCamera(hs.camera, { left: 0, top: 0, width: 16, height: 16, eyeX: 8, eyeY: 8, pxPerUnit: 0.02 });
  for (const planes of [[], [nearPlane(hs, clipPlane)]]) {
    renderer.clippingPlanes = planes;
    renderer.render(hs.scene, hs.camera);
  }
  if (lost || !renderer.getContext()) throw new Error('hand: no WebGL');

  return { behind, front, draw, usable: () => !lost };
}
