---
title: Coati
status: shipped
summary: Share, discover, and clone AI coding workflows. A platform where developers publish and install complete AI coding setups as shareable, installable units.
order: 1
links:
  - label: coati.sh
    url: https://coati.sh
---

## What I wanted

A place to share a whole AI coding setup, not just a prompt. A **setup** is a manifest (`coati.json`) plus the config files, scripts and docs that define a workflow: instructions like CLAUDE.md or .cursorrules, slash commands, skills, MCP server configs and hooks. Publish one, discover others through search, trending and profiles, then clone one to your machine with a single command.

TODO(jim): why you started it, in your words.

## How I built it

- **Web app:** SvelteKit 2 in strict TypeScript, server-rendered public pages with an SPA for signed-in pages, Tailwind CSS and shadcn-svelte.
- **Data:** Neon Postgres with Drizzle ORM, reached through Cloudflare Hyperdrive in production.
- **CLI:** `coati`, built with Commander and published to npm as `@coati/sh`, so `coati clone` installs a setup locally and `coati publish` shares yours.
- **Hosting:** Cloudflare Workers.
- **Tests:** Vitest for unit and component tests, Playwright end to end on desktop and mobile.

## What broke

TODO(jim)

## How it turned out

Live at [coati.sh](https://coati.sh) and 100% open source under the MIT license, so anyone can run their own instance or contribute.

TODO(jim): what you learned, who uses it.
