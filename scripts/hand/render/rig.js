// The hand rig, as in the v10 spike: load the model, dress it in the toon look, pose it (a key pose, the forearm
// aimed at the wearer's elbow, then each digit's pad settled onto the face it rests on).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { addHullNormals } from './look.js';
import { CARD, GAP, WRIST_LIM } from './held-pose.js';

const D = Math.PI / 180;
const clamp01 = (t) => Math.max(0, Math.min(1, t));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);

const FINGERS = ['index', 'middle', 'ring', 'pinky'];
const CHAIN = { thumb: ['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'] };
for (const f of FINGERS)
  CHAIN[f] = ['metacarpal', 'phalanx-proximal', 'phalanx-intermediate', 'phalanx-distal', 'tip'].map(
    (b) => `${f}-finger-${b}`,
  );

// How a unit of curl spreads over a digit's joints: [chain index, weight, local axis]. A finger curls by flexing
// (-X); the thumb's pad is brought onto a face by palmar abduction at its base (+Y) and a little IP flex.
const X_AXIS = new THREE.Vector3(-1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const CURL = {
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

/** Each mesh vertex's strongest bone. */
function strongestBones(geometry) {
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
 * Loads the hand model under `parent` (the wrist joint at its origin, scaled to px) and dresses it.
 * Returns the rig: bones, their rest rotations, the skin and sleeve meshes and each digit's pad vertices.
 */
export async function loadHand(url, parent, look, handScale) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  const model = gltf.scene;
  model.updateMatrixWorld(true);
  const rig = { bones: {}, rest: {}, mesh: null, sleeve: null, pads: {} };
  // Two skinned meshes share one skeleton: `hand` (skin, with a short forearm) and `sleeve` (the jacket).
  model.traverse((o) => {
    if (o.isSkinnedMesh) {
      if (o.name.startsWith('sleeve')) rig.sleeve = o;
      else rig.mesh = o;
    }
  });
  for (const b of rig.mesh.skeleton.bones) rig.bones[b.name] = b;
  // The wrist is lifted out from under the forearm, so the forearm bone IS the wrist bend (its pivot is the wrist).
  const { wrist, forearm } = rig.bones;
  forearm.parent.attach(wrist);
  for (const n in rig.bones) rig.rest[n] = rig.bones[n].quaternion.clone();

  const wristWorld = wrist.matrixWorld.clone();
  model.matrixAutoUpdate = false;
  model.matrix.makeScale(handScale, handScale, handScale).multiply(wristWorld.invert());
  parent.add(model);

  // Toon materials, each mesh with a silhouette hull and an inner hull sharing the skeleton.
  const hull = (mesh, material, order) => {
    const h = new THREE.SkinnedMesh(mesh.geometry, material);
    h.frustumCulled = false;
    h.renderOrder = order;
    h.bind(mesh.skeleton, mesh.bindMatrix);
    mesh.parent.add(h);
  };
  const dress = (mesh, material, silhouette, line) => {
    addHullNormals(mesh.geometry);
    mesh.material = material;
    mesh.frustumCulled = false;
    hull(mesh, silhouette, -1);
    hull(mesh, line, 0);
  };
  dress(rig.mesh, look.skin, look.skinSilhouette, look.skinLine);
  {
    // The wrist line: hullMask from the forearm bone's skin weight, eased so it fades in past the heel.
    const g = rig.mesh.geometry;
    const si = g.attributes.skinIndex;
    const sw = g.attributes.skinWeight;
    const fi = rig.mesh.skeleton.bones.indexOf(forearm);
    const mask = new Float32Array(si.count);
    for (let i = 0; i < si.count; i++) {
      let w = 0;
      for (let k = 0; k < 4; k++) if (si.getComponent(i, k) === fi) w += sw.getComponent(i, k);
      mask[i] = smooth(seg(w, 0.35, 0.8));
    }
    g.setAttribute('hullMask', new THREE.BufferAttribute(mask, 1));
    hull(rig.mesh, look.skinWristLine, 1);
  }
  dress(rig.sleeve, look.sleeve, look.clothSilhouette, look.clothLine);

  // Each digit's last segment: the pad vertices the contact solve rests on a face.
  const boneIndex = Object.fromEntries(rig.mesh.skeleton.bones.map((b, i) => [b.name, i]));
  const strongest = strongestBones(rig.mesh.geometry);
  for (const d in CHAIN) {
    const c = CHAIN[d];
    const distal = [boneIndex[c[c.length - 2]], boneIndex[c[c.length - 1]]];
    rig.pads[d] = [];
    for (let i = 0; i < strongest.length; i++) if (distal.includes(strongest[i])) rig.pads[d].push(i);
  }
  return rig;
}

const _e = new THREE.Euler();
const boneDelta = (x, y, z) => new THREE.Quaternion().setFromEuler(_e.set(x * D, y * D, z * D, 'XYZ'));

/** F: the hand's distal direction, N: the palm normal (out of the palm) → the wrist's rotation. */
function placeQuat(F, N) {
  const z = new THREE.Vector3(-F[0], -F[1], -F[2]).normalize(); // +Z proximal
  const y = new THREE.Vector3(-N[0], -N[1], -N[2]); // +Y back of the hand
  y.addScaledVector(z, -y.dot(z)).normalize();
  const x = new THREE.Vector3().crossVectors(y, z); // +X little-finger side
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

function bakeCurl(q, chain, kind, c) {
  if (!c) return;
  for (const [i, k, ax] of CURL[kind])
    q[chain[i]].multiply(new THREE.Quaternion().setFromAxisAngle(ax, c * k * D));
}

/** Applies a key pose: the wrist's place and every joint's rotation from rest. */
export function applyPose(rig, handPlace, key) {
  const q = {};
  for (const f of FINGERS) {
    const a = key.fingers[f];
    const c = CHAIN[f];
    q[c[0]] = boneDelta(-(a[4] || 0), 0, 0); // metacarpal cup (ring, little)
    q[c[1]] = boneDelta(-a[1], a[0], 0);
    q[c[2]] = boneDelta(-a[2], 0, 0);
    q[c[3]] = boneDelta(-a[3], 0, 0);
    bakeCurl(q, c, 'finger', a[5] || 0);
  }
  const t = key.thumb;
  const c = CHAIN.thumb;
  q[c[0]] = boneDelta(t.cmc[0], t.cmc[1], t.cmc[2]);
  q[c[1]] = boneDelta(-t.mcp, 0, 0);
  q[c[2]] = boneDelta(-t.ip, 0, 0);
  bakeCurl(q, c, 'thumb', t.curl || 0);

  handPlace.position.fromArray(key.place.p);
  handPlace.quaternion.copy(placeQuat(key.place.F, key.place.N));
  for (const n in q) rig.bones[n].quaternion.copy(rig.rest[n]).multiply(q[n]);
}

// Identity in the middle 70% of [lo, hi], then eases into the limit (never exceeds it).
function softLimit(x, lo, hi) {
  const k = 0.7;
  if (x > hi * k) return hi * k + hi * (1 - k) * Math.tanh((x - hi * k) / (hi * (1 - k)));
  if (x < lo * k) return lo * k + lo * (1 - k) * Math.tanh((x - lo * k) / (lo * (1 - k)));
  return x;
}

/** Aims the forearm at the elbow (world px), within the wrist's soft limits. Returns the wrist angles (degrees). */
export function aimForearm(rig, handPlace, elbow) {
  const wq = handPlace.getWorldQuaternion(new THREE.Quaternion());
  const wp = handPlace.getWorldPosition(new THREE.Vector3());
  // The forearm's direction in the hand frame: +Z proximal, +X little-finger side, +Y back of the hand.
  const ad = elbow.clone().sub(wp).applyQuaternion(wq.invert()).normalize();
  const rawDev = Math.atan2(ad.x, ad.z) / D;
  const rawExt = Math.atan2(ad.y, ad.z) / D;
  const dev = softLimit(rawDev, WRIST_LIM.dev[0], WRIST_LIM.dev[1]);
  const ext = softLimit(rawExt, WRIST_LIM.ext[0], WRIST_LIM.ext[1]);
  ad.set(Math.tan(dev * D), Math.tan(ext * D), 1).normalize();
  rig.bones.forearm.quaternion
    .copy(rig.rest.forearm)
    .multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), ad));
  rig.bones.forearm.updateMatrixWorld(true);
  return { dev, ext, rawDev, rawExt };
}

