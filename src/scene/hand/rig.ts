/* The hand rig, as in the v10 spike: load the model, dress it in the toon
   look, and the operations that pose it: a key pose (or a blend of two),
   the forearm aimed at the wearer's elbow, and each digit's curl onto the
   face it rests on (solved, or applied from the baked table, contacts.ts).
   Also the check the spike reports: triangles passing through the card.

   Shared by the hand turn (the page), the resting-hand images and the
   contact bake (scripts/hand). The model is the WebXR generic hand (MIT,
   © 2019 Amazon) rebuilt by scripts/hand/build_hand.py. */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import type { DigitName, FingerName, KeyPose } from './keys.ts';
import { addHullNormals, type HandLook } from './look.ts';
import { CARD, WRIST_LIM, seg, smooth } from './timeline.ts';

const D = Math.PI / 180;

/** Metres → world units (spike px). */
export const HAND_SCALE = 2430;

/** How far a resting pad sits off the face (world units). */
export const PAD_GAP = 1.5;

export const FINGERS: readonly FingerName[] = ['index', 'middle', 'ring', 'pinky'];
export const DIGITS: readonly DigitName[] = [...FINGERS, 'thumb'];

const CHAIN = {
  thumb: ['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'],
} as Record<DigitName, string[]>;
for (const f of FINGERS)
  CHAIN[f] = ['metacarpal', 'phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal', 'tip'].map(
    (b) => `${f}-finger-${b}`,
  );

// How a unit of curl spreads over a digit's joints: [chain index, weight, local axis]. A finger curls by flexing
// (-X); the thumb's pad is brought onto a face by palmar abduction at its base (+Y) and a little IP flex.
const X_AXIS = new THREE.Vector3(-1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
type CurlSpread = ReadonlyArray<readonly [number, number, THREE.Vector3]>;
const CURL: Record<'finger' | 'thumb', CurlSpread> = {
  finger: [
    [1, 0.2, X_AXIS],
    [2, 0.6, X_AXIS],
    [3, 1, X_AXIS],
  ],
  thumb: [
    [0, 1, Y_AXIS],
    [2, 0.35, X_AXIS],
  ],
};
const curlOf = (d: DigitName) => CURL[d === 'thumb' ? 'thumb' : 'finger'];

export interface HandRig {
  bones: Record<string, THREE.Bone>;
  /** Each bone's rest rotation. */
  rest: Record<string, THREE.Quaternion>;
  /** The skin (hand and a short forearm) and the jacket's sleeve; they share one skeleton. */
  mesh: THREE.SkinnedMesh;
  sleeve: THREE.SkinnedMesh;
  /** Each digit's last segment: the pad vertices that rest on a face. */
  pads: Record<DigitName, number[]>;
  /** Each skin vertex's digit, or 'palm' (for the crossing count). */
  digitOf: Array<DigitName | 'palm'>;
}

/** Parses the hand model (a meshopt-compressed GLB). */
export async function parseHandModel(glb: ArrayBuffer): Promise<THREE.Group> {
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(glb, '');
  return gltf.scene;
}

/** Each vertex's strongest bone. */
function strongestBones(geometry: THREE.BufferGeometry): Int32Array {
  const si = geometry.attributes.skinIndex;
  const sw = geometry.attributes.skinWeight;
  const out = new Int32Array(si.count);
  for (let i = 0; i < si.count; i++) {
    let best = -1;
    let bw = 0;
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k);
      if (w > bw) {
        bw = w;
        best = si.getComponent(i, k);
      }
    }
    out[i] = best;
  }
  return out;
}

/**
 * Puts the model under `parent` (the wrist joint at its origin, scaled to world units) and dresses it in `look`.
 */
