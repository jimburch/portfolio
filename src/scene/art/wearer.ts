/* The wearer: a flat-vector person in a dark jacket and open-necked shirt,
   cropped to the chest and neck. Drawn in two layers so the lanyard can pass
   between them: the body (jacket, collar stand, open shirt) behind the
   straps, and the neck with the lapels in front of their far ends.

   Ported from the hand-turn spike (v10). The stylesheet blurs both layers
   heavily (depth of field), so shapes are simple and edges are soft on screen. */

import { ABOVE_ART, ART_BOX, BELOW_ART, NECK, type Box } from './stage';

const SKIN = '#b98a6c';
const SKIN_SHADE_LEFT = '#94684f';
const SKIN_SHADE_RIGHT = '#a1735a';
const JACKET = '#2b3442';
const JACKET_DARK = '#1d242f';
const JACKET_LIGHT = '#3a4658';
const JACKET_SIDE = '#343f50';

/** The neck layer's box: the neck and lapels, with room for the blur. */
export const NECK_BOX: Box = {
  x: -(NECK.halfWidth + 60),
  y: ART_BOX.y,
  width: 2 * (NECK.halfWidth + 60),
  height: NECK.baseY + 360 - ART_BOX.y,
};

/** Path data mirrored about the badge's centre line (x → -x). */
type Shape = (side: -1 | 1) => string;
const bothSides = (shape: Shape, attrs: string): string =>
  ([-1, 1] as const).map((side) => `<path d="${shape(side)}" ${attrs}/>`).join('');

/** The body: jacket, collar stand and the open neck of the shirt. */
export function bodySvg(): string {
  const h = NECK.halfWidth;
  const b = NECK.baseY;
  const top = ABOVE_ART;
  const bottom = BELOW_ART;

  // Shoulders slope down from the collar, which rises behind the neck.
  const jacket =
    `M-1000 ${bottom}L-1000 ${b + 176}L-720 ${b + 80}Q-470 ${b - 6} ${-(h + 40)} ${b - 10}` +
    `L${-(h + 16)} ${top}L${h + 16} ${top}L${h + 40} ${b - 10}Q470 ${b - 6} 720 ${b + 80}` +
    `L1000 ${b + 176}L1000 ${bottom}Z`;
  // The collar stand, darker, wrapping the base of the neck (its back half hides behind it).
  const collarStand = (s: -1 | 1) =>
    `M${s * (h + 100)} ${b + 16}Q${s * (h + 46)} ${b} ${s * (h + 22)} ${b - 28}` +
    `L${s * (h + 10)} ${top}L${s * (h - 28)} ${top}L${s * (h - 8)} ${b - 10}` +
    `Q${s * (h + 22)} ${b + 24} ${s * (h + 72)} ${b + 34}Z`;
  // The open shirt: skin from the base of the neck down to the V (behind the badge).
  const openNeck =
    `M${-(h + 6)} ${b - 6}Q${-(h - 30)} ${b + 180} 0 ${b + 300}` +
    `Q${h - 30} ${b + 180} ${h + 6} ${b - 6}Q0 ${b + 50} ${-(h + 6)} ${b - 6}Z`;
  // A lighter panel down the jacket front, either side of the V.
  const front =
    `M-400 ${b + 10}Q-240 ${b + 330} -224 ${bottom}L224 ${bottom}Q240 ${b + 330} 400 ${b + 10}` +
    `Q160 ${b + 170} 0 ${b + 300}Q-160 ${b + 170} -400 ${b + 10}Z`;
  // Darker sides toward the arms.
  const side = (s: -1 | 1) =>
    `M${s * 520} ${b + 470}Q${s * 340} ${b + 420} ${s * 260} ${b + 550}` +
    `L${s * 280} ${bottom}L${s * 560} ${bottom}Z`;

  return (
    `<path d="${jacket}" fill="${JACKET}"/>` +
    bothSides(collarStand, `fill="${JACKET_DARK}"`) +
    `<path d="${openNeck}" fill="${SKIN}" opacity=".9"/>` +
    `<path d="${front}" fill="${JACKET_LIGHT}" opacity=".45"/>` +
    bothSides(side, `fill="${JACKET_SIDE}" opacity=".55"`)
  );
}

/** The neck column (sides shaded, turning away from the light) and the lapels over its base. */
export function neckSvg(): string {
  const h = NECK.halfWidth;
  const b = NECK.baseY;
  const top = ABOVE_ART;
  // One side's contour, from above the art down to where it meets the collar (x signed by side).
  const contour = (s: -1 | 1) =>
    `M${s * h} ${top}C${s * h} ${b - 40} ${s * (h + 1)} ${b - 20} ${s * (h + 6)} ${b}`;
  const column = `${contour(-1)}Q0 ${b + 58} ${h + 6} ${b}C${h + 1} ${b - 20} ${h} ${b - 40} ${h} ${top}Z`;
  const shade = (s: -1 | 1) =>
    `${contour(s)}Q${s * (h - 14)} ${b + 8} ${s * (h - 30)} ${b + 10}` +
    `C${s * (h - 26)} ${b - 30} ${s * (h - 26)} ${b - 50} ${s * (h - 28)} ${top}Z`;
  // The lapels, from the base of the neck down the V.
  const lapel = (s: -1 | 1) =>
    `M${s * (h + 6)} ${b - 6}Q${s * (h - 30)} ${b + 180} 0 ${b + 300}Q${s * 74} ${b + 178} ${s * 110} ${b + 24}Z`;

  return (
    `<path d="${column}" fill="${SKIN}"/>` +
    `<path d="${shade(-1)}" fill="${SKIN_SHADE_LEFT}"/>` +
    `<path d="${shade(1)}" fill="${SKIN_SHADE_RIGHT}"/>` +
    bothSides(lapel, `fill="${JACKET_DARK}"`)
  );
}
