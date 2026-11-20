/* The hand turn's choreography as plain numbers: v10's motion, which Jim
   locked (docs/reference/hand-turn-spike/spike-grab-turn-v10.html), as a
   pure function of one time value t in [0, 1]. No three.js here, so the
   page's turn presentation, the 3D hand and the build scripts all read the
   same timeline.

   - reach (t 0 → 0.19): the hand rises from below the frame and closes into
     a fist on the badge's bottom-right corner;
   - lift and turn (0.19 → 0.66): the badge comes up toward the camera and
     turns over (edge-on at about 0.43) while the hand slides into a phone
     grip behind it;
   - settle (0.62 → 1): a small overshoot of the turn, settling; the lift
     settles too, from below (trimmed: it never lifts past its end).
   Going back runs t backwards.

   Units are v10's world units, "spike px": the badge is 231 × 500 of them,
   and the eye sits 1400 in front of the badge's resting centre. Badge-local
   frame: x right (as seen at rest), y up, z out of the front face. */

import { clamp01 } from '../geometry.ts';

/** The badge: ±BW2 × ±BH2, its faces at z = ±HZ (+z is the front face). */
export const CARD = { BW2: 115.5, BH2: 250, HZ: 5 } as const;

/** How far the eye sits in front of the badge's resting centre. */
export const EYE_DISTANCE = 1400;

/** The whole motion, one way, in ms (v10's). */
export const HAND_TURN_MS = 1800;

/** The lift at t = 1 in v10: 218 toward the eye (the badge 1.184 × its resting size). */
export const SPIKE_LIFT_END = 218;

export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const smooth = (t: number) => t * t * (3 - 2 * t);

/** A monotone cubic keyframe track (Fritsch–Carlson) with flat tangents at the ends. */
function track(keys: ReadonlyArray<readonly [number, number]>): (t: number) => number {
  const n = keys.length;
  const d: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) d[i] = (keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]);
  m[0] = 0;
  m[n - 1] = 0;
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    if (t >= keys[n - 1][0]) return keys[n - 1][1];
    let j = 0;
    while (t > keys[j + 1][0]) j++;
    const h = keys[j + 1][0] - keys[j][0];
    const u = (t - keys[j][0]) / h;
    const u2 = u * u;
    const u3 = u2 * u;
    return (
      (2 * u3 - 3 * u2 + 1) * keys[j][1] +
      (u3 - 2 * u2 + u) * h * m[j] +
      (-2 * u3 + 3 * u2) * keys[j + 1][1] +
      (u3 - u2) * h * m[j + 1]
    );
  };
}

// v10's tracks: turn angle (degrees), lift toward the eye, screen offsets, roll (degrees). All but the lift unchanged.
const TH = track([[0, 0], [0.21, 0], [0.27, 7], [0.37, 52], [0.45, 104], [0.55, 160], [0.655, 192], [0.78, 175.5], [0.9, 181], [1, 180]]);
// The lift is v10's up to edge-on, then trimmed (Jim, 2026-11-20): v10 overshot to 244 at t .655 and settled back to
// 218, which drew the back a little larger than it is laid out. Its keys past edge-on are scaled so the peak is the
// end value (228 → 207.5, 244 → 218) and the settle dips below it instead (220 → 217). A monotone cubic never
// passes a key's value, so it never lifts past the end.
const TZ = track([[0, 0], [0.19, 0], [0.27, 30], [0.43, 168], [0.56, 207.5], [0.655, SPIKE_LIFT_END], [0.8, 212], [0.92, 217], [1, SPIKE_LIFT_END]]);
const TY = track([[0, 0], [0.19, 0], [0.27, -14], [0.43, -44], [0.58, -30], [0.7, -2], [0.84, -10], [1, -6]]);
const TX = track([[0, 0], [0.24, 0], [0.42, -12], [0.6, 5], [0.8, -1.5], [1, 0]]);
const ROLL = track([[0, 0], [0.2, 0], [0.28, -2.5], [0.43, -6.5], [0.6, 3.4], [0.77, -1.4], [0.9, 0.4], [1, 0]]);
/** The hand rising into the grip (0 → 1 over the reach). */
const HAND_IN = track([[0, 0], [0.03, 0.1], [0.135, 0.84], [0.19, 1]]);

/** Where the badge is at t: v10's one matrix, as its parts. */
export interface BadgeState {
  /** The turn about the badge's long axis, degrees (0 front up, 180 back up; overshoots to 192). */
  th: number;
  /** Lifted this far toward the eye. */
  tz: number;
  /** Screen offsets (applied after the perspective, so they read the same at any lift). */
  tx: number;
  ty: number;
  /** Roll in the screen's plane, degrees (clockwise on screen). */
  roll: number;
}

