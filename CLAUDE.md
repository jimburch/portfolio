# Jim Burch Portfolio

This is a single-page marketing landing page for an equity-for-MVP development service targeting non-technical founders. The core pitch: instead of vibe coding an MVP with AI tools (which produces insecure, unscalable, unmaintainable code), founders can partner with an experienced full-stack developer who builds a production-ready MVP in exchange for a 5-10% equity stake. The page is structured as a problem/solution narrative — it opens with documented risks of vibe-coded apps (security breaches, scaling failures, technical debt that blocks hiring), then presents the service as the alternative: clean architecture, proper security, tested and documented code that a future team can build on. The design should be dark, minimal, and developer-credible (think Linear or Stripe docs), with no stock photos, no gradient blobs, and no AI slop aesthetics — the page itself is a proof point that a real engineer built it.

See docs/OUTLINE_STRUCTURE.md for a content/structure outline of this page (we'll iterate and update it as we go)

## Stack

- Astro https://docs.astro.build/en/getting-started/
- Tailwind CSS
- Framer Motion (scroll animations, loaded as React islands only where needed)
- Cloudflare Pages (hosting)
- Cal.com (booking embed)
- Formspree (contact form fallback)
- Plausible or Cloudflare Analytics (no cookie banner needed)
- Prettier for code formatting (with prettier-plugin-astro)
- No CMS — content is hardcoded
- Playwright CLI (use this for snapshots of the UI as we build)

## Project Structure

```
src/
  components/    # Astro components (.astro) and React islands (.tsx)
  layouts/       # Base HTML layout
  pages/         # Single index.astro page
  styles/        # Global styles, Tailwind config
  assets/        # SVG icons, any static images
docs/
  OUTLINE_STRUCTURE.md  # Content outline and copy draft
public/
  favicon, og-image, robots.txt
```

## Design Principles

- Dark background (near-black or dark navy), white text, one muted accent color for CTAs
- One sans-serif font family (Inter, Geist, or similar)
- Large headlines, generous line height, comfortable reading width (max ~720px for body text)
- Subtle fade-in-on-scroll for sections — no flashy animations
- Mobile-first, single column on small screens, sticky CTA on mobile
- No stock photos. Icons should be simple and custom or from a minimal set (Lucide, Phosphor)
- No component libraries — hand-style everything with Tailwind

## Code Style

- Prefer Astro components (.astro) for static content
- Only use React islands (.tsx) where client-side interactivity is required (animations, form, Cal embed)
- Keep components small and single-purpose
- Use semantic HTML — proper heading hierarchy, landmarks, alt text
- Tailwind classes inline, no @apply unless repeated across 3+ components
- No unused dependencies — keep the bundle as close to zero JS as possible

## SEO / Performance

- Must score 95+ on all Lighthouse categories
- Proper meta tags, Open Graph image, canonical URL
- Semantic HTML for accessibility (proper heading levels, skip links, focus states)
- Preload fonts, use font-display: swap
- Generate sitemap and robots.txt via Astro integrations
- OG image should be custom — not auto-generated slop

## Content Guidelines

- Tone: Direct, confident, conversational. Writing for founders, not enterprises.
- No jargon unless it's jargon founders already know (MVP, equity, cap table)
- Stats and claims should be sourced — see OUTLINE_STRUCTURE.md for references
- Copy should be scannable: short paragraphs, clear section headers, pullquotes for key stats

## Deployment

- Cloudflare Pages, deployed from main branch
- Custom domain (TBD)
- No build secrets or env vars needed for static site
- Formspree form ID and Cal.com embed URL can be hardcoded or stored in a .env for cleanliness
