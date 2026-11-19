# Spike report: grab, turn, present (desktop)

File: `.superpowers/brainstorm/64033-1795017766/content/spike-grab-turn-v3.html` (served as the newest content file).
v2 is an intermediate step and is kept next to it, and so is the original `spike-grab-turn.html`.

## What changed

**The hand is now a small 3D rig, not 2D blobs.** The hand lives in the badge's own coordinates. It has a palm (an extruded slab), four fingers (three tapered phalanges each, posed by joint angles) and a thumb (joints that swing round the badge edge). Every point is projected through the same chain as the badge's CSS (`translate · perspective · translateZ · rotateZ · rotateY`), so the digits stay on the edges for the whole turn. Each digit is split where it crosses the badge plane. The piece on the viewer's side goes in the layer above the badge and the rest goes below it. That's why the digits swap sides on their own and nothing pops at edge-on.
- Grip: the wearer's right hand cradles the badge like a phone. Thumb up one long edge, four fingers wrapped round the other, heel of the palm at the bottom centre, wrist just below the badge.
- At the start you see the back of the hand. That's physically right: the palm is on the front face, as if the wearer were reading the back. At the end you see the classic "hand holding a phone" layout: fingertips with nails over the left edge, the thumb over the right edge, the heel and forearm below.
- Flat 2–3 tone art: skin, a shade tone for the sides of the slab and for finger segments that face away, a thin warm outline, light nails, and knuckle highlights on the back of the hand.
- The badge now has thickness (8px edge faces) and a shade overlay that darkens it as it goes edge-on, so the edge-on frame shows a card and not nothing.

**The forearm comes from below, on the correct side.** The wrist sits near the turn axis, so the turn reads as forearm rotation and the arm never swings out to the side. The forearm (skin, cuff, navy sleeve) is a static SVG moved only with transforms. A pre-blurred copy sits under a sharp copy, and the sharp copy fades out toward the elbow with a mask. So the arm is soft far from the badge and crisp at the wrist, and no blur value is ever animated.

**The lanyard stays attached.** The straps run neck → collar → clip. As the badge comes forward they lift out from under the collar and go taut toward the neck, which is just above the frame. In the final frame the badge stops low enough that a foreshortened V of strap is visible above the clip. The strap widens toward the clip for perspective. A sharp copy of the near end, masked with a gradient, sits on top of the blurred far end. The clip is a little metal piece that narrows as the badge turns.

**Motion.** Each property has its own keyframe track, eased with monotone cubic interpolation, over 1.75 s at 1×:
- reach (0–0.28)
- fingers close (0.17–0.31)
- tug: the badge dips, pulls back and winds the opposite way about 9° (0.31–0.40)
- lift and turn with the wrist roll overlapping and peaking after the turn's midpoint (0.38–0.80)
- settle: the turn overshoots to 187°, comes back to 178.6°, then lands on 180; scale and roll settle the same way (0.78–1.0)

Reverse plays the same tracks backwards. The overshoot becomes a wind-up and the tug becomes a small settle back onto the chest.

**Depth of field.** The person and the room crossfade between pre-blurred copies as before. The hand comes up through a blurred copy that fades out as it nears the badge.

## What works
- The final frame reads clearly as a hand holding a phone up to show you.
- The turn is continuous. Digits track the edges, and there's no pop at edge-on (t≈0.581) or anywhere else on the scrubber.
- The straps read as attached in every frame.
- The forearm is always on the right side and connected.
- Play and Reverse both run to completion with no console errors, at about 60 fps in headless Chromium on this Mac.

## What still doesn't
- **The back-of-hand view at grip is the weakest frame.** The palm is a large smooth paddle with no wrist taper or tendons. With the thumb seen from behind, it reads more like a mitten than a hand. It's on screen for about 0.15 s, but it's the moment of contact.
- **Fingertips at the end are a bit "pill-like".** They're stacked capsules with nail ovals. It's readable, but a stock-illustration hand has more irregular finger lengths and overlap.
- **Edge-on (2–3 frames) is a boxy slab.** The palm is an extruded flat shape, so the side view of the hand looks like a block.
- **Little forearm shows at the end.** Only the heel and wrist show below the badge, about 40–60px. Showing more would mean a smaller final scale (now 1.32) or letting the clip go higher, which costs strap visibility. It's a framing trade-off.
- **The badge hides most of the strap V at the end.** That's physically correct, but there's only about 60px of visible strap. It reads as attached, not as dramatic.
- **I only judged timing from scrubbed stills and the code.** I have no headed playback, so the 1× feel needs Jim's eye. The turn's middle 120° takes about 0.28 s, which may be a touch quick.
- **The person art is still stand-in.** The neck and collar are crude, which limits how "worn" the lanyard looks.

## Honest read: can this reach wow in flat vector?
Yes, the concept holds. The geometry problems (tracking, side swap, layering, lanyard, arm) are solved here procedurally, and the final frame already sells it. What separates this from "wow" is **art**, not technique:

1. **Hand art.** A procedural capsule rig tops out at "clearly a hand" and won't reach "beautifully drawn". A real build should get hand-drawn key poses from an illustrator: back-of-hand grip, about 45°, edge-on, about 135°, and the final. Draw them in the same flat style as the badge. Keep this rig only as the *motion and layering skeleton*: it says where each digit goes and which side of the badge it's on. Then swap or morph the drawn shapes per pose (matched point counts, or 8–12 frames of sprites per side of edge-on). The other option is Rive or Lottie with a properly rigged hand, which would also give the designer a timeline tool.
2. **Choreography.** Worth a pass with someone who animates: a hold on contact, an extra frame of squash on the tug, the turn slowed slightly through edge-on, and maybe a small camera push (a scale on the whole background) on the lift.
3. **Flipper refactor first.** Production flip code couples URL/history state with the turn animation. Split it into (a) flip logic (route state, focus management, announcements, reduced-motion handling) and (b) a pluggable "turn animation" interface, something like `play(direction, signal) → Promise` plus `jumpTo(state)`. Then desktop gets this grab-turn, phones keep the existing flip, and reduced-motion gets an instant swap or crossfade. Without that split this will be a bolt-on.
4. **Performance.** The person, room and forearm blurs are static layers. Only transforms and opacity animate, and those are cheap. Three things are rebuilt every frame:
   - the hand SVG: about 30 paths, cheap
   - two strap layers that carry CSS blur, re-rasterized each frame at full stage size
   - a blurred hand copy during the reach only

   The straps are the thing to optimize: draw them into canvas, or pre-blur a ribbon texture and transform it. Budget-check on a mid-range laptop at 1440p before committing. The final frame also needs the back face as real, crisp DOM, so the reading side should switch from a 3D-transformed layer to plain layout once the turn settles.

**Recommendation: iterate more on the art, then build.** The motion and structure are proven. One illustrator pass on 4–5 hand key poses would decide whether it lands as wow. Do that before investing in the flipper refactor.

## Screenshots
In `.superpowers/sdd/2026-11-18-badge-portfolio/screens/`:
- `spike-1-rest.png`: t=0, the worn badge at rest
- `spike-2-mid-reach.png`: t=0.14, the hand rising blurred from below
- `spike-3-grip.png`: t=0.32, the grip from the back of the hand, fingers curled round the right edge
- `spike-4-tug-start-turn.png`: t=0.42, the tug and wind-up, lift starting
- `spike-5-edge-on.png`: t=0.581, edge-on, the thumb in front and the fingers behind
- `spike-6-late-turn.png`: t=0.68, the reading side coming round, the wrist rolled, the straps taut
- `spike-7-final.png`: t=1, the presented back face, phone grip, the strap V above the clip

## v4

File: `.superpowers/brainstorm/64033-1795017766/content/spike-grab-turn-v4.html` (v3 is untouched).
Video: `screens/spike-v4.mp4` (60 fps: hold, 1× forward, hold, 1× reverse, hold, 0.5× forward). Contact sheet: `screens/spike-v4-sheet.png`. Key frames: `screens/spike-v4-1-rest.png` … `spike-v4-7-final.png` (rest, reach, grip, lift and turn, edge-on, late turn, final).

### What changed
**Hand art.** The capsule rig is gone. The hand is now five hand-drawn key poses in flat vector, each in its own drawing frame:
- (a) open hand reaching
- (b) fingers closing
- (c) the grip, from the back of the hand
- (d) edge-on, from the thumb side
- (e) presenting, palm behind the card

Each pose is built from Catmull-Rom outlines. Fingers have knuckle bulges, pinched waists between joints and pads, and the tips are rounded. Nails show only where the back of the finger faces you. The poses also carry joint creases, knuckle highlights, back-of-hand tendons, a thenar bulge and crease, and wrist creases. The body's outline stops at the wrist, so it runs into the forearm with no seam. Four skin tones (light, base, shade, outline) plus a nail tone, with no gradients.

The rig now only places the drawings. Each group of paths maps onto a plane in the badge's local 3D space: the face plane for (a), (b) and (c), the back plane for (e), and for (d) planes through the near edge (thumb), the far edge (fingertips) and mid-hand (body). Every path point then goes through the same projection as the badge's CSS. So fingertips stay on the edges while the card foreshortens, and parts on the near or far side split correctly between the layers under and over the card.

Poses change on a single frame, the way key drawings do: a→b→c by time while the hand closes, and c→d at 61° and d→e at 115° during the fastest part of the turn. A dissolve read as a ghost, so it was dropped. The badge slides 87px into the hand between grip and present, hidden by the turn. The grip stays low and clear of the LCD, and the present pose sits higher with the palm behind the card.

**Choreography** (1.8 s):
- The hand rises straight up from below the frame, slightly blurred at first. The forearm leans in from the lower left.
- The fingers close from about 0.13 to 0.19, and the lift starts at 0.19, so there's no dead hold.
- The turn rides the lift, so edge-on (t≈0.43) happens mid-air, about 13% closer to the camera, with the card near the top of the frame.
- Overshoot: the turn goes to 192°, back to 175.5°, then 181° before landing. Depth and scale overshoot and settle too.
- Reverse is the same tracks played backwards.

