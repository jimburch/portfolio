import { expect, test, type BrowserContextOptions, type Page } from '@playwright/test';

/* The hand turn: on a qualifying desktop, once the front has booted and the
   browser is idle, the 3D hand (three.js and the model) loads in the
   background; from then on a flip is v10's hand turn into the held close-up.
   Before that, without WebGL, or if the model fails, the held turn runs and
   nothing waits. Phones, touch screens, short windows and reduced motion
   never load it. Headless Chromium draws the WebGL with SwiftShader, headless
   WebKit with the GPU; both run the real thing here. */

/** The hand's code (the lazy chunk with three.js) and its model. */
const HAND_REQUEST = /\/hand-turn\.[\w-]+\.js$|\.glb$/;

/** The held badge's height in the close-up at 1440×900: about 91% of the window. */
const HELD_SHARE = 0.9;

interface Frame {
  side?: string;
  flipping?: string;
  /** The hand's canvases on the page. */
  canvases: number;
  /** The resting hand's static image, in front of the badge. */
  restingHand: number;
  /** How far the camera has pushed in: the page scene's extra blur (0 at rest, the held close-up's 4 once held). */
  push: number;
}

const pad = (page: Page) => page.getByRole('link', { name: 'RESUME', exact: true });
const badge = (page: Page) => page.locator('#badge');
const path = (page: Page) => new URL(page.url()).pathname;
const canvases = (page: Page) => page.locator('canvas.hand-layer');

/** Paths of the hand's requests from this page. */
function handRequests(page: Page): string[] {
  const seen: string[] = [];
  page.on('request', (r) => {
    const p = new URL(r.url()).pathname;
    if (HAND_REQUEST.test(p)) seen.push(p);
  });
  return seen;
}

/** Holds the browser's idle callbacks until `runIdle`: "the browser is idle" happens when the test says. */
async function holdIdle(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __idle: Array<() => void> } & Window;
    w.__idle = [];
    w.requestIdleCallback = (cb: IdleRequestCallback) => {
      w.__idle.push(() => cb({ didTimeout: false, timeRemaining: () => 50 }));
      return w.__idle.length;
    };
    w.cancelIdleCallback = () => {};
  });
}
const idleQueued = (page: Page) =>
  page.waitForFunction(() => (window as unknown as { __idle: unknown[] }).__idle.length > 0);
const runIdle = (page: Page) =>
  page.evaluate(() => {
    for (const cb of (window as unknown as { __idle: Array<() => void> }).__idle.splice(0)) cb();
  });

const handLoaded = (page: Page, outcome: 'ready' | 'unavailable') =>
  expect(badge(page)).toHaveAttribute('data-hand-turn', outcome, { timeout: 20_000 });

/**
 * Runs the paused clock on by `ms`, every animation frame. Each frame of the hand turn renders the 3D hand, in
 * software in headless Chromium, so the tests that step frames step only as far as they need and are marked slow.
 */
const step = (page: Page, ms: number) => page.clock.runFor(ms);

/** Records, every animation frame, how the badge shows. */
async function recordFrames(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __frames: Frame[] };
    w.__frames = [];
    const el = document.getElementById('badge')!;
    const scene = document.getElementById('worn-scene')!;
    const hand = document.querySelector('#back-slot .held-view__hand--front')!;
    const sample = () => {
      const blur = scene.style.getPropertyValue('--scene-blur');
      w.__frames.push({
        side: el.dataset.side,
        flipping: el.dataset.flipping,
        canvases: document.querySelectorAll('canvas.hand-layer').length,
        restingHand: parseFloat(getComputedStyle(hand).opacity),
        push: blur ? parseFloat(blur) : 0,
      });
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}
const frames = (page: Page) => page.evaluate(() => (window as unknown as { __frames: Frame[] }).__frames);
const kindsOf = (all: Frame[]) => [...new Set(all.map((f) => f.flipping).filter(Boolean))];

