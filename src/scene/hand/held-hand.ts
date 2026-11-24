/* The resting hand on the held badge: two static images of the turn's final grip,
   one behind the badge (held-hand-behind.webp) and one in front of it
   (held-hand-front.webp, with the hand's soft shadow on the face). Rendered
   by scripts/hand/render-held-hand.mjs (`pnpm hand:images`), which also
   writes their framing (held-hand.json). held-view.css paints them, only on a
   qualifying desktop.

   The framing contract (scripts/hand/README.md has it in full): both images
   cover the same box, given in held-badge units (1/500 of the held badge's
   height, `--held-u`) from the held badge's top-left corner, x right and y
   down. Each is `pxPerUnit` image px per unit. Scale them to the box and
   they sit on the badge exactly as v10's final pose does. */

import framing from './held-hand.json' with { type: 'json' };

export interface HeldHandBox {
  /** Left edge, units right of the badge's left edge (negative: out past it). */
  x: number;
  /** Top edge, units below the badge's top edge. */
  y: number;
  width: number;
  height: number;
}

export interface HeldHandFraming {
  /** Image px per unit. */
  pxPerUnit: number;
  box: HeldHandBox;
  /** How far the solid hand reaches over the face, in units: the fingers in
      from the left edge, the thumb in from the right, its top and lowest point
      down from the top. The back keeps its content clear of these. */
  reach: { fingersFromLeft: number; thumbFromRight: number; lowestFromTop: number; highestFromTop: number };
}

export const HELD_HAND: HeldHandFraming = framing;
