# Desktop hand turn: design

Date: 2026-11-19. Status: reviewed by a builder check; Jim's answers folded in. Awaiting approval.
Parent spec: `docs/superpowers/specs/2026-11-18-badge-portfolio-design.md`
(this replaces its §5.8 line "Flipping opens the back as a comfortable reading
column" for desktop).

## 1. Intent

On desktop, the badge hangs on a lanyard on a blurred, illustrated person (the
"worn" scene, DECISIONS: direction A). When a visitor opens a back page
(Resume, Projects, About, Contact), the wearer's own hand reaches up, grabs the
badge like a phone, turns it over and holds it up to the camera. The camera
pushes in until the held badge nearly fills the window, and the visitor reads
the back right there, in the hand. HOME reverses it all.

Why: the site's job is to show that Jim loves tinkering and building, and to be
fun. Jim's words: "This whole thing is supposed to be fun." Staying in the
scene keeps visitors in the experience. A recruiter who wants a conventional
resume clicks out to it (PDF, LinkedIn, GitHub) instead of the site breaking
the illusion for everyone.

The motion is locked at spike v10 (Jim, 2026-11-19: "done for an MVP"). The
spike page, `hand-v10.glb`, its Blender build script and source asset (with
licence), the round-by-round report and key frames are all in
`docs/reference/hand-turn-spike/` (see its README). Background
research: `docs/research/2026-11-18-hand-grab-animation.md`.

## 2. Goals, non-goals, anti-goals

Goals
- The desktop worn scene, built for real: blurred flat-vector person, lanyard
  that goes behind the neck, contact shadow. (Today desktop shows a placeholder
  background.)
- The hand turn on desktop, front → back and back → front, matching v10.
- Reading in the held close-up: the back is fully usable there (scroll, links,
  keyboard, screen readers).
- The real-resume escape hatch is obvious: Download PDF, LinkedIn and GitHub
  are visible at the top of `/resume` without scrolling.
- Phones are untouched, and never download any of this.

Non-goals (MVP)
- Fixing the v10 art leftovers (index fingertip reads as a knob, soft bend on
  the wrist's little-finger side). Later polish.
- Idle motion of the held hand (breathing, sway). Maybe later.
- Any change to the front, the OS, apps or phone flip.

Anti-goals (failure even if it "works")
- The resume being slow or hard to reach for someone in a hurry (parent spec).
  The hand must never block getting to the content: if it isn't ready, the
  visitor gets the plain flip, not a wait.
- Blurry text in the held close-up.
- Content trapped under the fingers: nothing important rests under a finger
  once scrolling stops.
- Mobile performance or bundle size getting worse.

## 3. Constraints

- Stack is set: Astro static, TypeScript strict, no UI framework, pnpm, Vitest,
  Playwright. Lean dependencies: three.js is the one new runtime dependency,
  and it loads on desktop only, lazily.
- Jim's coding rule: clean, modular, separation of concerns; no bolt-ons. This
  design needs a refactor of `src/badge/flip/flipper.ts` first (§6.1).
- Accessibility: everything reachable without motion; `prefers-reduced-motion`
  honoured; the hand is decorative and hidden from assistive tech.
- The URL stays the source of truth for which side shows (current flipper
  contract: rapid input, Back mid-flip, bfcache, direct loads all settle to what
  the URL names).
- Safari testing per Jim's rule: headless Playwright WebKit first.
- Public repo: the hand asset is MIT (WebXR input profiles, © 2019 Amazon);
  keep its licence notice with the asset.

## 4. Approaches considered

How the back is read once the hand holds it up (Jim picked **B**):

| | Approach | Trade-off |
|---|---|---|
| A | Hand presents, then hands off: badge glides into the existing reading column, hand drops away | Most comfortable reading; loses the immersion after a beat |
| **B** | **Camera pushes in, hand keeps holding; back scrolls inside the held badge** | **Keeps the visitor in the scene, and it's fun. Narrower reading width (badge shape), so the real resume is a click away** |
| C | Hand keeps holding at spike size (~290px wide) | Simplest; too cramped to read |

How the hand is rendered (my call, from the research doc):

| | Approach | Trade-off |
|---|---|---|
| **1** | **Real-time three.js, as in the spike** | **Any window size and pixel density stays crisp; reverses from any frame (Back mid-turn); ~150–190 KB gz plus the model, desktop only, lazy** |
| 2 | Bake the hand to transparent video, synced to the CSS badge | Smaller runtime, but two alpha layers kept in sync, HEVC-with-alpha for Safari, fixed resolution, awkward mid-turn reversal |

## 5. The experience (decided)

**Rest framing (Jim: option B).** At rest the crop is tighter than v10: the
collar and lanyard sit at the top edge, and the badge is about 78% of the
window height (v10: 62%; today's desktop: ~97%). The whole badge is always in
view on any qualifying desktop window. The front shrinks about 20% from today.
The hand still rises from below the frame; v10's camera and lift are re-tuned
for this framing, not re-choreographed.

**Front → back (desktop, hand available).** As in v10: the hand reaches up from
below, grips the badge (four fingertips over the left edge, thumb on the face),
turns it 180° and lifts it toward the camera. In one continuous move the camera
then pushes in until the held badge is roughly 90–94% of the window height
(exact framing judged on screen). The person behind blurs further as the camera
closes in. The URL changes at the start, as today.

**Reading.**
- **Held layout (Jim: option A).** A slim one-line strip is pinned at the top
  of the held badge: JIM BURCH, HOME and the page links (PROJECTS · RESUME ·
  ABOUT · CONTACT), like the spike's back. Everything else from today's back
  header (vCard QR, ID block, credits) moves to the top of the scrolling
  content, and the footer (contact pads, circuit art) sits at its end. HOME and
  navigation are always in reach. This is a desktop held-mode layout of the
  same back-page markup; phones keep today's back layout.
- The back's content scrolls inside the badge's panel, like a phone screen. The
  badge, hand and scene stay still. *(My call)* This is done with **the page's
  own scroll**, not an inner scroll box: the scene, badge frame and hand are
  fixed in place, and the back content flows in the document, visible only
  through the badge's panel window. So wheel anywhere, trackpad, Space, Page
  keys and arrows all work natively with no JS, and back pages keep the parent
  spec's "zero JS" rule.
- Text may pass under the fingers while scrolling. The panel has extra padding
  at the bottom and on both sides so that, at rest and at the end of the
  scroll, nothing important sits under a finger.
- Text is crisp: when the camera settles, the badge's DOM is laid out at its
  real on-screen size with no 3D transform left on it (no scaled-up or tilted
  text at rest).
- `/resume` shows Download PDF, LinkedIn and GitHub near the top, visible
  without scrolling and clear of the fingers. *(My call)* This applies on
  phones too: it's the same markup, and a faster route to the real resume
  serves the parent spec's anti-goal everywhere.

**Back → back.** In a session that started on the front, links to another back
route switch pages without the hand letting go: the content swaps inside the
held badge (a quick crossfade), the URL updates, focus goes to the new h1.
*(My call)* That covers the header's page links and in-content links to back
routes (e.g. project cards to `/projects/<slug>`); external links and the vCard
navigate normally. A swap **replaces** the history entry, matching what the
flipper does today for a second flip before the first lands, so browser Back
and HOME always return to the front.

**Back → front (HOME, browser Back).** The exact reverse: camera pulls out, hand
turns the badge back, lowers it and leaves. Back mid-turn reverses from where
it is, as today.

**Held pose at rest is static art.** Once settled, the hand is shown as two
pre-rendered images of v10's final pose (the part behind the badge and the part
in front of it), not a live 3D canvas. So:
- **Direct load** of `/resume` (or any back) on desktop renders the worn scene,
  zoomed in, with the badge held and the static hand: instant, CSS and images
  only, no JS. *(My call)* A direct-loaded back stays a static page: HOME is a
  normal load of `/` (the front appears at rest) and header links are normal
  loads (each lands in the held close-up). The animated turn and in-place swaps
  happen in sessions that started on the front. Shipping the front, controller
  and hand loader on every back page isn't worth it for this.
- **Fallbacks** all land in that same held close-up: with reduced motion
  (quick fade), no WebGL, the 3D code not loaded yet, or a load failure (plain
  turn plus the camera move, without the animated hand). The static hand is
  shown in the settled state in every case; it isn't motion.
- The animated hand is an enhancement for the transition only.

**Who gets the scene** *(my call)*: windows at least 768px wide **and** about
600px tall, with a mouse or trackpad (`hover: hover` and `pointer: fine`). That
gates the scene CSS, the static hand images and the 3D import alike.
Everything else (phones, tablets, touch screens, very short windows) keeps
today's behaviour: the plain flip into the existing reading column on wide
screens, the phone as the badge on narrow ones, and nothing extra downloaded.
The exact height threshold is tuned on screen so the held badge never gets too
narrow to read.

## 6. How it's built (decided parts)

### 6.1 Refactor the flip first

`flipper.ts` today mixes two jobs: the controller (URL as truth, history
entries, settling one turn at a time, steering a turn mid-way, focus return,
fallback navigation) and one hard-wired presentation (CSS 3D turn with a FLIP
size change, plus the reduced-motion fade). Split it:
- **Flip controller:** everything about URL, history, settling, focus. Unchanged
  behaviour on phones; existing tests keep passing.
- **Turn presentations**, behind one interface the controller drives: run a
  turn front→back or back→front, report progress, reverse mid-way, settle to a
  side, and swap back content in place. Implementations: the current CSS turn,
  the reduced-motion fade, and the hand turn.
- The controller gains the **back → back swap** (today it goes by way of the
  front). Desktop held mode uses it; phones keep current behaviour unless it
  comes for free.
- The presentation is chosen at runtime: phone → CSS turn; desktop → hand turn
  when ready, else the fallback described in §5; reduced motion → fade.

### 6.2 The desktop scene

Its own module and styles, desktop only: person, collar, neck, lanyard straps
(which go behind the neck, per v9/v10), contact shadow, background, and the
"camera" (one transform on the scene for the push-in, plus blur that grows with
it). Ported from the v10 spike's SVG and lanyard code, cleaned up. The badge
and the straps follow the existing pointer tilt at rest.

### 6.3 The hand turn

- **One time value drives everything**, as in the spike: per frame, one matrix
  places the DOM badge and the 3D camera; the hand's pose comes from the same
  time. That keeps hand and badge locked together and makes reversal trivial.
- Two canvases (behind and in front of the badge), split at the badge's plane,
  as in the spike.
- The spike solves finger contacts every frame. For production the builder may
  instead bake the solved poses into a compact table at build time; either is
  fine if v10's look and the no-crossing result hold.
- **Loading:** after the front has booted and the browser is idle, desktop only,
  import the hand module (three.js and the compressed hand model). A flip
  before it's ready uses the fallback; nothing waits on it.
- The hand canvases and static images are `aria-hidden`, ignore pointer events,
  and never take focus.

### 6.4 Assets

- `hand-v10.glb`, its Blender build script and the source asset (with its MIT
  notice) are in `docs/reference/hand-turn-spike/`. Move the build into the
  real asset pipeline, and compress the model (meshopt or Draco) for shipping.
- The two static held-pose images are rendered from the same scene at the
  held framing, at 2× density, and regenerated when the hand or framing changes
  (a script, not hand-made).

## 7. Testing

- Unit: the flip controller (settling, steering, back→back swap) against a fake
  presentation.
- Playwright, desktop size, Chromium and headless WebKit:
  - flip to `/resume` lands in the held close-up, URL and focus right
  - HOME and browser Back return to the front; Back mid-turn reverses
  - back → back swap via the header
  - direct load of a back shows the held close-up with no WebGL request
  - reduced motion, and WebGL unavailable, both land in the held close-up
  - the panel scrolls by wheel and keyboard; PDF/LinkedIn/GitHub visible
    unscrolled on `/resume`
  - phone size: no scene, no three.js request
- Visual: frame captures of the turn compared against v10 key frames.

## 8. Left to the builder

- Module boundaries and names inside the split, beyond §6.1's two roles.
- Exact camera framing and blur amounts (judge on screen with Jim).
- Solver at runtime vs baked pose table.
- Mesh compression choice; how three.js is imported to keep it small.
- The back → back crossfade's timing.

## 9. Risks and open points

- **Reading width.** The held badge keeps the badge's shape, so on a short
  laptop window it's about phone width. Judge on screen; the camera can push
  closer if it feels cramped.
- **Real GPUs and Safari.** The spike was only ever run in headless Chromium.
- **v10 art leftovers** ship as-is for the MVP (§2).
