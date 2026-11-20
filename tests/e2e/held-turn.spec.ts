import { expect, test, type Page } from '@playwright/test';

/* The held turn: on a qualifying desktop, flipping from the front turns the
   badge over where it hangs and pushes the camera in until it is held up in
   the held close-up, the same one a direct load of the back page shows.
   HOME and Back run it backwards. Phones, touch screens and short windows
   keep the plain CSS turn into today's back page. */

test.skip(({ isMobile }) => isMobile, 'desktop projects only');

/** The held badge's width in the close-up at 1440×900: 91% of the window tall, 390:844. */
const HELD_WIDTH_1440X900 = ((900 * 500) / 550) * (390 / 844);

interface Frame {
  side?: string;
  flipping?: string;
  /** The held badge's on-screen box: the back as the visitor sees it, turned and pushed in. */
  width: number;
  height: number;
}

const pad = (page: Page) => page.getByRole('link', { name: 'RESUME', exact: true });
const badge = (page: Page) => page.locator('#badge');
const path = (page: Page) => new URL(page.url()).pathname;

/** Records, every animation frame, how the badge shows: its side, the turn under way and the held badge's on-screen size. */
async function recordFrames(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __frames: Frame[] };
    w.__frames = [];
    const heldBadge = document.querySelector('#back-slot .held-view__badge')!;
    const el = document.getElementById('badge')!;
    const sample = () => {
      const { width, height } = heldBadge.getBoundingClientRect();
      w.__frames.push({ side: el.dataset.side, flipping: el.dataset.flipping, width, height });
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

const frames = (page: Page) =>
  page.evaluate(() => (window as unknown as { __frames: Frame[] }).__frames);

/** Waits until the badge is mid-way through a turn of the given kind. */
const turnStarts = (page: Page, kind: string) =>
  page.waitForFunction((k) => document.getElementById('badge')?.dataset.flipping === k, kind, { polling: 20 });

async function flipInWithKeyboard(page: Page) {
  await pad(page).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/resume\/?$/);
  await expect(badge(page)).toHaveAttribute('data-side', 'back');
  await expect(badge(page)).not.toHaveAttribute('data-flipping');
}