**Scene.**
- The wearer crossfades to a blurrier copy at brightness .6 (rest is .72). v3 faded both copies out, which caused the blackout. The chest, shirt and collar still read at the end.
- Final framing: the badge sits at about 1.18× with the clip ~62px below the top edge. The rest pose moved up 40px so the forearm stays in frame at grip and at the end.
- Lanyard: lifted, the straps go slack and bow out past the card's sides, then rise to the neck. They widen toward the clip, and a blurred strap shadow stays on the neck and chest where they used to lie.

**Physicality.**
- A screen-blended specular band crosses each face as it turns.
- The 10px card edges have a lit bevel, and a shade overlay darkens the faces near edge-on, so edge-on reads as a slab.
- The hand casts a blurred shadow, clipped to the card's projected outline, so it only lands on the badge.
- The contact shadow on the shirt goes from tight and dark to wide and faint as the badge lifts away.

### Honest wow read
This is clearly better than v3 and reads as a hand in every frame I checked, at 1× and when stopped on any frame.
- **Grip:** a back-of-hand grab of the bottom-right corner, the thumb hooking the bottom-left. It reads as grabbing.
- **Edge-on:** now the best frame. A thumb crosses in front of the card's edge, curled fingertips peek out behind it, and a knuckle row runs down the back of the hand. It reads like someone holding a phone, seen from the side.
- **Final:** the classic phone grip. Fingertips with nails sit over the left edge, the thumb runs up the right edge with its tip over it, and the heel, wrist and forearm show below.

It's a solid "illustrated explainer" level, not yet "wow". The motion is now the stronger half.

### Still weak
- **Style match.** Outlines are uniform and fairly heavy, and the finger stacks in the final frame are a bit regular. An illustrator would vary line weight and finger lengths, and overlap the fingers more.
- **Squashed drawings in the early and late turn** (about 20–60° and 120–160°). (c) and (e) are flat drawings, so they foreshorten like cards. At speed it's fine, but stopped there the hand looks pressed flat. A 3/4 drawing at ±45° would fix it, making 7 poses.
- **The thumb at grip** is long and straight as it points to the corner. It reads as a thumb, but a stiff one.
- **The reach** shows mostly fingertips for its first ~0.15 s, because the hand enters from below the frame. The forearm only appears once the hand is about two-thirds up.
- **Lanyard slack** reads as a loose loop. Its "toward the camera" depth is subtle, because most of the strap is hidden behind the lifted card.
- **Wearer:** the person art is still a stand-in, as in v3.
- **Checking:** I judged the result only from frame-by-frame renders through the scrubber in headless Chromium. Real-time feel on a headed browser still needs Jim's eye.

### Recommendation
Keep this structure: a placement rig, key drawings mapped onto planes, single-frame swaps on fast frames. It is the right architecture for production. The art can be swapped without touching the motion, since each pose is just a list of paths in a drawing frame.

Next step: give an illustrator the five pose frames (export them from the drawing frames as SVG) plus two 3/4 poses. Brief: "same silhouettes and contact points, your line and shapes". The illustrator's paths can drop straight into `POSES` as long as they use absolute coordinates.

The flipper refactor from v3 still applies before any production build: flip logic separate from a pluggable turn animation.

## v5 (three.js toon hand)

File: `.superpowers/brainstorm/64033-1795017766/content/spike-grab-turn-v5.html` (v4 untouched).
Video: `screens/spike-v5.mp4` (60 fps, same sequence as v4: hold, 1× forward, hold, 1× reverse, hold, 0.5× forward). Contact sheet: `screens/spike-v5-sheet.png` (16 evenly spaced frames of the 1× forward pass). Key frames, 2× DPR: `screens/spike-v5-1-rest.png` … `spike-v5-7-final.png`.

### What I built
- **Same scene, choreography and controls as v4.** That covers the person, lanyard, badge DOM, `render(t)`, DUR 1800, play/reverse/scrub/speed. The SVG hand is gone.
- **One matrix for the badge pose.** Each `t` builds a `THREE.Matrix4` in CSS space (y down). The DOM badge gets `perspective(1400px) matrix3d(…)` from it. Three.js uses the same matrix conjugated by diag(1,−1,1), with a `PerspectiveCamera` matched to the CSS perspective: fov = 2·atan(400/1400), eye at z = 1400, units = stage px. The lanyard clip also projects through it.
  - A debug outline of the card faces and the LCD (`SPIKE.setDebug(true)`, off by default) sits exactly on the DOM edges at 0°, at about 52° and edge-on.
- **Occlusion.** Two WebGL renderers draw the same scene into full-stage canvases, one under the DOM badge and one over it. Each frame both get a `renderer.clippingPlanes` plane: the badge mid-plane from the matrix, flipped to whichever side the camera is on. The under canvas keeps the far side and the over canvas keeps the near side, so the swap at edge-on is automatic.
  - A third, 2D canvas draws the over-canvas render blacked out and blurred, clipped to the card outline. It gives a soft contact shadow under the fingertips.
- **The hand model.** WebXR `generic-hand/right.glb`: 1360 verts and 25 joints, skinned.
  - The joints are flat siblings, because XR sets each joint pose directly. I re-parent the finger chains with `attach()`, which keeps the bind pose, so knuckle rotations carry the finger. The wrist bone is left free to work as the end of the forearm.
  - Bone conventions were checked numerically: −Z distal, +Y dorsal, flex = −X rotation, +spread toward the thumb. The skeleton is logged once on load.
  - Scale: 2700 px per metre. At 2300 the card was relatively wider than a phone, and the thumb base had to sit over the card.
- **Poses.** Key poses A (open reach), G (grab), G2 (let go), R2 (open), O (slide), P (present).
  - Each key is a wrist placement in badge-local px (position, finger direction, palm normal) plus per-joint angles. Finger and thumb angles are slerped along t; the reach uses v4's timing, and the turn keys are driven by turn angle.
  - The hand is parented to the badge frame throughout.
- **Contact solver (per frame).** Digits marked as touching a face or edge get their curl bisected until the pad's lowest vertex over the card sits 1.5 px off that face. An "anchor" slides the whole hand along the card normal so the palm or index rests on a face. Pads beside the card can't count as touching.
  - The key angles have the solved curl baked in, so contacts switching on or off don't pop.
