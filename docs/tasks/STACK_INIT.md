# Tech Stack Setup

## Stack

- Astro https://docs.astro.build/en/getting-started/
- Tailwind CSS
- Framer Motion (scroll animations, loaded as React islands only where needed)
- Cloudflare Pages (hosting)
- Cal.com (booking embed)
- Formspree (contact form fallback)
- Plausible or Cloudflare Analytics (no cookie banner needed)
- Biome for code formatting
- No CMS — content is hardcoded

## Overview

This document is where will install and setup the tech stack one by one. This isn't where the project is coded, just where everything is installed and set up so that it's ready to go when the site building begins. Write your progress and summaries below here:

-----

### Astro

Installed `astro@5.18.0` with pnpm. Set up:

- `astro.config.mjs` — minimal config, ready for integrations
- `tsconfig.json` — extends `astro/tsconfigs/strict`
- `src/layouts/Layout.astro` — base HTML layout with typed props and `<slot />`
- `src/pages/index.astro` — placeholder index page using the layout
- `package.json` — added `dev`/`build`/`preview` scripts, set `type: "module"`, added `pnpm.onlyBuiltDependencies` for esbuild/sharp
- `.gitignore` — added `dist`, `.astro`, `.env`
- Verified `pnpm build` completes successfully
- Disabled Astro telemetry

### Tailwind CSS

Installed `tailwindcss@4.2.1` + `@tailwindcss/vite` (Tailwind v4 — Vite plugin, no tailwind.config needed). Set up:

- `astro.config.mjs` — added `@tailwindcss/vite` plugin
- `src/styles/global.css` — `@import "tailwindcss"`
- `src/layouts/Layout.astro` — imports global.css
- `src/pages/index.astro` — added Tailwind classes (dark bg, centered text) to verify
- Verified `pnpm build` succeeds with Tailwind CSS in output

### Framer Motion + React

Installed `@astrojs/react@4.4.2`, `react@19.2.4`, `react-dom@19.2.4`, and `framer-motion@12.35.0`. Set up:

- `astro.config.mjs` — added `react()` integration
- `src/components/FadeIn.tsx` — reusable fade-in animation component using `motion.div`
- `src/pages/index.astro` — uses `FadeIn` as a `client:load` React island to verify hydration
- Will use `client:visible` for scroll-triggered sections during site build to minimize initial JS
- Verified `pnpm build` succeeds with client-side JS bundle

### Cal.com

Installed `@calcom/embed-react@1.5.3`. Set up:

- `src/components/CalButton.tsx` — popup modal trigger with dark theme, lazy-loads Cal embed script on mount
- Uses `data-cal-link` attribute for modal popup (keeps page flow clean, fits CTA pattern from outline)
- Placeholder `CAL_LINK` constant ready to swap with real booking URL
- Verified `pnpm build` succeeds