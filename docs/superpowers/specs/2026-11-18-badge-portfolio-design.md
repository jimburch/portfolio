# jimburch.com "badge": design

_Written Nov 18, 2026 from the brainstorm with Jim. Decisions Jim made are in
[`docs/DECISIONS.md`](../../DECISIONS.md); this document turns them into
something a builder can plan from. Anything marked **(builder's call)** or
**(Claude's call)** was not decided by Jim and can be revisited._

## 1. Intent

jimburch.com becomes a mobile-first portfolio that feels like holding Jim's own
hacked conference badge, inspired by (not copying) the GitHub Universe 2026
badge. On a phone, the phone *is* the badge.

**Who it's for:** hiring managers, first. It should catch their attention with
something fun and impressive. It's also a pet project Jim wants to show off.

**What they should take away:** Jim loves building and trying new things,
tinkering, messing around, hardware and personal projects. In the age of AI the
eye-catcher isn't "Jim writes good code," it's "Jim can't leave things alone":
curiosity, problem-solving, learning on his own.

**Guiding rule for every feature:** let the visitor tinker, don't just tell them
Jim tinkers. Things they can poke, break, change and uncover.

## 2. Goals, non-goals, anti-goals

**Goals**
- Looks great and feels like a physical badge in your hand, on a phone first.
- Fun to play with in the first 10 seconds; rewards the curious with deeper
  layers (hidden combos, dev mode).
- Does the portfolio and resume job: a hiring manager can reach the resume,
  work history, projects and contact quickly, including from a direct link.
- Fast and smooth on mid-range phones; fully usable by keyboard and screen
  reader. Being polished and accessible is part of "impressive."

**Non-goals**
- A replica of GitHub's badge. No GitHub logo, Mona, or GitHub's wording. The
  structure is borrowed; the art, labels and voice are Jim's.
- Photo-realistic 3D. (Tried in mockups and dropped.)
- A blog/CMS. Content is files in the repo.

**Anti-goals (failure even if it works)**
- Content trapped in canvas/WebGL where search engines, screen readers or
  copy-paste can't reach it.
- Anything that floats, swings or drifts on screen. The badge is locked to the
  phone; only the light and edges respond to tilt.
- A heavy JS bundle or framework runtime on every page.
- The resume being hard to find or slow to reach for someone in a hurry.

## 3. Constraints

- **Mobile-first for real:** design and test at phone sizes first; desktop is
  the adaptation.
- **Accessibility:** everything reachable without motion, sensors or gestures.
  Honor `prefers-reduced-motion`. Keyboard operable. Screen-reader friendly.
- **Lean dependencies:** no UI framework by default.
- **Public repo:** no secrets, tokens, `.env`, home address or phone number.
  Contact = email, LinkedIn, GitHub only.
- **No push, deploy or DNS change without Jim's OK.** Domains are in
  Cloudflare. The live site is currently `jimburch/vanilla-portfolio` on GitHub
  Pages; cutover is a later decision.
- **Platform facts the design depends on:**
  - iOS Safari only exposes device orientation after
    `DeviceOrientationEvent.requestPermission()` is called from a user gesture,
    and only over HTTPS. Android Chrome exposes it without a prompt (HTTPS
    required).
  - Desktop has no tilt sensor.

## 4. Approaches considered

| | Approach | Result | Verdict |
|---|---|---|---|
| 1 | **Astro + plain TypeScript for the badge** | Static HTML per route, zero JS unless a page needs it, built-in Markdown content collections and responsive image optimization. Badge code is framework-free TS loaded only on the front. | **Chosen.** |
| 2 | Hand-written HTML/CSS/JS bundled with Vite | Same output in principle, but the Markdown→pages, image resizing, per-project routes and PDF pipeline are homemade. | Equal at best, with more surface for bugs. |
| 3 | SvelteKit with the static adapter | Nice components for apps, but ships the Svelte runtime on every page, including content pages that gain nothing. | Heavier result. |

Jim's criterion was **best result, effort irrelevant**. Astro's output is as
lean as hand-written HTML while giving a proven content/image pipeline. If a
later app (the game, the console) truly benefits from components, a Svelte
island may be added to that app alone.

## 5. The experience

### 5.1 Front of the badge (route `/`)

The viewport is the badge. Layout, top to bottom (proportions from the mockup
"1. Depth in the edges"):

1. **Lanyard slot** cut into the top of the board.
2. **Name and title** in gold: "JIM BURCH" and a short role line (placeholder
   "BUILDER · TINKERER"; final wording is Jim's).
3. **Avatar:** a 16×16 dot-matrix pixel portrait of Jim in gold dots on a faint
   dot grid. Placeholder face until Jim's art exists.
4. **Reserved board area** (was the printed A/B, SELECT/START and D-pad,
   removed after the first phone review; see DECISIONS 2026-11-18): plain
   board, kept clear for something to be decided later.
   Plus a printed **`RESUME ↻` pad** on the board: one tap flips straight to
   `/resume`, at any time, including while the badge is still booting. This is
   the fast path for hiring managers in a hurry. (Exact placement and label
   styling: builder's call within the printed-board look; it must read as part
   of the board, not a web button pasted on.)
5. **Clear case** at the bottom holding the **LCD screen**, with two side
   keys (▲ ▼) and three bottom keys (◀ A ▶) on the case, each with a small
   printed label. **They work**, and they are the badge's only input keys.

**Look: flat illustration with depth in the edges.** Solid flat colors, drawn
not photo-real. Raised parts (gold lettering, buttons, avatar dots, the
case and its buttons) have a solid darker "side face" (a zero-blur offset in a
darker tone of the part's color). As the phone tilts, that side face shifts by
at most ~1.6px, like seeing a bit more of one edge. Tilt also moves the light
(round 2, more noticeable but still believable): a sheen (up to ~12% white)
travels across the board, a soft highlight slides across the metal (name,
avatar dots, RESUME pad) whose lit top edge brightens or dims, and a glossy
glare band drifts across the clear case and LCD glass against the tilt. All of
it is CSS driven by `--tx`/`--ty` and looks finished at rest (reduced motion).
Nothing translates or rotates. No layer parallax. No moving soft shadows.

Reference mockup: `.superpowers/brainstorm/64033-1795017766/content/badge-illustrated.html`,
variant 1 (local only, git-ignored). Key values from it: side-face offset
`x = tilt.x × -1.6px`, `y = 2px + tilt.y × -1.6px`; tilt is smoothed (lerp
factor ~0.08 per frame) and clamped to [-1, 1].

**Colors:** the mockup's green board and gold are placeholders. The final
palette is an open question for Jim (see §9). The palette must live in CSS
custom properties so the **reskin** app can swap it.

### 5.2 Tilt input

A single **tilt source** module produces a smoothed `{x, y}` in [-1, 1] and
writes it to CSS custom properties (`--tx`, `--ty`) on the badge root.
Sources, in priority order:

1. **Device orientation** (phones), after permission where required.
2. **Pointer position** over the badge (desktop, or if permission was denied).
3. **None** under `prefers-reduced-motion: reduce`: values stay at rest.

The badge boots on its own (§5.4), so there's no dedicated power-on tap. The
iOS permission request rides on the visitor's **first tap of any badge control
or the screen** (any user gesture qualifies). It must not block or delay that
tap's own action. If the visitor declines, fall back to pointer and never ask
again in that session. (Claude's call: remember the denial in
`sessionStorage`.) The `RESUME ↻` tap does not trigger the prompt, since tilt
doesn't matter on the back and a permission dialog would slow down the fast
path. (Claude's call.)

### 5.3 Controls

Every physical-looking button is a real `<button>` with an accessible name.
Mapping (Claude's call, adjustable):

| Badge control | Keyboard | Meaning in the badge OS |
|---|---|---|
| Case ▲ ▼ (side), ◀ ▶ (bottom) | Arrow keys | Move selection / game input |
| Case A (bottom middle) | Enter, Z | Confirm |
| — (on-screen BACK row) | Escape, X | Back |
| — | S | START: app-specific |
| — | Shift (alone) | SELECT: app-specific / part of combos |

B, START and SELECT have no key on the badge (DECISIONS 2026-11-18): every
screen app shows a BACK row on the LCD instead, and the Konami code is
keyboard-only. Tapping a menu item on the LCD directly also works. Keys give a
pressed state (the side face collapses), a key press lights the matching case
key, and a pointer press on any front control gives a short haptic tick
(`navigator.vibrate` where it exists, else the iOS 18+ hidden-switch toggle;
off under reduced motion).

### 5.4 The badge OS on the screen

The LCD runs a tiny "OS" (working name **JIM/OS**, Claude's call, Jim may rename):

- **Boot.** The badge boots on its own when the page loads: a short boot
  readout (skippable with any button or tap, ≤ ~2s; instant under reduced
  motion), then the launcher. No power-on tap is required. Return visits in
  the same session skip straight to the launcher. The `RESUME ↻` pad works
  during boot.
- **Launcher.** A menu of apps, navigated with the case keys, keyboard or taps.
- **Apps** run inside the LCD. "Real" items (About, Resume, Projects, Contact)
  don't run on the screen. They trigger the **flip** (§5.6).
- **Dev mode hint.** A visible hint on the front (e.g. a small printed
  "psst… ← ← A" on the board, exact combo Claude's call) unlocks a deeper layer.
  At launch, dev mode unlocks extra launcher items or Easter eggs. The console
  comes later.
- **Easter eggs.** At least the hint combo and one classic cheat code. More
  can accrue over time.

**App module contract** (Claude's call). Each app is a self-contained TS
module registered with the launcher:

```ts
interface BadgeApp {
  id: string;            // "reskin"
  title: string;         // launcher label
  kind: "screen" | "flip"; // runs on the LCD, or flips to a back route
  route?: string;        // for kind "flip"
  hidden?: boolean;      // only listed after dev mode unlock
  mount(ctx: AppContext): void | Promise<void>;   // render into ctx.screen
  unmount(): void;
  onInput?(input: BadgeInput): boolean;           // return true if handled
}
```

`AppContext` gives an app the screen element, access to the tilt source, the
theme (palette) controller, persistence helpers, and a way to exit to the
launcher. Apps never reach into each other or into the badge layout directly.
Apps are lazy-loaded (dynamic `import()`) so launching the badge doesn't load
every app.

**Screen content is DOM text, not canvas,** wherever it's text (menus,
readouts, boot log), so it's readable by assistive tech. Apps that are
inherently graphical (game, camera, avatar drawing) may use a `<canvas>` with a
text alternative.

### 5.5 Apps

**Launch batch**

| App | What it does |
|---|---|
| Boot | Automatic boot readout on load (not a launcher item). |
| Reskin | Change the board color and the metal (gold ↔ silver, plus a few palettes). The whole badge re-themes live. Choice persists in `localStorage`. |
| Sensor readout | Live tilt values (and source: gyro / pointer / off) as a little debug screen. Shows the data driving the edges and sheen. |
| Now tinkering on | What Jim is building this month. First item: the Showit badge hack. Links (flip) to its build log. Content comes from a content file, not code. |
| Break it / RESET | An "overclock" toggle that glitches the screen and board (scanlines, color shift, jitter limited to the LCD, honoring reduced motion), and a power off. A RESET button on the badge reboots the OS back to normal (replaying the boot). |
| About / Resume / Projects / Contact | `kind: "flip"` launcher entries. |

**After launch** (same contract, added one at a time)

| App | What it does |
|---|---|
| Draw your avatar | The 16×16 gold dot grid becomes editable. Visitor draws; can reset to Jim's. |
| Game | A small original game played with the case keys. Design TBD. |
| Camera | 1-bit dithered selfie via `getUserMedia`, shown on the LCD; nothing is uploaded. |
| Dev mode console | A console where visitors type commands to change colors, LEDs, art, etc. Nice-to-have. |

### 5.6 The flip (front ↔ back)

- **Front → back:** choosing a "flip" item shows a brief "loading…" on the LCD,
  then the badge turns 180° around its vertical axis and grows to fill the
  viewport, revealing the back, which then behaves as a normal scrolling page.
  The URL changes to the back route (`history.pushState` or a View Transition).
- **Back → front:** the **HOME** control on the back (styled as a labeled
  board button) flips it back. The browser back button does the same.
- **Direct load of a back route** (`/resume`, etc.) renders the back
  immediately, already flipped, with the HOME control to reach the front.
- **Reduced motion:** the flip becomes a quick crossfade.
- **No JS:** back routes are complete static pages; the front degrades to a
  static badge with plain links to the back pages.

Implementation is left to the builder: e.g. the front prefetches the back
route's HTML and animates in place, or cross-document View Transitions with a
same-document fallback. The requirement: back routes are real static pages
that work on their own, and the front-to-back transition is a single smooth
flip on modern mobile Safari and Chrome.

### 5.7 Back of the badge

**Look:** the back of a badge, our own design. A mix of normal badge details
and some circuitry, not a full circuit board. Badge-back details (ID header,
labeled HOME button, printed credits in Jim's voice, the contact QR code) sit
at the top; readable content in the middle in clean, normal type; circuitry
(traces, chip footprints) as accents at the edges and footer. Same palette as
the front.

**Routes** (Claude's call):

| Route | Content |
|---|---|
| `/about` | The career-change story: 10 years in creative marketing, laid off in the pandemic, taught himself to code, changed careers. Plus a short "what I'm into now." |
| `/resume` | Work history (Showit, FanPower), skills, education, a **Download PDF** button, contact. |
| `/projects` | Projects list: Coati, VonBox, the home lab, the Showit badge hack ("on the bench"). |
| `/projects/<slug>` | One build log per project. |
| `/contact` | Email, LinkedIn, GitHub, QR code that saves a vCard. |

Contact links also appear in the footer of every back page.

**Build logs.** Each project is a Markdown file in an Astro content collection
with frontmatter (title, status: `shipped` / `on-the-bench`, dates, links,
cover photo, tags). Body follows a loose shape: what Jim wanted, how he built
it, what broke, how it turned out, with photos throughout. The Showit badge
entry has status `on-the-bench` and is shown as in progress.

**Work entries** (Showit, FanPower) are also content files so the resume page
and the PDF read from the same data.

### 5.8 Desktop

The badge stays phone-sized, hanging centered on the page with room around it
(background treatment is a later visual decision; bring options to Jim).
Pointer position drives the tilt. Flipping opens the back as a comfortable
reading column, not edge to edge. Bring any other major desktop decisions to
Jim as they come up.

## 6. Technical design

- **Astro** (static output), **TypeScript**, no UI framework.
- **Content collections** for `work`, `projects`, `now` (the "now tinkering
  on" item). Copy and photos come from Jim; until then, placeholders seeded
  from the live site text and project READMEs.
- **Images** via `astro:assets` (responsive sizes, modern formats, lazy
  loading). Source photos live in the repo because the build needs them; keep
  originals reasonably sized (≤ ~3000px long edge, metadata/EXIF stripped since
  the repo is public) and let Astro generate variants. (Claude's call.)
- **Badge front** = an Astro page with static HTML/SVG for the badge and a
  single client entry script (`badge/main.ts`) that wires the tilt source,
  input, launcher, and lazy apps.
- **Suggested module boundaries** (builder may refine):
  - `badge/tilt` — sources, smoothing, writes CSS vars.
  - `badge/input` — buttons, keys, combos → `BadgeInput` events.
  - `badge/os` — power state, launcher, app lifecycle, dev-mode flag.
  - `badge/theme` — palettes as CSS custom properties; reskin API; persistence.
  - `badge/flip` — front ↔ back transition and history handling.
  - `badge/apps/*` — one folder per app.
  - Back pages are plain Astro pages/components; they ship no JS except the
    small HOME/flip enhancement.
- **Resume PDF** generated at build time from `/resume` with a print
  stylesheet, using headless Chromium via Playwright as a **dev** dependency.
  Output `public/jim-burch-resume.pdf` (or built into `dist/`). (Claude's
  call.)
- **QR code and vCard** generated at build time (dev dependency or a tiny
  inline encoder); no runtime library.
- **Performance budget** (Claude's call): front-page JS ≤ ~35KB gzipped before
  lazy apps; back pages work with zero JS; LCP under ~2s on a mid-range phone
  over 4G; no layout shift when the badge boots.
- **Testing:** unit tests for pure logic (tilt smoothing/clamping, input
  combos, launcher state, theme). Playwright (WebKit first, per Jim's Safari
  rule; Chromium too) for flows: boot, `RESUME ↻` one-tap flip, launch an app, flip to `/resume`
  and back, direct load of `/resume`, keyboard-only navigation, reduced
  motion. Real-device tilt checks need HTTPS on a phone (a temporary tunnel or
  preview deploy, only with Jim's OK).
- **Hosting:** undecided. Static output runs on GitHub Pages or Cloudflare
  Pages. No deploy without Jim's OK.

## 7. Phasing

1. **Foundation:** Astro project, badge front (static look, tilt, controls,
   auto boot, launcher, `RESUME ↻` pad), flip, back pages with placeholder
   content, resume PDF.
2. **Launch apps:** reskin, sensor readout, now tinkering on, break it / RESET,
   dev mode hint and Easter eggs.
3. **Real content:** Jim's copy and photos, avatar art, final palette.
4. **Launch:** hosting choice and cutover with Jim.
5. **After launch:** draw your avatar, game, camera, console, one at a time.

## 8. Left to the builder

Exact pixel layout and spacing beyond the mockup; the flip's implementation
technique; boot text; glitch effect details; specific Easter eggs beyond the
two listed; module internals within the boundaries above; test tooling
details.

## 9. Open questions for Jim (don't block foundation work)

- Final color palette (board and metal). Placeholder: green + gold.
- The avatar art: Jim's own pixel portrait. Who makes it, and from what?
- The role line under his name.
- Home lab: what's in it and which parts to show (photos exist).
- Hosting and cutover timing.
