// Builds the shipped hand model: public/hand/hand.glb, with the source asset's MIT licence next to it.
//
//   pnpm hand:model
//
// 1. Blender (headless) runs build_hand.py on the WebXR generic hand (source/, MIT, (c) 2019 Amazon): a short forearm,
//    finger volume, the wrist taper, the jacket sleeve, vertex colours, and KHR_mesh_quantization. Its output is the
//    spike's hand-v10.glb byte for byte (220,864 B).
// 2. That model is compressed with EXT_meshopt_compression, losslessly: the build has already quantized every
//    attribute, so nothing is re-quantized or filtered. The vertices and triangles are only put in a better order for
//    the GPU and the codec (meshopt's reorder), which shrinks the file by about a third.
// 3. The script decodes what it wrote and checks it is the same model: per mesh, the same triangles with the same
//    vertex values (position, normal, colour, joints, weights) and winding, and the same skeleton and bind matrices.
// Blender: BLENDER=/path/to/Blender overrides the default macOS app binary (the `blender` symlink on PATH can't find
// its bundled Python, so call the app binary).
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Logger, NodeIO } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { reorder } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const BLENDER = process.env.BLENDER || '/Applications/Blender.app/Contents/MacOS/Blender';
const SOURCE = join(HERE, 'source', 'webxr-generic-hand-right.glb');
const LICENCE = join(HERE, 'source', 'LICENSE-webxr-input-profiles.md');
const OUT_DIR = join(ROOT, 'public', 'hand');
const OUT = join(OUT_DIR, 'hand.glb');

/** Runs the Blender build into a temporary file; returns its bytes. */
function blenderBuild() {
  const work = mkdtempSync(join(tmpdir(), 'hand-build-'));
  const raw = join(work, 'hand-raw.glb');
  try {
    execFileSync(BLENDER, ['-b', '--python', join(HERE, 'build_hand.py'), '--', SOURCE, raw], {
      stdio: ['ignore', 'pipe', 'inherit'],
    })
      .toString()
      .split('\n')
      .filter((l) => l.startsWith('[build]'))
      .forEach((l) => console.log(l));
    return new Uint8Array(readFileSync(raw));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

/** A model's content, independent of vertex and triangle order: per mesh, its triangles, each written as its three
    corners' attribute values (rotated to start at its smallest corner, so winding is kept), sorted; plus every
    node's name, transform and children, and the skins' joints and inverse bind matrices. Node transforms are
    compared to 1e-7 (the writer drops a few joints' sub-nanometre translations and 1e-16 rotations as identity). */
function content(doc) {
  const root = doc.getRoot();
  const meshes = root.listMeshes().map((mesh) => {
    const tris = mesh.listPrimitives().flatMap((prim) => {
      const attrs = prim.listSemantics().sort().map((s) => prim.getAttribute(s));
      const corner = (i) => attrs.map((a) => a.getElement(i, []).join(',')).join('|');
      const idx = prim.getIndices().getArray();
      const out = [];
      for (let t = 0; t < idx.length; t += 3) {
        const c = [corner(idx[t]), corner(idx[t + 1]), corner(idx[t + 2])];
        const k = c.indexOf([...c].sort()[0]);
        out.push([c[k], c[(k + 1) % 3], c[(k + 2) % 3]].join(' / '));
      }
      return out;
    });
    return `${mesh.getName()}: ${tris.length} triangles\n${tris.sort().join('\n')}`;
  });
  const near = (v) => v.map((x) => Math.round(x * 1e7) / 1e7 || 0);
  const nodes = root.listNodes().map((n) =>
    [n.getName(), near(n.getTranslation()), near(n.getRotation()), near(n.getScale()), n.listChildren().map((c) => c.getName())].join(' '),
  );
  const skins = root.listSkins().map((s) =>
    [s.listJoints().map((j) => j.getName()).join(','), s.getInverseBindMatrices().getArray().join(',')].join(' '),
  );
  return [...meshes, ...nodes, ...skins];
}

function assertSameModel(expected, actual) {
  if (expected.length !== actual.length) throw new Error(`model has ${actual.length} parts, expected ${expected.length}`);
  expected.forEach((e, i) => {
    if (e !== actual[i]) throw new Error(`shipped model differs from the build: ${e.split('\n')[0]}`);
  });
}

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO()
  .setLogger(new Logger(Logger.Verbosity.WARN))
  .registerExtensions([KHRMeshQuantization, EXTMeshoptCompression])
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

const raw = blenderBuild();
const doc = await io.readBinary(raw);
const before = content(doc);

await doc.transform(reorder({ encoder: MeshoptEncoder, target: 'size' }));

doc
  .createExtension(EXTMeshoptCompression)
  .setRequired(true)
  .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
const shipped = await io.writeBinary(doc);

assertSameModel(before, content(await io.readBinary(shipped)));

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, shipped);
copyFileSync(LICENCE, join(OUT_DIR, 'LICENSE-webxr-input-profiles.md'));
console.log(`[model] built ${raw.byteLength} B -> shipped ${statSync(OUT).size} B (meshopt, lossless; checked): ${OUT}`);
