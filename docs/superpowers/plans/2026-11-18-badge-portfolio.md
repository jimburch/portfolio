# Badge Portfolio (Foundation + Launch Apps) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build jimburch.com as a mobile-first "badge": a flat-illustrated front that responds subtly to tilt and runs a tiny OS with apps, flipping to static back pages (about, resume, projects, contact) with a generated resume PDF.

**Architecture:** Astro builds every route as static HTML. The front (`/`) ships one framework-free TypeScript entry that wires a tilt source, an input bus, a pure OS reducer, a launcher and lazy-loaded apps. Back routes are complete pages that ship no module JS; on the front, a flipper fetches a back page, injects its back face and animates the turn, keeping the URL in sync with history.

**Tech Stack:** Astro 7, TypeScript 6 (strict), pnpm, Vitest (unit), Playwright (e2e on WebKit + Chromium, plus PDF generation), `qrcode` (build-time only).

**Spec:** `docs/superpowers/specs/2026-11-18-badge-portfolio-design.md` (decisions log: `docs/DECISIONS.md`). Read both before starting.

**Scope:** spec §7 phases 1 (foundation) and 2 (launch apps). Phases 3–5 (Jim's real copy/photos/avatar/palette, hosting and cutover, post-launch apps) are out of scope.

## Global Constraints

- **Git:** never `git commit` or `git push` unless Jim has explicitly authorized commits for this execution run. Each task ends with a **Checkpoint** step: if commits are authorized, commit the listed files with the given message (no `Co-Authored-By` or AI attribution lines); otherwise stage nothing and report the files ready to commit. Never push, deploy or touch DNS.
- **Exact versions (all published ≥ 2 weeks before 2026-11-18):** `astro@7.4.5`, `typescript@6.0.3`, `@astrojs/check@0.9.12`, `vitest@5.0.5`, `@playwright/test@1.64.1`, `qrcode@1.5.4`, `@types/qrcode@1.5.6`. No other runtime or dev dependencies without asking Jim. No UI framework.
- **Node** 22 (≥ 22.12, local is 22.23.4); package manager **pnpm**.
- **Astro 7 APIs:** this plan names Astro concepts (content collections with `glob` loaders in `src/content.config.ts`, `astro:assets` `<Image>`, `getCollection`, `render`, programmatic `preview`). If the installed version's API differs, follow docs.astro.build for 7.x and keep this plan's collection names, fields and routes.
- **Mobile-first:** design and test at phone sizes first. Phone viewports used in tests: 375×667, 390×844, 360×780.
- **Accessibility:** everything reachable without motion, sensors or gestures; keyboard operable; every control a real `<button>` or `<a>` with an accessible name; honor `prefers-reduced-motion: reduce` (no tilt, instant boot, crossfade instead of flip, static glitch).
- **Nothing floats:** the badge never translates, rotates or parallaxes on screen except during the flip. Tilt only shifts raised parts' solid side face (≤ ~1.6px) and a board sheen at ≤ 6% white.
- **Side-face math:** `--ex: calc(var(--tx) * -1.6px)`; `--ey: calc(2px + var(--ty) * -1.6px)`; tilt smoothing factor `0.08` per frame; tilt clamped to [-1, 1].
- **Public repo:** no secrets, `.env`, home address or phone. Contact = email, LinkedIn, GitHub. Strip EXIF from any photo added.
- **No GitHub branding:** no GitHub logo, Mona, or GitHub's wording anywhere.
- **Budgets:** front-page initial JS ≤ 35 KB gzipped (lazy app chunks excluded); back pages contain no `type="module"` script and no `<script src>`; the only script on back pages is the inline theme script.
- **Placeholder content** is allowed and must be marked with `TODO(jim)` in content files; never invent facts (dates, metrics, employers) not found in the sources named in Task 4.
- **Safari rule:** test in headless Playwright WebKit; never launch real Safari.

## Review Focus

1. **Short phones:** on a 375×667 viewport the whole front badge fits with no page scroll and no overlapping parts. Pinned in Task 3.
2. **Keyboard double-fire:** pressing Enter or Space on a focused badge `<button>` performs its action exactly once (native click only, keymap ignores it); Cmd/Ctrl/Alt shortcuts are never hijacked. Pinned in Task 6.
3. **Flip failure:** if fetching the back page fails (offline, 500), the visitor still ends up on the back page via normal navigation and the badge is never left half-turned. Pinned in Task 9.
4. **Rapid input during a flip:** double-tapping `RESUME ↻`, or pressing browser Back mid-animation, ends in a state that matches the URL. Pinned in Task 9.
5. **Storage blocked** (Safari private mode, disabled site data): the badge still boots, reskin works for the session, nothing throws. Pinned in Tasks 2 and 11.

---

## File Structure

```
astro.config.mjs            static output, site config
package.json                scripts + pinned deps
tsconfig.json               strict
vitest.config.ts            unit tests in tests/unit
playwright.config.ts        e2e in tests/e2e; projects webkit-phone, chromium-desktop
scripts/
  build-resume-pdf.mjs      post-build: /resume → dist/jim-burch-resume.pdf
  check-budget.mjs          post-build: JS budget + back-page no-module check
src/
  content.config.ts         collections: work, projects, now
  content/work/*.md         showit.md, fanpower.md
  content/projects/*.md     coati.md, vonbox.md, home-lab.md, showit-badge.md
  content/now/current.md    the "now tinkering on" item
  copy/about.md             career-change story (imported as Markdown)
  data/site.ts              name, role line, back routes
  data/contact.ts           contact constants + buildVCard()
  data/avatar.ts            16×16 placeholder bitmap
  styles/tokens.css         palettes as custom properties keyed by data-board / data-metal
  styles/base.css           reset, type, desktop surface
  styles/badge-front.css    front face, side faces, LCD, glitch
  styles/badge-back.css     back face, reading column, print styles
  layouts/Base.astro        html shell + inline theme script
  layouts/BackLayout.astro  back face wrapper [data-back-face]
  components/front/BadgeFront.astro, Avatar.astro, StaticMenu.astro
  components/back/BackHeader.astro, BackFooter.astro, ContactQr.astro, WorkEntry.astro, ProjectCard.astro
  pages/index.astro, about.astro, resume.astro, contact.astro, projects/index.astro, projects/[slug].astro, jim-burch.vcf.ts
  badge/
    main.ts                 front entry: wires everything
    storage.ts              SafeStorage
    theme/palettes.ts       board/metal ids, parseTheme (pure)
    theme/theme.ts          ThemeController (DOM + storage)
    tilt/math.ts            clamp, smoothing, orientation/pointer mapping (pure)
    tilt/tilt-source.ts     gyro/pointer/off, permission, writes --tx/--ty
    input/keymap.ts         keyToInput (pure)
    input/combos.ts         combo detector (pure)
    input/bus.ts            InputBus
    input/controls.ts       DOM buttons/keys → bus, pressed state, first-gesture hook
    os/types.ts             BadgeInput, BadgeApp, AppEntry, AppContext, OsState, OsEvent, OsEffect
    os/reducer.ts           initialState, reduce, visibleApps (pure)
    os/registry.ts          APPS list
    os/screen.ts            renders boot log + launcher into the LCD
    os/runtime.ts           holds state, runs effects, mounts apps
    flip/flipper.ts         front ↔ back transition + history
    apps/now.ts, reskin.ts, sensors.ts, break-it.ts
tests/unit/*.test.ts
tests/e2e/*.spec.ts
```

---

### Task 1: Scaffold Astro, tooling and test harness

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `src/layouts/Base.astro`, `src/styles/base.css`, `src/pages/index.astro`, `tests/e2e/smoke.spec.ts`, `tests/unit/smoke.test.ts`
- Modify: `.gitignore` (add `.astro/`, `test-results/`, `playwright-report/`)

**Interfaces:**
- Produces: `Base.astro` props `{ title: string; description?: string }` with a default `<slot />`; scripts `dev`, `build` (`astro build`; later tasks append steps), `preview`, `test:unit` (`vitest run`), `test:e2e` (`playwright test`), `check` (`astro check`).

- [ ] **Step 1: Install pinned deps** — create `package.json` (`"type": "module"`, `"private": true`) and run `pnpm add astro@7.4.5 && pnpm add -D typescript@6.0.3 @astrojs/check@0.9.12 vitest@5.0.5 @playwright/test@1.64.1 && pnpm exec playwright install chromium webkit`. Expected: lockfile written, browsers installed.
- [ ] **Step 2: Configure** — `astro.config.mjs`: `output: 'static'`, `site: 'https://jimburch.com'`, `trailingSlash: 'ignore'`, `build.format: 'directory'`. `tsconfig.json` extends `astro/tsconfigs/strict`. `vitest.config.ts`: `include: ['tests/unit/**/*.test.ts']`, `environment: 'node'`. `playwright.config.ts`: `testDir: 'tests/e2e'`, `webServer: { command: 'pnpm build && pnpm preview --port 4321', url: 'http://localhost:4321', reuseExistingServer: !process.env.CI, timeout: 180_000 }`, `use.baseURL: 'http://localhost:4321'`, projects `webkit-phone` (`devices['iPhone 14']`, browserName webkit) listed **first**, and `chromium-desktop` (`devices['Desktop Chrome']`).
- [ ] **Step 3: Write failing tests**

```ts
// tests/unit/smoke.test.ts
import { expect, test } from 'vitest';
test('vitest runs', () => expect(1 + 1).toBe(2));

// tests/e2e/smoke.spec.ts
import { expect, test } from '@playwright/test';
test('home responds with the site title', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(/Jim Burch/);
});
```

- [ ] **Step 4: Run** `pnpm test:e2e smoke` — Expected: FAIL (no page yet).
- [ ] **Step 5: Implement** `Base.astro` (lang `en`, charset, viewport `width=device-width, initial-scale=1, viewport-fit=cover`, `<title>`, description meta, imports `base.css`) and `index.astro` using it with title `Jim Burch`. `base.css`: box-sizing reset, `margin:0`, system font stack, `color-scheme: light dark` not set (badge has its own palette).
- [ ] **Step 6: Run** `pnpm test:unit && pnpm test:e2e smoke && pnpm check` — Expected: all PASS, 0 check errors.
- [ ] **Step 7: Checkpoint** — files above; message `chore: scaffold Astro site with Vitest and Playwright`.

---

### Task 2: Safe storage and theme palettes

**Files:**
- Create: `src/badge/storage.ts`, `src/badge/theme/palettes.ts`, `src/badge/theme/theme.ts`, `src/styles/tokens.css`, `tests/unit/storage.test.ts`, `tests/unit/palettes.test.ts`
- Modify: `src/layouts/Base.astro` (inline theme script, import `tokens.css`)

**Interfaces:**
- Produces:
  - `interface SafeStorage { get(key: string): string | null; set(key: string, value: string): void; remove(key: string): void }`
  - `createSafeStorage(getBacking: () => Storage | undefined): SafeStorage` — never throws; on any backing error (or `undefined`) uses an in-memory `Map`, sticky once it fails.
  - `safeStorage(kind: 'local' | 'session'): SafeStorage`
  - `type BoardId = 'green' | 'black' | 'blue' | 'red' | 'white' | 'midnight'`; `type MetalId = 'gold' | 'silver'`
  - `BOARDS: readonly { id: BoardId; label: string; hidden?: boolean }[]` (`midnight` is `hidden: true`, unlocked by the cheat code); `METALS: readonly { id: MetalId; label: string }[]`
  - `interface Theme { board: BoardId; metal: MetalId }`; `DEFAULT_THEME: Theme = { board: 'green', metal: 'gold' }`
  - `parseTheme(raw: string | null, unlocked: readonly BoardId[]): Theme`
  - `interface ThemeController { get(): Theme; set(t: Theme): void; unlock(id: BoardId): void; unlocked(): BoardId[] }`
  - `createThemeController(root: HTMLElement, storage: SafeStorage): ThemeController` — writes `data-board` / `data-metal` on `root`; storage keys `badge-theme` (JSON Theme) and `badge-unlocked` (JSON BoardId[]).

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/storage.test.ts
test('falls back to memory when the backing store throws', () => {
  const boom = () => { throw new Error('blocked'); };
  const s = createSafeStorage(() => ({ getItem: boom, setItem: boom, removeItem: boom } as unknown as Storage));
  s.set('k', 'v');
  expect(s.get('k')).toBe('v');
  s.remove('k');
  expect(s.get('k')).toBeNull();
});
test('falls back to memory when there is no backing store', () => {
  const s = createSafeStorage(() => undefined);
  s.set('a', '1');
  expect(s.get('a')).toBe('1');
});

// tests/unit/palettes.test.ts
test('null → default', () => expect(parseTheme(null, [])).toEqual({ board: 'green', metal: 'gold' }));
test('valid json', () => expect(parseTheme('{"board":"blue","metal":"silver"}', [])).toEqual({ board: 'blue', metal: 'silver' }));
test('garbage → default', () => expect(parseTheme('not json', [])).toEqual(DEFAULT_THEME));
test('unknown ids fall back per field', () => expect(parseTheme('{"board":"pink","metal":"silver"}', [])).toEqual({ board: 'green', metal: 'silver' }));
test('hidden board needs unlock', () => {
  expect(parseTheme('{"board":"midnight","metal":"gold"}', [])).toEqual(DEFAULT_THEME);
  expect(parseTheme('{"board":"midnight","metal":"gold"}', ['midnight'])).toEqual({ board: 'midnight', metal: 'gold' });
});
```

- [ ] **Step 2: Run** `pnpm test:unit` — Expected: FAIL (modules missing).
- [ ] **Step 3: Implement** `storage.ts`, `palettes.ts`, `theme.ts` per Interfaces.
- [ ] **Step 4: Tokens** — `tokens.css` defines on `:root` (= green/gold defaults) and per `[data-board=…]` / `[data-metal=…]` the custom properties `--board`, `--board-dot`, `--board-edge`, `--metal`, `--metal-side`, `--metal-lit`, `--lcd-bg`, `--lcd-fg`, `--lcd-hl`, `--case`, `--case-edge`, `--case-side`. Green/gold values from the approved mockup: board `#1b6b4e`, dot `#2a7d5e`, metal `#e6c57c`, side `#a8843c`, lit `#f6e2ae`, LCD bg `#12201b`, fg `#d9f7e9`, highlight `#ffd84d`. Silver: metal `#cfd4da`, side `#8b929b`, lit `#f1f4f7`. Other boards: pick solder-mask-plausible colors with the same dot/edge relationships (builder's call). These are placeholders pending Jim's palette.
- [ ] **Step 5: Inline theme script** in `Base.astro` `<head>` (`is:inline`, classic script, before CSS paints): in `try/catch`, read `localStorage['badge-theme']` and `['badge-unlocked']`, validate against id lists injected at build from `BOARDS`/`METALS` (`define:vars`), set `data-board`/`data-metal` on `<html>`. Keep under 600 bytes.
- [ ] **Step 6: Run** `pnpm test:unit && pnpm check` — Expected: PASS.
- [ ] **Step 7: Checkpoint** — message `feat: safe storage and badge theme palettes`.

---

### Task 3: Static badge front (look, layout, no-JS fallback)

**Files:**
- Create: `src/data/site.ts`, `src/data/avatar.ts`, `src/components/front/BadgeFront.astro`, `src/components/front/Avatar.astro`, `src/components/front/StaticMenu.astro`, `src/styles/badge-front.css`, `tests/e2e/front-layout.spec.ts`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Produces:
  - `site.ts`: `SITE = { name: 'Jim Burch', roleLine: 'BUILDER · TINKERER' /* TODO(jim) */ }` and `BACK_ROUTES = [{ id: 'projects', title: 'PROJECTS', route: '/projects' }, { id: 'resume', title: 'RESUME', route: '/resume' }, { id: 'about', title: 'ABOUT', route: '/about' }, { id: 'contact', title: 'CONTACT', route: '/contact' }] as const`
  - `avatar.ts`: `AVATAR: readonly string[]` — 16 strings of 16 chars, `#` = on (copy the placeholder face from the mockup `badge-illustrated.html`).
  - DOM contract on `/` (later tasks select these):
    - `#badge` root (`data-side="front"`), containing `.face-front` and an empty `#back-slot` (`.face-back`, `aria-hidden="true"`, `hidden`).
    - Board parts with `data-part`: `lanyard`, `name`, `role`, `avatar`, `controls`, `case`, `lcd`, `dev-hint`, `reset`, `resume-pad`.
    - Controls: `<button data-input="up|down|left|right|a|b|start|select">` on the board (accessible names "D-pad up", "A button", "SELECT", …) and five case buttons `<button data-input="up|down|left|right|a" data-case>`.
    - `<button data-action="reset" aria-label="Reset badge">` (small, printed "RESET" label).
    - `<a href="/resume" data-flip data-no-permission data-part="resume-pad">RESUME ↻</a>` printed-pad style.
    - Dev hint printed on the board: text `psst… ← ← A` (`data-part="dev-hint"`).
    - LCD: `#lcd` (`role="region"`, `aria-label="Badge screen"`) containing `#lcd-screen` (`aria-live="polite"`) which initially holds `StaticMenu` — a `<nav aria-label="Badge menu">` of `<a data-flip href>` links built from `BACK_ROUTES`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/e2e/front-layout.spec.ts
const PARTS = ['name', 'avatar', 'controls', 'resume-pad', 'case'];
for (const vp of [{ width: 375, height: 667 }, { width: 390, height: 844 }, { width: 360, height: 780 }]) {
  test(`front fits ${vp.width}x${vp.height} with no scroll or overlap`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto('/');
    const scroll = await page.evaluate(() => document.scrollingElement!.scrollHeight - innerHeight);
    expect(scroll).toBeLessThanOrEqual(0);
    const boxes = await Promise.all(PARTS.map(p => page.locator(`[data-part="${p}"]`).boundingBox()));
    for (const b of boxes) { expect(b).not.toBeNull(); expect(b!.y + b!.height).toBeLessThanOrEqual(vp.height); expect(b!.x + b!.width).toBeLessThanOrEqual(vp.width); }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!, b = boxes[j]!;
      const overlap = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
      expect(overlap, `${PARTS[i]} overlaps ${PARTS[j]}`).toBe(false);
    }
  });
}
test('every control has an accessible name', async ({ page }) => {
  await page.goto('/');
  for (const name of ['D-pad up', 'D-pad down', 'D-pad left', 'D-pad right', 'A button', 'B button', 'START', 'SELECT', 'Reset badge'])
    await expect(page.getByRole('button', { name, exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: /RESUME/ }).first()).toHaveAttribute('href', '/resume');
});
test('without JS the screen offers links to every back page', async ({ browser }) => {
  const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Badge menu' });
  for (const href of ['/projects', '/resume', '/about', '/contact']) await expect(nav.locator(`a[href="${href}"]`)).toBeVisible();
});
```

- [ ] **Step 2: Run** `pnpm test:e2e front-layout` — Expected: FAIL.
- [ ] **Step 3: Implement** the front markup and CSS. Layout: `#badge` fills `100dvh` × `100vw` on phones; `container-type: size`; a flex column whose gaps flex so short screens compress spacing; sizes in `cqw`/`cqh` (`min()` of both for the avatar so it shrinks on short screens). Look per spec §5.1: flat solid colors from tokens; faint board dot grid; raised parts use `box-shadow: inset 0 1.5px 0 var(--metal-lit), var(--ex) var(--ey) 0 var(--metal-side)`; text uses `text-shadow: var(--ex) var(--ey) 0 var(--metal-side)`; avatar "on" dots get the side face at 0.6× offset; case has a 2px translucent border and a side face at 1.4× offset; sheen `radial-gradient(circle at calc(50% + var(--tx,0)*14%) calc(28% + var(--ty,0)*14%), rgb(255 255 255 / .06), transparent 55%)`. Define `--tx: 0; --ty: 0` defaults on `#badge`. Pressed state: `:active` and `[data-pressed]` collapse the side face to `0 0`. Desktop (`min-width: 768px`): page gets a neutral placeholder surface (flag "desktop background: bring options to Jim" in a CSS comment), badge is phone-sized (`width: min(390px, 45vh)`, `aspect-ratio: 390 / 844`, centered).
- [ ] **Step 4: Run** `pnpm test:e2e front-layout` — Expected: PASS on both projects.
- [ ] **Step 5: Checkpoint** — message `feat: static badge front with no-JS menu`.