/**
 * The badge at t. `liftEnd` re-scales the lift so it ends there instead of
 * v10's 218 (so the badge lands at exactly the held close-up's size);
 * the curve's shape is v10's.
 */
export function badgeAt(t: number, liftEnd: number = SPIKE_LIFT_END): BadgeState {
  return { th: TH(t), tz: (TZ(t) * liftEnd) / SPIKE_LIFT_END, tx: TX(t), ty: TY(t), roll: ROLL(t) };
}

/** How far the badge has been lifted, 0 at rest to 1 held (clamped through the overshoot). */
export const liftAt = (t: number) => clamp01(TZ(t) / SPIKE_LIFT_END);

/** The badge's magnification on screen at lift `tz`: the eye is EYE_DISTANCE in front of it at rest. */
export const magnificationAt = (tz: number) => EYE_DISTANCE / (EYE_DISTANCE - tz);

/** The lift that magnifies the badge by `zoom`. */
export const liftForZoom = (zoom: number) => EYE_DISTANCE * (1 - 1 / zoom);

// ---- The hand ---------------------------------------------------------------------------------------------

/** Names of the key poses (keys.ts). */
export type KeyName = 'A' | 'G' | 'M' | 'M1' | 'M2' | 'P';

/**
 * The key schedule over the turn angle |θ| (degrees): hold the grab while the front faces you, slide and roll once it
 * faces away, settle into P.
 */
const TURN_KEYS: ReadonlyArray<readonly [number, KeyName]> = [
  [0, 'G'],
  [80, 'G'],
  [132, 'M'],
  [153, 'M1'],
  [165, 'M2'],
  [175, 'P'],
];

/** When the reach ends: from here on the pose follows the turn. */
export const REACH_END = 0.19;

/** The hand's pose at t: a blend of two key poses, and (during the reach) an offset down and out to the right. */
export interface HandBlend {
  from: KeyName;
  to: KeyName;
  /** 0 → `from`, 1 → `to`. */
  u: number;
  /** Added to the wrist's place (badge-local px) while the hand rises into the grip. */
  rise: { dx: number; dy: number };
  /** False while the hand is still arriving: no digit rests on the card yet. */
  arrived: boolean;
}

export function handBlendAt(t: number, th: number = TH(t)): HandBlend {
  if (t < REACH_END) {
    // The fist closes while still under the card; the whole hand, offset down and out to the right, slides up onto
    // the corner, the card's edge going into the gap between the thumb and the hooked fingertips.
    const rise = HAND_IN(t);
    const r1 = 1 - rise;
    return {
      from: 'A',
      to: 'G',
      u: smooth(seg(t, 0.04, 0.125)),
      rise: { dx: 40 * r1, dy: -420 * Math.pow(r1, 1.1) },
      arrived: rise >= 0.995,
    };
  }
  const a = Math.abs(th);
  let i = 0;
  while (i < TURN_KEYS.length - 2 && a > TURN_KEYS[i + 1][0]) i++;
  const [a0, from] = TURN_KEYS[i];
  const [a1, to] = TURN_KEYS[i + 1];
  return { from, to, u: smooth(seg(a, a0, a1)), rise: { dx: 0, dy: 0 }, arrived: true };
}

/**
 * The forearm belongs to the wearer: it aims at an elbow below the frame and back toward the body (world px, y up,
 * z toward the eye), which rises and comes forward as the badge is lifted.
 */
export const ELBOW_REST = [0, -1100, 20] as const;
export const ELBOW_UP = [295, -655, -205] as const;

/** Wrist soft limits (degrees): deviation (ulnar > 0), extension (> 0). */
export const WRIST_LIM = { dev: [-20, 20], ext: [-35, 30] } as const;

/**
 * Mid-turn the hand turns 180° with the card (a forearm twist), so the forearm's direction blends toward the hand's
 * own natural line (deviation, extension degrees, by turn angle), as if the elbow swings out with the turn, and back
 * to the elbow by the end. `armFollow` is how far.
 */
export function naturalForearm(th: number): readonly [number, number] {
  const u = smooth(seg(Math.abs(th), 90, 150));
  return [10 + 6 * u, -8 + 32 * u];
}

export function armFollow(th: number): number {
  const a = Math.abs(th);
  return smooth(seg(a, 15, 60)) * (1 - smooth(seg(a, 155, 177)));
}

/** The turn angle at t (degrees). */
export const turnAt = (t: number) => TH(t);
