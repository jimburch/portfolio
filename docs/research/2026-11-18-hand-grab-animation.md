# Hand-grabs-badge animation: precedent, assets, routes (2026-11-18)

Scope: desktop-only, lazy-loaded; flat/retro look; Chrome + Firefox + Safari; badge back stays live HTML.
Evidence grading: **[V]** = verified this session against the owning source (URL given). **[U]** = unverified (search snippet, memory, or the page would not load). Nothing marked [U] should drive a decision without a recheck.

## TL;DR (ranked)

1. **Pre-rendered 3D hand to alpha video (Blender, toon + outline), layered around the live DOM badge.** Correct anatomy and perspective come free from a real 3D rig; zero runtime 3D lib; the only new runtime code is a ~2.3 kB gz component. Biggest cost is the one-off Blender work and the occlusion (behind/in-front) layer split.
2. **Real-time toon-shaded rigged GLB in three.js, lazy-loaded, camera matched to the CSS 3D transform.** Perfect sync and re-timing for free, but ships three.js (~186 kB gz as measured by Bundlephobia for the whole package; tree-shaking will cut it) and needs a hand asset with a licence we can ship.
3. **Rotoscope/mocap own hand (phone video, optionally MediaPipe) as the reference for route 1 or a Rive/Lottie flat-vector hand.** Not a standalone route so much as the fix for the actual bottleneck (anatomy): trace real frames instead of inventing poses. Highest "looks hand-made" ceiling, highest effort per frame.

Not recommended as a primary route: stock Lottie/Rive "hand holding phone" clips. None found that match "one hand, turns a card 180 deg" and re-timing a baked clip cannot produce the correct occlusion on our badge.

## Precedent

| Item | What it shows | How it is built | Source |
|---|---|---|---|
| Vercel Ship 2024 interactive 3D badge | Lanyard + badge you can drag, dynamic name text. Closest precedent for "badge is the UI". No hand. | React Three Fiber, three.js, drei (`RenderTexture`, `Text3D`), MeshLine for the band, react-three-rapier (Rapier): rope joints + spherical joint, `CuboidCollider`; models prepped in Blender, loaded as GLB. The post states no licence for code/models/textures. [V] | https://vercel.com/blog/building-an-interactive-3d-event-badge-with-react-three-fiber |
| Vercel Ship site (Basement Studio) | Agency credits custom WebGL hero and badge physics | Basement says WebGL + liquid shaders; separate post on a Regl particle effect. Detail not read in full. [U] | https://basement.studio/post/behind-the-ship , https://basement.studio/post/shipping-ship-behind-the-particle-shader-effect-for-vercels-conf |
| GitHub Universe 2025 badge | Hackable hardware badge (the thing we imitate). | I could not find a first-party write-up of any interactive web badge. GitHub's blog confirms the physical badge is hackable. [U for any web build] | https://github.blog/2025-08-21-explore-the-best-of-github-universe-9-spaces-built-to-spark-creativity-connection-and-joy/ |
| Next.js Conf ticket pages | Not found. The repo URLs I tried (vercel/nextjs-conf-ticket-demo, vercel/examples 3d-card) returned 404. [U] | | |
| Hand holding phone/card hero animations (Apple, Stripe, fintech) | No primary source found describing how any specific one is built; I did not verify any. Common practice (memory, [U]): pre-rendered video or Lottie/Rive with device screen as a separate layer. | | |
| Alpha video overlay on live DOM | Technique, not a product. Jake Archibald (Chrome team) documents the browser matrix and a stacked-alpha WebGL approach. [V] | | https://jakearchibald.com/2024/video-with-transparency/ |

Takeaway: no precedent found of a hand turning a DOM card. The pieces (3D badge, alpha video over DOM) have precedent; the combination is ours.

## Assets

