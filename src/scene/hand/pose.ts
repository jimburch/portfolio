/* The hand at time t, in the badge's frame: v10's poseHand. The key pose
   blend for t (timeline.ts), the forearm aimed at the wearer's elbow, then
   each digit's curl onto the card: solved (the bake and the image render
   do this, as the spike did every frame) or read from the baked table
   (the page does this, contacts.ts). */

import * as THREE from 'three';
import { KEYS, type DigitName } from './keys.ts';
import {
  aimForearm,
  applyCurls,
  applyPose,
  blendPoses,
  compilePose,
  solveContacts,
  type CompiledPose,
  type DigitCurls,
  type HandRig,
  type WristAngles,
} from './rig.ts';
import { ELBOW_REST, ELBOW_UP, armFollow, handBlendAt, liftAt, naturalForearm, smooth, turnAt, type KeyName } from './timeline.ts';

const ELBOW_AT_REST = new THREE.Vector3(...ELBOW_REST);
const ELBOW_LIFTED = new THREE.Vector3(...ELBOW_UP);

/** Which digits rest on the card while blending `from` → `to` by u: those both ends agree on, or one end's at u 0 / 1. */
function contactsOf(from: KeyName, to: KeyName, u: number): Partial<Record<DigitName, 1 | -1>> {
  const a = KEYS[from].contacts ?? {};
  const b = KEYS[to].contacts ?? {};
  if (u <= 0) return { ...a };
  if (u >= 1) return { ...b };
  const out: Partial<Record<DigitName, 1 | -1>> = {};
  for (const d in a) if (a[d as DigitName] === b[d as DigitName]) out[d as DigitName] = a[d as DigitName];
  return out;
}

export interface HandPoser {
  /**
   * Poses the hand for t. `badgeFrame`'s matrix must already be the badge's at t. `curls`: the baked contact curls,
   * or 'solve' to solve them here. Returns the solve's curls (null: a contact that couldn't reach) and the wrist.
   */
  pose(t: number, curls: DigitCurls | 'solve'): { curls: Record<DigitName, number | null>; wrist: WristAngles };
}

export function createHandPoser(rig: HandRig, handPlace: THREE.Object3D, badgeFrame: THREE.Object3D): HandPoser {
  const keys = Object.fromEntries(Object.entries(KEYS).map(([k, v]) => [k, compilePose(v)])) as Record<KeyName, CompiledPose>;
  const blended: CompiledPose = { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), bones: {} };
  const elbow = new THREE.Vector3();
  const scene = (): THREE.Object3D => {
    let o: THREE.Object3D = badgeFrame;
    while (o.parent) o = o.parent;
    return o;
  };

  return {
    pose(t, curls) {
      const th = turnAt(t);
      const blend = handBlendAt(t, th);
      blendPoses(keys[blend.from], keys[blend.to], blend.u, blended);
      blended.pos.x += blend.rise.dx;
      blended.pos.y += blend.rise.dy;
      applyPose(rig, handPlace, blended);
      scene().updateMatrixWorld(true);
      elbow.lerpVectors(ELBOW_AT_REST, ELBOW_LIFTED, smooth(liftAt(t)));
      const wrist = aimForearm(rig, handPlace, elbow, armFollow(th), naturalForearm(th));
      if (curls === 'solve') {
        const contacts = blend.arrived ? contactsOf(blend.from, blend.to, blend.u) : {};
        return { curls: solveContacts(rig, badgeFrame, contacts), wrist };
      }
      applyCurls(rig, curls);
      return { curls, wrist };
    },
  };
}
