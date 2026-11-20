/* The lanyard, worn round the neck: two straps from the clip on the badge's
   top edge up to the sides of the neck, where they turn and pass behind it.

   Each strap is two runs (quadratic curves):
   - the FRONT run, from the clip up to a wrap point W just outside the neck's
     side, arriving there moving upward;
   - the BACK run, from W up and in behind the neck, narrowing as the ribbon
     turns edge-on, in the neck's shadow, and ending inside the neck's outline.

   Layering (the wearer's neck is its own layer, wearer.ts): the whole strap is
   drawn behind the neck, so the neck hides its far end; the front run is drawn
   again over the neck and lapels, fading out just before W so its end never
   shows as a cut. Each strap layer is a soft copy (out of focus toward the
   neck) under a sharp copy that fades out with distance from the clip.

   Ported from the hand-turn spike (v9/v10 "the lanyard goes round the neck"),
   at rest: the badge hangs flat on the chest and the straps are a taut V. */

import { NECK, type Box, type Point } from './stage';
import { boxAttributes, lerp, num, quadPoints, ribbonPath, smooth } from './svg';

const STRAP_WIDTH = 22;
/** The strap's centre stripe (a woven ribbon catches the light along its middle). */
const STRIPE_WIDTH = 7;
const STRAP = '#1d2a24';
const STRIPE = '#2c4036';
/** The clip on the badge's top edge, and where the straps leave it. */
const CLIP: Point = { x: 0, y: -13 };
const STRAP_END: Point = { x: 0, y: -19 };
const STRAP_END_SPREAD = 10;
/** Blur of the strap's soft copy (out of focus toward the neck), and of its sharp copy. */
const SOFT_BLUR = 4;
const SHARP_BLUR = 1.8;
/** The front run fades out over this radius around each wrap point. */
const WRAP_FADE = 46;
const FRONT_STEPS = 26;
/** The layer boxes: the straps (with their blur), and the clip. */
export const LANYARD_BOX: Box = { x: -210, y: -160, width: 420, height: 190 };
export const CLIP_BOX: Box = { x: -30, y: -40, width: 60, height: 60 };
const LANYARD_REGION = boxAttributes(LANYARD_BOX);
const BACK_STEPS = 14;

interface Strap {
  /** The wrap point W, where the strap turns behind the neck. */
  wrap: Point;
  /** Front run, from W down to the clip, with its widths. */
  front: Point[];
  frontWidths: number[];
  /** Back run, from its hidden end behind the neck up to W, with its widths. */
  back: Point[];
  backWidths: number[];
}

function strap(side: -1 | 1): Strap {
  const contour = side * (NECK.halfWidth + 6); // the neck's side where it meets the collar
  const wrap = { x: contour + side * (STRAP_WIDTH / 2 + 1), y: NECK.baseY - 6 };
  const end = { x: STRAP_END.x + side * STRAP_END_SPREAD, y: STRAP_END.y };
  // Below and a little inside W (60% of the way down to the clip), so the run
  // arrives at W moving up and hangs as a taut V rather than a loop.
  const control = { x: wrap.x - side * 24, y: lerp(wrap.y, end.y, 0.6) };
  const front = quadPoints(wrap, control, end, FRONT_STEPS);
  // Up and sharply in: the strap turns behind the neck just above W, so the
  // turn shows with neck above it even in the tight crop.
  const backEnd = { x: contour - side * 62, y: wrap.y - 18 };
  const back = quadPoints(backEnd, { x: wrap.x - side * 2, y: wrap.y - 14 }, wrap, BACK_STEPS);
  return {
    wrap,
    front,
    frontWidths: front.map(() => STRAP_WIDTH),
    back,
    backWidths: back.map((_, i) => lerp(STRAP_WIDTH / 2, STRAP_WIDTH, smooth(i / BACK_STEPS))),
  };
}

const STRAPS = [strap(-1), strap(1)] as const;

type Run = 'front' | 'whole';

function runPath(s: Strap, run: Run, widthScale: number): string {
  const points = run === 'front' ? s.front : s.back.concat(s.front.slice(1));
  const widths = run === 'front' ? s.frontWidths : s.backWidths.concat(s.frontWidths.slice(1));
  return ribbonPath(points, widths.map((w) => w * widthScale));
}