| Asset | Link | Format | Licence | Attribution | Fit |
|---|---|---|---|---|---|
| WebXR generic-hand | https://github.com/immersive-web/webxr-input-profiles/tree/main/packages/assets/profiles/generic-hand | `left.glb`, `right.glb` [V] | Repo LICENSE.md: W3C Software and Document License unless a package says otherwise [V]; the assets README says MIT for the motion-controller assets [V]. Which applies to generic-hand is **unverified**. *(Update 2026-11-19: verified. The published `@webxr-input-profiles/assets@1.0.20` package, which contains generic-hand, ships an MIT `LICENSE.md`, © 2019 Amazon.)* | Likely notice retention | Low-poly rigged hand with joint skeleton, made for XR tracking. Good for route 2/MediaPipe-driven pose; low-poly look is stylised. Check poses/skin weights before relying. |
| three.js `XRHandModelFactory` | three.js examples (webxr) | uses the above models [U] | MIT (three.js) [U] | notice | Same models. |
| Quaternius packs | https://quaternius.com/ | rigged "Universal Base Characters" (hands included, not a standalone hand) [V] | Page does not state it; Quaternius is commonly CC0 [U] | n/a if CC0 | Full body rig; hand only as part of a character. Needs verification of licence. |
| Mixamo | https://www.mixamo.com | FBX rigged characters + animations | Adobe FAQ returned 403; terms **unverified** | unknown | Full-body, no gripping-card animation; weak fit. |
| Sketchfab "Hand holding phone" (CC-BY, 56k faces) | surfaced by Sketchfab API search; the viewer URL the API returned was malformed, search sketchfab.com for the title | glTF/FBX if downloadable | API reports "CC Attribution" [V as reported by API] | **required (CC-BY)** | Dense mesh, probably not rigged. Useful as a pose/proportion reference only. Check each model's licence; the results mixed in NonCommercial models, which we must avoid. |
| Sketchfab "2D Hand Creation Rigged" | via the same API search | | "Free Standard" licence (Sketchfab's own, terms [U]) | [U] | Interesting (hand for 2D-look creation) but licence terms unverified. |
| LottieFiles free animations | https://lottiefiles.com/free-animations/holding-paper-business , /tap-card , /handing | Lottie JSON / dotLottie | Lottie Simple License: commercial use, modification allowed, attribution not required but encouraged, derivatives keep same terms [V] https://lottiefiles.com/page/license | optional | Searches surfaced hand-holding categories but **no** one-hand-turns-card clip. Each file's own licence can differ; check per file. Re-timing is trivial, restyling needs AE/editor. |
| Rive Marketplace | https://rive.app/community/ | `.riv` | Terms not stated on page [U] | unknown | Nothing found for this subject. Useful only if we author our own rig. |
| Humaaans (Pablo Stanley) | https://www.humaaans.com/ | SVG/Sketch parts | CC0 [V] | none | People parts; page does not mention hands [V]. Could supply a flat figure for the blurred background person. |
| Open Peeps | https://www.openpeeps.com/ | SVG parts | CC0 [V] | none | Described as "vector arms, legs, emotions" [V]; hand-specific content unconfirmed. Good style match for the retro flat person, not for the gripping hand. |
| Storyset | https://storyset.com/terms | SVG/Lottie | Free use **requires credit**; no resale; commercial grant not explicit [V] | **required on free tier** | Avoid unless we accept credit. |
| Envato "hand holding object" clips | https://elements.envato.com/mobile-payment-including-alpha-5FFDATE | video with alpha | paid [V as listed by search] | per licence | Shows the genre; fixed content, won't match our badge. |

## Routes

### Route 1: Offline 3D render to alpha video, composited over the live DOM badge

How: Model/pose a hand in Blender (rigged mesh, or a base mesh we sculpt/skin). Toon material plus outline (Freestyle or inverted-hull) and a flat palette. Animate: reach from below, grip, 180 deg turn, raise. Render **two or three passes**: (a) hand parts behind the badge (palm-side/rear fingers), (b) fingertips in front. The live DOM badge sits between the layers; its CSS 3D transform is keyed to the same curve as the Blender badge proxy. Export each pass as alpha video; scrub by `currentTime` (or play and sync).
Reverse: scrub backwards (alpha video reverse playback is poor; prefer drive `currentTime` from the same eased progress, or encode a short all-intra file; test).
Deps and size: no 3D lib. `stacked-alpha-video` 1.0.10 is 2.3 kB gz [V, Bundlephobia API]. Video size from Archibald's 2024 test clip: stacked AV1 ~460 kB; native VP9 alpha ~1.1 MB; native HEVC alpha ~3.4 MB (his clip, ours will differ) [V].
Browser support [V, Archibald]: Chrome/Firefox play VP9 WebM alpha natively; Safari needs HEVC with alpha listed first in `<source>`, and does not support VP9 alpha. A 2026 secondary guide says Safari WebM transparency is "coming" (Safari 27 beta) [U]; the WebKit Safari 27 beta notes I read do not mention it [V], so do not rely on it. Stacked-alpha + WebGL shader works in Chrome, Firefox and Safari on newer Apple hardware with AV1; other Apple devices use stacked HEVC [V]. Caveats from the same article: Chrome Android and Firefox Android alpha issues (irrelevant: desktop only) [V].
Sync: `requestVideoFrameCallback` is Baseline 2024 and exposes `mediaTime` per presented frame [V, MDN https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback]. For a fixed 1.8 s sequence, the simpler approach is to drive both the badge transform and `video.currentTime` from one rAF progress value, and use rVFC only to correct drift.
Effort: high one-time (Blender modelling/rigging/lighting/toon, ~days), low runtime. Re-timing means re-rendering.
Quality ceiling: high. Real anatomy; occlusion is correct because the layers are rendered; the Blender stand-in badge guarantees the grip lands on the card edges.
Risks: layer-seam between hand-behind / hand-in-front when the badge turns (the badge is a flat card so the split is clean only if finger parts truly never cross the card plane mid-turn; animate with that constraint); badge scale/position must match at all viewport sizes (scale the whole stage as one unit); HEVC encode toolchain (ffmpeg reportedly drops Apple's alpha layer, per a secondary 2026 blog [U]; Archibald's macOS command uses a premultiply step [V]); alpha video seek/scrub smoothness in Safari [U, test early].
Alternative delivery: PNG/WebP/AVIF sprite sequence (no codec trouble, larger; Archibald found animated AVIF broken in Safari and slow elsewhere [V]).

### Route 2: Real-time three.js toon hand (lazy-loaded)

How: Load a rigged hand GLB; `MeshToonMaterial` with a small `gradientMap` (NearestFilter) for hard bands, plus an outline (inverted hull or three's outline effect/pass). Perspective camera whose FOV/pose is matched to the CSS `perspective`. Render on a transparent canvas layered above the badge with the DOM badge in between via z-ordering (hand split into two canvases, or one canvas plus a depth-hack). Pose with a handful of authored bone keys.
Deps and size: three.js 0.187.0 package, 185,679 B gz for the whole bundle [V, Bundlephobia API; tree-shaken use will be smaller, unmeasured]. GLB hand: tens of kB [U]. `MeshToonMaterial` and `gradientMap` are standard three.js APIs (docs page would not render; descriptive claim [U], confirm in https://threejs.org/docs/).
Browser support: WebGL2 in all three browsers [U, not re-verified].
Effort: medium-high; the hand asset and posing remain the hard part (same anatomy problem, now in 3D, but the rig enforces joint limits, which was precisely what the SVG poses lacked).
Quality ceiling: high and fully re-timeable/interactive (reverse, scrub, hover pre-reach).
Risks: dependency weight vs lean-deps goal; the stock hand models' licence unclear (see Assets); the two-layer occlusion problem is the same as route 1.

### Route 3: Reference-based 2D (rotoscope / mocap)

- **Rotoscope own hand**: film the real motion on a phone against a plain background holding a card, then trace key frames into flat vector. Auto-trace tools (potrace, Illustrator Image Trace, vectorizer.ai) produce one blob per colour region and will not give a rigged, layered hand; I did not verify their output quality or terms here [U]. Best used as the underlay for drawing or for matching a Blender pose frame by frame.
- **MediaPipe Hand Landmarker** on the recorded video: 21 3D landmarks per hand in image coordinates plus 21 world landmarks in metres; VIDEO running mode processes frames in order with monotonically increasing timestamps; npm `@mediapipe/tasks-vision` [V, https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker]. It runs **offline in a Node/browser script once**; export joint rotations/positions as JSON and key a Blender/three.js rig from them (needs retargeting; monocular depth is noisy, expect cleanup). Package 1.2.3 ~45 kB gz JS (wasm and model separate, unmeasured) [V for JS, Bundlephobia], but we would not ship it.
- **Rive** (bones/mesh): runtime `@rive-app/canvas-lite` 2.51.0 ~59 kB gz, `@rive-app/webgl2` ~83 kB gz (JS only, the wasm is additional and its size was not stated in the docs [V]; MIT licence per npm [V]). Rive can deform a hand mesh but we would still be authoring hand art from scratch, and a 2D rig cannot do a true 180 deg turn with correct occlusion.
- **After Effects + Duik/Bodymovin to Lottie**: `lottie-web` 5.13.0 ~77 kB gz; `@lottiefiles/dotlottie-web` 0.83.2 ~31 kB gz [V, Bundlephobia API]. Same limitation as Rive; Lottie also cannot do true 3D rotation.
Effort: very high for quality; best as the reference producer for route 1.
Quality ceiling: highest stylistic charm if drawn by an illustrator; risk is repeating the failed approach.

## Animation craft (brief; no primary source consulted, general practice, [U])

- Key the **grip contact pose first** (thumb on one face, fingers on the other, pads only), then the in-betweens; hands read by silhouette, so keep each pose's outline distinct.
- For a card held like a phone: thumb in front/on one face, four fingertips curled onto the far edge, only the last joints visible past the edge; the palm is hidden behind the card.
- Turning an object in a hand: hand mostly rotates the wrist/forearm with the object, with brief finger re-grip; hide the re-grip in a 2 to 4 frame smear or under motion blur.
- Front/behind sorting must flip as the card passes edge-on; plan the occlusion swap at the edge-on frame (hence the layer split in routes 1 and 2).
- Squash/stretch on a hand is tiny; flattening during the turn (our earlier failure) is a perspective error, which 3D avoids by construction.

## Recommendation

Go with **Route 1**, using **Route 3's filmed reference** to drive the poses, and keep Route 2 as the fallback if alpha-video sync proves fiddly.

Concrete next spike (about half a day, throw-away quality, to answer "does the occlusion + sync work?"):
1. Film 10 s of your own right hand holding a card-sized object, phone-style, turning it 180 deg; use it as a Blender background reference.
2. In Blender, use a free rigged hand (verify the licence first; the WebXR `generic-hand` GLB is the cheapest to try) and a flat card proxy. Pose 4 keys (reach, grip, mid-turn, present), toon shader + outline, render two passes (behind-card / in-front) to PNG with alpha at 1.8 s, 30 or 60 fps.
3. Encode stacked AV1 and HEVC-alpha; place under/over the real badge in Astro behind a `matchMedia('(min-width: ...)')` lazy import, driving `video.currentTime` and the badge CSS transform from one progress value. Check Chrome, Firefox, Safari for scrub smoothness and layer seams.
4. Decision gate: if seams and anatomy read well in the spike, polish the model; otherwise try Route 2 with the same Blender poses.

`prefers-reduced-motion`: plain 180 deg flip, no hand assets loaded (never fetch the video).

## Not verified / gaps

- Adobe Mixamo licence terms (page 403/loading screen).
- Quaternius, Poly Pizza, Sketchfab licence pages (404 or not stated); the Sketchfab hand-holding-phone model licence comes from the API search only.
- Licence for the specific `generic-hand` GLBs (repo default W3C Software and Document License vs MIT note).
- Any first-party build description for GitHub Universe or Next.js Conf badge/ticket pages.
- Safari WebM-alpha status in Safari 27 beta (secondary claim only; WebKit notes silent).
- Sizes: Bundlephobia numbers are for whole-package default import, not tree-shaken or including wasm. three.js bundle at 0.187.0 was the latest npm version at query time.
- Animation craft section has no primary source; treat as practitioner knowledge.
