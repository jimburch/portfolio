/* The card's edge in the hand's 3D scene: the badge's thickness, as v10
   drew it. The DOM faces are the card's front and back; this is the band
   between them, the outline (rounded corners and all) run back from one
   face to the other, CARD.HZ either side of the mid-plane. Drawn in the
   badge's frame, so it turns with the badge and the hand, and depth-tested
   with the hand, so fingers in front of it cover it and fingers behind it
   are hidden. Only its outside faces are drawn: edge-on it is a solid bar,
   face on there is nothing to see.

   Unlit, like v10's edge faces: the colour runs across the thickness, dark
   at both faces and lit along the middle, brightest on the long edges (v10
   lit them more than the top and bottom). Coloured from the board's colour,
   so a reskinned board has a matching edge. */

import * as THREE from 'three';
import { cardOutline } from './hand-scene.ts';
import { CARD } from './timeline.ts';

/** Across the thickness, back face to front face: where each colour sits (0 to 1), as v10's edge gradient. */
const STOPS = [0, 0.3, 0.5, 0.7, 1] as const;
type Tone = 'dark' | 'board' | 'lit';
const TONES: readonly Tone[] = ['dark', 'board', 'lit', 'board', 'dark'];

/**
 * The edge's tones from the board's colour, matched to v10's edge on its board (#1b6b4e): the faces' edges
 * #072519, the long edges' lit middle #4fae88, the top and bottom's #24775a.
 */
function tones(board: THREE.Color) {
  // In CSS's sRGB terms, as the board's colour was written.
  const hsl = board.getHSL({ h: 0, s: 0, l: 0 }, THREE.SRGBColorSpace);
  const tone = (s: number, l: number) =>
    new THREE.Color().setHSL(hsl.h, Math.min(1, s), Math.min(1, l), THREE.SRGBColorSpace);
  return {
    dark: tone(hsl.s * 1.14, hsl.l * 0.33),
    board: board.clone(),
    litLong: tone(hsl.s * 0.63, hsl.l + 0.233),
    litShort: tone(hsl.s * 0.9, hsl.l * 1.16),
  };
}

export interface CardEdge {
  readonly mesh: THREE.Mesh;
  /** Colours the edge from the board's colour (any CSS colour three.js reads, such as the `--board` token's hex). */
  setBoard(colour: string): void;
  /** Whether any of the edge faces an eye at `eye` (in the badge's frame): only once the eye is out past its outline. */
  seenFrom(eye: { x: number; y: number }): boolean;
}

export function createCardEdge(perCorner = 6): CardEdge {
  const outline = cardOutline(perCorner);
  const n = outline.length;
  const rings = STOPS.length;
  const position = new Float32Array(n * rings * 3);
  for (let r = 0; r < rings; r++) {
    const z = -CARD.HZ + 2 * CARD.HZ * STOPS[r];
    outline.forEach((p, i) => position.set([p.x, p.y, z], (r * n + i) * 3));
  }
  // Outside faces only, wound counter-clockwise seen from outside (the outline runs counter-clockwise).
  const index: number[] = [];
  for (let r = 0; r < rings - 1; r++)
    for (let i = 0; i < n; i++) {
      const a = r * n + i;
      const b = r * n + ((i + 1) % n);
      index.push(a, b, b + n, a, b + n, a + n);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  const color = new THREE.BufferAttribute(new Float32Array(n * rings * 3), 3);
  geometry.setAttribute('color', color);
  geometry.setIndex(index);

  const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }));
  // Before the hand's silhouette outlines (renderOrder -1), which test depth against it (look.ts).
  mesh.renderOrder = -2;
  mesh.frustumCulled = false;

  const c = new THREE.Color();
  function setBoard(colour: string) {
    const t = tones(new THREE.Color(colour));
    for (let r = 0; r < rings; r++)
      outline.forEach((p, i) => {
        const tone = TONES[r];
        if (tone === 'lit') c.lerpColors(t.litShort, t.litLong, Math.abs(p.nx));
        else c.copy(t[tone]);
        color.setXYZ(r * n + i, c.r, c.g, c.b);
      });
    color.needsUpdate = true;
  }
  setBoard('#1b6b4e');

  // A facet faces the eye when the eye is on the outside of it; the facets run straight back, so depth doesn't count.
  const seenFrom = (eye: { x: number; y: number }) =>
    outline.some((p) => p.nx * (eye.x - p.x) + p.ny * (eye.y - p.y) > 0);

  return { mesh, setBoard, seenFrom };
}
