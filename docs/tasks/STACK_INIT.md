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