- **Pass-through check (dev aid).** An exact test (`SPIKE.check`) counts mesh triangles whose edges cross the card mid-plane inside the outline, per digit, after skinning. Per-vertex checks miss these because the low-poly triangles span the 10 px slab. P was found by a small search with this test as the penalty.
- **Forearm and sleeve.** Tapered elliptical toon cylinders (skin, cuff, sleeve #2c3646) hang off the wrist.
  - They aim at a fixed elbow point below the frame in world space: the hand follows the badge, the elbow belongs to the body.
  - The GLB's wrist bone takes 35% of the hand–forearm angle, so the wrist skin bends instead of a stub poking out.
- **The look.**
  - `MeshToonMaterial` with an RGB gradient map (patched to read `.rgb`), white material colour and NearestFilter. The three bands land exactly on v4's skin palette: shade #a96b49, base #c98b65, light #dda788.
  - Key light from the upper left, where the room's lamp is.
  - Inverted-hull outline in #6e3f28, a constant 1.4 px on screen: back faces pushed along position-averaged normals in clip space, so there are no cracks at UV seams.
  - Renders at devicePixelRatio × stage scale. The hand is never blurred.
- **Timing.** `render(t)` is synchronous: DOM transform, both GL renders and the shadow. The page sets `window.__ready = true` after the GLB loads and the first frame draws. Play and Reverse stay disabled until then.

### The grip story (why these poses)
Earlier attempts each failed one way:
- Rigid grips put the palm over the LCD at the start, or over the resume at the end.
- A key pinch on the corner forced the index through the card when the hand rolled.
- A grip with fingers wrapping the bottom edge left the fingers on the front.

What works, with each move happening where the camera can't see a problem:
1. **G (t .19–.38).** The hand comes up under the card, back of the hand toward you. The thumb pad sits on the front's bottom strip, below the LCD. The curled index reaches round the bottom edge onto the back.
2. **G2 (θ 62–92°).** As the front turns away, the hand drops straight down with the fingers still curled. The index slides out from behind the bottom edge before it opens.
3. **R2 → O (θ 92–145°).** The front faces away by now. The hand opens and slides up it, out of sight, with the palm 25 px off the face. The fingers emerge past the far edge.
4. **P (θ 172° onward).** The fingers curl so only their last one or two joints come over the long edge onto the resume side. The thumb runs up the other edge, the palm stays hidden, and the wrist and forearm go down out of frame.

### Versions, URLs, measured transfer (Chromium, from the network, brotli)
- three **0.187.0** (released 2026-10-30), import map:
  - `https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js`
  - `…/examples/jsm/`
- Transferred:

| File | Transferred |
|---|---|
| three.module.js | 104,119 B |
| three.core.js | 211,855 B |
| GLTFLoader.js | 22,146 B |
| BufferGeometryUtils.js (pulled in by GLTFLoader) | 8,150 B |
| SkeletonUtils.js (pulled in by GLTFLoader) | 3,126 B |
| **three + addons** | **≈349 KB** |

- Hand: `https://cdn.jsdelivr.net/npm/@webxr-input-profiles/assets@1.0.20/dist/profiles/generic-hand/right.glb`, 94,004 B raw, **≈61 KB** transferred.
  - The package's LICENSE.md is MIT, © 2019 Amazon. That settles research's open question for this package.
  - GitHub raw is wired in as a fallback but wasn't needed.
- **Total ≈ 410 KB transferred.** Production would tree-shake three, which these figures don't include.

### Honest quality read, per key frame
Checked at full size (2432×1520), with crops on the grip and the final frame. Pass-through numbers come from the triangle test, sampled every 0.01 of t over the whole run.

- **1 rest (t 0).** No hand. Fine.
- **2 reach (t .11).** An open hand rising from below, fingers loose, still curling.
  - Every finger is connected, and nothing touches yet.
  - It reads as a hand coming up, but only fingertips show at first, as in v4.
- **3 grip (t .20).**
  - **Yes:** every finger is connected to the palm. Back of the hand toward you, and the orientation is consistent. The thumb pad sits on the front's bottom strip, clear of the LCD. The index pad is on the back face, hidden.
  - **Weak:** most of the thumb is below the card, so it reads as supporting the edge more than pressing the face. The curled middle finger sits in the air beside the right edge, touching nothing. It's anatomically fine for a curled hand, but it's a finger not on the card.
  - **Graze:** at t .14–.17 the index grazes 0.5–2.5 px inside the card's bottom-right edge, 2–3 triangles. It isn't visible at any size I checked.
- **4 lift and turn (t .33).** The same grip, holding as the card tilts. Contacts are solved, and nothing passes through.
- **5 edge-on (t .43).** The card's bottom edge is held in the curled fingers, like holding a stick.
  - **Graze:** another 2-triangle edge graze at t .40–.41, not visible.
  - **Gap:** while the hand drops and opens (about θ 70–110°, ≈120 ms) nothing is solved onto the card. The fingers leave the back and re-grip, so for those frames the card is held by "nothing". At 1× it reads as a re-grip, but stopped on those frames the card is not being gripped.
- **6 late turn (t .53).**
  - **Yes:** the palm is hidden behind the card. The fingers come out past the far edge and curl over it. The thumb is on the near edge, solved onto it.
  - **No:** the fingertips are not on the card yet. They are mid-curl.
- **7 final (t 1).** The best frame. A hand holding a phone up to show it:
  - Four fingertips over the long edge, with distal joints only (two joints on the middle finger).
  - The thumb up the opposite edge, the palm hidden, and the heel of the hand below.
  - The wrist bends into a forearm that leaves the frame.
  - All pads are 1.5 px off the face, and zero triangles cross.
  - Occlusion is right: what's behind the card is hidden, and what wraps the edge draws over it.
  - The outline and three-band shading look intentional and match v4's flat palette.

### Is the model the limit?
**Partly, yes.** The WebXR hand is low-poly (1360 verts), so silhouettes are polygonal. You can see facets at the knuckles, the fingertips and the thumb tip at this size, and the inverted hull follows the facets. The fingers read a bit like sausages. The rig is the other limit: it's built for tracking, not posing.
- No forearm.
- A flat skeleton.
- A heavily weighted wrist bone (154 verts), so bending it moves the heel of the palm.

The structure itself works:
- The matrix-shared badge and camera.
- The clip-plane occlusion.
- The contact solver and crossing test.

None of those care which mesh is loaded. They are what fixed v3/v4's anatomy failures: no floating fingers, no fingers lying through the card, and no squash mid-turn, because it's real 3D.

### Still weak
- The grip's thumb and the idle middle finger (see above).
- The re-grip window, θ 70–110°, has no contact.
- Facets on the hand.
- **Wrist and arm:** the wrist still shows a soft bump at the end. The forearm aims at a fixed elbow, and P's hand is fairly horizontal, so the hand–forearm angle there is large; the skin takes 35% of it.
- The hand is large relative to the badge (needed for the phone grip). Jim should judge whether that reads as "badge" or "phone".
- **What I couldn't check:** real-time feel was checked in headless Chromium (SwiftShader) only. I didn't check headed GPU performance or Safari.

### Recommendation
1. **Route 2 answers the question:** a toon-shaded 3D hand does sit in this flat, blurred scene. The final frame is clearly better than v4's, and the occlusion and anatomy problems are solved structurally, not by hand-drawing.
2. **Next step: swap the asset, not the approach.** Get a smoother rigged hand with a forearm, either a CC0/MIT hand or one modelled in Blender: around 3–5k verts, with a proper wrist-to-forearm chain and a properly weighted palm. Then re-run the same key-pose search. The page's rig layer (`compilePose`, the solver, the crossing test) should take a new GLB with only a bone-name map.
3. **Weight.** About 410 KB transferred (three about 349 KB, GLB about 61 KB) is the cost, lazy-loaded on desktop only. If that's too much, Route 1 (render these same poses offline to alpha video) remains available. The poses and choreography found here would transfer directly.
4. **Polish before production:** a 3/4 key between G and G2 so the thumb stays on the card through the re-grip, and a thumb that presses more of its pad onto the face at the grip.

## v6 (one-piece hand and forearm, grip that never lets go)

File: `.superpowers/brainstorm/64033-1795017766/content/spike-grab-turn-v6.html` (v5 untouched). Asset: `content/hand-v6.glb`.
Video: `screens/spike-v6.mp4` (same sequence as v5). Contact sheet: `screens/spike-v6-sheet.png`. Key frames, 2× DPR: `screens/spike-v6-1-rest.png` … `spike-v6-7-final.png`. **The shot to judge:** `screens/spike-v6-7-final-wrist.png` (hand and wrist, final frame, full resolution).

Everything else is v5's: scene, lanyard, timing (DUR 1800, `render(t)` synchronous, `window.__ready`), controls, the shared matrix, the two clip-plane canvases, the contact shadow and the toon look.

### Serving
The mockup server serves `content/` files flat under `/files/<name>` (subfolders 404), so the GLB sits at `content/hand-v6.glb`, not `content/assets/`. The page loads `/files/hand-v6.glb` over http and `hand-v6.glb` next to the page from `file://`. The video and key frames were recorded from the running mockup server (`http://localhost:64580/`, headless Chromium).

### The Blender pipeline
Script: `blender/build_hand.py` (v6 at the time), input `blender/webxr-generic-hand-right.glb` (WebXR generic-hand 1.0.20, MIT). Run headless:
`/Applications/Blender.app/Contents/MacOS/Blender -b --python build_hand.py -- src/right.glb <content>/hand-v6.glb`.
(The `blender` symlink on PATH can't find Blender's bundled Python from this sandbox, "No module named encodings". The app binary is the same Blender 5.2.2 and works.)

1. **Import and weld.** The UV-seam duplicates are welded (1360 → 1159 verts) so subdivision can't tear the mesh.
2. **Forearm.** The GLB's slanted wrist cap (18 tris) is cut off. The 20-vert opening is extruded into eight rings:
   - The first ring keeps the opening's slant, then the rings blend to an ellipse that widens toward the elbow (5.3 × 3.8 cm at the wrist, 6.3 × 4.7 cm at 12 cm).
   - The sleeve-cuff edge loop is at 12 cm, and the tube ends at 16 cm inside the sleeve.
   - The cuff and sleeve stay page geometry, but they now ride rigidly on the forearm bone, so they can't separate from the skin.
3. **Forearm bone.** A `forearm` bone has its pivot at the wrist joint and points at the elbow.
   - Weights: every vertex gets w = smoothstep(−0.8 cm, +3.4 cm) of its distance past the wrist joint along the forearm axis. The hand's own weights are scaled by (1 − w).
   - The bend therefore spreads over about 4 cm and about four edge loops, from the end of the heel of the palm to the start of the forearm.
   - The heel itself stays 100% hand: the old wrist bone is now the hand's root and never bends. That removes v5's heel drag.
4. **Smoothing.** Triangles are joined into quads, then one Catmull-Clark level is applied with weights interpolated, limited to 4 influences, normalized and smooth-shaded. Result: **5,303 verts / 10,564 tris** (v5: 1,360).
5. **Export, then post-process the GLB in the same script.**
   - Blender re-orients bones on import. The script rewrites every joint back to its exact WebXR frame and builds a real hierarchy, forearm > wrist > metacarpal > … > tip.
   - It recomputes the inverse bind matrices so the bind pose is unchanged. Every v5 pose convention (flex = −X, etc.) still holds.
   - Then KHR_mesh_quantization: int16 positions (5 µm steps, folded into the inverse binds), int8 normals, and uint8 weights and joints. Measured against float: PSNR 58.8 dB on the final frame.
6. **The page.**
   - The GLB's wrist is lifted out from under the forearm (one `attach`). The hand is placed directly, and the forearm bone is aimed from the pose's authored wrist angles.
   - The elbow goes wherever those angles put it, so the wrist can't be forced past them.

**GLB transfer:** 179,145 B from the mockup server, which sends it uncompressed (178,656 B file). Compressed, it would be ≈97 KB brotli / ≈127 KB gzip. Float, it was 306 KB. The total page is ≈670 KB transferred from the mockup server, versus ≈410 KB for v5. Most of the increase is the uncompressed GLB.

### Wrist and scale
- **Final pose:** the wrist is at **15° ulnar deviation, 10° extension**, and the forearm leaves the frame down and to the right, in line with the hand.
  - It's a phone grip: the hand runs diagonally behind the card at 35°, with the heel under the bottom-right corner (as seen).
- **Over the whole run:** deviation 15–20° ulnar, extension 10–11°, and the forearm always points down out of frame.
  - v5 measured 72° ulnar at the end.
- **Scale:** 2300 px/m, down from 2700. That's **×0.852, 14.8% smaller**, relative to the badge.

### Choreography (why it never lets go)
The hand stays on the front side of the card the whole way, palm toward it:
- the fingertips stay hooked round the same long edge (local +x) onto the back
- the thumb pad stays on the front face

The keys:
- **A → G (reach, t 0–.19).** The hand rises from the bottom right and its fist closes while still under the card. The fist then slides up, so the card's edge goes into the gap between the thumb and the hooked fingertips.
  - There are no triangle crossings and no LCD cover during the reach. In the first draft, the open fingers swept in front of the screen.
- **G (θ 0–80°).** A fist on the bottom-right corner, back of the hand to the camera:
  - the thumb pad presses the front beside the lower side key
  - the index, middle and ring tips are behind the card
  - the screen is clear: 0 skin verts in front of the LCD (2 on the case border)
- **M (θ 128°) → M2 (158°) → P (172°+).** Once the front faces away, the hand slides and rolls into the phone grip:
  - the fingers stay curled on the edge
  - the thumb slides across the hidden front to the far edge
  - only in M2 → P does the thumb step from the front face onto the side edge
- **Baked curls.** Each key now stores the contact solver's curl (`fingers[f][5]`, `thumb.curl`), so keys reached unsolved look solved and nothing pops.
- **Thumb solver.** It now uses palmar abduction at the base (+Y on the metacarpal), not flexion. Flexing the thumb only sweeps it across the palm, which is why v5's thumb ended up under the edge.

### Checks (numbers)
From `SPIKE.check`, sampled every 0.01 of t:
- **Triangle crossings through the card:** 0 at every t from 0 to 1.
- **Contacts:**
  - The thumb is solved onto the card at every t from .19 to 1.
  - The index, middle and ring are solved from .19 to 1, except the middle at t .48 (1 frame).
  - The pinky is unsolved in G (tucked inside the fist) and solved from M on.
- **Pads:** finger pads sink up to 1–3 px into the back face around t .47–.53. That's within the 10 px slab, and I couldn't see it at full size.
- **Solver cost:** 0.4–1.3 ms per frame (headless Chromium).

### Honest checklist, per key frame
Checked at full size (2432×1520) and in zoomed crops of the grip, mid-turn and final.

- **1 rest.** No hand. Fine.
- **2 reach (t .11).** The fist's knuckles and thumb are rising into frame below the corner. It reads as a hand coming up. Nothing touches yet.
- **3 grip (t .20).**
  - **Yes:** fingers connected, a firm grab on the corner, the thumb pad on the front face, the fingertips behind, the screen uncovered, no crossings, and the forearm straight down out of frame.
  - **Weak:**
    - It's a fist grab seen from the back of the hand, not a dainty thumb–index pinch.
    - The thumb tip sits on the lower side key, about 85 px above the corner, not right at it.
    - The fist covers the bottom-right key.
    - Next to the 231 px card, the fist still looks big.
- **4 lift and turn (t .33).** The same grip, tilting with the card. Contacts are solved and nothing passes through.
- **5 edge-on (t .43).** Thumb on one side, curled fingertips peeking past the other side of the edge. It reads as a pinch on a thin card, and nothing floats.
- **6 late turn (t .53).** The fingers are hooked over the long edge, the palm is behind, and the forearm is in line. **Weak:** the fingers are still sliding into place here, so they bunch a little near the bottom.
- **7 final (t 1).** The best frame.
  - **Yes:** four fingertips over the long edge, the thumb up the other edge, the heel under the bottom-right corner.
  - **Yes, the wrist:** the heel tapers into one continuous forearm. No slab, no notch, no dark patch. The silhouette narrows at the wrist the way a real one does.
  - **Yes:** the edges are smooth, not faceted.
- **Across all frames:** every finger is connected to the palm. The toon bands are clean after subdivision, with no faceted outline.

### Still weak
- **The grip is a fist, not a pinch.** Searching for a true side-on thumb/index pinch (hand to the right of the card, palm toward the edge) never got the pinky and ring onto the card. A pinch with the hand on the front would cover the LCD, so I kept the fist. If Jim wants a dainty pinch, the ring and pinky will be curled off the card. That's anatomically normal but against brief #5.
- **Final frame:** the thumb and the heel show as two separate pieces along the right edge, with the thenar hidden behind the card between them. It reads as a phone grip to me, but someone might see it as a detached thumb. Moving the hand right to show the thenar pushed the fingers through the card.
- **The index fingertip** in the final wraps at its middle joint, so only a short, round tip shows. It's a bit stubby.
- **The fingers are still a bit sausage-like.** That comes from the base WebXR mesh, and subdivision rounds it but can't add knuckle detail.
- **Hand size:** at ×0.852 it reads more "badge" than v5, but the fist at the grip is still about 70% of the card's width. Jim should judge. `SPIKE.handScale` sets it before load, but the keys would need re-solving at a different scale.
- **The GLB is 179 KB uncompressed** from the mockup server. That's fine for a spike. Production should serve it brotli (≈97 KB) or meshopt.
- **Not checked:** only headless Chromium (SwiftShader) was used. I didn't check a GPU browser or Safari.

### Recommendation
1. Keep this asset pipeline. A one-piece hand and forearm with spread wrist weights is what fixed the wrist, and the script regenerates the GLB in about 2 s.
2. If Jim likes the final frame but not the fist grab, the next pass is the grip only. The rig, the solver, curl baking, the wrist-angle forearm and the search scripts (`gsearch.js`, `fsearch.js`, `tsearch*.js`, `msearch.js`, `bake.js` in the v6 scratch dir) all carry over.
3. If Jim wants richer anatomy (knuckles, nails), that's a better base mesh, not more subdivision. It would go through the same `build_hand.py`.

## v7 (the wearer's own arm, sleeve, finger volume, warmer skin)

File: `.superpowers/brainstorm/64033-1795017766/content/spike-grab-turn-v7.html` (v6 untouched). Asset: `content/hand-v7.glb`.
Video: `screens/spike-v7.mp4` (same sequence as v5/v6). Contact sheet: `screens/spike-v7-sheet.png`. Key frames, 2× DPR: `screens/spike-v7-1-rest.png` … `spike-v7-7-final.png`.
**The shots to judge:** `screens/spike-v7-7-final-hand.png` (hand, wrist and sleeve, final frame, full resolution) and `screens/spike-v7-compare.png` (v6 left, v7 right, same crop).

Unchanged from v6: the scene, lanyard, choreography and timing (DUR 1800, `render(t)` synchronous, `window.__ready`), the controls, the shared matrix, the two clip-plane canvases, the contact shadow, the contact solver and crossing test. The LCD stays clear through the grip (0 skin verts over it from t 0 to .42).

### What changed

**1. The arm is the wearer's (pose and angles).** The forearm is no longer authored per key. Every frame it aims at an **elbow point on the wearer's body** in world space (stage px, y up, z toward the camera):
- `ELBOW_REST (0, −1100, 20)` while the badge rests on the chest: the forearm runs straight down along the body.
- `ELBOW_UP (260, −600, −200)` once the badge is lifted (blended by lift): the elbow comes forward and out a little.
- **Final:** the forearm leaves the wrist at world direction (0.32, −0.70, −0.64), so 64% of it points back into the body. It is strongly foreshortened and rises from the bottom of the frame right of centre, not from the right edge. Wrist **13° ulnar, 25° extension**.
- **Over the final settle** (the badge overshoots θ 175–192°): raw angles peak at 19.4° deviation and 28.7° extension. Grip and lift: 10–17° deviation, −8° to +12° extension.
- **Mid-turn (θ ≈ 15–177°)** the hand turns 180° with the card, which is a forearm twist. A forearm pinned to the elbow would need 60–85° wrist angles. So there the forearm direction blends toward the hand's own natural line:
  - slight flexion while the fist grips back-of-hand to camera, easing to P's extension as the palm comes round
  - that is, the elbow swings out with the turn
  - a soft limit (±20° deviation, 30° extension, 35° flexion, easing in over the last 30% of each range) is the safety net. Drawn angles never exceed it.
- **New final grip (P).** The hand stands behind the card, leaning 16° toward it so the forearm can recede within the wrist limits.
  - Three fingertips (middle, ring, pinky) are hooked over the long edge onto the face, evenly spaced about 50 px apart.
  - The **index rests on the back** of the card. It could not reach round the far edge without crossing the card, and half-wrapped it showed as a sliver.
  - The **thumb pad presses the visible face** at the other edge, with the card's corner in the thumb's web. The thenar shows beside the edge, so the thumb visibly joins the heel.
  - The heel and a short bare wrist show below the card, then the cuff.
- **New mid keys.**
  - M (θ 132): the hand halfway, upright, the thumb tucked and the index released onto the hidden face.
  - M1 (θ 153): P's hand, with the thumb behind the card but already past the edge.
  - M2 (θ 165): the thumb round the edge, beside the face.
  - So the thumb goes round the edge, never through the card.
- All keys have their solved curls baked in, as in v6.

**2. The sleeve (in the GLB).** A second skinned mesh, `sleeve`, is 100% weighted to the forearm bone:
- **Shape:** an elliptical tapered tube, 8.4 × 6.8 cm at the cuff and 11.6 × 10.0 cm at 30 cm, running to 46 cm and offset 4 mm toward the back of the forearm. 800 verts.
- **Cuff edge:** 4.0 cm past the wrist joint, so the bare forearm is short (about 3 cm past the wrist crease).
- **Cuff details:** a rolled 3 mm lip turns into a dark inner wall (the inside of the sleeve), and there is a stitched seam loop 1 cm up from the edge.
- **Colour:** vertex colours carry the cuff band (×1.05), the seam (×0.74), the inner wall (×0.42) and a darkening toward the elbow (to ×0.78 at 30 cm). They multiply a navy toon ramp in the jacket's colours: shade #1b212c, base #29323f, light #3a465b, line #0d1016.
- **Depth cue:** linear fog toward #1d232d over view depth (1300 → 2900 px) applies to the sleeve and its lines only, so the sleeve gets slightly darker and lower-contrast as it recedes. The skin stays crisp.
- The skin forearm is now only 10 cm long and ends inside the sleeve.

**3. Finger volume.** Measured on the mesh (bind pose, mid-segment, radial–ulnar width), the proximal phalanges were already 16–20 mm (20–24% of the 83 mm palm). Subdivision had thinned the intermediate and distal segments to 11.6–15 mm.
- **Method:** in `build_hand.py`, after Catmull–Clark, every finger and thumb vertex moves out from the closest point on its bones' segments by Σ w_b·(s_b − 1)·radial_b.
  - s_b = target width ÷ measured width, per segment.
  - So each cross-section scales about the bone, keeping the shape and restoring volume.
  - The tip cap scales spherically, giving a round pad rather than a point.
  - Joints blend because the weights do. The palmar side of each distal pad gets ×1.10 extra (the pulp).

| segment (mm, X = radial–ulnar) | v6 | v7 |
|---|---|---|
| index P / I / D | 20.2 / 14.8 / 13.4 | 20.3 / 17.9 / 17.7 |
| middle P / I / D | 18.7 / 15.1 / 14.1 | 19.7 / 18.4 / 17.3 |
| ring P / I / D | 17.9 / 14.4 / 12.7 | 18.5 / 17.4 / 16.6 |
| pinky P / I / D | 16.4 / 12.4 / 11.6 | 17.1 / 15.6 / 14.7 |
| thumb P / D | 19.7 / 19.7 | 22.9 / 24.1 |
| palm | 82.7 | 82.8 |

Fingers now run 18–25% of palm width, tapering gently, with the thumb clearly thickest. **Measured on the rendered final frame** (stage px, about 2.6 px/mm at the hand's depth):
- middle / ring / pinky distal: 51 / 49 / 44 px (≈ 19 / 19 / 17 mm apparent)
- intermediates: 45–52 px
- thumb distal / proximal: 55 / 65 px
- index-to-pinky MCP span: 163 px, so the palm is ≈ 210 px
- ratio: finger/palm ≈ 22%

**4. Skin and outline.**
- **Palette:** shade #ad5d41 (reddish-brown, not grey), base #d8926b (warm, a little saturated), light #eeae86. These replace v6's #a96b49 / #c98b65 / #dda788.
- **Bands** (over N·L·0.5 + 0.5): shade ≤ .44, base ≤ .91, light above.
  - v6's light band started at .70 and covered most of a hand facing the camera, which read pale.
  - Now the mid tone covers most of the hand, and the highlight sits only on ridges facing the lamp. That removed the white speck on the back of the hand at the grip.
- **Same person:** the hue matches the scene's neck (#b98a6c, darkened by the scene's blur and brightness filter), and the hand is a touch more saturated because it is lit and in focus.
- **Warm extremities:** the GLB's skin vertex colours multiply the ramp by up to (1, .90, .87) at the fingertips and the back of the knuckles. It is a faint warm blush, visible on the grip's knuckles, and never a separate colour.
- **Outline: two hulls per mesh.**
  - A silhouette hull, 2.3 stage px (v6: 1.4), drawn first without depth test, so only what sticks out past the outer silhouette shows.
  - An inner hull, 1.0 px, depth-tested, for the lines where a finger crosses the palm.
  - So the outer line is bold and the inner lines stay light. The cloth uses 1.7 / 0.9 px. Skin line #5a2a1b.

**5. Scale:** 2430 px/m, **×0.9 of v5's 2700** (×1.057 of v6's 2300).
- With the fingers' volume restored, the hand needed slightly more reach to wrap both long edges.
- At ×0.95 (2565) the far-edge wrap was no better (the index still couldn't reach without crossing), and the hand starts to read "phone".
- At ×0.9 the fist at the grip is about 75% of the card's width.

**6. GLB:** 220,864 B (hand 5,063 verts / 10,084 tris, sleeve 800 / 1,520). Served uncompressed by the mockup server, 221,353 B transferred. ≈ 101 KB brotli, 136 KB gzip. The total page is ≈ 717 KB transferred from the mockup server (v6: ≈ 670 KB).

Scripts, all in `…/scratchpad/v7/`:
- `build_hand.py` + `measure.py` (Blender, about 2 s)
- the pose searches: `psearch.js`, `tloc.js`, `floc.js`, `iback.js`, `msearch3.js`, `mthumb2.js`, `m1thumb.js`, `pinky.js`
- `sweep.js` (per-t wrist, crossing and contact check)
- `rec6.mjs` / `keys6.mjs` (recording)

### Checks (numbers, `SPIKE.check` every 0.01 of t)
- **Triangle crossings through the card:** 0 at every t except **2 middle-finger triangles at t .48** (θ 122°, the far edge, the front facing away). I couldn't see them.
- **Contacts:**
  - Thumb, index, middle and ring are solved wherever their key asks for contact.
  - The pinky is unsolved from t .20 to .51: it is tucked inside the fist, as in v6.
  - The index has no contact from M to M2 while it moves onto the back. It stays hidden.
- **Wrist (drawn):** deviation ≤ 20°, extension ≤ 30°, flexion ≤ 8° over the whole run.

### Honest checklist, per key frame
Viewed at full size (2432×1520), with zoomed crops of the grip, mid-turn and final.
- **1 rest.** No hand. Fine.
- **2 reach (t .11).** The fist's knuckles rise from below the corner, the forearm straight down. Reads as a hand coming up from the body.
- **3 grip (t .20).**
  - **Yes:** a firm fist on the bottom-right corner, back of hand to camera, warm mid tone with highlights only on the knuckle ridges, no white speck, screen clear, no crossings.
  - The forearm and cuff are just below the frame here, so no sleeve shows yet.
- **4 lift and turn (t .33).** The same grip tilting with the card, the thumb pad on the front, nothing through.
- **5 edge-on (t .43).** The thumb on one side and the fingertips peeking past the other read as a pinch on a thin card. Nothing floats.
- **6 late turn (t .53).**
  - **Yes:** three fingertips hooked over the edge onto the face; the thumb waits open just outside the other edge (M1).
  - **Weak:** the forearm still leans toward the bottom-right corner here (the elbow sits out to the right). The sleeve appears at the frame's corner.
- **7 final (t 1).** The best frame, and clearly better than v6 (see the compare image).
  - **Arm:** reads as the wearer's own. A short bare wrist runs into a navy cuff and sleeve that goes back toward the body, out of the bottom of the frame right of centre.
  - **Thumb:** connected. Its pad is on the face near the right edge, its base wraps the corner, and the thenar joins the heel.
  - **Fingers:** have volume and look healthy, neither thin nor sausage-like. Every visible digit is on the card. No slivers beside the left edge (the pinky's tail was removed).
  - **Skin and line:** warm and alive. The outline is bold and smooth.
  - **Occlusion:** correct.

### Still weak
- **Fingertips over the edge read as round pads.** They're healthy but slightly knobbly and cartoonish, because only the curled distal segment shows end-on. Getting more finger over the face needs a narrower card or a bigger hand.
- **Only three fingertips show.** The index rests on the back by design. Someone counting fingers may notice.
- **The thumb opens wide during the re-grip** (t .46–.55), and the forearm briefly runs diagonally toward the bottom-right corner (t .48–.54) before settling. It's quick at 1×, but visible when scrubbing.
- **The heel below the card is a broad area of skin** with a strong diagonal shadow band down the wrist. It reads as a wrist bent back, which it is (25°), but it's the least refined area.
- **Faint sleeve outline.** The far edge of the sleeve's outline survives the fog as a thin dark line where the sleeve meets the jacket at the bottom right.
- **Not checked:** headless Chromium (SwiftShader) only. No GPU browser, no Safari.

### Recommendation
1. Judge `spike-v7-7-final-hand.png` and `spike-v7-compare.png` first. If the arm now reads as Jim's own, the body-anchored elbow plus the GLB sleeve is the approach to keep. It is generic: any key pose gets a forearm that recedes into the body.
2. The re-grip (t .46–.55) is the next thing to polish: a tighter thumb path and a less diagonal forearm.
3. If the round fingertips bother Jim, the fix is a richer base mesh (knuckles, nail beds, a flatter pulp), fed through the same `build_hand.py` (inflation, sleeve, vertex colours).

## v8 (four fingers over the edge, elbow tuck)

File: `.superpowers/brainstorm/64033-1795017766/content/spike-grab-turn-v8.html` (v7 untouched). Asset: reuses `content/hand-v7.glb` (no rebuild needed).
Video: `screens/spike-v8.mp4` (same sequence as v7, 1216×760). Contact sheet: `screens/spike-v8-sheet.png`. Key frames, 2× DPR: `screens/spike-v8-1-rest.png` … `spike-v8-7-final.png`.
**The shots to judge:** `screens/spike-v8-7-final-hand.png` and `screens/spike-v8-compare.png` (v7 left, v8 right, same crop; the v8 frame is scaled to v7's 2432 px width first, because v8's page has no scrollbar and renders 2.6% wider).

Unchanged from v7: palette, outline, sleeve, scale (2430), scene, timing (DUR 1800), synchronous `render(t)`, `window.__ready`, controls, LCD clear at the grip, and keys A and G. Only the keys M, M1, M2, P and `ELBOW_UP` changed (plus page text and comments).

### What changed

**1. Four fingertips over the edge (P, M1, M2).**
- **Why v7 couldn't:** the index knuckle is the one furthest from the far (+x) edge, and the index is short. At v7's hand position it could only reach the edge at an angle, and an angled finger curling round a 10 px card cuts through it. Every index candidate there had 10–30 crossing triangles.
- **What was in the way:** three things pulled against each other.
  - The index wants the hand further onto the card, or rolled.
  - The thumb wants the hand near the near (−x) edge and unrolled; with any roll ≥ 15° or the wrist past x −80 it can't get round the edge onto the face.
  - Turning the fingers more horizontal costs ulnar deviation one-for-one, and the elbow tuck adds more.
- **The placement that works:** v7's hand angle exactly (same F, 16° lean, no roll), with the wrist moved **45 px up and 45 px across the card**: (−125, −310) → (−80, −265) badge-local. The palm is anchored 8 px behind the card as before.
- **Deep hooks:** each finger now wraps the edge at the middle knuckle, not the last one. The proximal phalanx crosses the back, the PIP and DIP sit just past the edge, and the distal pad curls back onto the face.
  - So more of each finger shows (a side view of the middle phalanx beside the edge, then the pad on the face).
  - That replaces v7's end-on round knobs, except for the index (see weak points).
- **Method:** in the v8 scratch folder.
  - `p8search.js`: a placement grid over in-plane angle, lean, roll and wrist x/y, with a post-anchor wrist filter. It runs a per-finger grid through the real contact solver, then picks the best combination for spacing, then searches the thumb.
  - `iscan*.js` / `tfeas*.js`: index-only and thumb-only feasibility maps, which is how the conflict above was found.
  - `frefine.js`: continuous per-finger refinement against tip targets. It requires ≥ 40% of the pad over the face (index excepted), zero crossings with a 3 px margin, adjacent joints ≥ 42 px apart (50 px next to the index), and a stable re-solve (curl 0.0 after baking).
  - `trefine3.js`: the thumb, from 24 random restarts, with the MCP capped at 58° so the thenar doesn't fold.
- **Per-finger results:** pad centres in badge px; the gap is 1.5 px on the visible face for every digit.

| digit | pad centre (x, y) | pad over the card | how it reads |
|---|---|---|---|
| index | 127, −34 | 37/153 (just past the edge, on the green border) | highest, a round tip |
| middle | 96, −96 | 112/137 | long |
| ring | 96, −151 | 118/137 | long |
| pinky | 113, −191 | 80/145 | lowest and shortest |
| thumb | −113, −65 | 155/261 | pad on the face just inside the near edge |

  The tips are 62 / 55 / 40 px apart, top to bottom, and each finger leaves the edge at a slightly different angle, so it isn't a comb.
- **M1 and M2** use P's new hand. Their thumbs were re-solved (`m12thumb.js`), and M1's thumb was nudged 0.8° (`m1fix.js`) to clear the edge by 3 px.

**2. The transition (M and the re-grip).**
- **M (θ 132) now keeps all four fingers hooked** (the index too), so no finger swings round the edge later. M was found with `m8search.js`, scored over the whole G → M → M1 sweep: crossings, unsolved hooks, the forearm pointing away from the body, and a new "thumb stray" term.
- **Baked curls in M** were tuned so the solver never snaps:
  - **Pinky (35):** v7 had a 24 px pinky flick at t .513, when the pinky came over the card and the solver suddenly curled it 20°.
  - **Index (28.3):** this ends a one-frame index flicker at t .46.
  - **Result:** the largest fingertip move per 0.001 of t is now 6.7 px, which is the thumb's ordinary travel.
- **The re-grip thumb no longer swings wide** (folded in, cheap). The thumb tip's furthest point behind the card is now 64 px (v7: 160 px at t .49). The thumb waits about 40 px past the near edge at t .55–.57, then presses on.

**3. The elbow tuck.**
- `ELBOW_UP` moved from (260, −600, −200) to **(245, −640, −205)**: 15 px toward the wearer's centreline and 40 px lower. `ELBOW_REST` is unchanged.
- **That's all the tuck the wrist limit allows.** The four-finger grip needs v7's hand angle, and every 10 px further in adds about 1.5° of ulnar deviation. The settle (θ overshoots 175–192°) swings deviation about ±5.5° around the final value.
  - (210, −650), the first try, ended at 18.8° and peaked at 24.4°.
  - Rotating the hand 3–5° toward the thumb to buy room broke the index hook (crossings).
- **Most of the visible improvement comes from the hand move.** The wrist is 45 px further in, so the cuff and sleeve now sit almost directly under the card instead of at the bottom right (see the compare).
- **Wrist (raw):**

| | deviation | extension |
|---|---|---|
| final | 14.4° ulnar (v7 13°) | 19.3° (v7 25°) |
| peak over the whole run | 20.1° (t .565, the thumb pressing on), 19.9° at t .78 (the settle) | 26.3° |

  The drawn angles stay inside the soft limit. The final forearm direction is (0.33, −0.76, −0.56); v7 was (0.32, −0.70, −0.64).

### Checks (numbers)
- **Triangles through the card:** 0 at every t, swept every 0.0005 of t over 0–1 (v7 had 2 middle-finger triangles at t .48).
- **Vertices inside the 10 px slab at the final pose:** ring 3, pinky 2, thumb 1, the rest 0. They are on the finger skin where it wraps the rounded edge; v7 had 2–6 per digit.
- **Contacts:**
  - Final: all five digits solved, curl 0.0 on re-solve (the baked keys are stable).
  - The pinky is unsolved from t .19 to .51 (tucked, as in v7).
  - The index is unsolved from t .46 to .50 (θ 110–134). There it is hooked just past the edge without touching, and mostly hidden by the card.
- **LCD:** 0 skin vertices over it up to t .415, and 1 at t .42 (edge-on; v7 had 2 there).

### Checklist (viewed full size, plus 3× crops of the finger stack and the thumb edge)
- **Exactly four fingertips plus the thumb in the final pose: yes.** Index on top, then middle, ring, pinky, all on the long edge. The thumb pad is on the face at the other edge.
- **Every finger connected and on the card, nothing through: yes.** 0 crossings; each pad 1.5 px off the face. Each finger visibly joins the hand behind the card.
- **Natural spacing: mostly.** Middle and ring are the longest, the pinky is lowest and shortest, the angles vary, and it isn't a comb. But see the weak points about the index.
- **Arm from the wearer's body: yes for reach, grip, lift and final.** Final is the clearest gain: the bare wrist and the cuff now rise from under the badge, and the sleeve goes down and back, centred under the card rather than at the bottom right. The late turn (t .48–.55) is still weak; see below.
- **Regressions against v7: none found** in rest, reach, grip, lift-turn or edge-on (keys A/G unchanged, wrist within 0.3° of v7 there). Final ulnar deviation is 1.4° higher, and extension is 6° lower.

### Still weak
- **The index reads as a round knob, not a finger.** It reaches only onto the green border (24% of the pad over the face), and it is the one tip still seen end-on. It sits against the middle finger with only a hairline gap, so "slightly separated" is barely there. It can't go higher or further in without a bigger hand or narrower card: every index solution with more reach crossed the card.
- **Fingers stick out about 45–65 px past the left edge.** The deep hooks show the middle phalanges beside the edge. That reads as fingers wrapped round the card (better than knobs), but it's a slightly chunky silhouette.
- **A faint inner-line speck at the base of the thumb**, by the card edge (2–3 px at 2×). It is the inner outline hull where the thenar folds. It got smaller with the capped-MCP thumb but did not go away.
- **Late turn (t .48–.55):** the forearm still angles toward the bottom-right corner, as in v7. That is `armFollow` blending toward the hand's own line mid-turn; it was out of scope to change. The thumb also waits about 40 px outside the edge for about 30 ms before pressing on.
- **The elbow tuck is small** (15 px in, 40 px down), capped by the 20° deviation limit. A bigger tuck needs either a looser limit or a grip angled more toward the thumb, which loses the index hook.
- **Not checked:** headless Chromium (SwiftShader) only. No GPU browser, no Safari.

Scripts, in `…/scratchpad/v8/`:
- searches: `p8search.js`, `iscan2.js` / `iscan3.js`, `tfeas.js` / `tfeas2.js`, `frefine.js`, `trefine3.js`, `m8search.js`, `m12thumb.js`, `m1fix.js`
- checks: `csw.js` (dense crossing sweep), `sweep.js`, `elb3.js` (wrist peaks per elbow), `jp3.js` (fingertip jumps)
- recording: `rec6.mjs`, `keys6.mjs`

## v9 (hand proportions, lanyard round the neck)

File: `.superpowers/brainstorm/64033-1795017766/content/spike-grab-turn-v9.html` (v7 and v8 untouched). Asset: `content/hand-v9.glb` (rebuilt; 220,864 B, same vertex and triangle counts as v7's).
Video: `screens/spike-v9.mp4` (same recorder, sequence and settings as v8: 1216×760, 60 fps, crf 18). Contact sheet: `screens/spike-v9-sheet.png`. Key frames, 2× DPR: `screens/spike-v9-1-rest.png` … `spike-v9-7-final.png`.
**The shots to judge:**
- `screens/spike-v9-compare.png`: v8 left, v9 right, the same crop as v8's compare (the frame scaled to 2432 px wide, 1000×820 at 830, 702).
- `screens/spike-v9-7-final-hand.png`: that crop alone.
- `screens/spike-v9-lanyard-compare.png`: v8 and v9 at rest and in the final pose, labelled.

Unchanged from v8: motion, keys (except one baked thumb curl in P, below), timing (DUR 1800), elbow targets, palette, outline weights, sleeve, hand scale (2430), the contact solver and the clip-plane canvases.

### Problems first (viewed at full size)
- **The thumb is better, not solved.**
  - The tip is now fingertip-sized: on screen it is 1.04× the index tip, against v8's 1.22×.
  - But the mass beside the card's right edge is barely narrower: about 104 crop px against v8's 107. That mass is the thumb's proximal phalanx plus the thumb–index web, seen side-on. Its width is now right (1.03× the index's proximal on screen), so slimming the mesh further won't fix it.
  - What keeps it reading heavy is P's pose: the proximal phalanx stands entirely beside the card, parallel to the edge, with the distal folded onto the face. The result is an L-shaped block with no visible knuckle, and the base mesh has no nail.
  - The next fix is a pose change: angle the proximal phalanx back behind the card, toward the thenar. That changes key-pose motion, so it was out of scope this round.
- **The wrist taper is visible but mild.**
  - There is now a waist on the little-finger side: a concave notch where the heel meets the wrist. The forearm then widens again into the sleeve opening.
  - The thumb-side contour is still a straight diagonal from the card corner to the cuff. A dip there broke the toon shade band into a stray floating sliver (variants d to h), so that side was left alone.
  - Only about 35 px of bare wrist shows between the card's bottom edge and the cuff, so there isn't much room to show a taper.
- **The brief's "wrist at 75–80% of palm width" target doesn't fit this mesh.**
  - The wrist was already 63% of the palm (52 vs 83 mm) in v8. The "column as wide as the palm" read came from the missing waist, not from the absolute width.
  - v9 is narrower still: 47 mm at the narrowest, 56% of the palm, with the narrowing set against the heel. On screen the narrowest point is 70% of the heel at the card's edge.
- **The wrist has no outline where it enters the sleeve** (unchanged since v7). The sleeve's back wall is drawn after the skin's silhouette hull and covers it, so the wrist's side contours lean on the shade band alone. A stencil pass or a reordered hull would fix it; it was out of scope.
- **The lanyard in the final pose is legible but soft.**
  - It runs from the clip back to the neck's sides and hooks in behind. But the person is at blur 20 in that pose and the strap goes out of focus toward the neck, so the occlusion edge is soft rather than crisp.
  - At rest the read is strong. Mid-lift (t .3–.4) the slack U under the clip is clear.
- **The lanyard's wrap sits high.** The neck meets the collar about 45–50 px below the frame's top edge, so the hook behind the neck happens in the top 6% of the frame.
- **Secondary items from the brief that did not fall out:**
  - The index tip is still a round, end-on knob on the green border (a pose issue).
  - The faint crease line along the top of the ring finger is unchanged (an inner-outline line).
  - v8's dark speck at the thumb base is gone, but a small lighter crescent now shows there, by the card's right edge (about 15×80 px at 2×, with one hairline). It is the thumb web turning toward the light.

### What changed
**1. The hand (`hand-v9.glb`, from `build_hand.py` in `…/scratchpad/v9/`).** Same pipeline as v7, with four proportion steps after the finger inflation. Each has an env override, and the defaults are the shipped values:
- **Thumb target widths:** proximal / distal 23.0 / 22.0 mm → **20.0 / 18.6**.
- **Thenar:** every thumb-metacarpal-weighted vertex is pulled toward the metacarpal bone by ×**0.72**, weight-blended, so the mound flows into the palm.
- **Little-finger heel (hypothenar):** the ulnar side of the heel is slimmed by up to **18%** (a Gaussian centred 18 mm before the wrist joint, σ 13 mm).
- **Wrist waist:**
  - Non-thumb vertices are scaled toward the forearm axis by up to **20%**, on the little-finger side only (a Gaussian centred 26 mm past the wrist joint, σ 26 mm). The thumb side gets no dip.
  - The forearm rings widen at 0.08 per m (v7: 0.052), so the forearm opens out again inside the sleeve.

Measured on the mesh (bind pose, mm, radial–ulnar width; palm 83 mm):

| | v8 (hand-v7.glb) | v9 |
|---|---|---|
| thumb proximal / distal | 22.9 / 24.1 | **19.8 / 20.5** (index 20.3 / 17.7) |
| thenar (thumb metacarpal) | 40.7 | **33.9** |
| heel, 20 mm before the wrist joint | 62.8 | 57.3 |
| at the wrist joint / +20 mm / +40 mm (the cuff) | 52.4 / 51.9 / 50.0 | 49.9 / 47.3 / **46.5** |
| forearm at 90 mm (inside the sleeve) | 58.1 | 61.8 |

Measured on screen at the final pose (stage px). Digit widths are taken perpendicular to each segment at mid-length. The wrist profile is taken across the projected forearm, every 10 px along it from the wrist joint (`sw.js`):

| | v8 | v9 |
|---|---|---|
| thumb distal (index / middle distal: 50.4 / 51.2) | 61.7 | **52.4** |
| thumb proximal (index proximal: 60.1) | 63.5 | 61.8 |
| thenar | 102.3 | 87.9 |
| wrist profile at −20 / 0 / +20 / +40 / +60 / +80 | 173 / 160 / 133 / 127 / 127 / 131 | 167 / 144 / 127 / **117** / 120 / 126 |

v8 ran flat at 127–131 from +30 to +90. v9 narrows to 117 and then widens back by 8% toward the cuff.

**Variants tried** (renders in `…/scratchpad/v9/shots/`):
- a, b, c: thumb and thenar only.
- d, e: a symmetric waist. It sat right at the card's edge, where it was hidden.
- f, g: a wider, smoother waist. It still left a thumb-side shade sliver.
- h: a small thumb-side dip. Same sliver.
- **i: a waist on the little-finger side only (shipped).**
- j: a deeper version of i. It made a jagged shade spike at the notch.

**2. One baked curl.** P's thumb now carries `curl: -3.4`. The slimmer pad sat 4 px off the face, and the solver only scans in the positive direction from there, so it reported "unsolved". With the bake, the solver re-solves P at curl 0.0, with the pad 0.9–1.7 px off the face. No other key changed.

**3. The lanyard goes round the neck.**
- **Person art.**
  - The body and the neck are now separate layers: `sp-n1` / `sp-n2` mirror `sp-p1` / `sp-p2` with the same blur, brightness and fade.
  - The jacket's neckline meets the neck's sides inside the frame, at y ≈ 44–50. Before, it met them at the top edge.
  - A darker collar stand wraps the base of the neck. The neck is a 296 px column with darker side bands, so there is a contour.
  - The lapels start at the base of the neck. Same palette.
- **Strap geometry.** Each strap is two quadratic runs:
  - The front run goes from the clip to a wrap point just outside the neck's contour, arriving there moving upward.
  - The back run hooks up and inward behind the neck, narrows as it turns edge-on, is darkened 40% (in the neck's shadow), and ends inside the neck's outline.
- **Layering.**
  - The whole strap is drawn under the neck (`sp-strapsB`).
  - The front run is drawn again over the neck and lapels (`sp-strapsF`), masked to fade out over the last 46 px before the wrap point, so its end never shows as a cut.
  - The strap is sharp at the clip and goes soft toward the neck: an SVG blur of 4 → 6.5 px as the person goes out of focus, under a sharp copy that fades out radially from the clip.
- **Motion.**
  - Rest: a taut V from the clip to the neck's sides.
  - Lift: the front run sags (up to 46 px, peaking mid-lift), then pulls nearly straight as the badge comes up toward the camera.
  - Final: a near-horizontal run from the clip back to the neck's sides, hooking behind.
  - The wrap points and back runs stay fixed, since they lie on the wearer.
- **Strap shadow** (`strapsS`): it follows the front run, meets the strap at the wrap point and pushes down and out as the strap leaves the body (same offsets as v8).
- **Fix found on the way:** the clip-end strap layer (`sp-near`) used a vertical mask. Once the straps left the clip sideways, it left a hard cut at the neck in the final pose. The mask is now radial around the clip.

### Checks (numbers, on the final page)
- **Triangles through the card:** 0 at every one of 2001 samples (t 0–1, step 0.0005).
  - Note: v8's `csw.js` runner set `__ST` inline, and that assignment didn't apply. Run that way it steps 0.005, so the v8 report's "every 0.0005" was likely 201 samples.
  - The v9 sweep (`csw2.js`) prints its sample count.
- **Contacts:**
  - Final: all five digits solved, curl 0.0 on re-solve.
  - Same unsolved ranges as v8: the pinky t .19–.51 (tucked) and the index t .46–.50.
  - Vertices inside the 10 px slab at the final pose: ring 3, pinky 2, thumb 0.
- **Wrist (raw), unchanged from v8:** final 14.4° ulnar / 19.3° extension. Peaks: deviation 20.1° at t .565 and extension 26.3°. The drawn angles stay inside the soft limit (≤ 20° / ≤ 30°).
- **Largest fingertip step:** 6.7 px per 0.001 of t, the same as v8.
- **LCD:** 0 skin vertices over it up to t .42 (v8 had 1 at .42).
- **Not checked:** headless Chromium (SwiftShader) only. No GPU browser, no Safari.

### Checklist per key frame (full size)
- **1 rest:** the lanyard is a V from the clip to the base of the neck. It turns up and in at the neck's sides and disappears behind it; nothing leaves through the top edge. No hand.
- **2 reach, 3 grip, 4 lift-turn:** the same motion as v8. The thumb on the front face is visibly slimmer. The lanyard stays a V and starts to sag as the badge lifts.
- **5 edge-on (t .43):** the straps run out from the clip toward the neck's sides with slack.
- **6 late turn (t .53):** the waiting thumb is slimmer. There is a slight notch at the heel. The strap is behind the card.
- **7 final:** see the problems above. The thumb tip is finger-sized and the heel wedge is smaller, with a notch into the wrist. The lanyard runs back to the neck and hooks behind it, softly.

Scripts, in `…/scratchpad/v9/`:
- build: `build_hand.py`, `measure.py` (adds `profile` and `thenar`)
- iteration: `it.sh` (build, render, crop, screen widths), `sw.js` (screen-space widths), `bonecol.js` (colours vertices by bone), `tcurl.js` (thumb gap against curl)
- lanyard: `lan.sh` (stacked phase crops)
- checks: `csw2.js` (crossing sweep with a sample count), `sweep.js`, `fin.js`, `lcd.js`, `elb3.js`, `jp3.js`, all run by `ev.mjs`
- recording: `rec6.mjs`, `keys6.mjs`; the labelled lanyard compare is built by `lc/shot.mjs`

## v10 (the wrist)

File: `.superpowers/brainstorm/64033-1795017766/content/spike-grab-turn-v10.html` (v9 and earlier untouched). Asset: `content/hand-v10.glb` (rebuilt; 220,864 B, same vertex and triangle counts as v9's).
Video: `screens/spike-v10.mp4` (same recorder, sequence and settings as v9: 1216×760, 60 fps, crf 18). Contact sheet: `screens/spike-v10-sheet.png`. Key frames, 2× DPR: `screens/spike-v10-1-rest.png` … `spike-v10-7-final.png`.
**The shots to judge:**
- `screens/spike-v10-wrist-compare.png`: the wrist alone (card's bottom edge to the cuff) for v8, v9 and v10, in the final pose and mid-turn (t .65), labelled.
- `screens/spike-v10-compare.png`: v9 left, v10 right, the same crop as v9's compare.
- `screens/spike-v10-7-final-hand.png`: that crop alone.

Jim's note: "the wrist is a little skinny and crooked where it bends." Unchanged from v9: fingers, thumb, every key pose, timing (DUR 1800), palette, outline weights, the sleeve's look, hand scale (2430), the lanyard, the contact solver and the clip-plane canvases.

### Problems first (viewed at full size)
- **A soft bend is left where the heel meets the wrist on the little-finger side.** It is no longer a corner. The outline is continuous and the shade wedge no longer ends on it. But at 3× zoom there is still a gentle elbow, about 20° over ~15 px, where the heel's contour turns down into the forearm. It is clearest in the late turn (t .53), where v10's is about the same as v9's. Every mesh-side fix that removed it fully broke the toon shading (see "Variants tried").
- **The sleeve now heads down-right more steeply away from the badge.** Lining the forearm up with the hand is what straightens the limb. The cuff opening moves only ~8 px on screen and still sits under the badge's bottom-right corner. But the sleeve's tube now runs down-right at roughly 45° instead of v9's ~60°, so the arm reads a little less tucked under the badge. Any more alignment (elbow x ≥ 320, 6.8° ulnar) swung it visibly toward the bottom-right corner, so I stopped at 10°.
- **The wrist is now a bit wider than v8's, not equal to it.**
  - On screen it is 144 px at +20 against v8's 133, tapering to 133 at +60, which v8 matches.
  - I judged that right against the chunky fingers. If Jim wants it a touch slimmer, set `U_B` / `R_B` in `build_hand.py` (half-widths at the cuff) from .027 / .0265 to about .026 / .0255.
- **Small toon slivers survive in the heel's shade band.**
  - Mid-turn (t .65) there is a light tip a few px long where the shade wedge meets the outline.
  - The palmar side of the heel is only half-smoothed (`TY_K` .5). At full strength it left a ridge that broke the shading into floating islands on the wrist mid-turn.
- **Right side:** the notch at the card's bottom-right corner is gone. The thumb-side contour now leaves the card's edge and runs straight into the cuff. The natural V between the thenar and the wrist is still visible beside the card's right edge, above the corner. That is anatomy, not a kink.
- **Not checked:** headless Chromium (SwiftShader) only. No GPU browser, no Safari.

### What changed
**1. The mesh (`hand-v10.glb`, `build_hand.py` in `…/scratchpad/v10/`).** Only the wrist changed. v9's knobs for thumb, thenar and finger volume are untouched, and so is everything from the cuff on.
- **v9's waist and heel slimming are gone.** In their place is a measured taper.
  - For each side (ulnar, radial, dorsal, palmar), the skin's extent is measured along the forearm axis: non-thumb vertices, 4 mm bins, with sparse-bin dips dropped.
  - Between `TAPER_A` (−34 mm, in the heel, behind the card) and `TAPER_B` (+44 mm, at the cuff), each side is re-shaped to a monotone cubic (Fritsch–Carlson, so it can never dip into a waist). The cubic runs from the heel's own width and slope to `U_B` / `R_B` (27.0 / 26.5 mm half-widths).
  - The palmar/dorsal sides are blended at half strength (`TY_K` .5).
  - The target/measured ratio is Gaussian-smoothed along the axis (`RATIO_S` 8 mm). Without that, the bin noise from the hand's sparse, slanted edge loops showed up as a wobble in the contour mid-turn.
- **Why:** the v7 bind mesh itself had a corner at the wrist joint. The ulnar contour fell at a slope of ~0.4 from the heel and then went flat at d = 0. The palmar heel pad dropped 7 mm in 10 mm. On top of that, v9's waist put a pinch just past it.
- **The bend is spread wider.** The forearm weights now ramp over d −16 … +44 mm (v9: −8 … +34), so the bend deforms as an arc rather than a hinge.
- **Forearm ring widening:** `FORE_K` .06 (v9 .08). It no longer has to widen back out of a waist.

Bind-pose width, radial–ulnar (mm; palm 83):

| | v8 | v9 | v10 |
|---|---|---|---|
| heel, 20 mm before the wrist joint | 62.8 | 57.3 | 63.3 |
| −10 / wrist joint / +10 | 55.3 / 52.4 / 51.7 | 50.9 / 49.9 / 48.5 | 58.1 / 57.1 / 56.3 |
| +20 / +30 / +35–45 (the cuff) | 51.9 / 52.4 / ~50.0 | 47.3 / 47.4 / ~46.5 | 55.3 / 54.2 / 54.0–54.3 |

v10 runs 63 → 58 → 56 → 54 with no step and no dip. v8 dropped 10 mm between the heel and the joint, then ran flat; v9 dipped to 46.5.

**2. The elbow.** `ELBOW_UP` (245, −640, −205) → **(295, −655, −205)**: 50 px out, 15 px down. The forearm now lines up more with the hand. On screen its axis is 0.50/0.86 against v9's 0.41/0.91, against the palm's ~49° diagonal. `ELBOW_REST` and the turn's `armFollow`/`natArm` are unchanged.

**3. The wrist's outline into the sleeve.**
- A third hull is drawn on the skin: `matSkinWristLine`.
- It is depth-tested and drawn at the full outer width (2.3 px). Its width is scaled per vertex by a `hullMask` attribute, which is the forearm bone's skin weight eased over .35–.8.
- So it outlines the wrist's sides down into the sleeve, over the sleeve's inner wall that used to cover the silhouette hull. The cuff's front lip still covers it, because it is depth-tested.
- No wide lines appear on the palm or fingers, because the mask is 0 there.
- It costs one extra skinned draw per canvas.

### Numbers
Wrist profile on screen at the final pose (stage px across the projected forearm, from the wrist joint; `sw.js`):

| | −20 | 0 | +20 | +40 | +60 | +70 |
|---|---|---|---|---|---|---|
| v8 | 173 | 160 | 133 | 127 | 127 | — |
| v9 | 167 | 144 | 127 | **117** | 120 | — |
| v10 | 169 | 159 | 144 | 140 | 133 | 134 |

(+80 px and beyond is inside the cuff, where the samples are sparse; v10 reads 123 there in every variant, which is sampling noise.)

Wrist angles (raw), with all 2001 samples checked (t 0–1, step 0.0005):

| | v9 | v10 |
|---|---|---|
| final | 14.4° ulnar / 19.3° extension | **10.1° / 16.6°** |
| peak deviation | 20.1° at t .5625 | 17.9° at t .556 |
| peak extension | 26.3° at t .5625 | 25.3° at t .557 |
| settle (t .8) | 19.4° / 21.7° | 14.8° / 19.1° |
| min deviation / min extension | −6° / −8° | −6° / −8° |
| samples where the soft limit engaged | 192 | **0** |

Mid-turn (t .65): v9 3.2° / 11.7°, v10 −0.1° / 8.7°. The wrist bends most at t .55–.56 and in the settle (t .75–.8), not at .6–.7.

### Checks (on the final page)
- **Triangles through the card:** 0 at every one of 2001 samples (`csw2.js`, `__ST` .0005; it prints `n=2001`).
- **Contacts:**
  - Final: all five digits solved, curl 0.0 on re-solve. Pad gaps are 1.5 px for the fingers and 0.9 for the thumb, identical to v9 digit by digit (pad centres, pad-over-card counts).
  - Slab vertices: ring 3, pinky 2, thumb 0 (as v9).
  - Unsolved ranges are as v9: pinky t .19–.51 (tucked), index t .46–.50.
- **Largest fingertip step:** 6.7 px per 0.001 of t (as v9).
- **LCD:** 0 skin vertices over it up to t .42 (as v9).

### Variants tried (renders in `…/scratchpad/v10/shots/`)
- **Elbow only, v9 mesh** (e300/e330): this alone clears the right-side notch, but leaves the left corner. It is a mesh problem: it shows even with the wrist straight (`straight.js` puts the elbow on the hand's own axis).
- **a:** the x-taper, with a sparse-bin dip in the measurement that inflated the forearm (fixed by dropping dips).
- **b, c:** the x-taper, with v9's and the wider bend weights. Both are clean mid-turn, but a small jog stays at the heel.
- **d–k:** a Laplacian or plain relax of the wrist band. It straightened the contour but left shade slivers on it, or a shade crease across the wrist. It is off (`SMOOTH_IT` 0).
- **o:** the palmar taper at full strength. It gives the cleanest final contour, but a shade sliver by the thumb-side contour and big shade islands mid-turn.
- **p, q, s:** an ulnar-only palmar taper. Islands on the wrist mid-turn.
- **r:** the palmar taper at half strength. Clean mid-turn, but a wobble at t .53 (traced to the unsmoothed ratio: the v9 mesh at the same elbow is smooth there).
- **s8 (shipped), s5, s12:** r plus the smoothed ratio. s8 is the cleanest at the final pose, at t .53 and at t .65.

Scripts, in `…/scratchpad/v10/`:
- build: `build_hand.py`, `bld.sh` (build a tagged variant with env knobs)
- iteration: `rs.sh` (final-pose render, crop, wrist zoom, screen profile, angles), `t65.sh` / `t53.sh` (mid-turn wrist crops), `elbscan.js` (final and peak angles plus the cuff position per elbow), `straight.js` (the wrist straightened, for mesh-only checks)
- checks: `csw2.js`, `fin.js`, `wfull.js` (wrist angles at all 2001 samples), `lcd.js`, `sweep.js`, run through `ev.mjs`
- recording: `rec6.mjs`, `keys6.mjs`; the wrist compare is `wc/grid.html` shot by `wc/shot.mjs`
