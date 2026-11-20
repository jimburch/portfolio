import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test';
import { HELD_HAND } from '../../src/scene/hand/held-hand';

/* The held close-up: on a qualifying desktop, a direct load of a back page
   shows the worn scene zoomed in, with the badge turned and held up, nearly
   filling the window. The back's content is read through the badge's window,
   scrolled by the page's own scroll. Static: CSS and markup only. */

const BACK_ROUTES = [
  ['/resume', 'Resume'],
  ['/projects', 'Projects'],
  ['/projects/vonbox', 'VonBox'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
] as const;

/** The 3D hand: three.js and the hand model must never load on a back page. */
const HAND_CODE = /three|hand-turn|\.glb$/i;
/** The resting hand's two static images (behind and in front of the badge). */
const HAND_IMAGE = /held-hand-(behind|front)\b/;

/** Opens `route` in a fresh context, recording requests for scene art, hand code and the hand's images. */
async function openBack(browser: Browser, route: string, options: BrowserContextOptions = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const sceneRequests: string[] = [];
  const handRequests: string[] = [];
  const handImages: string[] = [];
  page.on('request', (r) => {
    const path = new URL(r.url()).pathname;
    if (path.startsWith('/scene/')) sceneRequests.push(path);
    if (HAND_CODE.test(path)) handRequests.push(path);
    const image = path.match(HAND_IMAGE);
    if (image) handImages.push(image[1]!);
  });
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  return { page, sceneRequests, handRequests, handImages };
}

const box = async (page: Page, selector: string) => (await page.locator(selector).boundingBox())!;

/** The badge held up, and the window in it the back is read through. */
const heldBadge = (page: Page) => box(page, '.held-view__badge');
const heldWindow = (page: Page) => box(page, '.held-view__window');

test.describe('on a qualifying desktop, a direct load', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop projects only');

  for (const [width, height] of [
    [1280, 720],
    [1440, 900],
    [1920, 1080],
    [2560, 1440],
    [800, 620],
  ]) {
    test(`${width}×${height}: shows the held close-up, 90–94% of the window tall, with JS off`, async ({
      browser,
    }) => {
      const { page, sceneRequests, handRequests } = await openBack(browser, '/resume', {
        viewport: { width, height },
        javaScriptEnabled: false,
      });
      await expect(page.locator('.worn-scene')).toBeVisible();
      expect(sceneRequests).toContain('/scene/wearer.svg');
      expect(handRequests).toEqual([]);

      const badge = await heldBadge(page);
      expect(badge.height / height).toBeGreaterThanOrEqual(0.9);
      expect(badge.height / height).toBeLessThanOrEqual(0.94);
      expect(badge.y).toBeGreaterThan(0);
      expect(badge.y + badge.height).toBeLessThan(height);
      expect(badge.x).toBeGreaterThan(0);
      expect(badge.x + badge.width).toBeLessThan(width);
    });
  }
  for (const [width, height] of [
    [1440, 900],
    [800, 620],
  ])
    test(`${width}×${height}: the hand rests on the held badge, as two images, with no 3D code`, async ({ browser }) => {
      const { page, handRequests, handImages } = await openBack(browser, '/resume', {
        viewport: { width, height },
        javaScriptEnabled: false,
      });
      expect(handImages.sort()).toEqual(['behind', 'front']);
      expect(handRequests).toEqual([]);

      // Both images cover the box the render gave, in units of the held badge (1/500 of its height) from its
      // top-left corner.
      const badge = await heldBadge(page);
      const u = badge.height / 500;
      const { box: unitBox } = HELD_HAND;
      for (const layer of ['behind', 'front']) {
        const b = await box(page, `.held-view__hand--${layer}`);
        expect(Math.abs(b.x - (badge.x + unitBox.x * u)), layer).toBeLessThan(1.5);
        expect(Math.abs(b.y - (badge.y + unitBox.y * u)), layer).toBeLessThan(1.5);
        expect(Math.abs(b.width - unitBox.width * u), layer).toBeLessThan(1.5);
        expect(Math.abs(b.height - unitBox.height * u), layer).toBeLessThan(1.5);
      }
      // Behind the badge (under the surround, which the badge covers), and in front of the badge and the strip.
      const z = (selector: string) => page.locator(selector).evaluate((el) => Number(getComputedStyle(el).zIndex));
      await expect(page.locator('.held-view__surround .held-view__hand--behind')).toHaveCount(1);
      expect(await z('.held-view__surround')).toBeLessThan(await z('.held-view__badge'));
      expect(await z('.held-view__hand--front')).toBeGreaterThan(await z('.held-view__badge'));
      expect(await z('.held-view__hand--front')).toBeGreaterThan(await z('.back-face .back-nav'));
    });
});

