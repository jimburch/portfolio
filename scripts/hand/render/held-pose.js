// The v10 spike's final pose (t = 1): the badge turned 180° and lifted toward the camera, held in the phone grip.
// Every number is v10's (docs/reference/hand-turn-spike/spike-grab-turn-v10.html); only the final frame is kept.
//
// World units are the spike's stage px (a 1280 × 800 stage). three.js frame: origin at the stage centre, x right,
// y up, z toward the camera. The camera is the spike's CSS perspective: the eye at z = P over the stage centre.

/** The spike's stage and camera. */
export const STAGE = { width: 1280, height: 800, perspective: 1400 };

/** The card, badge-local px: ±BW2 × ±BH2, faces at z = ±HZ (+z is the front face). */
export const CARD = { BW2: 115.5, BH2: 250, HZ: 5 };

/** The badge at t = 1: turned 180° about its long axis, lifted 218 px toward the camera, 6 px up on screen. */
export const BADGE_FINAL = { th: 180, tz: 218, ty: -6, tx: 0, roll: 0 };

/** Metres → stage px for the hand model. */
export const HAND_SCALE = 2430;

/** The wearer's elbow once the badge is lifted (world px); the forearm aims at it. */
export const ELBOW_UP = [295, -655, -205];

/** Wrist soft limits (degrees): deviation (ulnar > 0), extension (> 0). */
export const WRIST_LIM = { dev: [-20, 20], ext: [-35, 30] };

/** How far a resting pad sits off the face (px). */
export const GAP = 1.5;

// P, presenting: palm behind the card, all four fingertips curled over the card's +x long edge (the LEFT edge as
// seen once turned) onto the visible face, the thumb pad on the face just inside the other edge. Badge-local px:
// place = wrist position, hand direction (wrist → knuckles) and palm normal; fingers = [spread, mcp, pip, dip, cup,
// baked curl] degrees; thumb = { cmc: [x, y, z], mcp, ip, curl }. Contacts: -1 = rest on the back face (toward the
// camera once turned).
export const KEY_P = {
  place: { p: [-80, -265, 141.3], F: [0.6179, 0.7364, -0.2756], N: [-0.1772, -0.2112, -0.9613] },
  fingers: {
    index: [-27, -10, 35, 74, 0, 12.1],
    middle: [-33, -10, 65, 15.5, 0, 53.9],
    ring: [-25, 8, 75, 71.5, 4, 25.9],
    pinky: [-27.5, -2, 62.5, 89.5, 8, 25],
  },
  thumb: { cmc: [36.8, 31.2, 37.5], mcp: 58, ip: 75.4, curl: -3.4 },
  contacts: { index: -1, middle: -1, ring: -1, pinky: -1, thumb: -1 },
};