---

### Task 4: Back pages and content

**Files:**
- Create: `src/content.config.ts`, `src/content/work/{showit,fanpower}.md`, `src/content/projects/{coati,vonbox,home-lab,showit-badge}.md`, `src/content/now/current.md`, `src/copy/about.md`, `src/data/contact.ts`, `src/layouts/BackLayout.astro`, `src/components/back/{BackHeader,BackFooter,ContactQr,WorkEntry,ProjectCard}.astro`, `src/styles/badge-back.css`, `src/pages/{about,resume,contact}.astro`, `src/pages/projects/{index,[slug]}.astro`, `src/pages/jim-burch.vcf.ts`, `tests/unit/contact.test.ts`, `tests/e2e/back-pages.spec.ts`

**Interfaces:**
- Consumes: `Base.astro`, `SITE`, `tokens.css`.
- Produces:
  - Collections: `work` `{ company: string; role: string; start: string; end: string | null; order: number; link?: string; summary: string }`; `projects` `{ title: string; status: 'shipped' | 'on-the-bench'; summary: string; order: number; cover?: image; links?: { label: string; url: string }[] }`; `now` `{ title: string; blurb: string; project: reference('projects') }`.
  - `CONTACT = { name: 'Jim Burch', email: 'TODO(jim)@example.com', linkedin: 'https://www.linkedin.com/in/jimburch1/', github: 'https://github.com/jimburch', city: 'Mesa, AZ' }`
  - `buildVCard(c: typeof CONTACT): string` — vCard 3.0, CRLF line endings.
  - `BackLayout.astro` props `{ title: string; heading: string }`: renders `<div data-back-face class="back-face">` containing `BackHeader` (ID block with name/role, `<a href="/" data-home>HOME</a>` styled as a labeled board button, a small contact QR), `<main id="back-main"><h1 tabindex="-1">{heading}</h1><slot/></main>`, `BackFooter` (contact links + circuitry accents). The flipper (Task 9) extracts exactly this element.
  - Routes `/about`, `/resume`, `/projects`, `/projects/<id>` (ids `coati`, `vonbox`, `home-lab`, `showit-badge`), `/contact`, `/jim-burch.vcf`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/contact.test.ts