test.describe('the held close-up on a qualifying desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop projects only');
  test.use({ viewport: { width: 1440, height: 900 } });

  /** Inside `outer`, give or take a pixel. */
  const inside = (inner: { x: number; y: number; width: number; height: number }, outer: typeof inner) =>
    inner.x >= outer.x - 1 &&
    inner.y >= outer.y - 1 &&
    inner.x + inner.width <= outer.x + outer.width + 1 &&
    inner.y + inner.height <= outer.y + outer.height + 1;

  for (const [route, heading] of BACK_ROUTES)
    test(`${route}: a strip pinned above the window, the header's details at the top of the content`, async ({
      page,
    }) => {
      await page.goto(route);
      await expect(page.locator('h1')).toHaveText(new RegExp(heading));
      const [badge, window] = [await heldBadge(page), await heldWindow(page)];
      const strip = page.getByRole('navigation', { name: 'Back of the badge' });
      const stripParts = [
        page.locator('.back-face').getByText('Jim Burch', { exact: true }),
        page.getByRole('link', { name: 'HOME', exact: true }),
        ...['PROJECTS', 'RESUME', 'ABOUT', 'CONTACT'].map((name) => strip.getByRole('link', { name })),
      ];
      // One line of links, under the name, on the badge above its window.
      const linkMiddles = new Set<number>();
      for (const part of stripParts) {
        await expect(part).toBeVisible();
        const b = (await part.boundingBox())!;
        expect(inside(b, badge), await part.innerText()).toBe(true);
        expect(b.y + b.height).toBeLessThanOrEqual(window.y + 1);
        if (part !== stripParts[0]) linkMiddles.add(Math.round(b.y + b.height / 2));
      }
      expect(linkMiddles.size).toBe(1);
      // The vCard QR, then the ID block's role and credits, at the top of the window.
      const details = [
        page.getByRole('link', { name: /contact card/ }),
        page.locator('.back-face').getByText('BUILDER · TINKERER'),
        page.locator('.back-face').getByText(/If found, press HOME/i),
      ];
      let below = window.y;
      for (const part of details) {
        const b = (await part.boundingBox())!;
        expect(inside(b, window)).toBe(true);
        expect(b.y).toBeGreaterThanOrEqual(below);
        below = b.y + b.height;
      }
      expect((await box(page, 'h1')).y).toBeGreaterThan(below);
    });

  test('the footer is at the end of the content, inside the window, clear of the hand', async ({ page }) => {
    await page.goto('/resume');
    await page.keyboard.press('End');
    await expect.poll(() => page.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 1)).toBe(true);
    const [badge, window] = [await heldBadge(page), await heldWindow(page)];
    for (const part of [page.getByRole('list', { name: 'Contact' }), page.locator('.back-colophon')]) {
      const b = (await part.boundingBox())!;
      expect(inside(b, window)).toBe(true);
      // Above the lowest fingertip (93% of the badge's height).
      expect(b.y + b.height).toBeLessThanOrEqual(badge.y + badge.height * 0.93);
    }
  });

  test('wheel and keys scroll the content in the window; the scene, badge and strip stay put', async ({ page }) => {
    await page.goto('/resume');
    // Rounded to a tenth of a pixel: WebKit's layout of the scaled scene can drift by a hair between reads.
    const still = async () =>
      [
        await heldBadge(page),
        await heldWindow(page),
        await box(page, '.back-home'),
        await box(page, '.worn-scene__wearer'),
      ].map((b) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v * 10) / 10])));
    const before = await still();
    const h1 = await box(page, 'h1');
    const scrolled = () => page.evaluate(() => scrollY);
    /** Where the page comes to rest once a smooth scroll ends (a key pressed mid-scroll can be dropped). */
    const settled = async () => {
      let last = -1;
      for (;;) {
        const now = await scrolled();
        if (now === last) return now;
        last = now;
        await page.waitForTimeout(150);
      }
    };

    // The wheel works anywhere in the window, even over the scene beside the badge.
    await page.mouse.move(80, 450);
    await page.mouse.wheel(0, 300);
    await expect.poll(scrolled).toBeGreaterThan(0);
    expect((await box(page, 'h1')).y).toBeLessThan(h1.y);
    expect(await still()).toEqual(before);

    for (const key of ['Space', 'PageDown', 'ArrowDown']) {
      const from = await settled();
      await page.keyboard.press(key);
      await expect.poll(scrolled, key).toBeGreaterThan(from);
    }
    for (const key of ['PageUp', 'ArrowUp']) {
      const from = await settled();
      await page.keyboard.press(key);
      await expect.poll(scrolled, key).toBeLessThan(from);
    }
    expect(await still()).toEqual(before);
  });

  test('a page Down never skips content: what was at the window bottom is still in view', async ({
    page,
    browserName,
  }) => {
    // Known weakness: WebKit pages by at least 80% of the viewport, more than
    // the window shows (about 76%), so a line or so slips past per page.
    // Chromium honours the root's scroll-padding and pages by what's visible.
    // Whether a line slips past depends on where lines fall, so it isn't reliably failing: skip, don't expect-fail.
    test.skip(browserName === 'webkit', 'WebKit pages by 80% of the viewport, more than the window shows');
    await page.goto('/resume');
    const window = await heldWindow(page);
    const lastSeen = await page.evaluate(
      ({ bottom }) => {
        const paras = [...document.querySelectorAll('#back-main :is(p, li, h2, h3)')];
        const seen = paras.filter((p) => p.getBoundingClientRect().top < bottom);
        const last = seen[seen.length - 1]!;
        last.setAttribute('data-last-seen', '');
        return last.getBoundingClientRect().top;
      },
      { bottom: window.y + window.height },
    );
    await page.keyboard.press('PageDown');
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
    const now = await box(page, '[data-last-seen]');
    expect(now.y).toBeLessThan(lastSeen);
    expect(now.y + now.height).toBeGreaterThan(window.y);
  });

  test('HOME goes to the front; the strip links load each back page in the held close-up', async ({ page }) => {
    await page.goto('/resume');
    await expect(page.getByRole('link', { name: 'HOME', exact: true })).toHaveAttribute('href', '/');
    const strip = page.getByRole('navigation', { name: 'Back of the badge' });
    await expect(strip.getByRole('link', { name: 'RESUME' })).toHaveAttribute('aria-current', 'page');
    for (const [name, path] of [
      ['ABOUT', '/about'],
      ['PROJECTS', '/projects'],
      ['CONTACT', '/contact'],
      ['RESUME', '/resume'],
    ]) {
      await strip.getByRole('link', { name }).click();
      await expect(page).toHaveURL(new RegExp(`${path}/?$`));
      await expect(page.locator('.held-view__badge')).toBeVisible();
      await expect(strip.getByRole('link', { name })).toHaveAttribute('aria-current', 'page');
    }
    await page.getByRole('link', { name: 'HOME', exact: true }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe('/');
    await expect(page.locator('#badge')).toHaveAttribute('data-side', 'front');
  });

  test('the text is laid out at its real size: nothing over it is transformed', async ({ page }) => {
    await page.goto('/projects/vonbox');
    const transforms = await page.evaluate(() => {
      const out: string[] = [];
      for (let el: Element | null = document.querySelector('#back-main .build-log p'); el; el = el.parentElement) {
        const s = getComputedStyle(el);
        out.push(`${el.tagName}:${s.transform}:${s.scale}:${s.zoom}`);
      }
      return out;
    });
    for (const t of transforms) expect(t).toMatch(/:none:none:1$/);
    const body = page.locator('#back-main .build-log p').first();
    expect(await body.evaluate((p) => getComputedStyle(p).fontSize)).toBe('16px');
  });

  test('on the resume, Download PDF, LinkedIn and GitHub show in the window without scrolling', async ({ page }) => {
    for (const size of [
      { width: 1440, height: 900 },
      { width: 1280, height: 720 },
      { width: 800, height: 620 },
    ]) {
      await page.setViewportSize(size);
      await page.goto('/resume');
      const window = await heldWindow(page);
      const links = page.getByRole('list', { name: 'Resume links' });
      for (const name of ['Download PDF', 'LinkedIn', 'GitHub'])
        expect(inside((await links.getByRole('link', { name }).boundingBox())!, window), `${name} ${size.width}`).toBe(
          true,
        );
    }
  });

  test('content scrolled out of the window is hidden and cannot be clicked', async ({ page }) => {
    await page.goto('/resume');
    const pdf = page.getByRole('link', { name: 'Download PDF' });
    // Scroll the PDF pad up past the window's top, behind the badge and scene.
    const window = await heldWindow(page);
    const pad = (await pdf.boundingBox())!;
    await page.evaluate((dy) => scrollBy(0, dy), pad.y - window.y + pad.height + 120);
    const moved = (await pdf.boundingBox())!;
    expect(moved.y + moved.height).toBeLessThan(window.y);
    const hit = await page.evaluate(
      ([x, y]) => !!document.elementFromPoint(x!, y!)?.closest('a'),
      [moved.x + moved.width / 2, Math.max(1, moved.y + moved.height / 2)],
    );
    expect(hit).toBe(false);
  });

  test('keyboard focus brings each link into the window, never under the strip or the scene', async ({
    page,
    browserName,
  }) => {
    // Safari's Tab skips links unless the visitor turns that on; Option+Tab reaches them.
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await page.goto('/resume');
    const window = await heldWindow(page);
    const focusedBox = () =>
      page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const r = el.getBoundingClientRect();
        return { tag: el.tagName, inStrip: !!el.closest('.back-nav, .back-home'), x: r.x, y: r.y, width: r.width, height: r.height };
      });

    // Tabbing through from the top.
    for (let i = 0; i < 24; i++) {
      await page.keyboard.press(tab);
      const focused = await focusedBox();
      if (focused.inStrip || focused.tag === 'BODY') continue;
      expect(inside(focused, window), JSON.stringify(focused)).toBe(true);
    }

    // A link on screen but just under the window's bottom edge, behind the badge's board.
    await page.evaluate(() => scrollTo(0, 0));
    const links = page.locator('#back-main a');
    const target = links.nth(4);
    await links.nth(3).focus();
    const t = (await target.boundingBox())!;
    await page.evaluate((dy) => scrollBy(0, dy), t.y - (window.y + window.height) + 4);
    await page.keyboard.press(tab);
    await expect(target).toBeFocused();
    const focused = await focusedBox();
    expect(inside(focused, window), JSON.stringify(focused)).toBe(true);
  });

  test('the reading column stays clear of the fingers on the left and the thumb on the right', async ({ page }) => {
    for (const size of [
      { width: 1440, height: 900 },
      { width: 800, height: 620 },
      { width: 2560, height: 1440 },
    ]) {
      await page.setViewportSize(size);
      await page.goto('/projects/vonbox');
      const badge = await heldBadge(page);
      const column = await page.locator('#back-main').evaluate((main) => {
        const r = main.getBoundingClientRect();
        const s = getComputedStyle(main);
        return { left: r.left + parseFloat(s.paddingLeft), right: r.right - parseFloat(s.paddingRight) };
      });
      expect(column.left, `${size.width}`).toBeGreaterThanOrEqual(badge.x + badge.width * 0.21);
      expect(column.right, `${size.width}`).toBeLessThanOrEqual(badge.x + badge.width * 0.9);
    }
  });

  /** Text the visitor can see (inside the window, or in the pinned strip) that sits under the hand in front of
      the badge or its shadow: the image is read back at its on-screen size, and anything over 5% opaque counts
      (the shadow's last faint fringe may touch).
      Decorative art (aria-hidden, like the footer's circuit and its TP1 / U1 labels) may pass under a finger. */
  const textUnderTheHand = (page: Page) =>
    page.evaluate(async () => {
      const hand = document.querySelector<HTMLElement>('.held-view__hand--front')!;
      const r = hand.getBoundingClientRect();
      const url = /url\("?(.*?)"?\)/.exec(getComputedStyle(hand).backgroundImage)![1]!;
      const img = new Image();
      img.src = url;
      await img.decode();
      const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(r.width), height: Math.round(r.height) });
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const alpha = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const solid = (x: number, y: number) => {
        const ix = Math.floor(x - r.left);
        const iy = Math.floor(y - r.top);
        if (ix < 0 || iy < 0 || ix >= canvas.width || iy >= canvas.height) return false;
        return alpha[(iy * canvas.width + ix) * 4 + 3]! >= 13;
      };
      const win = document.querySelector('.held-view__window')!.getBoundingClientRect();
      const covered: string[] = [];
      const walker = document.createTreeWalker(document.querySelector('.back-face')!, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement!;
        if (!node.textContent!.trim() || parent.closest('[aria-hidden="true"]')) continue;
        if (getComputedStyle(parent).visibility === 'hidden') continue;
        const inStrip = !!parent.closest('.back-name, .back-home, .back-nav');
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const t of range.getClientRects()) {
          // What shows of it: all of it in the strip, else the part inside the window.
          const x0 = inStrip ? t.left : Math.max(t.left, win.left);
          const x1 = inStrip ? t.right : Math.min(t.right, win.right);
          const y0 = inStrip ? t.top : Math.max(t.top, win.top);
          const y1 = inStrip ? t.bottom : Math.min(t.bottom, win.bottom);
          let hit = false;
          for (let y = y0 + 0.5; y < y1 && !hit; y += 1) for (let x = x0 + 0.5; x < x1 && !hit; x += 1) hit = solid(x, y);
          if (hit) covered.push(`${node.textContent!.trim().slice(0, 40)} @ ${Math.round(t.left)},${Math.round(t.top)}`);
        }
      }
      return covered;
    });

  for (const size of [
    { width: 1440, height: 900 },
    { width: 800, height: 620 },
  ])
    test(`${size.width}×${size.height}: at the top, part-way and at the end, no text sits under the hand or its shadow`, async ({ page }) => {
      await page.setViewportSize(size);
      for (const [route] of BACK_ROUTES) {
        await page.goto(route);
        expect(await textUnderTheHand(page), `${route}, top`).toEqual([]);
        // Part-way: the header's details (centred on the badge, wider than the reading column) scroll up and
        // away from the fingers, never down past them.
        await page.evaluate(() => scrollTo(0, innerHeight / 3));
        expect(await textUnderTheHand(page), `${route}, part-way`).toEqual([]);
        await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
        await expect
          .poll(() => page.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 1))
          .toBe(true);
        expect(await textUnderTheHand(page), `${route}, end`).toEqual([]);
      }
    });

  test('the held view is decorative to assistive tech and never takes focus', async ({ page }) => {
    await page.goto('/resume');
    for (const layer of ['.held-view__surround', '.held-view__badge', '.held-view__window', '.held-view__hand--front'])
      await expect(page.locator(layer)).toHaveAttribute('aria-hidden', 'true');
    // The hand behind the badge is inside the surround, hidden with it.
    await expect(page.locator('.held-view__surround .held-view__hand--behind')).toHaveCount(1);
    await expect(page.locator('.held-view :is(a, button, input, [tabindex])')).toHaveCount(0);
    // The hand never takes a click: a link under a finger stays clickable.
    for (const hand of ['.held-view__hand--behind', '.held-view__hand--front'])
      expect(await page.locator(hand).evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
  });
});