/**
 * Settles each digit in `contacts` onto its face (side +1 front, -1 back): scans the curl outward from the authored
 * pose for where the pad reaches GAP px off the face, then bisects. Returns each digit's solved curl (degrees), or
 * null where it could not reach.
 */
export function solveContacts(rig, badgeFrame, contacts) {
  const inv = new THREE.Matrix4();
  const p = new THREE.Vector3();
  const flex = new THREE.Quaternion();
  const padGap = (d, side) => {
    inv.copy(badgeFrame.matrixWorld).invert();
    let g = Infinity;
    for (const i of rig.pads[d]) {
      const v = rig.mesh.getVertexPosition(i, p).applyMatrix4(rig.mesh.matrixWorld).applyMatrix4(inv);
      if (Math.abs(v.x) < CARD.BW2 - 2 && Math.abs(v.y) < CARD.BH2 - 2) g = Math.min(g, side * v.z - CARD.HZ);
    }
    return g;
  };
  const solved = {};
  for (const d in contacts) {
    const side = contacts[d];
    const chain = CHAIN[d];
    const base = chain.map((n) => rig.bones[n].quaternion.clone());
    const weights = CURL[d === 'thumb' ? 'thumb' : 'finger'];
    const setCurl = (c) => {
      for (const [i, k, ax] of weights)
        rig.bones[chain[i]].quaternion.copy(base[i]).multiply(flex.setFromAxisAngle(ax, c * k * D));
      rig.bones[chain[0]].updateMatrixWorld(true);
    };
    setCurl(0);
    const g0 = padGap(d, side);
    if (isFinite(g0) && Math.abs(g0 - GAP) < 0.25) {
      solved[d] = 0;
      continue;
    }
    const dirn = isFinite(g0) && g0 < GAP ? -1 : 1; // already pressing in: uncurl; else curl
    let lo = null;
    let hi = null;
    let prev = 0;
    let gp = g0;
    for (let c = 5 * dirn; Math.abs(c) <= 60; c += 5 * dirn) {
      setCurl(c);
      const g = padGap(d, side);
      if (isFinite(g) && isFinite(gp) && (gp - GAP) * (g - GAP) <= 0) {
        lo = prev;
        hi = c;
        break;
      }
      prev = c;
      gp = g;
    }
    if (lo === null) {
      setCurl(0);
      solved[d] = null;
      continue;
    }
    for (let it = 0; it < 12; it++) {
      const mid = (lo + hi) / 2;
      setCurl(mid);
      if (padGap(d, side) > GAP === dirn > 0) lo = mid;
      else hi = mid;
    }
    const c = dirn > 0 ? lo : hi; // the side that is clear of the face
    setCurl(c);
    solved[d] = c;
  }
  return solved;
}
