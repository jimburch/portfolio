/* v10's key poses for the hand (docs/reference/hand-turn-spike/), unchanged but for P's place (slid out
   over the edge, so the fingers cover less of the face) and the digits re-rested to match.

   Badge-local px, three.js axes: x right (as seen at rest), y up, z out of
   the FRONT face (the LCD side). The card is ±115.5 × ±250 with faces at
   z = ±5.

   A pose: `place` = the wrist's position, the hand's direction (wrist →
   knuckles, F) and its palm normal (out of the palm, N); `fingers` =
   [spread, mcp, pip, dip, metacarpal cup, baked curl] degrees (flex > 0
   curls toward the palm); `thumb` = { cmc: [x, y, z] on the metacarpal, mcp
   and ip flex, baked curl }. `contacts`: the digits the contact solve rests
   on a face (+1 the front face, -1 the back face). A baked curl is the
   solve's own curl, applied the same way, so a key reached unsolved looks
   solved. The forearm is not part of a pose: it aims at the wearer's elbow.

   The grip never lets go: the hand stays on the front side of the card,
   the fingers hooked round its +x long edge, the thumb on the front face;
   between the keys it only slides and rolls, while the front faces away. */

import type { KeyName } from './timeline.ts';

export type FingerName = 'index' | 'middle' | 'ring' | 'pinky';
export type DigitName = FingerName | 'thumb';

export interface KeyPose {
  place: { p: readonly number[]; F: readonly number[]; N: readonly number[] };
  fingers: Record<FingerName, readonly number[]>;
  thumb: { cmc: readonly number[]; mcp: number; ip: number; curl?: number };
  contacts?: Partial<Record<DigitName, 1 | -1>>;
}

export const KEYS: Record<KeyName, KeyPose> = {
  // A: the open hand rising into G: G's placement, fingers loose, thumb out.
  A: {
    place: { p: [72.7, -450.8, 80], F: [0.342, 0.94, 0.3], N: [0, 0, -1] },
    fingers: { index: [0, 12, 18, 8], middle: [0, 14, 20, 8], ring: [0, 18, 24, 10, 3], pinky: [0, 22, 26, 12, 6] },
    thumb: { cmc: [10, -20, 30], mcp: 5, ip: 5 },
  },
  // G: the grab at the bottom-right corner: the fist closes on the corner from in front, the fingertips hooked round
  // the +x edge onto the back, the thumb pad pressing the front beside the bottom keys, clear of the screen.
  G: {
    place: { p: [72.7, -450.8, 80], F: [0.342, 0.94, 0.3], N: [0, 0, -1] },
    fingers: {
      index: [-15, 60, 40, 24, 0, 36.5],
      middle: [5, 70, 95, 57, 0, -37.5],
      ring: [20, 60, 95, 57, 4, -45.6],
      pinky: [20, 40, 40, 24, 8],
    },
    thumb: { cmc: [20, -30, 60], mcp: 25, ip: 10, curl: 58 },
    contacts: { thumb: 1, index: -1, middle: -1, ring: -1, pinky: -1 },
  },
  // M: mid-slide, the front facing away: all four fingers stay hooked on the +x edge, the thumb tucked close behind
  // the card.
  M: {
    place: { p: [59.9, -400.1, 171], F: [0.3561, 0.9276, -0.1128], N: [-0.0477, -0.0569, -0.9972] },
    fingers: {
      index: [-21, 25, 37.5, 49, 0, 28.3],
      middle: [-0.9, 56, 91, 51.1, 0, -23.5],
      ring: [12.6, 49.9, 92.7, 57.7, 4, -33.5],
      pinky: [11.7, 31.3, 45, 32.6, 8, 35],
    },
    thumb: { cmc: [40.2, -17.4, -2.4], mcp: 52.7, ip: 82.4 },
    contacts: { index: -1, middle: -1, ring: -1, pinky: -1 },
  },
  // M1: P's hand, the thumb still behind the card but already past the -x edge, so M1 → M2 brings it round the edge.
  M1: {
    place: { p: [-80, -265, 141.3], F: [0.6179, 0.7364, -0.2756], N: [-0.1772, -0.2112, -0.9613] },
    fingers: {
      index: [-27, -10, 35, 74, 0, 12.1],
      middle: [-33, -10, 65, 15.5, 0, 53.9],
      ring: [-25, 8, 75, 71.5, 4, 25.9],
      pinky: [-27.5, -2, 62.5, 89.5, 8, 25],
    },
    thumb: { cmc: [69.5, 6.7, 9.8], mcp: 65, ip: 99.5 },
    contacts: { index: -1, middle: -1, ring: -1, pinky: -1 },
  },
  // M2: P's hand, the thumb waiting just outside the -x edge (off both faces); P then presses it onto the face.
  M2: {
    place: { p: [-80, -265, 141.3], F: [0.6179, 0.7364, -0.2756], N: [-0.1772, -0.2112, -0.9613] },
    fingers: {
      index: [-27, -10, 35, 74, 0, 12.1],
      middle: [-33, -10, 65, 15.5, 0, 53.9],
      ring: [-25, 8, 75, 71.5, 4, 25.9],
      pinky: [-27.5, -2, 62.5, 89.5, 8, 25],
    },
    thumb: { cmc: [69.3, 7.4, -3.1], mcp: 61.4, ip: 96.5 },
    contacts: { index: -1, middle: -1, ring: -1, pinky: -1 },
  },
  // P: presenting. Palm behind the card, all four fingertips curled over the +x long edge (the LEFT edge once
  // turned) onto the visible face, index highest, little finger lowest; the thumb pad on the face just inside the
  // other edge. v10's grip slid 10 px out along +x (2026-11-21), so the fingertips reach 38 units in over the face,
  // not v10's 48 (the held view keeps its text clear of them; held-hand.json `reach`). The index spreads 6° more
  // (else it dips into the card while the hand slides out from M2), the index and little finger curl 12.9° and
  // 0.6° more to rest on the face again, and the thumb is re-aimed to rest just inside the other edge.
  // Wrist 9° ulnar / 16° extension.
  P: {
    place: { p: [-70, -265, 141.3], F: [0.6179, 0.7364, -0.2756], N: [-0.1772, -0.2112, -0.9613] },
    fingers: {
      index: [-33, -10, 35, 74, 0, 25],
      middle: [-33, -10, 65, 15.5, 0, 53.9],
      ring: [-25, 8, 75, 71.5, 4, 25.9],
      pinky: [-27.5, -2, 62.5, 89.5, 8, 25.6],
    },
    thumb: { cmc: [48, 24.4, 21.5], mcp: 55.8, ip: 85.2 },
    contacts: { index: -1, middle: -1, ring: -1, pinky: -1, thumb: -1 },
  },
};
