/* The worn scene's art layers, back to front: each a standalone SVG document
   over its own box (stage units). Served as static files at /scene/<name>.svg
   (pages/scene/[layer].svg.ts) and painted by worn-scene.css, only on a
   qualifying desktop. Between them the stylesheet adds the room behind, the
   badge's contact shadow, and the badge itself on top. */

import { CLIP_BOX, LANYARD_BOX, clipSvg, lanyardBehindSvg, lanyardFrontSvg, strapShadowSvg } from './lanyard';
import { ART_BOX, type Box } from './stage';
import { artDocument } from './svg';
import { NECK_BOX, bodySvg, neckSvg } from './wearer';

interface ArtLayer {
  box: Box;
  svg: () => string;
}

export const SCENE_ART = {
  /** The wearer's body, with the straps' shadow on it. */
  wearer: { box: ART_BOX, svg: () => bodySvg() + strapShadowSvg() },
  /** The whole lanyard; the neck (next) hides its far ends. */
  'lanyard-behind': { box: LANYARD_BOX, svg: lanyardBehindSvg },
  /** The neck and lapels. */
  neck: { box: NECK_BOX, svg: neckSvg },
  /** The straps' front runs, over the neck. Also the mask for their sheen. */
  'lanyard-front': { box: LANYARD_BOX, svg: lanyardFrontSvg },
  /** The clip on the badge's top edge. */
  clip: { box: CLIP_BOX, svg: clipSvg },
} satisfies Record<string, ArtLayer>;

export type SceneLayer = keyof typeof SCENE_ART;

export const sceneArtDocument = (layer: SceneLayer): string =>
  artDocument(SCENE_ART[layer].box, SCENE_ART[layer].svg());