/** The straps' fill: the ribbon and its centre stripe; behind the neck, the back run shaded. */
function strapFill(run: Run): string {
  const paths = (scale: number) => STRAPS.map((s) => runPath(s, run, scale)).join('');
  const shade =
    run === 'whole'
      ? `<path d="${STRAPS.map((s) => ribbonPath(s.back, s.backWidths.map((w) => w + 1))).join('')}" fill="#000" opacity=".4"/>`
      : '';
  return (
    `<path d="${paths(1)}" fill="${STRAP}"/>` +
    `<path d="${paths(STRIPE_WIDTH / STRAP_WIDTH)}" fill="${STRIPE}" opacity=".8"/>` +
    shade
  );
}

/** A strap layer: soft copy, sharp copy near the clip; the front-only layer fades out at W. */
function strapLayer(run: Run): string {
  const reach = Math.hypot(STRAPS[0].front[FRONT_STEPS].x - STRAPS[0].wrap.x, STRAPS[0].front[FRONT_STEPS].y - STRAPS[0].wrap.y);
  const wrapFade =
    run === 'front'
      ? STRAPS.map((s) => `<circle cx="${num(s.wrap.x)}" cy="${num(s.wrap.y)}" r="${WRAP_FADE}" fill="url(#wrap-fade)"/>`).join('')
      : '';
  const fill = strapFill(run);
  return (
    '<defs>' +
    `<filter id="soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="${SOFT_BLUR}"/></filter>` +
    `<filter id="sharp" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="${SHARP_BLUR}"/></filter>` +
    '<radialGradient id="wrap-fade"><stop offset=".25" stop-color="#000"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
    `<mask id="ends" maskUnits="userSpaceOnUse" ${LANYARD_REGION}><rect ${LANYARD_REGION} fill="#fff"/>${wrapFade}</mask>` +
    `<radialGradient id="near-clip" gradientUnits="userSpaceOnUse" cx="${num(CLIP.x)}" cy="${num(STRAP_END.y)}" r="${num(reach)}">` +
    '<stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>' +
    `<mask id="focus" maskUnits="userSpaceOnUse" ${LANYARD_REGION}><rect ${LANYARD_REGION} fill="url(#near-clip)"/></mask>` +
    '</defs>' +
    `<g mask="url(#ends)"><g filter="url(#soft)">${fill}</g>` +
    `<g mask="url(#focus)"><g filter="url(#sharp)">${fill}</g></g></g>`
  );
}

/** The whole lanyard, drawn behind the neck. */
export const lanyardBehindSvg = (): string => strapLayer('whole');

/** The straps' front runs, drawn over the neck and lapels. */
export const lanyardFrontSvg = (): string => strapLayer('front');

/** The straps' shadow on the wearer: the front runs, nudged down and out, fainter toward W. */
export function strapShadowSvg(): string {
  const paths = STRAPS.map((s) => {
    const points = s.front.map((p, i) => {
      const u = i / FRONT_STEPS;
      return { x: p.x + 3 * u, y: p.y + 5 * u };
    });
    return ribbonPath(points, s.frontWidths);
  }).join('');
  return (
    '<defs><filter id="strap-shadow" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="7"/></filter></defs>' +
    `<path d="${paths}" fill="#000" opacity=".15" filter="url(#strap-shadow)"/>`
  );
}

/** The metal clip on the badge's top edge; its tab goes behind the badge. */
export function clipSvg(): string {
  return (
    `<g transform="translate(${num(CLIP.x)} ${num(CLIP.y)})">` +
    '<rect x="-21" y="-16" width="42" height="26" rx="5" fill="#9aa1a9"/>' +
    '<rect x="-21" y="-16" width="42" height="12" rx="5" fill="#c9cfd5"/>' +
    '<rect x="-9" y="-10" width="18" height="6" rx="3" fill="#5e656d"/>' +
    '<rect x="-6" y="8" width="12" height="16" rx="2" fill="#7c838b"/></g>'
  );
}
