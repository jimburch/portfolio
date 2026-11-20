# The hand: model and resting-hand images

The desktop hand turn's assets (spec #24, design §6.4): the 3D hand model the
turn animates (#32), and the two static images of the hand at rest on the held
badge, which a direct-loaded back page shows (#29). Both are built here from
the v10 spike (`docs/reference/hand-turn-spike/`) and checked into the repo.

| File | What it is |
|---|---|
| `source/webxr-generic-hand-right.glb` | Source asset: `@webxr-input-profiles/assets@1.0.20`, `profiles/generic-hand/right.glb`. |
| `source/LICENSE-webxr-input-profiles.md` | Its MIT licence (© 2019 Amazon). Copied next to the built model. |
| `build_hand.py`, `measure.py` | The Blender build (v10's, unchanged): forearm, finger volume, wrist taper, sleeve, vertex colours, KHR_mesh_quantization. Tuning knobs read env vars and default to v10. |
| `build-model.mjs` | `pnpm hand:model`: Blender build, then lossless meshopt compression, then a check. |
| `render/` | A small page that renders the held pose (`held-hand.js`: crop, layers, shadow, specks) with the page's own hand code. |
| `render-held-hand.mjs` | `pnpm hand:images`: renders `render/` in headless Chromium and writes the images and their framing. |
| `bake-contacts.ts`, `hand-checks.ts` | `pnpm hand:contacts`: bakes the contact curls and checks the hand never passes through the card (node, no browser). |

**One source.** The look, rig, key poses, timeline, pose and 3D scene live in
`src/scene/hand/` as TypeScript (`look.ts`, `rig.ts`, `keys.ts`, `timeline.ts`,
`pose.ts`, `hand-scene.ts`). The page's hand turn bundles them; node runs them
directly for the bake (type stripping); the render page gets them type-stripped
by `render-held-hand.mjs` (`node:module`'s `stripTypeScriptTypes`), so the
stills and the turn's last frame come from the same code. Imports between them
carry `.ts` extensions for that reason.

Outputs:

- `src/scene/hand/hand.glb` (the hand turn imports it with `?url`, so it ships content-hashed under `/_astro/`) and `public/hand/LICENSE-webxr-input-profiles.md` (served at `/hand/`; the model's `asset.copyright` carries the notice too).
- `src/scene/hand/contacts.json` (the baked contact curls, read by `src/scene/hand/contacts.ts`).
- `src/scene/hand/held-hand-behind.webp`, `held-hand-front.webp`, `held-hand.json` (painted by `src/styles/held-view.css`, typed by `src/scene/hand/held-hand.ts`).

## Rebuilding

Run both when the hand changes (the Blender build, its knobs or the source
asset), and the images alone when the held pose, the look or the held framing
changes (the held badge's shape or corner radius; its size and position on
screen don't matter, since the images are placed in badge units).

```sh
pnpm hand:model     # Blender 5.x, headless; BLENDER=/path/to/Blender to override
pnpm hand:contacts  # re-bake the contact curls (also when the keys or the timeline change)
pnpm hand:images    # renders the model just built
```

- **`hand:contacts`** poses the hand at 1001 evenly spaced t with the contact
  solve (as the spike did every frame), on the page's own path (v10's badge
  with the lift scaled to the held zoom and trimmed, as `hand-turn-motion.ts`
  places it), writes each digit's curl, then sweeps that path over 2001 t,
  with the baked curls interpolated and solved at every sample, and fails if
  any skin triangle passes through the card or the held pose's pads don't all
  rest on the face. The curls depend only on t: the key poses are in the
  badge's frame and the forearm, which the framing moves, carries no pad.

- **Blender on macOS:** the script calls
  `/Applications/Blender.app/Contents/MacOS/Blender -b --python build_hand.py -- <in> <out>`;
  the `blender` symlink on PATH can't find its bundled Python.
- **`hand:model`** prints the built and shipped sizes and fails unless the
  shipped model decodes to the build's: per mesh the same triangles with the
  same vertex values and winding, the same skeleton and the same bind
  matrices. The compression is EXT_meshopt_compression over the build's own
  quantization (nothing re-quantized or filtered); meshopt's reorder changes
  only the order of vertices and triangles. The Blender output is the spike's
  `hand-v10.glb` byte for byte (220,864 B); shipped: 84,444 B (62 KB gzip,
  58 KB brotli).
- **`hand:images`** fails if any digit's pad doesn't rest on the face, and
  prints the box, the file sizes and how far the hand reaches over the face.
  It needs Playwright's Chromium (`pnpm exec playwright install chromium`) and
  renders with SwiftShader (software WebGL, like the spike checks); two runs on one machine give identical files.

## The resting-hand images: framing contract

The held close-up (#28) and the hand turn's last frame (#32) both rely on this.

- **Units.** 1 unit = 1/500 of the held badge's height (`--held-u`). The held
  badge is 231 × 500 units (390 : 844), the spike's card at 1 world px per unit.
- **Origin.** The held badge's top-left corner as the visitor sees it, on the
  card's mid-plane (where the page's DOM badge lies, so the hand turn's last
  frame and these images agree); x right, y down.
- **Box.** Both images cover the same box, `box` in `held-hand.json`
  (now x −57, y 254, width 411, height 346). Read it from the JSON; don't
  copy the numbers.
- **Placement.** left = badge left + x·u, top = badge top + y·u, size
  width·u × height·u, the image stretched to the box
  (`background-size: 100% 100%`). Nothing else: no offset, no transform.
- **Density.** `pxPerUnit` = 4 image px per unit (1644 × 1384 px): 2× for a
  held badge up to 1000 CSS px tall (a window about 1100 px tall), a little
  softer above that.
- **Behind** (`held-hand-behind.webp`): the whole hand and sleeve, everything
  more than 2 units inside the badge's outline cleared (the board hides it).
  Stacks over the scene and over the held badge's drop shadow, under the badge.
- **In front** (`held-hand-front.webp`): what is on the camera's side of the
  card's mid-plane (the four fingertips over the left edge, the thumb on the
  face; stray cut-plane specks under 64 image px dropped), over the hand's soft shadow on the face (30%, offset 5.97 / 11.95
  units, blur 4.2 units, clipped to the badge's outline). Stacks over the
  badge and the pinned strip. Where the two meet beside the card they draw
  the same pixels, so there is no seam at the card's plane.
- **Badge outline** assumed by both: the 231 × 500 rectangle with corners
  of radius 0.045 × width (as `.held-view__badge`).
- **Bottom edge.** Cut through the sleeve at y = 600 (100 units below the
  badge). In the held framing the window ends about 12 units below the badge.
- **Pose and camera.** v10 at t = 1 exactly: key P, the forearm aimed at
  `ELBOW_UP` (wrist 10.1° ulnar, 16.6° extension), all five pads resting on
  the face at curl 0. The badge face-on; the eye 1182 spike px (about 998
  units) in front of the card's mid-plane, centred across it and 6 spike px
  (5.07 units) below its centre (v10's perspective camera, its badge 6 px up).
- **Line widths.** v10's, scaled with the badge: skin outline 1.93 units,
  inner lines 0.84; sleeve 1.43 and 0.76.
- **Reach** (`reach` in the JSON, solid pixels over the face): fingertips
  48.3 units in from the left edge, the thumb 21.5 in from the right, the hand
  from 267.3 to 463.8 units down; the fingers' shadow fades out by about 60
  units in. The back's padding tokens (`--held-finger-left` 60,
  `--held-thumb-right` 28, `--held-hand-bottom` 30 from the bottom) keep text
  clear of the hand and its shadow.

## The hand turn (#32)

The page's hand turn (`src/badge/flip/hand-turn.ts`, `src/scene/hand/hand-view.ts`)
draws the same scene live on two canvases, with outlines in world units (they
scale with the badge exactly as these images' do), and hands over to these
images when it lands. Moving the images' reference from the back face (z −5)
to the card's mid-plane (#32) scaled the hand in them by about 0.4% against
the badge; with the old reference the shared code reproduced the #29 images
byte for byte.