test('vCard has required fields and CRLF endings', () => {
  const v = buildVCard(CONTACT);
  expect(v.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')).toBe(true);
  expect(v).toContain('FN:Jim Burch\r\n');
  expect(v).toContain(`URL:${CONTACT.linkedin}\r\n`);
  expect(v.endsWith('END:VCARD\r\n')).toBe(true);
});

// tests/e2e/back-pages.spec.ts
const ROUTES = [['/about', 'About'], ['/resume', 'Resume'], ['/projects', 'Projects'], ['/projects/vonbox', 'VonBox'], ['/contact', 'Contact']];
for (const [route, heading] of ROUTES) test(`${route} renders its back face`, async ({ page }) => {
  await page.goto(route);
  await expect(page.locator('[data-back-face] h1')).toHaveText(new RegExp(heading));
  await expect(page.locator('[data-back-face] a[data-home]')).toHaveAttribute('href', '/');
});
test('back pages ship no module scripts', async ({ request }) => {
  for (const [route] of ROUTES) {
    const html = await (await request.get(route)).text();
    expect(html).not.toMatch(/<script[^>]*type="module"/);
    expect(html).not.toMatch(/<script[^>]*\ssrc=/);
  }
});
test('showit badge is marked on the bench', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.locator('[data-project="showit-badge"]')).toContainText(/on the bench/i);
});
test('vcard is served', async ({ request }) => {
  const res = await request.get('/jim-burch.vcf');
  expect(res.headers()['content-type']).toContain('text/vcard');
  expect(await res.text()).toContain('BEGIN:VCARD');
});
test('reading column is comfortable on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/resume');
  const w = (await page.locator('#back-main').boundingBox())!.width;
  expect(w).toBeLessThanOrEqual(760);
});
```

- [ ] **Step 2: Run** `pnpm add qrcode@1.5.4 && pnpm add -D @types/qrcode@1.5.6`, then `pnpm test:unit contact && pnpm test:e2e back-pages` — Expected: FAIL.
- [ ] **Step 3: Seed content** only from these sources, marking every gap `TODO(jim)`: the live site text (`../vanilla-portfolio/src/index.html`: career-change story, Showit role "Software Developer @ Showit, March 2024 – Present", Applications team, Design App UI overhaul and other listed highlights; FanPower "formerly Pickup", full-stack), the old jobs data (`git show main:src/data/jobs.ts`: FanPower start "May 2021", fan sentiment tools, AI sports content; FanPower end date → `TODO(jim)`), `../coati/README.md` (coati.sh, what it is), `../vonbox/README.md` and `CONTEXT.md` (NFC box that plays movies, session timer via Home Assistant). Home lab and Showit badge: short `TODO(jim)` placeholders; Showit badge `status: on-the-bench` with the concept from `docs/CONTEXT.md` (lit sound-reactive edge, NFC tap to connect, e-ink instant photo). `now/current.md` references `showit-badge`. Project bodies use headings `What I wanted`, `How I built it`, `What broke`, `How it turned out`.
- [ ] **Step 4: Implement** layout, components and pages. Back look (spec §5.7): our own badge-back design, same tokens; ID header + HOME + QR at top; clean readable body type in the middle (`#back-main` max-width `68ch`, centered on desktop); traces/chip-footprint accents (CSS or inline SVG) only at edges and footer. `ContactQr.astro` renders `QRCode.toString(buildVCard(CONTACT), { type: 'svg', margin: 1 })` at build time with `role="img"` and `aria-label="QR code: save Jim's contact card"`. Resume page: About summary line, Work entries (sorted by `order`), skills `TODO(jim)`, a `Download PDF` link to `/jim-burch-resume.pdf`, contact. `jim-burch.vcf.ts` is a static `GET` returning `buildVCard(CONTACT)` with `Content-Type: text/vcard; charset=utf-8`. Back pages include no client scripts.
- [ ] **Step 5: Run** `pnpm test:unit && pnpm test:e2e back-pages && pnpm check` — Expected: PASS.
- [ ] **Step 6: Checkpoint** — message `feat: back pages with seeded content, QR and vCard`.

