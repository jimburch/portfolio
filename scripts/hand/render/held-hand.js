// Renders the resting hand for the held close-up: v10's final pose, in two layers split at the card's plane, cropped
// to the hand and scaled to the held badge. Run in a browser by ../render-held-hand.mjs; see scripts/hand/README.md
// for the framing contract the two images follow. The scene, look, rig and pose are the page's own
// (src/scene/hand/), served type-stripped by the script, so these stills and the hand turn's last frame are one source.
import * as THREE from 'three';
import {
  BADGE_RADIUS,
  HAND_SHADOW,
  createHandScene,
  frameCamera,
  nearPlane,
  paintHandShadow,
  placeBadge,
} from '/src/scene/hand/hand-scene.ts';
import { createLook, scaleOutlines } from '/src/scene/hand/look.ts';
import { createHandPoser } from '/src/scene/hand/pose.ts';
import { parseHandModel, rigHand } from '/src/scene/hand/rig.ts';
import { CARD, badgeAt, magnificationAt } from '/src/scene/hand/timeline.ts';

/** v10's stage: 1280 × 800 spike px, the eye over its centre (the badge's resting centre). */
const STAGE = { width: 1280, height: 800 };
const STAGE_VIEW = { left: 0, top: 0, width: STAGE.width, height: STAGE.height, eyeX: STAGE.width / 2, eyeY: STAGE.height / 2, pxPerUnit: 1 };

/** The card's face in units (500 tall). */
const FACE_W = (CARD.BW2 / CARD.BH2) * 500;

/** A world point → stage px (x right, y down). */
function stagePoint(camera, v) {
  frameCamera(camera, STAGE_VIEW);
  const n = v.clone().project(camera);
  return { x: ((n.x + 1) / 2) * STAGE.width, y: ((1 - n.y) / 2) * STAGE.height };
}

function newCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Pieces of the near-side layer smaller than this (image px) are cut-plane specks, not hand. */
const SPECK_PX = 64;

/** Clears every 8-connected group of drawn pixels (alpha > 0) smaller than `minPx`. */
function clearSpecks(canvas, minPx) {
  const ctx = canvas.getContext('2d');
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const seen = new Uint8Array(width * height);
  const stack = [];
  let cleared = 0;
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || data[start * 4 + 3] === 0) continue;
    const group = [];
    seen[start] = 1;
    stack.push(start);
    while (stack.length) {
      const i = stack.pop();
      group.push(i);
      const x = i % width;
      const y = (i - x) / width;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const j = ny * width + nx;
          if (!seen[j] && data[j * 4 + 3] > 0) {
            seen[j] = 1;
            stack.push(j);
          }
        }
    }
    if (group.length < minPx) {
      for (const i of group) ctx.clearRect(i % width, Math.floor(i / width), 1, 1);
      cleared += group.length;
    }
  }
  return cleared;
}

/** The bounding box of pixels with alpha > 0 over a list of canvases, in px. */
function alphaBounds(canvases) {
  const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const c of canvases) {
    const { data, width, height } = c.getContext('2d').getImageData(0, 0, c.width, c.height);
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++)
        if (data[(y * width + x) * 4 + 3] > 0) {
          if (x < b.x0) b.x0 = x;
          if (x > b.x1) b.x1 = x;
          if (y < b.y0) b.y0 = y;
          if (y > b.y1) b.y1 = y;
        }
  }
  return b;
}

/**
 * @param {object} options
 * @param {string} options.modelUrl the hand model (meshopt-compressed GLB)
 * @param {number} options.pxPerUnit image px per held-badge unit (a unit is 1/500 of the badge's height)
 * @param {number} options.bottom how far down the images reach, in units from the badge's top edge
 */
