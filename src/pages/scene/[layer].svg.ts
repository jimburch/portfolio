import type { APIRoute, GetStaticPaths } from 'astro';
import { SCENE_ART, sceneArtDocument, type SceneLayer } from '../../scene/art/layers';

/** The worn desktop scene's art, prerendered to static SVG files. */
export const getStaticPaths = (() =>
  Object.keys(SCENE_ART).map((layer) => ({ params: { layer } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) =>
  new Response(sceneArtDocument(params.layer as SceneLayer), {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