const turnStarts = (page: Page, kind: string) =>
  page.waitForFunction((k) => document.getElementById('badge')?.dataset.flipping === k, kind, { polling: 20 });

async function landsHeld(page: Page) {
  await expect(page).toHaveURL(/\/resume\/?$/);
  await expect(badge(page)).toHaveAttribute('data-side', 'back');
  await expect(badge(page)).not.toHaveAttribute('data-flipping');
  await expect(page.getByRole('heading', { level: 1, name: /Resume/ })).toBeFocused();
  expect((await page.locator('#back-slot .held-view__badge').boundingBox())!.height / 900).toBeGreaterThanOrEqual(
    HELD_SHARE,
  );
  // The resting hand's images have taken over from the canvases; nothing is left transformed.
  await expect(canvases(page)).toHaveCount(0);
  await expect(page.locator('#back-slot .held-view__hand--front')).toBeVisible();
  await expect(page.locator('#back-slot .held-view__hand--front')).toHaveCSS('opacity', '1');
  expect(await transformOf(page, '#back-slot')).toBe('');
  await expect(page.locator('#worn-scene')).toBeHidden();
}

/** An element's inline transform: '' once a turn has let go of it. */
const transformOf = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => (el as HTMLElement).style.transform);

test.describe('on a qualifying desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop projects only');
  test.use({ viewport: { width: 1440, height: 900 } });

  test('once loaded, the hand turns the badge into the held close-up, and HOME turns it back', async ({ page }) => {
    test.slow();
    await page.clock.install({ time: 0 });
    await page.goto('/');
    await handLoaded(page, 'ready');
    await page.waitForLoadState('networkidle');
    await page.clock.pauseAt(60_000);
    await recordFrames(page);
    await pad(page).focus();
    await page.keyboard.press('Enter');
    await turnStarts(page, 'hand-turn');
    await step(page, 1700); // nearly there
    await step(page, 400);
    await landsHeld(page);
    let all = await frames(page);
    expect(kindsOf(all)).toEqual(['hand-turn']);
    // The hand was drawn on its two canvases while the badge turned, and the static hand stayed out of it.
    expect(all.some((f) => f.flipping === 'hand-turn' && f.canvases === 2)).toBe(true);
    expect(all.filter((f) => f.flipping).every((f) => f.restingHand === 0)).toBe(true);
    // The camera pushed in nearly as far as the held close-up's, then the held view took over.
    expect(Math.max(...all.filter((f) => f.flipping).map((f) => f.push))).toBeGreaterThan(3.9);

    await recordFrames(page);
    await page.locator('#back-slot [data-back-face] a[data-home]').click();
    await expect.poll(() => path(page)).toBe('/');
    await step(page, 2100);
    await expect(badge(page)).toHaveAttribute('data-side', 'front');
    await expect(badge(page)).not.toHaveAttribute('data-flipping');
    await expect(pad(page)).toBeFocused();
    await expect(canvases(page)).toHaveCount(0);
    all = await frames(page);
    expect(kindsOf(all)).toEqual(['hand-turn']);
    expect(all.some((f) => f.canvases === 2)).toBe(true);
    expect(await transformOf(page, '.face-front')).toBe('');
  });

  test('Back mid-turn turns back from where it is: the badge never reaches the back', async ({ page }) => {
    test.slow();
    await page.clock.install({ time: 0 });
    await page.goto('/');
    await handLoaded(page, 'ready');
    await page.waitForLoadState('networkidle');
    await page.clock.pauseAt(60_000); // time moves only when the test moves it
    await pad(page).focus();
    await page.keyboard.press('Enter');
    await turnStarts(page, 'hand-turn');
    await recordFrames(page);
    // Part-way: the badge is lifted and edge-on, the camera part-way in.
    await step(page, 800);
    const before = (await frames(page)).at(-1)!;
    expect(before.push).toBeGreaterThan(2);

    await page.goBack();
    await expect.poll(() => path(page)).toBe('/');
    await step(page, 150);
    // It turned back at once: the camera is already pulling out.
    expect((await frames(page)).at(-1)!.push).toBeLessThan(before.push);
    await step(page, 1000); // back down from under halfway: well under a whole turn

    await expect(badge(page)).toHaveAttribute('data-side', 'front');
    await expect(badge(page)).not.toHaveAttribute('data-flipping');
    await expect(canvases(page)).toHaveCount(0);
    const all = await frames(page);
    expect(all.every((f) => f.side === 'front')).toBe(true);
    expect(Math.max(...all.map((f) => f.push))).toBeLessThan(3.9);
  });

  test('its canvases are decorative: hidden from assistive tech, never focused, never in the way of a click', async ({
    page,
  }) => {
    test.slow();
    await page.clock.install({ time: 0 });
    await page.goto('/');
    await handLoaded(page, 'ready');
    await page.waitForLoadState('networkidle');
    await page.clock.pauseAt(60_000);
    await pad(page).click();
    await turnStarts(page, 'hand-turn');
    await step(page, 700); // lifted, the hand gripping the badge over its face
    await expect(canvases(page)).toHaveCount(2);
    for (const canvas of await canvases(page).all()) {
      await expect(canvas).toHaveAttribute('aria-hidden', 'true');
      await expect(canvas).not.toHaveAttribute('tabindex');
      await expect(canvas).toHaveCSS('pointer-events', 'none');
    }
    const report = await page.evaluate(() => {
      const layers = [...document.querySelectorAll<HTMLCanvasElement>('canvas.hand-layer')];
      for (const c of layers) c.focus();
      // The middle of the window: the hand and its canvases are there, but the click lands on the page.
      const hit = document.elementFromPoint(innerWidth / 2, innerHeight * 0.7);
      return { focused: layers.includes(document.activeElement as HTMLCanvasElement), hitCanvas: hit?.tagName === 'CANVAS' };
    });
    expect(report).toEqual({ focused: false, hitCanvas: false });
    await expect(page.locator('canvas.hand-layer:focus')).toHaveCount(0);
  });

  test('a swap while held keeps the resting hand where it is', async ({ page }) => {
    await page.goto('/');
    await handLoaded(page, 'ready');
    await pad(page).click();
    await landsHeld(page);
    const hand = page.locator('#back-slot .held-view__hand--front');
    const box = await hand.boundingBox();
    await recordFrames(page);
    await page.locator('#back-slot [data-back-face] a[data-flip][href="/projects"]').first().click();
    await expect(page).toHaveURL(/\/projects\/?$/);
    await expect(page.getByRole('heading', { level: 1, name: /Projects/ })).toBeFocused();
    await expect(page.locator('#back-slot > .back-face')).toHaveCount(1);
    const all = await frames(page);
    expect(all.every((f) => !f.flipping && f.canvases === 0 && f.restingHand === 1)).toBe(true);
    expect(await hand.boundingBox()).toEqual(box);
  });

  test('a flip before the hand has loaded runs the held turn at once, and the hand takes over from the next turn', async ({
    page,
  }) => {
    await holdIdle(page);
    const requests = handRequests(page);
    await page.goto('/');
    await idleQueued(page); // booted; the hand waits for the browser to be idle
    await recordFrames(page);
    await pad(page).click();
    await turnStarts(page, 'held-turn');
    await landsHeld(page);
    expect(kindsOf(await frames(page))).toEqual(['held-turn']);
    expect(requests).toEqual([]);

    await runIdle(page);
    await handLoaded(page, 'ready');
    await recordFrames(page);
    await page.locator('#back-slot [data-back-face] a[data-home]').click();
    await expect(badge(page)).toHaveAttribute('data-side', 'front');
    await expect(badge(page)).not.toHaveAttribute('data-flipping');
    expect(kindsOf(await frames(page))).toEqual(['hand-turn']);
  });

  test('the hand loads only once the front has booted and the browser is idle', async ({ page }) => {
    await holdIdle(page);
    const requests = handRequests(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await idleQueued(page);
    expect(requests).toEqual([]);
    await runIdle(page);
    await handLoaded(page, 'ready');
    expect(requests.some((p) => /\/hand-turn\./.test(p))).toBe(true);
    expect(requests.some((p) => p.endsWith('.glb'))).toBe(true);
  });

  for (const [cause, setUp] of [
    [
      'WebGL is unavailable',
      (page: Page) =>
        page.addInitScript(() => {
          const getContext = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
            return /webgl/i.test(type) ? null : getContext.call(this, type as '2d', ...(rest as []));
          } as typeof getContext;
        }),
    ],
    ['the model fails to load', (page: Page) => page.route(/\.glb$/, (route) => route.abort())],
  ] as const) {
    test(`when ${cause}, the held turn runs instead`, async ({ page }) => {
      await setUp(page);
      await page.goto('/');
      await handLoaded(page, 'unavailable');
      await recordFrames(page);
      await pad(page).click();
      await landsHeld(page);
      expect(kindsOf(await frames(page))).toEqual(['held-turn']);
    });
  }
});