---

### Task 5: Tilt

**Files:**
- Create: `src/badge/tilt/math.ts`, `src/badge/tilt/tilt-source.ts`, `src/badge/main.ts`, `tests/unit/tilt.test.ts`, `tests/e2e/tilt.spec.ts`
- Modify: `src/pages/index.astro` (load `main.ts` via `<script>`)

**Interfaces:**
- Consumes: `SafeStorage`.
- Produces:
  - `interface Tilt { x: number; y: number }`; `interface Orientation { beta: number; gamma: number }`; `type ScreenAngle = 0 | 90 | 180 | 270`; `type TiltSourceKind = 'gyro' | 'pointer' | 'off'`
  - `clampUnit(v: number): number` (NaN → 0)
  - `stepToward(current: Tilt, target: Tilt, factor?: number): Tilt` (default `0.08`)
  - `orientationToTilt(reading: Orientation, baseline: Orientation, angle: ScreenAngle): Tilt` — deltas `dB = beta − baseline.beta`, `dG = gamma − baseline.gamma`, divided by `30`, rotated by screen angle: 0 → `(dG, dB)`, 90 → `(dB, −dG)`, 180 → `(−dG, −dB)`, 270 → `(−dB, dG)`, each clamped.
  - `driftBaseline(baseline: Orientation, reading: Orientation, rate?: number): Orientation` (default `0.002`; moves baseline toward reading so posture changes recenter)
  - `pointerToTilt(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): Tilt`
  - `interface TiltSource { current(): Tilt; kind(): TiltSourceKind; subscribe(fn: (t: Tilt, kind: TiltSourceKind) => void): () => void; requestPermissionFromGesture(): Promise<void> }`
  - `createTiltSource(opts: { root: HTMLElement; reducedMotion: boolean; session: SafeStorage }): TiltSource` — writes `--tx`/`--ty` (4 decimals) on `root` each animation frame while not at rest; `off` when reduced motion; `gyro` once a non-null orientation event arrives (first reading = baseline); else `pointer` from `pointermove` on `window` relative to `root`'s rect (pointer leave → target 0,0); `requestPermissionFromGesture` calls `DeviceOrientationEvent.requestPermission()` only if it exists, at most once per session, records `tilt-denied` in session storage on denial and never asks again; stops the rAF loop when `document.hidden`.
  - `main.ts`: `const root = document.getElementById('badge')!` and creates the tilt source (later tasks extend `main.ts`).

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/tilt.test.ts
test('clampUnit', () => { expect(clampUnit(2)).toBe(1); expect(clampUnit(-3)).toBe(-1); expect(clampUnit(NaN)).toBe(0); });
test('stepToward uses 0.08 by default', () => expect(stepToward({ x: 0, y: 0 }, { x: 1, y: -1 })).toEqual({ x: 0.08, y: -0.08 }));
const base = { beta: 45, gamma: 0 }, r = { beta: 60, gamma: 15 };
test.each([[0, { x: 0.5, y: 0.5 }], [90, { x: 0.5, y: -0.5 }], [180, { x: -0.5, y: -0.5 }], [270, { x: -0.5, y: 0.5 }]] as const)(
  'orientation at screen angle %i', (angle, expected) => expect(orientationToTilt(r, base, angle)).toEqual(expected));
test('orientation clamps', () => expect(orientationToTilt({ beta: 45, gamma: 90 }, base, 0).x).toBe(1));
test('baseline drifts slowly', () => {
  const d = driftBaseline(base, { beta: 55, gamma: 10 });
  expect(d.beta).toBeCloseTo(45.02); expect(d.gamma).toBeCloseTo(0.02);
});
test('pointer mapping', () => {
  const rect = { left: 100, top: 0, width: 200, height: 400 };
  expect(pointerToTilt(200, 200, rect)).toEqual({ x: 0, y: 0 });
  expect(pointerToTilt(300, 0, rect)).toEqual({ x: 1, y: -1 });
  expect(pointerToTilt(900, 900, rect)).toEqual({ x: 1, y: 1 });
});

// tests/e2e/tilt.spec.ts — first line: test.skip(({ browserName }) => browserName !== 'chromium', 'pointer tilt is desktop-only');
test('pointer drives --tx', async ({ page }) => {
  await page.goto('/');
  const box = (await page.locator('#badge').boundingBox())!;
  await page.mouse.move(box.x + box.width - 2, box.y + 2);
  await expect.poll(() => page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('badge')!).getPropertyValue('--tx')))).toBeGreaterThan(0.5);
});
test('reduced motion keeps the badge at rest', async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  await page.goto('/');
  const box = (await page.locator('#badge').boundingBox())!;
  await page.mouse.move(box.x + box.width - 2, box.y + 2);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('badge')!).getPropertyValue('--tx')) || 0)).toBe(0);
});
```

- [ ] **Step 2: Run** `pnpm test:unit tilt && pnpm test:e2e tilt` — Expected: FAIL.
- [ ] **Step 3: Implement** `math.ts`, `tilt-source.ts`, `main.ts` per Interfaces. Screen angle from `screen.orientation?.angle ?? 0`.
- [ ] **Step 4: Run** same command — Expected: PASS.
- [ ] **Step 5: Checkpoint** — message `feat: tilt source driving the badge's side faces`.

---

### Task 6: Input (keys, buttons, combos)

