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