export function rigHand(model: THREE.Group, parent: THREE.Object3D, look: HandLook): HandRig {
  model.updateMatrixWorld(true);
  let mesh: THREE.SkinnedMesh | null = null;
  let sleeve: THREE.SkinnedMesh | null = null;
  model.traverse((o) => {
    if ((o as THREE.SkinnedMesh).isSkinnedMesh) {
      if (o.name.startsWith('sleeve')) sleeve = o as THREE.SkinnedMesh;
      else mesh = o as THREE.SkinnedMesh;
    }
  });
  if (!mesh || !sleeve) throw new Error('hand model: expected the hand and sleeve meshes');
  const skin: THREE.SkinnedMesh = mesh;
  const cloth: THREE.SkinnedMesh = sleeve;

  const bones: Record<string, THREE.Bone> = {};
  for (const b of skin.skeleton.bones) bones[b.name] = b;
  // The wrist is lifted out from under the forearm, so the forearm bone IS the wrist bend (its pivot is the wrist).
  const { wrist, forearm } = bones;
  forearm.parent!.attach(wrist);
  const rest: Record<string, THREE.Quaternion> = {};
  for (const n in bones) rest[n] = bones[n].quaternion.clone();

  const wristWorld = wrist.matrixWorld.clone();
  model.matrixAutoUpdate = false;
  model.matrix.makeScale(HAND_SCALE, HAND_SCALE, HAND_SCALE).multiply(wristWorld.invert());
  parent.add(model);

  // Toon materials, each mesh with a silhouette hull and an inner hull sharing the skeleton.
  const hull = (m: THREE.SkinnedMesh, material: THREE.Material, order: number) => {
    const h = new THREE.SkinnedMesh(m.geometry, material);
    h.frustumCulled = false;
    h.renderOrder = order;
    h.bind(m.skeleton, m.bindMatrix);
    m.parent!.add(h);
  };
  const dress = (m: THREE.SkinnedMesh, material: THREE.Material, silhouette: THREE.Material, line: THREE.Material) => {
    addHullNormals(m.geometry);
    m.material = material;
    m.frustumCulled = false;
    hull(m, silhouette, -1);
    hull(m, line, 0);
  };
  dress(skin, look.skin, look.skinSilhouette, look.skinLine);
  {
    // The wrist line: hullMask from the forearm bone's skin weight, eased so it fades in past the heel.
    const g = skin.geometry;
    const si = g.attributes.skinIndex;
    const sw = g.attributes.skinWeight;
    const fi = skin.skeleton.bones.indexOf(forearm);
    const mask = new Float32Array(si.count);
    for (let i = 0; i < si.count; i++) {
      let w = 0;
      for (let k = 0; k < 4; k++) if (si.getComponent(i, k) === fi) w += sw.getComponent(i, k);
      mask[i] = smooth(seg(w, 0.35, 0.8));
    }
    g.setAttribute('hullMask', new THREE.BufferAttribute(mask, 1));
    hull(skin, look.skinWristLine, 1);
  }
  dress(cloth, look.sleeve, look.clothSilhouette, look.clothLine);

  // Each digit's pad (its last segment) and its whole chain (for the crossing count).
  const boneIndex: Record<string, number> = {};
  skin.skeleton.bones.forEach((b, i) => {
    boneIndex[b.name] = i;
  });
  const strongest = strongestBones(skin.geometry);
  const pads = {} as Record<DigitName, number[]>;
  const digitOf: Array<DigitName | 'palm'> = new Array(strongest.length).fill('palm');
  for (const d of DIGITS) {
    const c = CHAIN[d];
    const distal = [boneIndex[c[c.length - 2]], boneIndex[c[c.length - 1]]];
    const whole = c.slice(1).map((b) => boneIndex[b]);
    pads[d] = [];
    for (let i = 0; i < strongest.length; i++) {
      if (distal.includes(strongest[i])) pads[d].push(i);
      if (whole.includes(strongest[i])) digitOf[i] = d;
    }
  }
  return { bones, rest, mesh: skin, sleeve: cloth, pads, digitOf };
}

