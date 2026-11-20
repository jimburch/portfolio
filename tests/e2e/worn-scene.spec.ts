import { expect, test, type Browser, type BrowserContextOptions, type Page } from '@playwright/test';

/* The worn desktop scene: on a qualifying desktop (a wide, tall enough window
   with a mouse or trackpad) the badge hangs on a lanyard on a blurred person.
   Everyone else keeps today's look and downloads none of the scene's art.
   `#worn-scene` is the page's own scene; the held close-up in the back slot
   (HeldView.astro) draws its own copy, shown only once the badge is held. */

const SCENE_ART = /\/scene\//;

/** Opens the front in a fresh context and records every request for scene art. */
async function openFront(browser: Browser, options: BrowserContextOptions) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const sceneRequests: string[] = [];
  page.on('request', (r) => {
    if (SCENE_ART.test(new URL(r.url()).pathname)) sceneRequests.push(r.url());
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  return { page, sceneRequests };
}

const badgeBox = async (page: Page) => (await page.locator('#badge').boundingBox())!;

test.describe('on a qualifying desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop projects only');

  for (const [width, height] of [
    [1280, 720],
    [1440, 900],
    [1920, 1080],
    [2560, 1440],
    [800, 620],
  ]) {
    test(`${width}×${height}: the badge is worn, about 78% of the window tall and fully in view`, async ({
      browser,
    }) => {
      const { page, sceneRequests } = await openFront(browser, { viewport: { width, height } });
      await expect(page.locator('#worn-scene')).toBeVisible();
      // The wearer, the neck and the lanyard (behind and in front of the neck) are drawn.
      for (const layer of ['wearer', 'lanyard-behind', 'neck', 'lanyard-front', 'clip']) {
        expect(sceneRequests.some((u) => u.includes(`/scene/${layer}.svg`)), layer).toBe(true);
      }
      const box = await badgeBox(page);
      expect(box.height / height).toBeGreaterThan(0.76);
      expect(box.height / height).toBeLessThan(0.8);
      expect(box.y).toBeGreaterThan(0);
      expect(box.y + box.height).toBeLessThan(height);
      expect(box.x).toBeGreaterThan(0);
      expect(box.x + box.width).toBeLessThan(width);
    });
  }

  test('the scene is decorative: hidden from assistive tech, never focused, never clicked', async ({ page }) => {
    await page.goto('/');
    const scene = page.locator('#worn-scene');
    await expect(scene).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.worn-scene *:focus, .worn-scene:focus')).toHaveCount(0);
    // A point on the wearer, beside the badge, hits the page, not the scene.
    const box = await badgeBox(page);
    const hit = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest('.worn-scene') !== null,
      [box.x / 2, box.y + box.height / 2],
    );
    expect(hit).toBe(false);
    // Tabbing from the top never lands in the scene.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('.worn-scene'))).toBe(false);
    }
  });

  test('the front still works: the RESUME pad flips over the scene', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-part="resume-pad"]').click();
    await expect(page).toHaveURL(/\/resume\/?$/);
    await expect(page.locator('#badge')).toHaveAttribute('data-side', 'back');
  });

  test('the straps catch the light as the pointer tilts the badge', async ({ page }) => {
    await page.goto('/');
    const sheen = page.locator('#worn-scene .worn-scene__sheen');
    const position = () => sheen.evaluate((el) => getComputedStyle(el).backgroundPosition);
    const box = await badgeBox(page);
    await page.mouse.move(box.x + 2, box.y + box.height / 2);
    await page.waitForTimeout(600);
    const left = await position();
    await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);
    await expect.poll(position).not.toBe(left);
  });
});

test.describe('everyone else keeps today’s look and downloads no scene art', () => {
  test.skip(({ isMobile }) => isMobile, 'opens its own contexts; once per desktop engine');

  const cases: [string, BrowserContextOptions][] = [
    ['a phone', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }],
    ['a touch screen', { viewport: { width: 1366, height: 1024 }, hasTouch: true }],
    ['a short window', { viewport: { width: 1440, height: 560 } }],
    ['a narrow window', { viewport: { width: 700, height: 900 } }],
  ];
  for (const [name, options] of cases) {
    test(`${name}: no scene, no scene requests`, async ({ browser }) => {
      const { page, sceneRequests } = await openFront(browser, options);
      await expect(page.locator('#badge')).toBeVisible();
      await expect(page.locator('#worn-scene')).toBeHidden();
      expect(sceneRequests).toEqual([]);
    });
  }
});
