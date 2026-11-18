# CLAUDE.md: jimburch.com "badge" portfolio

You're working on Jim Burch's new personal portfolio homepage. Read
[`docs/CONTEXT.md`](./docs/CONTEXT.md) first; it has the full vision, the
references and the open questions.

## The one-line pitch

A **mobile-first** portfolio homepage that mimics the experience of holding
and playing with a hackable conference badge (the GitHub Universe 2026 badge):
part lanyard ID card, part tiny programmable gadget with a screen and buttons.

## Where things stand

- **Phase: brainstorming → planning.** Nothing is built. No framework,
  language, build tool or host has been chosen. Do not scaffold a framework
  or install dependencies until Jim agrees on a stack.
- This is the `badge` branch of `jimburch/portfolio` (a **public** repo). It was
  branched from `main` and intentionally emptied for a clean slate. Older work
  lives on other branches (`main`: a 2023 Next.js site; `vibes`: an Astro
  equity-for-MVP landing page). Neither is the starting point for this.
- The current live jimburch.com is served by GitHub Pages from a different repo,
  `jimburch/vanilla-portfolio` (plain HTML/CSS/JS). Cutover is a later decision.

## How to work with Jim here

1. **Brainstorm first.** Help shape the experience before the tech. Offer
   options with tradeoffs, and ask one question at a time when a decision is his.
2. **Then propose a stack** with reasons (performance on phones, animation and
   sensor needs, hosting, how much JS it ships). Get a yes before scaffolding.
3. **Write decisions down.** Keep `docs/CONTEXT.md` (and a `docs/DECISIONS.md`
   once decisions start landing) current, so a fresh session can pick up cold.

## Standing rules

- Jim's coding rule, word for word:
  > Always build code cleanly, modularly, and with proper architecture and
  > separation of concerns. Never simply bolt on a feature because I asked for
  > it. If you can't find an easy way to build it naturally, and you'd
  > recommend a refactor to make the whole thing cleanly, stop your work ahead
  > of time and say so.
- Public repo: never commit secrets, tokens, `.env` files or private info
  (home address, phone, etc.).
- Mobile-first for real: design and test at phone sizes first, and treat
  desktop as the adaptation.
- Respect accessibility: content must be reachable without motion, sensors or
  gestures (keyboard, screen readers, `prefers-reduced-motion`).
- Don't push, deploy, or change DNS without Jim's OK. Domains are managed
  in Cloudflare.