**Files:**
- Create: `src/badge/os/types.ts` (only `BadgeInput` for now; Task 7 adds the rest), `src/badge/input/keymap.ts`, `src/badge/input/combos.ts`, `src/badge/input/bus.ts`, `src/badge/input/controls.ts`, `tests/unit/input.test.ts`, `tests/e2e/input.spec.ts`
- Modify: `src/badge/main.ts`

**Interfaces:**
- Consumes: `TiltSource.requestPermissionFromGesture`.
- Produces:
  - `type BadgeInput = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start' | 'select'`
  - `keyToInput(key: string, targetTag: string | null, mods: { meta: boolean; ctrl: boolean; alt: boolean }): BadgeInput | null` — Arrow keys → directions; `Enter`, `z`, `Z`, `' '` → `a`; `Escape`, `x`, `X` → `b`; `s`, `S` → `start`; `Shift` → `select`. Returns `null` if any of meta/ctrl/alt is held; if `targetTag` is `INPUT`/`TEXTAREA`/`SELECT`; and for `Enter`/`' '` when `targetTag` is `BUTTON` or `A` (native activation handles those).
  - `createComboDetector(combos: Record<string, readonly BadgeInput[]>, onMatch: (name: string) => void): (input: BadgeInput) => boolean` — keeps a rolling buffer of the longest combo length; fires on suffix match and returns `true` for the input that completed a combo (the caller swallows that input so the final `a` of a combo doesn't also open a launcher item), `false` otherwise.
  - `COMBOS = { dev: ['left', 'left', 'a'], konami: ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'] } as const`
  - `interface InputBus { emit(i: BadgeInput): void; subscribe(fn: (i: BadgeInput) => void): () => void }`; `createInputBus(): InputBus`
  - `wireControls(root: HTMLElement, bus: InputBus, opts: { onFirstGesture: () => void; isActive: () => boolean }): () => void` — `click` on `[data-input]` emits its value; `keydown` on `document` maps via `keyToInput` and emits only when `isActive()` (front visible), sets `data-pressed` on the matching board button for 120 ms, calls `preventDefault` for mapped keys; the first `pointerdown`/`keydown` on any control or the LCD calls `onFirstGesture` unless the target is inside `[data-no-permission]`; `navigator.vibrate?.(8)` on button press where available.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/input.test.ts
const none = { meta: false, ctrl: false, alt: false };
test.each([['ArrowUp', 'up'], ['ArrowLeft', 'left'], ['Enter', 'a'], ['z', 'a'], ['Z', 'a'], [' ', 'a'], ['Escape', 'b'], ['x', 'b'], ['s', 'start'], ['Shift', 'select'], ['q', null]] as const)(
  '%s → %s', (key, out) => expect(keyToInput(key, null, none)).toBe(out));
test('Enter and Space on a focused button are left to the browser', () => {
  expect(keyToInput('Enter', 'BUTTON', none)).toBeNull();
  expect(keyToInput(' ', 'A', none)).toBeNull();
  expect(keyToInput('ArrowUp', 'BUTTON', none)).toBe('up');
});
test('modifier shortcuts are never hijacked', () => expect(keyToInput('ArrowLeft', null, { ...none, meta: true })).toBeNull());
test('text fields are ignored', () => expect(keyToInput('x', 'INPUT', none)).toBeNull());
test('combo fires on suffix match', () => {
  const hits: string[] = [];
  const feed = createComboDetector(COMBOS, n => hits.push(n));
  const results = (['left', 'up', 'left', 'left', 'a'] as const).map(feed);
  expect(hits).toEqual(['dev']);
  expect(results).toEqual([false, false, false, false, true]);
});
test('konami fires', () => {
  const hits: string[] = [];
  const feed = createComboDetector(COMBOS, n => hits.push(n));
  COMBOS.konami.forEach(feed);
  expect(hits).toContain('konami');
});

// tests/e2e/input.spec.ts — exposes nothing global; observe via a test hook:
// main.ts sets document.documentElement.dataset.lastInput = input on every bus emit (cheap, harmless).
test('Enter on a focused A button fires once', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { (window as any).__n = 0; new MutationObserver(() => (window as any).__n++).observe(document.documentElement, { attributeFilter: ['data-last-input'] }); });
  await page.getByRole('button', { name: 'A button', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => (window as any).__n)).toBe(1);
});
```

(The mutation count works because each emit writes a fresh `data-last-input-seq`/`data-last-input` pair; implement as `dataset.lastInput = \`${input}:${seq++}\`` so repeated identical inputs still mutate.)

- [ ] **Step 2: Run** `pnpm test:unit input && pnpm test:e2e input` — Expected: FAIL.
- [ ] **Step 3: Implement** per Interfaces; wire in `main.ts` (`onFirstGesture` → `tilt.requestPermissionFromGesture()`, `isActive` → `#badge` `data-side === 'front'`).
- [ ] **Step 4: Run** same — Expected: PASS.
- [ ] **Step 5: Checkpoint** — message `feat: badge input bus, key map and combos`.

---

### Task 7: OS core (pure reducer and registry)

**Files:**
- Modify: `src/badge/os/types.ts`
- Create: `src/badge/os/reducer.ts`, `src/badge/os/registry.ts`, `tests/unit/reducer.test.ts`

**Interfaces:**
- Consumes: `BadgeInput`, `BACK_ROUTES`, `TiltSource`, `ThemeController`, `SafeStorage`.
- Produces (in `types.ts`):
  - `type AppKind = 'screen' | 'flip'`
  - `interface AppContext { screen: HTMLElement; tilt: TiltSource; theme: ThemeController; storage: SafeStorage; exit(): void; dispatch(e: OsEvent): void; data<T>(id: string): T | null /* reads JSON from <script type="application/json" id="data-{id}"> */ }`
  - `interface BadgeApp { id: string; title: string; mount(ctx: AppContext): void | Promise<void>; unmount(): void; onInput?(input: BadgeInput): boolean }`
  - `interface AppEntry { id: string; title: string; kind: AppKind; route?: string; hidden?: boolean; load?: () => Promise<{ default: BadgeApp }> }`
  - `type OsMode = 'booting' | 'launcher' | 'app' | 'off'`
  - `interface OsState { mode: OsMode; selected: number; appId: string | null; devMode: boolean; glitch: boolean }`
  - `type OsEvent = { type: 'BOOT_DONE' } | { type: 'INPUT'; input: BadgeInput } | { type: 'SELECT_INDEX'; index: number } | { type: 'EXIT_APP' } | { type: 'POWER_OFF' } | { type: 'RESET' } | { type: 'UNLOCK_DEV' } | { type: 'SET_GLITCH'; on: boolean }`
  - `type OsEffect = { type: 'flip'; route: string } | { type: 'mountApp'; id: string } | { type: 'unmountApp'; id: string } | { type: 'startBoot' }`
- Produces (in `reducer.ts`):
  - `initialState(opts: { skipBoot: boolean }): OsState` — `mode` `'launcher'` if `skipBoot` else `'booting'`; `selected: 0`, `appId: null`, `devMode: false`, `glitch: false`
  - `visibleApps(apps: readonly AppEntry[], devMode: boolean): AppEntry[]`
  - `reduce(state: OsState, event: OsEvent, apps: readonly AppEntry[]): { state: OsState; effects: OsEffect[] }`
- Produces (in `registry.ts`): `APPS: AppEntry[]`, in launcher order (indices are relied on by later e2e tests): 0 `now` (screen, title `NOW TINKERING`), 1 `projects`, 2 `resume`, 3 `about`, 4 `contact` (flip, from `BACK_ROUTES`), 5 `reskin` (screen, `RESKIN`), 6 `break` (screen, `BREAK IT`), 7 `sensors` (screen, `SENSORS`, `hidden: true`). All eight entries exist from this task on; screen entries have no `load` until the task that builds that app adds it. The runtime (Task 8) shows `COMING SOON` for a screen entry without `load`.