test.describe('everyone else keeps today’s back page and downloads no scene art or hand', () => {
  test.skip(({ isMobile }) => isMobile, 'opens its own contexts; once per desktop engine');

  const cases: [string, BrowserContextOptions][] = [
    ['a phone', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }],
    ['a touch screen', { viewport: { width: 1366, height: 1024 }, hasTouch: true }],
    ['a short window', { viewport: { width: 1440, height: 560 } }],
    ['a narrow window', { viewport: { width: 700, height: 900 } }],
  ];
  for (const [name, options] of cases) {
    test(`${name}: no held view, the header on top, no scene art or hand requested`, async ({ browser }) => {
      const { page, sceneRequests, handRequests, handImages } = await openBack(browser, '/resume', options);
      await expect(page.locator('.held-view')).toBeHidden();
      await expect(page.locator('.worn-scene')).toBeHidden();
      expect(sceneRequests).toEqual([]);
      expect(handImages).toEqual([]);
      expect(handRequests).toEqual([]);
      // Today's order: HOME and the vCard at the top, then the ID block, the page pads, the label.
      const y = (s: string) => box(page, s).then((b) => b.y);
      expect(await y('.back-home')).toBeLessThan(await y('.back-name'));
      expect(await y('.back-name')).toBeLessThan(await y('.back-nav'));
      expect(await y('.back-nav')).toBeLessThan(await y('#back-main'));
      await expect(page.locator('.back-switch')).toBeVisible();
    });
  }
});
