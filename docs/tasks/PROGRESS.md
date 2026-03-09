# Project Progress

Living document tracking what's been completed, what's in progress, and what's left.

---

## Completed

### Tech Stack Setup (STACK_INIT.md)

All dependencies installed and configured:

- **Astro 5.18.0** — minimal config, strict TypeScript, base layout + index page
- **Tailwind CSS 4.2.1** — Vite plugin (v4, no config file), global.css with `@import "tailwindcss"`
- **React + Framer Motion** — `@astrojs/react`, React 19, framer-motion 12. `FadeIn.tsx` component ready
- **Cal.com embed** — `CalButton.tsx` popup modal trigger, placeholder link
- **Formspree** — `ContactForm.tsx` with state handling, no extra packages (plain fetch)
- **Prettier** — prettier + prettier-plugin-astro, replaced Biome. `format` / `format:check` scripts
- **Cloudflare Analytics** — beacon script in Layout.astro, placeholder token
- **Playwright CLI** — Chromium installed, screenshot commands for desktop (1280x800) and mobile (375x812)

### Initial Page Build (BUILD_INIT.md)

All 7 sections from OUTLINE_STRUCTURE.md built and composed in `index.astro`:

| Section | Component(s) | Notes |
|---------|-------------|-------|
| Hero | `Hero.astro` | Full-viewport, h1, subhead, CalButton CTA, trust line |
| Problem | `ProblemSection.astro`, `RiskCard.astro` | Horizontal scroll carousel with snap, 3 risk cards, gradient fade edge |
| Solution | `SolutionSection.astro`, `ValueProp.astro` | Bio + 4 value prop blocks with teal dash accent |
| Equity Model | `EquitySection.astro`, `FaqItem.astro` | 3 bullet points + 4 FAQ items |
| Investor Angle | `InvestorSection.astro` | Side-by-side comparison cards (red vs teal borders) |
| How It Works | `HowItWorksSection.astro`, `Step.astro` | 2x2 grid, staggered FadeIn delays |
| Final CTA | `CtaSection.astro` | CalButton + ContactForm + footer links |

**Supporting pieces:**
- `Section.astro` — reusable wrapper with `id`, `dark`, `narrow` props
- `MobileStickyCtaBar.tsx` — React island, shows after hero scrolls out, hides at final CTA
- `global.css` — Inter font, `@theme` accent color (#5eead4), `.scrollbar-hide` utility
- `Layout.astro` — Google Fonts preconnect, meta/OG tags, skip-to-content link, canonical URL
- `astro.config.mjs` — `site: "https://jimburch.dev"`
- `public/robots.txt`, `public/favicon.svg`, `public/og-image.png`

**Post-review refinements applied:**
- Problem section redesigned from stacked cards to horizontal scroll carousel (v3)
- RiskCard got numbered category labels, equal-height layout, bottom-anchored pullquotes
- Wider cards, softer corners, body text density improvements

---

## Placeholders (need real values)

- Cal.com booking link (`PLACEHOLDER/intro-call` in CalButton.tsx)
- Formspree form ID (`PLACEHOLDER` in ContactForm.tsx)
- Cloudflare Analytics token (`PLACEHOLDER` in Layout.astro)

## Not Yet Done

- **Sitemap** — `@astrojs/sitemap` not installed; robots.txt references it
- **Lighthouse audit** — target is 95+ on all categories
- **OG image refinement** — current version is a Playwright screenshot of HTML
- **Font optimization** — Inter loaded via Google Fonts CSS; could self-host for perf
- **Custom domain** — TBD
- **Deployment** — Cloudflare Pages not yet configured

---

## Current Branch

`vibes` (branched from `develop`)