export async function renderHeldHand({ modelUrl, pxPerUnit, bottom }) {
  // ---- the scene (shared with the page's hand turn): the eye, lamp and fog, the badge at t = 1, the hand under it
  const hs = createHandScene();
  const { scene, camera, badgeFrame, handPlace } = hs;
  const final = badgeAt(1);
  const k0 = magnificationAt(final.tz);
  placeBadge(badgeFrame, final);
  frameCamera(camera, STAGE_VIEW);

  const look = createLook();
  const glb = await (await fetch(modelUrl)).arrayBuffer();
  const rig = rigHand(await parseHandModel(glb), handPlace, look);

  // ---- the pose, as v10's render(1): the key, then the forearm, then the contacts (solved here)
  const { curls, wrist } = createHandPoser(rig, handPlace, badgeFrame).pose(1, 'solve');
  scene.updateMatrixWorld(true);

  // ---- the card on the stage, at its mid-plane (where the page's DOM badge lies); one unit = its height / 500
  const corner = (x, y) => stagePoint(camera, new THREE.Vector3(x, y, 0).applyMatrix4(badgeFrame.matrixWorld));
  const corners = [corner(-CARD.BW2, CARD.BH2), corner(CARD.BW2, CARD.BH2), corner(CARD.BW2, -CARD.BH2), corner(-CARD.BW2, -CARD.BH2)];
  const face = {
    left: Math.min(...corners.map((c) => c.x)),
    right: Math.max(...corners.map((c) => c.x)),
    top: Math.min(...corners.map((c) => c.y)),
    bottom: Math.max(...corners.map((c) => c.y)),
  };
  const unit = (face.bottom - face.top) / 500; // stage px per unit
  const pr = pxPerUnit / unit; // image px per stage px

  // ---- a first box: every hand and sleeve vertex, plus room for the outline, down to `bottom`
  const p = new THREE.Vector3();
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  for (const mesh of [rig.mesh, rig.sleeve])
    for (let i = 0; i < mesh.geometry.attributes.position.count; i++) {
      const s = stagePoint(camera, mesh.getVertexPosition(i, p).applyMatrix4(mesh.matrixWorld));
      x0 = Math.min(x0, s.x);
      x1 = Math.max(x1, s.x);
      y0 = Math.min(y0, s.y);
    }
  const margin = 6; // stage px: outline (2.3) and antialiasing
  const box = {
    x: Math.floor((x0 - margin - face.left) / unit),
    y: Math.floor((y0 - margin - face.top) / unit),
  };
  box.width = Math.ceil((x1 + margin - face.left) / unit) - box.x;
  box.height = bottom - box.y;

  // ---- render that box: the whole hand (the layer behind the badge), then the near side only (in front of it)
  const cw = box.width * pxPerUnit;
  const ch = box.height * pxPerUnit;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(1);
  renderer.setSize(cw, ch, false);
  frameCamera(camera, {
    ...STAGE_VIEW,
    left: face.left + box.x * unit,
    top: face.top + box.y * unit,
    width: box.width * unit,
    height: box.height * unit,
  });
  scaleOutlines(look, cw, ch, pr);

  const snapshot = () => {
    const c = newCanvas(cw, ch);
    c.getContext('2d').drawImage(renderer.domElement, 0, 0);
    return c;
  };

  // Behind: the whole hand. The badge covers it wherever the card is, so beside the card it is the whole hand, with
  // no seam where the in-front layer meets it (that layer draws the same pixels there).
  renderer.clippingPlanes = [];
  renderer.render(scene, camera);
  const behind = snapshot();
  renderer.clippingPlanes = [nearPlane(hs)];
  renderer.render(scene, camera);
  const near = snapshot();
  renderer.dispose();
  // The mid-plane cut leaves a stray outline speck or two where a hull just pokes through it, alone on the face.
  const specks = clearSpecks(near, SPECK_PX);

  // The card's face in the image (the box is on the unit grid, so this is exact).
  const faceInImage = { x: -box.x * pxPerUnit, y: -box.y * pxPerUnit, w: FACE_W * pxPerUnit, h: 500 * pxPerUnit };
  const facePath = (ctx, inset) => {
    const i = inset * pxPerUnit;
    ctx.beginPath();
    ctx.roundRect(faceInImage.x + i, faceInImage.y + i, faceInImage.w - 2 * i, faceInImage.h - 2 * i, BADGE_RADIUS * faceInImage.w - i);
  };

  // Behind: nothing under the badge's board is ever seen, so it is cleared (2 units in from the edge, clear of the
  // board's antialiased edge), which halves the file.
  {
    const ctx = behind.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    facePath(ctx, 2);
    ctx.fill();
  }

  // In front: the hand's soft shadow on the card's face, then the near side of the hand.
  const front = newCanvas(cw, ch);
  {
    const ctx = front.getContext('2d');
    ctx.save();
    facePath(ctx, 0);
    ctx.clip();
    paintHandShadow(ctx, near, { dx: HAND_SHADOW.dx * pr * k0, dy: HAND_SHADOW.dy * pr * k0, blur: HAND_SHADOW.blur * pr });
    ctx.restore();
    ctx.drawImage(near, 0, 0);
  }

  // ---- trim both to what they draw, in whole units (so the box stays on the unit grid)
  const b = alphaBounds([behind, front]);
  const trim = {
    left: Math.floor(b.x0 / pxPerUnit),
    top: Math.floor(b.y0 / pxPerUnit),
    right: Math.ceil((b.x1 + 1) / pxPerUnit),
    bottom: box.height, // the bottom edge is the cut through the sleeve
  };
  const out = {
    x: box.x + trim.left,
    y: box.y + trim.top,
    width: trim.right - trim.left,
    height: trim.bottom - trim.top,
  };
  const crop = (c) => {
    const o = newCanvas(out.width * pxPerUnit, out.height * pxPerUnit);
    o.getContext('2d').drawImage(c, -trim.left * pxPerUnit, -trim.top * pxPerUnit);
    return o;
  };
  const behindOut = crop(behind);
  const frontOut = crop(front);
  const nearOut = crop(near);

  // ---- where the hand reaches over the face (the near side, solid pixels), in units from the badge's edges
  const reach = handReach(nearOut, out, pxPerUnit);

  return {
    behind: behindOut.toDataURL('image/png'),
    front: frontOut.toDataURL('image/png'),
    box: out,
    reach,
    check: { curls, wrist, specks, unitStagePx: unit, faceStagePx: face },
  };
}

/** How far the near side of the hand reaches over the face: the fingers in from the left edge, the thumb in from the
    right edge, and the lowest fingertip down from the top; in units, solid pixels only (alpha ≥ 50%). */
function handReach(near, box, pxPerUnit) {
  const { data, width, height } = near.getContext('2d').getImageData(0, 0, near.width, near.height);
  const r = { fingersFromLeft: 0, thumbFromRight: 0, lowestFromTop: 0, highestFromTop: Infinity };
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < 128) continue;
      const ux = box.x + x / pxPerUnit;
      const uy = box.y + y / pxPerUnit;
      if (ux < 0 || ux > FACE_W || uy < 0 || uy > 500) continue; // over the face only
      if (ux < FACE_W / 2) r.fingersFromLeft = Math.max(r.fingersFromLeft, ux);
      else r.thumbFromRight = Math.max(r.thumbFromRight, FACE_W - ux);
      r.lowestFromTop = Math.max(r.lowestFromTop, uy);
      r.highestFromTop = Math.min(r.highestFromTop, uy);
    }
  for (const k in r) r[k] = Math.round(r[k] * 10) / 10;
  return r;
}
