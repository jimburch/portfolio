# Decisions

Decisions Jim has made, newest last. Proposals that haven't been agreed yet stay
in [`CONTEXT.md`](./CONTEXT.md) or the brainstorm, not here.

## 2026-11-17

- **Audience and why.** The main audience is hiring managers. The site should
  catch their attention with something fun and impressive. It's also a pet
  project to show off.
- **The takeaway.** What a visitor should remember: Jim loves building and
  trying new things, tinkering, messing around, and doing hardware and personal
  projects. In the age of AI, the eye-catcher isn't how well he codes. It's how
  much he likes solving problems, learning on his own and making his own
  things.
- **Mobile-first, always.** It's a badge you hold in your hand. Desktop keeps
  the same badge theme, but it's the adaptation. Major desktop decisions get
  brought to Jim as they come up.
- **Front plays, back reads.** Fun things happen on the badge's small screen.
  Anything "real" (resume, projects, etc.) flips the badge over, and the back
  grows to fill the phone as a normal page you can scroll. Going back flips it
  to the front, where it's a tactile badge again.
- **The back is badge-back, not just circuit board.** Like the real Universe
  '26 back ([photo](./reference/github-universe-26-badge-back.png)): a mix of
  circuitry and normal badge stuff (printed credits, art, a QR code, labeled
  buttons). The circuit theme is worked in, not the whole surface. The photo
  only shows that mix. The back is our own design, not a copy of GitHub's
  layout or wording.
- **The front is layered: play first, then hack.** Visitors get fun apps and
  toys on the screen right away. A visible hint opens a deeper "dev mode" for
  the curious. The spirit: visitors tinker, break things and find Easter eggs
  themselves. A console where visitors type their own code is a nice-to-have.