**Rules the tests pin:** booting + any `INPUT` or `BOOT_DONE` → launcher. Launcher `up`/`down` move `selected` with wrap-around over `visibleApps`. Launcher `a` (or `SELECT_INDEX`) on a flip entry → effect `flip(route)`, state unchanged except `selected`; on a screen entry → `mode: 'app'`, `appId`, effect `mountApp`. App mode + `b` or `EXIT_APP` → launcher + `unmountApp`. `POWER_OFF` → `off` (+ `unmountApp` if in an app). Off ignores `INPUT`. `RESET` from any mode → `booting`, `glitch: false`, effects `unmountApp` (if in app) then `startBoot`. `UNLOCK_DEV` → `devMode: true`. `SET_GLITCH` sets `glitch`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/reducer.test.ts
const apps: AppEntry[] = [
  { id: 'now', title: 'NOW', kind: 'screen' },
  { id: 'resume', title: 'RESUME', kind: 'flip', route: '/resume' },
  { id: 'sensors', title: 'SENSORS', kind: 'screen', hidden: true },
];
const L = { ...initialState({ skipBoot: true }) };
test('boot skips on any input', () => expect(reduce(initialState({ skipBoot: false }), { type: 'INPUT', input: 'b' }, apps).state.mode).toBe('launcher'));
test('down wraps over visible apps only', () => {
  let s = reduce(L, { type: 'INPUT', input: 'down' }, apps).state;
  s = reduce(s, { type: 'INPUT', input: 'down' }, apps).state;
  expect(s.selected).toBe(0);
});
test('dev mode reveals hidden apps', () => {
  const s = reduce(L, { type: 'UNLOCK_DEV' }, apps).state;
  expect(visibleApps(apps, s.devMode).map(a => a.id)).toEqual(['now', 'resume', 'sensors']);
});
test('A on a flip entry emits flip', () => {
  const r = reduce({ ...L, selected: 1 }, { type: 'INPUT', input: 'a' }, apps);
  expect(r.effects).toEqual([{ type: 'flip', route: '/resume' }]);
  expect(r.state.mode).toBe('launcher');
});
test('A on a screen entry opens it; B closes it', () => {
  const open = reduce(L, { type: 'INPUT', input: 'a' }, apps);
  expect(open.state).toMatchObject({ mode: 'app', appId: 'now' });
  expect(open.effects).toEqual([{ type: 'mountApp', id: 'now' }]);
  const close = reduce(open.state, { type: 'INPUT', input: 'b' }, apps);
  expect(close.state.mode).toBe('launcher');
  expect(close.effects).toEqual([{ type: 'unmountApp', id: 'now' }]);
});
test('off ignores input; reset reboots and clears glitch', () => {
  const off = reduce({ ...L, glitch: true }, { type: 'POWER_OFF' }, apps).state;
  expect(reduce(off, { type: 'INPUT', input: 'a' }, apps).state).toEqual(off);
  const r = reduce(off, { type: 'RESET' }, apps);
  expect(r.state).toMatchObject({ mode: 'booting', glitch: false });
  expect(r.effects).toEqual([{ type: 'startBoot' }]);
});
test('reset from inside an app unmounts it first', () => {
  const inApp = reduce(L, { type: 'INPUT', input: 'a' }, apps).state;
  expect(reduce(inApp, { type: 'RESET' }, apps).effects).toEqual([{ type: 'unmountApp', id: 'now' }, { type: 'startBoot' }]);
});
```

- [ ] **Step 2: Run** `pnpm test:unit reducer` — Expected: FAIL.
- [ ] **Step 3: Implement** `types.ts`, `reducer.ts`, `registry.ts` per Interfaces and rules.
- [ ] **Step 4: Run** `pnpm test:unit && pnpm check` — Expected: PASS.
- [ ] **Step 5: Checkpoint** — message `feat: pure badge OS reducer and app registry`.

---

### Task 8: Screen runtime (boot, launcher, dev mode, cheat code)

**Files:**
- Create: `src/badge/os/screen.ts`, `src/badge/os/runtime.ts`, `tests/e2e/os.spec.ts`
- Modify: `src/badge/main.ts`, `src/styles/badge-front.css`

**Interfaces:**
- Consumes: reducer, registry, `InputBus`, `createComboDetector`/`COMBOS`, `ThemeController`, `TiltSource`, `safeStorage`.
- Produces:
  - `BOOT_LINES: readonly string[]` — the boot readout (builder writes copy in JIM/OS voice, e.g. `JIM/OS v0.1`, `checking solder joints… ok`; ≤ 6 lines). Lines appear over ≤ 2000 ms total; instant under reduced motion.
  - `renderBoot(screen: HTMLElement, lines: readonly string[], opts: { reducedMotion: boolean; signal: AbortSignal }): Promise<void>`
  - `renderLauncher(screen: HTMLElement, entries: readonly AppEntry[], selected: number, onPick: (index: number) => void): void` — a list of `<button>`s (`aria-current="true"` on the selected one, a `▶` marker), showing a window of 4 items with `▲`/`▼` indicators when more exist.
  - `interface Runtime { dispatch(e: OsEvent): void; state(): OsState; onFlip(fn: (route: string) => void): void }`
  - `createRuntime(opts: { screen: HTMLElement; apps: readonly AppEntry[]; bus: InputBus; ctxBase: Omit<AppContext, 'screen' | 'exit' | 'dispatch'>; reducedMotion: boolean; session: SafeStorage }): Runtime` — skip boot if session key `booted` is set (set it after the first boot completes); routes bus input to the mounted app's `onInput` first, then to `reduce`; runs effects (`mountApp` → `await entry.load()` then `mount`; `flip` → calls `onFlip` listeners after rendering `loading…` on the LCD for 300 ms, 0 under reduced motion; `startBoot` → `renderBoot` then `BOOT_DONE`); re-renders the launcher after each state change in launcher mode; sets `#badge` `data-mode` and `data-glitch` from state.
  - `main.ts`: on start, replaces the `StaticMenu` in `#lcd-screen`; every bus input goes to the combo detector first and is swallowed when it completes a combo; otherwise it goes to the runtime. `dev` → `UNLOCK_DEV` and a one-line LCD toast `DEV MODE: ON` (shown ~1.5 s over the launcher); `konami` → `theme.unlock('midnight')` and toast `CHEAT ENABLED`; `[data-action="reset"]` click → `RESET`.
  - A screen entry without `load` mounts a built-in placeholder that renders `COMING SOON`; `b` exits as usual.

- [ ] **Step 1: Write failing tests**

```ts
// tests/e2e/os.spec.ts
test('boots by itself into the launcher', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher', { timeout: 3000 });
  await expect(page.locator('#lcd-screen button[aria-current="true"]')).toBeVisible();
});
test('any key skips the boot', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher', { timeout: 300 });
});
test('second visit in the session skips the boot', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher', { timeout: 3000 });
  await page.reload();
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher', { timeout: 300 });
});
test('reduced motion boots instantly', async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  await page.goto('/');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher', { timeout: 300 });
});
test('keyboard moves the selection', async ({ page }) => {
  await page.goto('/'); await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#lcd-screen button[aria-current="true"]')).toHaveText(/PROJECTS/);
});
test('← ← A unlocks dev mode', async ({ page }) => {
  await page.goto('/'); await page.keyboard.press('Escape');
  for (const k of ['ArrowLeft', 'ArrowLeft', 'z']) await page.keyboard.press(k);
  await expect(page.locator('#lcd-screen')).toContainText('DEV MODE: ON');
});
test('reset replays the boot', async ({ page }) => {
  await page.goto('/'); await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Reset badge' }).click();
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'booting');
});
```

(`z` is used for A because Enter on a focused button is left to the browser; with focus on `body`, Enter also works.)

- [ ] **Step 2: Run** `pnpm test:e2e os` — Expected: FAIL.
- [ ] **Step 3: Implement** per Interfaces. LCD styles: monospace, `--lcd-*` tokens, ~4 visible rows at all three phone sizes.
- [ ] **Step 4: Run** `pnpm test:e2e os && pnpm test:e2e front-layout` — Expected: PASS.
- [ ] **Step 5: Checkpoint** — message `feat: badge screen runtime with boot, launcher and dev mode`.

---

### Task 9: The flip