// ---- Poses -----------------------------------------------------------------------------------------------------

/** A key pose compiled to the wrist's place and every joint's rotation from rest. */
export interface CompiledPose {
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  bones: Record<string, THREE.Quaternion>;
}

const _e = new THREE.Euler();
const boneDelta = (x: number, y: number, z: number) =>
  new THREE.Quaternion().setFromEuler(_e.set(x * D, y * D, z * D, 'XYZ'));

/** F: the hand's distal direction, N: the palm normal (out of the palm) → the wrist's rotation. */
function placeQuat(F: readonly number[], N: readonly number[]): THREE.Quaternion {
  const z = new THREE.Vector3(-F[0], -F[1], -F[2]).normalize(); // +Z proximal
  const y = new THREE.Vector3(-N[0], -N[1], -N[2]); // +Y back of the hand
  y.addScaledVector(z, -y.dot(z)).normalize();
  const x = new THREE.Vector3().crossVectors(y, z); // +X little-finger side
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

function bakeCurl(q: Record<string, THREE.Quaternion>, digit: DigitName, c: number) {
  if (!c) return;
  const chain = CHAIN[digit];
  for (const [i, k, ax] of curlOf(digit)) q[chain[i]].multiply(new THREE.Quaternion().setFromAxisAngle(ax, c * k * D));
}

export function compilePose(key: KeyPose): CompiledPose {
  const q: Record<string, THREE.Quaternion> = {};
  for (const f of FINGERS) {
    const a = key.fingers[f];
    const c = CHAIN[f];
    q[c[0]] = boneDelta(-(a[4] || 0), 0, 0); // metacarpal cup (ring, little)
    q[c[1]] = boneDelta(-a[1], a[0], 0);
    q[c[2]] = boneDelta(-a[2], 0, 0);
    q[c[3]] = boneDelta(-a[3], 0, 0);
    bakeCurl(q, f, a[5] || 0);
  }
  const t = key.thumb;
  const c = CHAIN.thumb;
  q[c[0]] = boneDelta(t.cmc[0], t.cmc[1], t.cmc[2]);
  q[c[1]] = boneDelta(-t.mcp, 0, 0);
  q[c[2]] = boneDelta(-t.ip, 0, 0);
  bakeCurl(q, 'thumb', t.curl || 0);
  return { pos: new THREE.Vector3().fromArray(key.place.p), quat: placeQuat(key.place.F, key.place.N), bones: q };
}

/** `out` = a blended toward b by u (positions lerped, rotations slerped). */
export function blendPoses(a: CompiledPose, b: CompiledPose, u: number, out: CompiledPose): CompiledPose {
  out.pos.lerpVectors(a.pos, b.pos, u);
  out.quat.slerpQuaternions(a.quat, b.quat, u);
  for (const n in a.bones) (out.bones[n] ??= new THREE.Quaternion()).slerpQuaternions(a.bones[n], b.bones[n], u);
  return out;
}

/** Puts the hand in `pose`: the wrist's place under `handPlace`, and every joint. */
export function applyPose(rig: HandRig, handPlace: THREE.Object3D, pose: CompiledPose): void {
  handPlace.position.copy(pose.pos);
  handPlace.quaternion.copy(pose.quat);
  for (const n in pose.bones) rig.bones[n].quaternion.copy(rig.rest[n]).multiply(pose.bones[n]);
}

// Identity in the middle 70% of [lo, hi], then eases into the limit (C1, never exceeds it).
function softLimit(x: number, lo: number, hi: number): number {
  const k = 0.7;
  if (x > hi * k) return hi * k + hi * (1 - k) * Math.tanh((x - hi * k) / (hi * (1 - k)));
  if (x < lo * k) return lo * k + lo * (1 - k) * Math.tanh((x - lo * k) / (lo * (1 - k)));
  return x;
}

export interface WristAngles {
  dev: number;
  ext: number;
  rawDev: number;
  rawExt: number;
}

const _wq = new THREE.Quaternion();
const _wp = new THREE.Vector3();
const _ad = new THREE.Vector3();
const _an = new THREE.Vector3();
const _q = new THREE.Quaternion();
const Z_AXIS = new THREE.Vector3(0, 0, 1);

/**
 * Aims the forearm at `elbow` (world units), blended by `follow` toward the hand's own natural line (`natural`:
 * deviation and extension, degrees), within the wrist's soft limits. Returns the wrist's angles.
 */
export function aimForearm(
  rig: HandRig,
  handPlace: THREE.Object3D,
  elbow: THREE.Vector3,
  follow = 0,
  natural: readonly [number, number] = [0, 0],
): WristAngles {
  handPlace.getWorldQuaternion(_wq);
  handPlace.getWorldPosition(_wp);
  // The forearm's direction in the hand frame: +Z proximal, +X little-finger side, +Y back of the hand.
  _ad.copy(elbow).sub(_wp).applyQuaternion(_wq.invert()).normalize();
  if (follow > 0) {
    _an.set(Math.tan(natural[0] * D), Math.tan(natural[1] * D), 1).normalize();
    _ad.lerp(_an, follow).normalize();
  }
  const rawDev = Math.atan2(_ad.x, _ad.z) / D;
  const rawExt = Math.atan2(_ad.y, _ad.z) / D;
  const dev = softLimit(rawDev, WRIST_LIM.dev[0], WRIST_LIM.dev[1]);
  const ext = softLimit(rawExt, WRIST_LIM.ext[0], WRIST_LIM.ext[1]);
  _ad.set(Math.tan(dev * D), Math.tan(ext * D), 1).normalize();
  rig.bones.forearm.quaternion.copy(rig.rest.forearm).multiply(_q.setFromUnitVectors(Z_AXIS, _ad));
  rig.bones.forearm.updateMatrixWorld(true);
  return { dev, ext, rawDev, rawExt };
}

// ---- Contacts ----------------------------------------------------------------------------------------------------

/** Each digit's curl onto its face (degrees, on top of its pose; 0 where it rests on nothing). */
export type DigitCurls = Record<DigitName, number>;

const _flex = new THREE.Quaternion();

/** Curls `digit` by `c` from `base` (its chain's rotations before the curl). */
function setCurl(rig: HandRig, digit: DigitName, c: number, base: THREE.Quaternion[]) {
  const chain = CHAIN[digit];
  for (const [i, k, ax] of curlOf(digit))
    rig.bones[chain[i]].quaternion.copy(base[i]).multiply(_flex.setFromAxisAngle(ax, c * k * D));
  rig.bones[chain[0]].updateMatrixWorld(true);
}

const baseOf = (rig: HandRig, digit: DigitName) => CHAIN[digit].map((n) => rig.bones[n].quaternion.clone());

/** Curls each digit by its baked curl, as the solve would have. */
export function applyCurls(rig: HandRig, curls: DigitCurls): void {
  for (const d of DIGITS) if (curls[d]) setCurl(rig, d, curls[d], baseOf(rig, d));
}

const _inv = new THREE.Matrix4();
const _p = new THREE.Vector3();

/**
 * Settles each digit in `contacts` onto its face (+1 front, -1 back): scans the curl outward from the posed digit for
 * where its pad reaches PAD_GAP off the face, then bisects. Returns each digit's curl (degrees), or null where it
 * could not reach; a digit not in `contacts` is 0.
 */
export function solveContacts(
  rig: HandRig,
  badgeFrame: THREE.Object3D,
  contacts: Partial<Record<DigitName, 1 | -1>>,
): Record<DigitName, number | null> {
  const padGap = (d: DigitName, side: number) => {
    _inv.copy(badgeFrame.matrixWorld).invert();
    let g = Infinity;
    for (const i of rig.pads[d]) {
      const v = rig.mesh.getVertexPosition(i, _p).applyMatrix4(rig.mesh.matrixWorld).applyMatrix4(_inv);
      if (Math.abs(v.x) < CARD.BW2 - 2 && Math.abs(v.y) < CARD.BH2 - 2) g = Math.min(g, side * v.z - CARD.HZ);
    }
    return g;
  };
  const solved = { index: 0, middle: 0, ring: 0, pinky: 0, thumb: 0 } as Record<DigitName, number | null>;
  for (const d of DIGITS) {
    const side = contacts[d];
    if (!side) continue;
    const base = baseOf(rig, d);
    setCurl(rig, d, 0, base);
    const g0 = padGap(d, side);
    if (isFinite(g0) && Math.abs(g0 - PAD_GAP) < 0.25) continue; // already resting on it
    const dirn = isFinite(g0) && g0 < PAD_GAP ? -1 : 1; // already pressing in: uncurl; else curl
    let lo: number | null = null;
    let hi = 0;
    let prev = 0;
    let gp = g0;
    for (let c = 5 * dirn; Math.abs(c) <= 60; c += 5 * dirn) {
      setCurl(rig, d, c, base);
      const g = padGap(d, side);
      if (isFinite(g) && isFinite(gp) && (gp - PAD_GAP) * (g - PAD_GAP) <= 0) {
        lo = prev;
        hi = c;
        break;
      }
      prev = c;
      gp = g;
    }
    if (lo === null) {
      setCurl(rig, d, 0, base);
      solved[d] = null;
      continue;
    }
    let a: number = lo;
    let b = hi;
    for (let it = 0; it < 12; it++) {
      const mid = (a + b) / 2;
      setCurl(rig, d, mid, base);
      if (padGap(d, side) > PAD_GAP === dirn > 0) a = mid;
      else b = mid;
    }
    const c = dirn > 0 ? a : b; // the side that is clear of the face
    setCurl(rig, d, c, base);
    solved[d] = c;
  }
  return solved;
}

/**
 * Skin triangles that pass through the card: an edge crossing the card's mid-plane inside its outline (a low-poly
 * triangle can span the card's thickness without a vertex inside it). Counted per digit, and 'palm'.
 */
export function cardCrossings(rig: HandRig, badgeFrame: THREE.Object3D): Partial<Record<DigitName | 'palm', number>> {
  const g = rig.mesh.geometry;
  const idx = g.index!;
  const n = g.attributes.position.count;
  const P3 = new Float32Array(n * 3);
  _inv.copy(badgeFrame.matrixWorld).invert();
  for (let i = 0; i < n; i++) {
    rig.mesh.getVertexPosition(i, _p).applyMatrix4(rig.mesh.matrixWorld).applyMatrix4(_inv);
    P3[i * 3] = _p.x;
    P3[i * 3 + 1] = _p.y;
    P3[i * 3 + 2] = _p.z;
  }
  const hit = (a: number, b: number) => {
    const za = P3[a * 3 + 2];
    const zb = P3[b * 3 + 2];
    if (za > 0 === zb > 0) return false;
    const u = za / (za - zb);
    const x = P3[a * 3] + (P3[b * 3] - P3[a * 3]) * u;
    const y = P3[a * 3 + 1] + (P3[b * 3 + 1] - P3[a * 3 + 1]) * u;
    return Math.abs(x) < CARD.BW2 && Math.abs(y) < CARD.BH2;
  };
  const out: Partial<Record<DigitName | 'palm', number>> = {};
  for (let k = 0; k < idx.count; k += 3) {
    const a = idx.getX(k);
    const b = idx.getX(k + 1);
    const c = idx.getX(k + 2);
    if (hit(a, b) || hit(b, c) || hit(c, a)) {
      const d = rig.digitOf[a];
      out[d] = (out[d] ?? 0) + 1;
    }
  }
  return out;
}
