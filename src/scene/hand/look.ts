/* The hand's toon look, as in the v10 spike: flat illustration bands from a
   gradient map, and inverted-hull outlines whose width is set in world
   units (spike px), so they scale with the badge on screen. Shared by the
   hand turn's canvases and the resting-hand images (scripts/hand). */

import * as THREE from 'three';

// Skin: a warm mid tone over most of the hand, a reddish-brown shadow band and a small highlight. The model's vertex
// colours warm the fingertips and knuckles (they multiply these bands).
export const SKIN = { shade: '#ad5d41', base: '#d8926b', light: '#eeae86', line: '#5a2a1b' } as const;
// The sleeve: the jacket's navy in three bands; fog toward the jacket colour makes it recede toward the elbow.
export const JACKET = { shade: '#1b212c', base: '#29323f', light: '#3a465b', line: '#0d1016' } as const;
/** Outline widths, world units (spike px). */
export const LINE = { outer: 2.3, inner: 1.0, clothOuter: 1.7, clothInner: 0.9 } as const;

type Stops = ReadonlyArray<readonly [number, string]>;

/** stops: [[up to 0..1, '#hex'], ...] over dotNL × 0.5 + 0.5, written as sRGB bytes (the texture is tagged sRGB). */
function ramp(stops: Stops, n: number): THREE.DataTexture {
  const data = new Uint8Array(n * 4);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    c.set(stops.find((s) => u <= s[0])![1]);
    const s = c.clone().convertLinearToSRGB();
    data.set([Math.round(s.r * 255), Math.round(s.g * 255), Math.round(s.b * 255), 255], i * 4);
  }
  const tex = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

// The gradient map holds the palette itself (RGB), and the material is white, so each band lands on an exact tone.
const RGB_GRADIENT = THREE.ShaderChunk.gradientmap_pars_fragment.replace(
  'vec3( texture2D( gradientMap, coord ).r )',
  'texture2D( gradientMap, coord ).rgb',
);

function toon(stops: Stops): THREE.MeshToonMaterial {
  const m = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: ramp(stops, 20) });
  m.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace('#include <gradientmap_pars_fragment>', RGB_GRADIENT);
  };
  return m;
}

/** The uniforms every outline reads: the render target (device px) and device px per world unit. */
export interface OutlineScale {
  uRes: { value: THREE.Vector2 };
  uPr: { value: number };
}

export interface HandLook {
  outline: OutlineScale;
  skin: THREE.Material;
  sleeve: THREE.Material;
  skinSilhouette: THREE.Material;
  skinLine: THREE.Material;
  skinWristLine: THREE.Material;
  clothSilhouette: THREE.Material;
  clothLine: THREE.Material;
}

/** Sets the outlines' scale: a target `width` × `height` device px, `pxPerUnit` device px per world unit. */
export function scaleOutlines(look: HandLook, width: number, height: number, pxPerUnit: number): void {
  look.outline.uRes.value.set(width, height);
  look.outline.uPr.value = pxPerUnit;
}

export function createLook(): HandLook {
  const outline: OutlineScale = { uRes: { value: new THREE.Vector2(1, 1) }, uPr: { value: 1 } };

  // Inverted hull, pushed along a smoothed normal (no cracks at UV seams). A SILHOUETTE hull is drawn before the hand
  // and writes no depth (the mesh covers all of it but what sticks out past the silhouette); it tests depth only
  // against what is drawn before it, the card's edge (card-edge.ts), so a finger behind the edge loses its outline
  // there too. An INNER hull is depth-tested (where a finger crosses the palm or another finger). `masked`: the width
  // is scaled per vertex by `hullMask`.
  function outlineMat(hex: string, width: number, silhouette: boolean, fog = false, masked = false) {
    const m = new THREE.MeshBasicMaterial({ color: hex, side: THREE.BackSide, fog });
    if (silhouette) m.depthWrite = false;
    const uWidth = { value: width };
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uWidth = uWidth;
      sh.uniforms.uPr = outline.uPr;
      sh.uniforms.uRes = outline.uRes;
      const head =
        'attribute vec3 hullNormal;\nuniform float uWidth;\nuniform float uPr;\nuniform vec2 uRes;\n' +
        (masked ? 'attribute float hullMask;\n#define HULL_W (uWidth * hullMask)\n' : '#define HULL_W uWidth\n');
      sh.vertexShader =
        head +
        sh.vertexShader.replace(
          '#include <project_vertex>',
          `#include <project_vertex>
      vec3 hN = hullNormal;
      #ifdef USE_SKINNING
        hN = ( skinMatrix * vec4( hN, 0.0 ) ).xyz;
      #endif
      vec3 vN = normalize( normalMatrix * hN );
      vec4 c1 = projectionMatrix * ( mvPosition + vec4( vN, 0.0 ) );
      vec2 dir = c1.xy / c1.w - gl_Position.xy / gl_Position.w;
      dir = dir / max( length( dir ), 1e-6 );
      gl_Position.xy += dir * HULL_W * uPr * 2.0 / uRes * gl_Position.w;
      gl_Position.z += 0.0004 * gl_Position.w;`,
        );
    };
    return m;
  }

  const skin = toon([
    [0.44, SKIN.shade],
    [0.91, SKIN.base],
    [1, SKIN.light],
  ]);
  skin.vertexColors = true;
  skin.fog = false;
  const sleeve = toon([
    [0.44, JACKET.shade],
    [0.84, JACKET.base],
    [1, JACKET.light],
  ]);
  sleeve.vertexColors = true;

  return {
    outline,
    skin,
    sleeve,
    skinSilhouette: outlineMat(SKIN.line, LINE.outer, true),
    skinLine: outlineMat(SKIN.line, LINE.inner, false),
    // The wrist's outline where it goes into the sleeve: depth-tested (the cuff's lip covers it), full outer width,
    // only on the forearm part of the skin.
    skinWristLine: outlineMat(SKIN.line, LINE.outer, false, false, true),
    clothSilhouette: outlineMat(JACKET.line, LINE.clothOuter, true, true),
    clothLine: outlineMat(JACKET.line, LINE.clothInner, false, true),
  };
}

/** Averages the normals of vertices that share a position, for the hulls (`hullNormal`). */
export function addHullNormals(geom: THREE.BufferGeometry): void {
  const pos = geom.attributes.position;
  const nrm = geom.attributes.normal;
  const map = new Map<string, number[]>();
  const out = new Float32Array(pos.count * 3);
  const key = (i: number) => [pos.getX(i), pos.getY(i), pos.getZ(i)].map((v) => Math.round(v * 1e5)).join(',');
  for (let i = 0; i < pos.count; i++) {
    const k = key(i);
    const a = map.get(k) ?? [0, 0, 0];
    a[0] += nrm.getX(i);
    a[1] += nrm.getY(i);
    a[2] += nrm.getZ(i);
    map.set(k, a);
  }
  for (let i = 0; i < pos.count; i++) {
    const a = map.get(key(i))!;
    const l = Math.hypot(a[0], a[1], a[2]) || 1;
    out.set([a[0] / l, a[1] / l, a[2] / l], i * 3);
  }
  geom.setAttribute('hullNormal', new THREE.BufferAttribute(out, 3));
}