**Files:**
- Create: `src/badge/flip/flipper.ts`, `tests/e2e/flip.spec.ts`
- Modify: `src/badge/main.ts`, `src/styles/badge-front.css`, `src/styles/badge-back.css`, `src/pages/index.astro` (import `badge-back.css` so injected faces are styled)

**Interfaces:**
- Consumes: `Runtime.onFlip`, `#badge`, `#back-slot`, `[data-back-face]` from Task 4, `[data-flip]` links, `[data-home]`.
- Produces:
  - `interface Flipper { flipTo(route: string, opts?: { push?: boolean }): Promise<void>; flipBack(opts?: { viaHistory?: boolean }): Promise<void>; side(): 'front' | 'back' }`
  - `createFlipper(opts: { badge: HTMLElement; backSlot: HTMLElement; reducedMotion: boolean; onSideChange: (side: 'front' | 'back') => void }): Flipper`
- Behavior:
  - `flipTo`: `fetch(route)`; on non-OK or network error → `location.assign(route)` and return. Parse with `DOMParser`, take `[data-back-face]` and `<title>`; inject the face into `#back-slot`; animate `#badge` with the Web Animations API: `rotateY(0 → 180deg)` with the back face pre-rotated and `backface-visibility: hidden`, 600 ms, `cubic-bezier(.2,.7,.2,1)`; on desktop also grow from badge size to the reading column. Under reduced motion: 150 ms crossfade. Afterwards set `#badge` `data-side="back"`, switch the back to normal document flow (front face `hidden`, no transforms, page scrolls), `scrollTo(0, 0)`, set `document.title`, focus the back `h1`, and if `push !== false` `history.pushState({ side: 'back', route }, '', route)`.
  - `flipBack`: reverse animation, `data-side="front"`, restore front, clear `#back-slot`, title `Jim Burch`; focus `#lcd-screen`. If not `viaHistory`, `history.pushState({ side: 'front' }, '', '/')`.
  - One flip at a time: calls during an animation are queued as "desired route"; when the animation ends, reconcile to the latest desired state (so the final side always matches `location.pathname`).
  - Delegated `click` on `[data-flip]` (front) → `preventDefault`, `flipTo(href)`. Delegated `click` on `[data-home]` inside `#back-slot` → `preventDefault`; if `history.state?.side === 'back'` then `history.back()` else `flipBack()`.
  - `popstate`: path `/` and side back → `flipBack({ viaHistory: true })`; a back route and side front → `flipTo(path, { push: false })`.
  - `pageshow` with `persisted` (bfcache): reconcile side to `location.pathname`.
  - Prefetch: after the first `BOOT_DONE`, `fetch` each `BACK_ROUTES` route once (`priority: 'low'`) to warm the cache.

- [ ] **Step 1: Write failing tests**

```ts
// tests/e2e/flip.spec.ts
test('RESUME pad is one tap to the resume, even mid-boot', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-part="resume-pad"]').click();
  await expect(page).toHaveURL(/\/resume\/?$/);
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'back');
  await expect(page.getByRole('heading', { level: 1, name: /Resume/ })).toBeFocused();
});
test('launcher flip, browser back and forward', async ({ page }) => {
  await page.goto('/'); await page.keyboard.press('Escape');
  for (let i = 0; i < 2; i++) await page.keyboard.press('ArrowDown'); // NOW → PROJECTS → RESUME
  await page.keyboard.press('z');
  await expect(page).toHaveURL(/\/resume\/?$/);
  await expect(page).toHaveTitle(/Resume/);
  await page.goBack();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/');
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'front');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher');
  await page.goForward();
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'back');
});
test('HOME on the injected back flips to the front', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-part="resume-pad"]').click();
  await page.locator('#back-slot a[data-home]').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/');
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'front');
});
test('fetch failure falls back to normal navigation', async ({ page }) => {
  await page.goto('/');
  await page.route('**/resume', r => r.request().resourceType() === 'fetch' ? r.abort() : r.continue());
  await page.locator('[data-part="resume-pad"]').click();
  await expect(page).toHaveURL(/\/resume\/?$/);
  await expect(page.locator('[data-back-face] h1')).toHaveText(/Resume/);
});
test('double tap and back mid-flip settle to match the URL', async ({ page }) => {
  await page.goto('/');
  const pad = page.locator('[data-part="resume-pad"]');
  await pad.click(); await pad.click({ force: true });
  await page.goBack();
  await page.waitForTimeout(1200);
  const side = await page.locator('#badge').getAttribute('data-side');
  expect(new URL(page.url()).pathname === '/' ? 'front' : 'back').toBe(side);
});
test('reduced motion still flips', async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  await page.goto('/');
  await page.locator('[data-part="resume-pad"]').click();
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'back', { timeout: 500 });
});
```