- **Look: flat illustration with depth in the edges.** Solid flat colors, drawn
  rather than photo-real (no realistic metal or lighting). Raised parts (gold
  lettering, buttons, d-pad, avatar dots, the clear case) have a solid darker
  "side face" that shifts a pixel or two as the phone tilts, like seeing a bit
  more of one edge. No layer parallax: nothing drifts. (Mockup "1. Depth in the
  edges", Nov 18. A realistic 3D look was tried first and dropped.)
- **Locked to the phone.** On a phone, the badge doesn't move or rotate on screen: it's
  fixed at the depth of the phone, as if the phone *is* the badge. Tilting the
  phone (accelerometer/gyro) shifts the edges of raised parts and a faint sheen
  on the board instead.
- **Lighting is subtle, and nothing floats.** Tilting gives a slight hint of
  light changing, not a dramatic sweep. Parts look printed or soldered onto the
  board: no shadows that slide around, nothing that looks like it hovers above
  it. Raised parts can show their depth through which edge catches the light.
- **Front-screen apps (Jim wants all of them).** Power on (boot readout; the
  tap also asks iOS for tilt permission), reskin the badge (board color, gold
  vs silver), draw your own avatar on the dot grid, sensor readout (live tilt
  data), a small original game on the D-pad and A/B, a 1-bit dithered camera
  selfie, "now tinkering on" (links to build notes on the back), break it
  ("overclock" glitches, RESET reboots), and the dev mode console
  (nice-to-have).
- **What the back covers:** Showit, FanPower, VonBox, Coati, and Jim's home
  lab (everything he's set up there).
  - **About = the career-change story** (from the live site): 10 years in
    creative marketing, laid off in the pandemic, taught himself to code.
  - **The Showit badge hack gets its own entry.** It's still a concept, not
    started yet, so it's shown as in progress.
  - **Photos exist** for VonBox, the home lab and the badge hack, including
    build photos.
- **Direct links land on the back.** URLs like `/resume` and `/projects` open
  already flipped, with a way to get to the front.
- **Lean dependencies.** No heavy framework. Three.js or similar is OK only if
  it clearly earns its place.

## 2026-11-18

- **Stack: Astro + plain TypeScript.** Jim's criterion: the best result, not
  effort. Astro outputs static HTML with no JS unless a page needs it, so the
  output is as lean as hand-written, with a proven content and image pipeline.
  Badge code is plain TypeScript with no UI framework. Svelte islands are
  allowed later if an app (game, console) truly needs them.
- **Launch batch of apps:** boot (now automatic, see below), reskin, sensor readout, "now tinkering
  on", break it / RESET. After launch: draw your avatar, the game, the camera,
  the dev mode console.
- **Desktop default:** badge stays phone-sized, hanging centered with room
  around it; the flipped back opens as a comfortable reading column.
- **Resume PDF** downloadable from the resume page, generated from the same
  content.
- **Contact lives on the back** (email, LinkedIn, GitHub) plus a QR code that
  saves a contact card.
- **The Showit badge hack is "on the bench":** shown as in progress, and it's
  the first "now tinkering on" item.
- **Fast path to the resume.** The badge boots on its own (no power-on tap),
  and a printed `RESUME ↻` pad on the board flips straight to `/resume` in one
  tap, even mid-boot. iOS tilt permission is asked on the first tap of a badge
  control. Power off lives in the break it / RESET app.
- **Projects read like build logs** with photos: what he wanted, how he built
  it, what broke, how it turned out.

## 2026-11-18 (after first phone review)

- **No printed controls on the board.** The A/B buttons, SELECT/START and the
  D-pad are gone; the black case keys around the screen already do that job
  (▲ ▼ on the side, ◀ A ▶ along the bottom, with small printed labels). The
  freed-up board area is reserved for something to be decided later.
- **Back is an on-screen BACK row.** With no B key on the badge, every screen
  app shows a BACK item on the LCD. Keyboard B (X / Esc) still works.
  SELECT, START and the Konami code are keyboard-only.
- **Stronger reflections when the badge tilts.** The light, sheen, metal
  highlights and glass glare respond more noticeably to tilt. Parts still don't
  move or float.
- **Haptic tick on every badge press.** A pointer press on any front control
  (case keys, RESET, RESUME, LCD rows) gives a short haptic: `vibrate` on
  Android, the hidden `switch` toggle on iOS 18+ Safari. Keyboard presses and
  reduced motion get none.
- **Testing real tilt on a phone:** a private Tailscale https link
  (`tailscale serve`, tailnet-only, port 8443, since Docker holds 443 locally).
- **Desktop scene: the badge, worn (direction A).** On desktop, the badge hangs
  on a lanyard on a person's chest. The person is a flat, vector illustration
  (not a photo) that's heavily out of focus (warm, depth-of-field blur), so
  the crisp badge is front and center.
  Phones are unchanged: the phone is the badge. The mockup didn't yet read as
  "worn"; that needs a tight chest crop, a lanyard that disappears under the
  collar, and a contact shadow.
- **Desktop flip: the wearer's hand turns the badge (MVP motion locked at
  spike v10, 2026-11-19).** One hand reaches up, grips the badge like a phone
  (four fingertips over the left edge, thumb on the face), turns it 180° and
  holds it up toward the camera to show the back; reverse returns it. Built as
  a toon-shaded, rigged 3D hand (three.js, WebXR generic-hand asset, MIT) over
  the DOM badge, with both driven by one transform per frame. Reference:
  `docs/reference/hand-turn-spike/` (spike page, hand model, Blender build,
  round-by-round report). Known MVP
  leftovers: the index fingertip reads as a knob, a soft bend on the wrist's
  little-finger side, and testing so far in headless Chromium only. Phones keep
  the plain flip; reduced motion on desktop fades into the held view. Design:
  `docs/superpowers/specs/2026-11-19-desktop-hand-turn-design.md`. Background research:
  `docs/research/2026-11-18-hand-grab-animation.md`.

## 2026-11-20 (hand turn build)

- **Hand assets (#29).** The hand model ships as `public/hand/hand.glb`
  (84 KB; 62 KB gzip) with the WebXR asset's MIT licence beside it, built by
  `pnpm hand:model` from `scripts/hand/` (v10's Blender build, then lossless
  meshopt: no re-quantization, only reordering, checked against the build).
  Meshopt over Draco: its decoder is tiny and the model is already quantized.
  The resting hand on a direct-loaded back page is two static WebP images of
  v10's final grip (behind and in front of the badge, 74 KB together),
  rendered by `pnpm hand:images` (headless Chromium, three.js as a dev
  dependency only) and placed in held-badge units from a generated framing
  file. Only qualifying desktops fetch them. Contract and rebuild steps:
  `scripts/hand/README.md`.
- **The desktop flip into the held close-up (#30).** On a qualifying desktop
  the flip is the held turn (`src/badge/flip/held-turn.ts`): the badge turns
  over where it hangs, then the scene's camera pushes in, blur growing, until
  the badge is held up; HOME and Back run it backwards from wherever it is.
  The front page's back slot renders the same `HeldView` a back page has, and
  the lifted face goes after it, so a flipped-in back is the direct load's
  markup and CSS exactly (no second copy of the held layout). The motion is a
  pure function of one time value (`held-turn-motion.ts`: `poseAt`,
  `frameAt`), which the 3D hand turn (#32) will drive and fall back to.
  Without the 3D hand, the resting hand fades in over the last fifth of the
  motion. Reduced motion keeps the existing fade, which lands in the held
  close-up as a unit. Phones, touch screens and short windows keep the CSS
  turn.
- **Swapping back pages in place (#31).** Once a back page shows in session,
  its links to other back pages (the strip's page links, project cards, "All
  projects", marked `data-flip` in the markup) swap the page in place with a
  200 ms crossfade instead of turning by way of the front: the old page stays
  pinned where it was showing and fades out over the new one, which starts at
  its top. A swap replaces the history entry (like a second flip before the
  first lands), so one Back or HOME always returns to the front; focus moves
  to the new h1. Held on a desktop, the badge stays held and the hand stays
  put. It is shared by every presentation (`flip/back-swap.ts`), so phones get
  it too (reduced motion: the fade's 150 ms crossfade). External links, the
  PDF and the vCard stay ordinary links, and a direct-loaded back page still
  ships no script, so its links are ordinary page loads.
- **The hand turn (#32).** On a qualifying desktop, once the front has booted
  and the browser is idle, the hand turn loads in the background (one lazy
  chunk: three.js, tree-shaken, about 167 KB gz; the meshopt model, 62 KB gz,
  content-hashed). From the next flip on it plays v10's locked motion: the
  hand reaches up, grips, turns and lifts the badge while the camera pushes
  in, and lands in the held close-up, where the static resting-hand images
  take over from its two canvases. Until it is ready, without WebGL, if the
  model fails, or if the WebGL context is lost, the held turn (#30) runs and
  nothing waits. Phones, touch screens, short windows and reduced motion never
  load it. One time value drives the badge's placement (DOM faces, the page
  scene's camera, the 3D eye) and the hand's pose (`flip/hand-turn-motion.ts`,
  `scene/hand/timeline.ts`). Re-tuned for the 77% rest framing, not
  re-choreographed: v10's world units scaled to the worn badge, its eye
  distance kept, its lift re-scaled to end exactly at the held zoom, and the
  camera push following the lift (so the wearer, the clip and the badge move
  together; the clip and a lifted-badge shadow turn with the badge's roll).
  Finger contacts are baked at build time (`pnpm hand:contacts`, 0 crossings
  over 2001 t). The hand's look, rig, keys, pose and scene are one TypeScript
  source shared by the page and the resting-image render.