/* The badge turns like a card (v10): it has an edge with thickness, a band of
   light crosses each face as it turns, and the clip turns with it. Frames
   counted as in hand-turn-baselines.spec.ts: the turn's first animation frame
   only starts its timer, then t moves 16 / 1800 a frame; frame 48 is v10's
   edge-on (t .4267). */
test.describe('the turned card', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop projects only');
  test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

  const EDGE_ON = 48;

  /** The front at rest, the hand loaded and the clock paused; then a click with no pointer over the badge. */
  async function startTurn(page: Page) {
    await page.clock.install({ time: 0 });
    await page.goto('/');
    await handLoaded(page, 'ready');
    await page.waitForLoadState('networkidle');
    await page.clock.pauseAt(60_000);
    await page.locator('[data-part="resume-pad"]').dispatchEvent('click');
    await turnStarts(page, 'hand-turn');
  }
  const stepToFrame = (page: Page, frame: number) => step(page, (frame + 1) * 16 + 8);

  /** Which faces carry the turn's sheen, and whether it is drawn (its ::after is generated), every frame. */
  async function recordSheen(page: Page) {
    await page.evaluate(() => {
      const w = window as unknown as { __sheen: Array<{ front: boolean; back: boolean; drawn: number }> };
      w.__sheen = [];
      const front = document.querySelector('.face-front')!;
      const back = document.getElementById('back-slot')!;
      const sample = () => {
        w.__sheen.push({
          front: front.hasAttribute('data-sheen'),
          back: back.hasAttribute('data-sheen'),
          drawn: [front, back].filter((el) => getComputedStyle(el, '::after').content !== 'none').length,
        });
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
  }
  const sheen = (page: Page) =>
    page.evaluate(() => (window as unknown as { __sheen: Array<{ front: boolean; back: boolean; drawn: number }> }).__sheen);

  test('edge-on it is a solid bar, as thick as v10\'s card, not a hairline', async ({ page }) => {
    test.slow();
    await startTurn(page);
    await stepToFrame(page, EDGE_ON);
    // The widest run of the card's green across rows between the clip and the hand, on the canvas behind the face.
    const widths = await page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('canvas.hand-layer--behind')!;
      const ctx = c.getContext('2d')!;
      return [200, 300, 400].map((y) => {
        const row = ctx.getImageData(0, y * devicePixelRatio, c.width, 1).data;
        let run = 0;
        let best = 0;
        for (let x = 0; x < c.width; x++) {
          const [r, g, b, a] = row.slice(x * 4, x * 4 + 4);
          run = a > 200 && g > r + 20 && g > b ? run + 1 : 0;
          best = Math.max(best, run);
        }
        return best / devicePixelRatio;
      });
    });
    // v10's card is 10 units thick, about 12.7 px here at edge-on; the face alone is a line a pixel or two wide.
    for (const w of widths) expect(w).toBeGreaterThanOrEqual(10);
  });

  test('edge-on the clip has turned with the badge: a sliver, not a clip face on', async ({ page }) => {
    test.slow();
    await startTurn(page);
    const clip = page.locator('#worn-scene .worn-scene__clip');
    const atRest = (await clip.boundingBox())!.width;
    await stepToFrame(page, EDGE_ON);
    expect((await clip.boundingBox())!.width / atRest).toBeLessThan(0.4);
  });

  test('a band of light crosses each face only while it turns, there and back, and none at rest or held', async ({
    page,
  }) => {
    test.slow();
    await page.clock.install({ time: 0 });
    await page.goto('/');
    await handLoaded(page, 'ready');
    await page.waitForLoadState('networkidle');
    await page.clock.pauseAt(60_000);
    await expect(page.locator('[data-sheen]')).toHaveCount(0);
    await recordSheen(page);
    await page.locator('[data-part="resume-pad"]').dispatchEvent('click');
    await turnStarts(page, 'hand-turn');
    await step(page, 2100);
    await landsHeld(page);
    let all = await sheen(page);
    // It crossed the front, then the back; while it was on a face it was drawn there, and once held it is gone.
    const firstFront = all.findIndex((f) => f.front);
    const firstBack = all.findIndex((f) => f.back);
    expect(firstFront).toBeGreaterThan(0);
    expect(firstBack).toBeGreaterThan(firstFront);
    expect(all.every((f) => f.drawn === Number(f.front) + Number(f.back))).toBe(true);
    await expect(page.locator('[data-sheen]')).toHaveCount(0);
    expect(await page.locator('#back-slot').evaluate((el) => getComputedStyle(el, '::after').content)).toBe('none');

    await recordSheen(page);
    await page.locator('#back-slot [data-back-face] a[data-home]').click();
    await expect.poll(() => path(page)).toBe('/');
    await step(page, 2100);
    await expect(badge(page)).not.toHaveAttribute('data-flipping');
    all = await sheen(page);
    expect(all.some((f) => f.back)).toBe(true);
    expect(all.some((f) => f.front)).toBe(true);
    await expect(page.locator('[data-sheen]')).toHaveCount(0);
    expect(await page.locator('.face-front').evaluate((el) => getComputedStyle(el, '::after').content)).toBe('none');
  });
});