- [ ] **Step 2: Run** `pnpm test:e2e flip` — Expected: FAIL.
- [ ] **Step 3: Implement** per Interfaces; wire `runtime.onFlip(r => flipper.flipTo(r))` and `onSideChange` to `#badge` `data-side` (which `wireControls`' `isActive` reads).
- [ ] **Step 4: Run** `pnpm test:e2e` (full suite) — Expected: PASS on both projects.
- [ ] **Step 5: Checkpoint** — message `feat: flip between badge front and back pages`.

---

### Task 10: Resume PDF

**Files:**
- Create: `scripts/build-resume-pdf.mjs`, `tests/e2e/pdf.spec.ts`
- Modify: `package.json` (`"build": "astro build && node scripts/build-resume-pdf.mjs"`), `src/styles/badge-back.css` (`@media print`)

**Interfaces:**
- Consumes: built `dist/`, `/resume` route.
- Produces: `dist/jim-burch-resume.pdf` (Letter, backgrounds off, margins 0.5in) linked as `/jim-burch-resume.pdf` from `/resume`. Script: Astro programmatic `preview({ root, server: { port: 4399 } })`, Playwright `chromium.launch()`, `page.emulateMedia({ media: 'print' })`, `page.pdf(...)`, close both; exit non-zero on failure. Print CSS: black on white, hide HOME, QR, circuitry and nav; keep headings, work entries, skills, contact as text.

- [ ] **Step 1: Write failing test**

```ts
// tests/e2e/pdf.spec.ts
test('resume PDF is served and linked', async ({ page, request }) => {
  const res = await request.get('/jim-burch-resume.pdf');
  expect(res.status()).toBe(200);
  expect((await res.body()).subarray(0, 4).toString()).toBe('%PDF');
  await page.goto('/resume');
  await expect(page.getByRole('link', { name: /Download PDF/ })).toHaveAttribute('href', '/jim-burch-resume.pdf');
});
```

- [ ] **Step 2: Run** `pnpm test:e2e pdf` — Expected: FAIL (404).
- [ ] **Step 3: Implement** the script, build hook and print CSS.
- [ ] **Step 4: Run** `pnpm build && pnpm test:e2e pdf` — Expected: PASS; open the PDF once and confirm it reads as a plain resume.
- [ ] **Step 5: Checkpoint** — message `feat: generate resume PDF at build time`.

---

### Task 11: Reskin app (and the hidden board)

**Files:**
- Create: `src/badge/apps/reskin.ts`, `tests/e2e/reskin.spec.ts`
- Modify: `src/badge/os/registry.ts` (give the existing `reskin` entry `load: () => import('../apps/reskin')`)

**Interfaces:**
- Consumes: `AppContext.theme`, `BOARDS`, `METALS`.
- Produces: `default: BadgeApp` with `id: 'reskin'`. LCD shows two rows, `BOARD` and `METAL`; `up`/`down` pick the row, `left`/`right` cycle the value (hidden boards only after `unlock`), applied live via `theme.set`; `b` exits (handled by the reducer). Every value is also a tappable `<button>`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/e2e/reskin.spec.ts
async function openReskin(page) {
  await page.goto('/'); await page.keyboard.press('Escape');
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown'); // → RESKIN
  await page.keyboard.press('z');
}
test('reskin changes the board, persists, and carries to the back', async ({ page }) => {
  await openReskin(page);
  await page.keyboard.press('ArrowRight');
  const board = await page.locator('html').getAttribute('data-board');
  expect(board).not.toBe('green');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-board', board!);
  await page.goto('/resume');
  await expect(page.locator('html')).toHaveAttribute('data-board', board!);
});
test('reskin works when storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    const boom = () => { throw new DOMException('blocked', 'SecurityError'); };
    Object.defineProperty(window, 'localStorage', { get: boom });
    Object.defineProperty(window, 'sessionStorage', { get: boom });
  });
  await openReskin(page);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('html')).not.toHaveAttribute('data-board', 'green');
});
test('konami unlocks the midnight board', async ({ page }) => {
  await page.goto('/'); await page.keyboard.press('Escape');
  for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'x', 'z']) await page.keyboard.press(k);
  await expect(page.locator('#lcd-screen')).toContainText('CHEAT ENABLED');
  // the konami's up/up/down/down nets the selection back to 0, and its final A was swallowed
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown'); // → RESKIN
  await page.keyboard.press('z');
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight'); // green → black → blue → red → white → midnight
  await expect(page.locator('html')).toHaveAttribute('data-board', 'midnight');
});
```

- [ ] **Step 2: Run** `pnpm test:e2e reskin` — Expected: FAIL.
- [ ] **Step 3: Implement** the app and add its `load` to the existing registry entry. `BOARDS` order is `green, black, blue, red, white, midnight`.
- [ ] **Step 4: Run** `pnpm test:e2e reskin` — Expected: PASS.
- [ ] **Step 5: Checkpoint** — message `feat: reskin app`.

---

### Task 12: Now tinkering on, and Sensors (dev mode)

**Files:**
- Create: `src/badge/apps/now.ts`, `src/badge/apps/sensors.ts`, `tests/e2e/now-sensors.spec.ts`
- Modify: `src/badge/os/registry.ts` (give the existing `now` and `sensors` entries their `load`), `src/pages/index.astro` (embed `<script type="application/json" id="data-now">` with `{ title, blurb, route: '/projects/<id>' }` from the `now` collection at build time)

**Interfaces:**
- Consumes: `AppContext.data`, `AppContext.tilt`, and Task 9's `[data-flip]` click delegation: the now app renders its own `<a data-flip href>` and its `onInput('a')` calls `.click()` on it (returning `true`).
- Produces: `now` — LCD shows `NOW TINKERING ON`, title, blurb (truncated to fit), and a `READ BUILD LOG ↻` link. `sensors` — live readout `SOURCE gyro|pointer|off`, `X ±0.00`, `Y ±0.00`, updated via `ctx.tilt.subscribe`, unsubscribed on `unmount`.

- [ ] **Step 1: Write failing tests**

```ts
// tests/e2e/now-sensors.spec.ts
test('now app shows the bench project and flips to its log', async ({ page }) => {
  await page.goto('/'); await page.keyboard.press('Escape');
  await page.keyboard.press('z'); // NOW is first
  await expect(page.locator('#lcd-screen')).toContainText('NOW TINKERING ON');
  await page.locator('#lcd-screen a[data-flip]').click();
  await expect(page).toHaveURL(/\/projects\/showit-badge\/?$/);
});
test('sensors appear only in dev mode and report the source', async ({ page, browserName }) => {
  await page.goto('/'); await page.keyboard.press('Escape');
  await expect(page.locator('#lcd-screen')).not.toContainText('SENSORS');
  for (const k of ['ArrowLeft', 'ArrowLeft', 'z']) await page.keyboard.press(k);
  for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('z');
  await expect(page.locator('#lcd-screen')).toContainText(/SOURCE (pointer|gyro|off)/);
});
```

- [ ] **Step 2: Run** `pnpm test:e2e now-sensors` — Expected: FAIL.
- [ ] **Step 3: Implement** both apps, registry entries, and the JSON embed.
- [ ] **Step 4: Run** `pnpm test:e2e now-sensors` — Expected: PASS.
- [ ] **Step 5: Checkpoint** — message `feat: now-tinkering and sensors apps`.

---

### Task 13: Break it / power off / RESET

**Files:**
- Create: `src/badge/apps/break-it.ts`, `tests/e2e/break-it.spec.ts`
- Modify: `src/badge/os/registry.ts` (give the existing `break` entry its `load`), `src/styles/badge-front.css` (glitch + off styles)

**Interfaces:**
- Consumes: `ctx.dispatch({ type: 'SET_GLITCH' | 'POWER_OFF' })`, `#badge[data-glitch]`, `#badge[data-mode="off"]`.
- Produces: `break` app with two items, `OVERCLOCK: OFF/ON` (toggles `SET_GLITCH`) and `POWER OFF` (`POWER_OFF`). Glitch CSS on `[data-glitch="on"]`: scanline overlay on the LCD, color shift and text jitter confined to the LCD, a brief board hue flicker; under reduced motion only static scanlines and a fixed color shift. Off: LCD goes black with no text, controls still focusable, a one-time LCD hint `press RESET` when any input arrives while off (render outside the reducer; the reducer keeps ignoring input).

- [ ] **Step 1: Write failing tests**

```ts
// tests/e2e/break-it.spec.ts
async function openBreak(page) {
  await page.goto('/'); await page.keyboard.press('Escape');
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowDown'); // → BREAK IT
  await page.keyboard.press('z');
}
test('overclock glitches and RESET restores', async ({ page }) => {
  await openBreak(page);
  await page.keyboard.press('z'); // OVERCLOCK on
  await expect(page.locator('#badge')).toHaveAttribute('data-glitch', 'on');
  await page.getByRole('button', { name: 'Reset badge' }).click();
  await expect(page.locator('#badge')).toHaveAttribute('data-glitch', 'off');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', /booting|launcher/);
});
test('power off ignores input until RESET', async ({ page }) => {
  await openBreak(page);
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('z'); // POWER OFF
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'off');
  await page.keyboard.press('z');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'off');
  await expect(page.locator('#lcd-screen')).toContainText('press RESET');
  await page.getByRole('button', { name: 'Reset badge' }).click();
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher', { timeout: 3000 });
});
test('RESUME pad still works while powered off', async ({ page }) => {
  await openBreak(page);
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('z');
  await page.locator('[data-part="resume-pad"]').click();
  await expect(page).toHaveURL(/\/resume\/?$/);
});
```

- [ ] **Step 2: Run** `pnpm test:e2e break-it` — Expected: FAIL.
- [ ] **Step 3: Implement** the app, registry entry and styles.
- [ ] **Step 4: Run** `pnpm test:e2e break-it` — Expected: PASS.
- [ ] **Step 5: Checkpoint** — message `feat: break-it app with overclock, power off and reset`.

---

### Task 14: Budgets and final verification

**Files:**
- Create: `scripts/check-budget.mjs`
- Modify: `package.json` (`"check:budget": "node scripts/check-budget.mjs"`)

**Interfaces:**
- Consumes: built `dist/`.
- Produces: script that (1) reads `dist/index.html`, collects every `<script type="module" src>` and `<link rel="modulepreload">` file plus inline module script text, gzips each (`zlib.gzipSync`), and fails if the total exceeds `35 * 1024` bytes, printing the total; (2) for every other `dist/**/index.html`, fails if it contains `type="module"` or `<script … src=`.

- [ ] **Step 1: Write the script and run it against a deliberately small limit first** — `node scripts/check-budget.mjs --limit 1` — Expected: FAIL with a printed total (proves it measures).
- [ ] **Step 2: Run** `pnpm build && pnpm check:budget` — Expected: PASS, total ≤ 35 KB. If over, move code behind lazy `load()` before raising anything.
- [ ] **Step 3: Full verification** — `pnpm check && pnpm test:unit && pnpm test:e2e` — Expected: 0 type errors, all tests pass on `webkit-phone` and `chromium-desktop`.
- [ ] **Step 4: Report** — list for Jim: every `TODO(jim)` (`grep -rn "TODO(jim)" src`), the placeholder palette and avatar, the desktop background placeholder, and that real-device tilt needs an HTTPS preview (only with his OK).
- [ ] **Step 5: Checkpoint** — message `chore: JS budget check`.