test.describe('on a qualifying desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('flipping to /resume turns into the held close-up: URL, focus on the heading, nothing left transformed', async ({
    page,
  }) => {
    await page.goto('/');
    await recordFrames(page);
    await flipInWithKeyboard(page);
    expect((await frames(page)).some((f) => f.flipping === 'held-turn')).toBe(true);
    await expect(page.getByRole('heading', { level: 1, name: /Resume/ })).toBeFocused();
    await expect(page).toHaveTitle(/Resume/);

    // The held close-up, with the resting hand, over the page's own scene.
    const held = (await page.locator('#back-slot .held-view__badge').boundingBox())!;
    expect(held.height / 900).toBeGreaterThanOrEqual(0.9);
    await expect(page.locator('#worn-scene')).toBeHidden();
    await expect(page.locator('#back-slot .held-view .worn-scene')).toBeVisible();
    for (const layer of ['behind', 'front']) {
      const hand = page.locator(`#back-slot .held-view__hand--${layer}`);
      await expect(hand).toBeVisible();
      expect(await hand.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    }

    // Laid out at its real size: nothing from the text up is transformed, clipped or faded.
    const chain = await page.evaluate(() => {
      const out: string[] = [];
      for (let el: Element | null = document.querySelector('#back-main p'); el; el = el.parentElement) {
        const s = getComputedStyle(el);
        out.push(`${el.tagName}#${el.id}:${s.transform}:${s.clipPath}:${s.opacity}`);
      }
      return out;
    });
    for (const link of chain) expect(link).toMatch(/:none:none:1$/);
  });

  test('HOME turns back to the front and gives focus back to the RESUME pad', async ({ page }) => {
    await page.goto('/');
    await flipInWithKeyboard(page);
    await recordFrames(page);
    await page.locator('#back-slot a[data-home]').click();
    await expect.poll(() => path(page)).toBe('/');
    await expect(badge(page)).toHaveAttribute('data-side', 'front');
    await expect(badge(page)).not.toHaveAttribute('data-flipping');
    expect((await frames(page)).some((f) => f.flipping === 'held-turn')).toBe(true);
    await expect(pad(page)).toBeFocused();
    await expect(page.locator('#worn-scene')).toBeVisible();
    // The front hangs where it did, untransformed.
    expect(await page.locator('.face-front').evaluate((el) => getComputedStyle(el).transform)).toBe('none');
  });

  test('browser Back turns back to the front and gives focus back to the launcher entry', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Escape');
    await page.locator('#lcd-screen button[aria-current="true"]').focus();
    for (let i = 0; i < 2; i++) await page.keyboard.press('ArrowDown'); // → RESUME
    await page.keyboard.press('Enter');
    await expect(badge(page)).toHaveAttribute('data-side', 'back');
    await expect(badge(page)).not.toHaveAttribute('data-flipping');
    await page.goBack();
    await expect(badge(page)).toHaveAttribute('data-side', 'front');
    const entry = page.locator('#lcd-screen button[aria-current="true"]');
    await expect(entry).toHaveText(/RESUME/);
    await expect(entry).toBeFocused();
  });

  test('Back mid-turn turns back from where it is: the badge never reaches the back', async ({ page }) => {
    await page.clock.install({ time: 0 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.clock.pauseAt(5000); // time moves only when the test moves it
    await pad(page).focus();
    await page.keyboard.press('Enter');
    await turnStarts(page, 'held-turn');
    await recordFrames(page);
    // Part-way: the back is up and the camera has started to push in.
    await page.clock.runFor(450);
    const before = (await frames(page)).at(-1)!;
    expect(before.width).toBeGreaterThan(0);
    expect(before.height / 900).toBeLessThan(0.85);

    await page.goBack();
    await expect.poll(() => path(page)).toBe('/');
    await page.clock.runFor(100);
    // It turned back at once: the back is already turning away (narrower).
    expect((await frames(page)).at(-1)!.width).toBeLessThan(before.width - 20);
    await page.clock.runFor(1500);

    await expect(badge(page)).toHaveAttribute('data-side', 'front');
    await expect(badge(page)).not.toHaveAttribute('data-flipping');
    const all = await frames(page);
    // Never landed on the back, and never came near the held close-up's size
    // face on (its width; turned, perspective stretches its near edge taller).
    expect(all.every((f) => f.side === 'front')).toBe(true);
    expect(Math.max(...all.map((f) => f.width))).toBeLessThan(0.95 * HELD_WIDTH_1440X900);
    await expect(page.getByRole('heading', { level: 1, name: /Resume/ })).toHaveCount(0);
    await expect(pad(page)).toBeFocused();
  });

  test('a double click and Back settle to what the URL names', async ({ page }) => {
    await page.goto('/');
    await pad(page).click();
    await pad(page).click({ force: true });
    await page.goBack();
    await expect.poll(() => path(page)).toBe('/');
    await expect(badge(page)).not.toHaveAttribute('data-flipping');
    await expect(badge(page)).toHaveAttribute('data-side', 'front');
  });

  test('rapid Back and Forward settle to what the URL names, in the held close-up', async ({ page }) => {
    await page.goto('/');
    await flipInWithKeyboard(page);
    await page.goBack();
    await page.goForward();
    await expect(page).toHaveURL(/\/resume\/?$/);
    await expect(badge(page)).not.toHaveAttribute('data-flipping');
    await expect(badge(page)).toHaveAttribute('data-side', 'back');
    expect((await page.locator('#back-slot .held-view__badge').boundingBox())!.height / 900).toBeGreaterThanOrEqual(
      0.9,
    );
  });

  test('the held back scrolls by mouse wheel and by keyboard after a flip in', async ({ page, browserName }) => {
    await page.goto('/');
    await flipInWithKeyboard(page);
    const scrolled = () => page.evaluate(() => window.scrollY);
    // The wheel works anywhere, even over the scene beside the badge.
    await page.mouse.move(100, 450);
    await page.mouse.wheel(0, 300);
    await expect.poll(scrolled).toBeGreaterThan(0);
    await page.evaluate(() => scrollTo(0, 0));
    await expect.poll(scrolled).toBe(0);
    // Headless WebKit ignores the arrow keys in the held close-up once the page
    // has been scrolled by script, on a direct load too (not the turn's doing;
    // see the #30 report). Space and Page Down work there.
    const keys = browserName === 'webkit' ? ['Space', 'PageDown'] : ['ArrowDown', 'Space', 'PageDown'];
    for (const key of keys) {
      const from = await scrolled();
      await page.keyboard.press(key);
      await expect.poll(scrolled, key).toBeGreaterThan(from);
    }
  });
});

test('reduced motion on a qualifying desktop fades straight into the held close-up', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto('/');
  await recordFrames(page);
  await pad(page).click();
  await expect(badge(page)).toHaveAttribute('data-side', 'back', { timeout: 500 });
  await expect(badge(page)).not.toHaveAttribute('data-flipping');
  const kinds = new Set((await frames(page)).map((f) => f.flipping).filter(Boolean));
  expect([...kinds]).toEqual(['fade']);
  expect((await page.locator('#back-slot .held-view__badge').boundingBox())!.height / 900).toBeGreaterThanOrEqual(0.9);
  await expect(page.locator('#back-slot .held-view__hand--front')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: /Resume/ })).toBeFocused();
  await context.close();
});

for (const [name, options] of [
  ['a touch screen', { viewport: { width: 1366, height: 1024 }, hasTouch: true }],
  ['a short window', { viewport: { width: 1440, height: 560 } }],
] as const) {
  test(`${name} keeps the plain turn into today's back page`, async ({ browser }) => {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    await page.goto('/');
    await recordFrames(page);
    await page.locator('[data-part="resume-pad"]').click();
    await expect(badge(page)).toHaveAttribute('data-side', 'back');
    await expect(badge(page)).not.toHaveAttribute('data-flipping');
    const kinds = new Set((await frames(page)).map((f) => f.flipping).filter(Boolean));
    expect([...kinds]).toEqual(['turn']);
    await expect(page.locator('#back-slot .held-view')).toBeHidden();
    await context.close();
  });
}
