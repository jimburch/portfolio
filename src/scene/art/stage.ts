/* The worn scene's stage: the coordinate system every piece of scene art is
   drawn in.

   Stage units are tied to the badge, not the window: the origin is the
   badge's top centre, y points down, and the badge is 500 units tall (so
   231 wide). The stylesheet (worn-scene.css) scales one unit to
   `--worn-u` px and lines the stage up with the badge, so the art always
   meets the badge, whatever its on-screen size. */

export interface Point {
  x: number;
  y: number;
}

/** A rectangle in stage units: an art layer's extent (its SVG viewBox). */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The most any art layer covers: wide enough to fill a 21:9 window at rest,
 * with room above and below for the camera, and a margin past every visible
 * edge so the blur never fades an edge into view. Layers that need less use a
 * smaller box (layers.ts), so no browser rasterizes more than it shows.
 */
export const ART_BOX: Box = { x: -960, y: -200, width: 1920, height: 820 };

/** The wearer's neck: its half-width and where its sides meet the collar. */
export const NECK = { halfWidth: 140, baseY: -86 } as const;

/** Past the art box's top and bottom edges: where shapes run off the art. */
export const ABOVE_ART = ART_BOX.y - 20;
export const BELOW_ART = ART_BOX.y + ART_BOX.height + 20;