test.describe('who never loads the hand', () => {
  const cases: Array<[string, BrowserContextOptions, (isMobile: boolean) => boolean]> = [
    ['a phone', {}, (isMobile) => !isMobile],
    ['a touch screen', { viewport: { width: 1366, height: 1024 }, hasTouch: true }, (isMobile) => isMobile],
    ['a short window', { viewport: { width: 1440, height: 560 } }, (isMobile) => isMobile],
    ['reduced motion', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, (isMobile) => isMobile],
  ];
  for (const [who, options, skip] of cases) {
    test(`${who}: no three.js and no model, even once idle`, async ({ browser, isMobile }, testInfo) => {
      test.skip(skip(isMobile), who === 'a phone' ? 'the phone project' : 'desktop projects');
      const device = testInfo.project.use;
      const context = await browser.newContext({ ...device, ...options });
      const page = await context.newPage();
      await holdIdle(page);
      const requests = handRequests(page);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await runIdle(page);
      await page.waitForLoadState('networkidle');
      await pad(page).click();
      await expect(badge(page)).toHaveAttribute('data-side', 'back');
      await expect(badge(page)).not.toHaveAttribute('data-flipping');
      await runIdle(page);
      await page.waitForLoadState('networkidle');
      expect(requests).toEqual([]);
      await expect(badge(page)).not.toHaveAttribute('data-hand-turn');
      await context.close();
    });
  }
});
