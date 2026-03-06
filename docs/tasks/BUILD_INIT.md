# BUILD_INIT — Initial Page Build

## Status: Complete (awaiting review)

## What was built

All 7 sections of the landing page from `docs/OUTLINE_STRUCTURE.md`, plus global styles, SEO meta, accessibility foundations, and mobile UX.

## Files created/modified

### Modified
| File | Changes |
|------|---------|
| `src/styles/global.css` | Inter font import, `@theme` accent color (`#5eead4`), base body styles (bg, font, antialiased) |
| `src/layouts/Layout.astro` | Google Fonts preconnect, meta description, skip-to-content link, OG/Twitter card tags, canonical URL |
| `src/components/FadeIn.tsx` | Refactored from `animate` (fires on mount) to `whileInView` + `viewport={{ once: true }}`. Added `delay` prop |
| `src/components/ContactForm.tsx` | Added `focus:ring-2 focus:ring-teal-300` to inputs and focus-visible ring to submit button |
| `src/pages/index.astro` | Composes all 7 sections with Section wrapper + MobileStickyCtaBar |
| `astro.config.mjs` | Added `site: "https://jimburch.dev"` |

### Created
| File | Purpose |
|------|---------|
| `src/components/Section.astro` | Reusable section wrapper — props: `id`, `dark`, `narrow` |
| `src/components/Hero.astro` | Full-viewport hero: h1, subhead, CalButton CTA, trust line |
| `src/components/ProblemSection.astro` | "Vibe coding gets you a demo" — 3 RiskCards with full copy |
| `src/components/RiskCard.astro` | Card with icon, title, body slot, pullquote. Props: `title`, `pullquote`, `pullquoteSource` |
| `src/components/SolutionSection.astro` | "I build MVPs that your future team can work in" — bio + 4 ValueProps |
| `src/components/ValueProp.astro` | Title with teal dash accent + body slot |
| `src/components/EquitySection.astro` | "No invoices. No hourly rates." — 3 bullet points + 4 FAQ items |
| `src/components/FaqItem.astro` | Bold question, neutral-400 answer, border-b separator |
| `src/components/InvestorSection.astro` | "Investors notice what's under the hood" — red vs teal comparison cards |
| `src/components/HowItWorksSection.astro` | "From idea to working product in four steps" — 2x2 grid |
| `src/components/Step.astro` | Large muted step number + title + description |
| `src/components/CtaSection.astro` | Final CTA: CalButton + ContactForm + footer (GitHub/LinkedIn) |
| `src/components/MobileStickyCtaBar.tsx` | React island — fixed bottom CTA bar, shows after hero scrolls out, hides at final CTA |
| `public/robots.txt` | Standard allow-all with sitemap reference |
| `public/favicon.svg` | "JB" monogram, teal on dark rounded rect |
| `public/og-image.png` | 1200x630 dark OG image with headline + tagline |

## Design decisions

- **Alternating backgrounds**: `bg-neutral-950` (dark sections) vs `bg-neutral-900/30` (lighter sections) for visual rhythm
- **Text hierarchy**: neutral-300 for body copy (better contrast than neutral-400 on dark bg), neutral-400 for secondary text, neutral-500 for meta text
- **RiskCards**: Horizontal scroll carousel with scroll-snap (see "Post-review refinements" below)
- **Investor comparison**: Side-by-side cards with red-500/20 border vs teal-300/20 border — text only, no images
- **How It Works**: 2x2 grid on desktop with staggered FadeIn delays (0, 0.1, 0.2, 0.3s)
- **Mobile sticky CTA**: Uses IntersectionObserver on both `#hero` and `#cta` sections to control visibility
- **Icons**: Inline Lucide SVGs (ShieldAlert, TrendingDown, Unlink) — no icon library dependency

## Verification

- `pnpm build` passes cleanly (922ms, single page)
- Playwright screenshots taken for all sections at 1440px desktop
- Mobile screenshots at 375px confirm single-column layout and sticky CTA
- All files Prettier-formatted

## Post-review refinements

### Problem section — horizontal scroll carousel (v3)

Redesigned from vertically stacked cards to a horizontal-scrolling carousel after review feedback that the original layout felt unstyled and lacked visual polish.

**Changes to `RiskCard.astro`:**
- Added `number` prop — monospace category labels (`01 — Security`, `02 — Scalability`, `03 — Technical Debt`) in faded teal
- Equal-height cards via `flex flex-col` + `items-stretch` on container, with `mt-auto` on pullquote block
- Pullquote anchored to bottom with `border-t` separator (was `border-l`)
- Wider cards: `w-[85vw] md:w-[480px]` (was `85vw / 420px`)
- Body text `text-sm text-neutral-400` for better density
- Softer corners: `rounded-2xl` (was `rounded-xl`)

**Changes to `ProblemSection.astro`:**
- Scroll container: `snap-x snap-mandatory` for clean snap stops, `snap-start` on each card
- Right edge gradient fade (`from-neutral-950 to-transparent`) hints at more content
- Removed individual `FadeIn` wrappers per card — whole carousel fades in as a unit
- Trailing spacer `div` ensures last card can scroll fully into view

**Changes to `global.css`:**
- Added `.scrollbar-hide` utility (hides native scrollbar on all browsers)

## Known gaps / next steps

- **Placeholders still in code**: Cal.com link (`PLACEHOLDER/intro-call`), Formspree ID (`PLACEHOLDER`), Cloudflare analytics token (`PLACEHOLDER`)
- **Sitemap integration**: `@astrojs/sitemap` not yet added — robots.txt references it but it won't generate yet
- **Lighthouse audit**: Not yet run — plan calls for 95+ on all categories
- **OG image**: Generated via Playwright screenshot of HTML — works but could be refined
- **Font loading**: Inter loaded via Google Fonts CSS import in global.css + preconnect in Layout — could consider self-hosting for performance
