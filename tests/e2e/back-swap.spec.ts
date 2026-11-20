import { expect, test, type Page } from '@playwright/test';

/* Swapping back pages in place: once the badge shows a back page in session
   (flipped in from the front), the back's links to other back pages (the
   strip's page links, project cards, "All projects") swap the page in place
   with a quick crossfade, without turning to the front. On a qualifying
   desktop the badge stays held and the resting hand stays put. The URL is
   replaced, not pushed, so one Back (or HOME) always returns to the front.
   External links, the PDF and the vCard stay ordinary links. */

const badge = (page: Page) => page.locator('#badge');
const path = (page: Page) => new URL(page.url()).pathname.replace(/\/$/, '') || '/';
const stripLink = (page: Page, name: string) =>
  page.locator('#back-slot .back-nav').getByRole('link', { name, exact: true });
const resumePad = (page: Page) => page.locator('[data-part="resume-pad"]');
const historyLength = (page: Page) => page.evaluate(() => history.length);
const scrollY = (page: Page) => page.evaluate(() => window.scrollY);

/** The flip in from the front, by keyboard, so focus has a front control to go back to. */
async function flipIn(page: Page) {
  await page.goto('/');
  await resumePad(page).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/resume\/?$/);
  await expect(badge(page)).toHaveAttribute('data-side', 'back');
  await expect(badge(page)).not.toHaveAttribute('data-flipping');
  // Survives only if no page load follows.
  await page.evaluate(() => {
    (window as unknown as { __sameDocument: boolean }).__sameDocument = true;
  });
}

const sameDocument = (page: Page) =>
  page.evaluate(() => (window as unknown as { __sameDocument?: boolean }).__sameDocument === true);

/** The badge shows `heading`'s back page, swapped in place: one face, the heading focused, no page load. */
async function expectSwappedTo(page: Page, route: RegExp, heading: RegExp) {
  await expect(page).toHaveURL(route);
  await expect(page.getByRole('heading', { level: 1, name: heading })).toBeFocused();
  await expect(page).toHaveTitle(heading);
  await expect(page.locator('#back-slot > .back-face')).toHaveCount(1);
  await expect(badge(page)).toHaveAttribute('data-side', 'back');
  await expect(badge(page)).not.toHaveAttribute('data-flipping');
  expect(await sameDocument(page)).toBe(true);
}

interface Frame {
  flipping?: string;
  side?: string;
  /** The front hand layer's box and opacity: undefined off the held close-up. */
  hand?: string;
}

/** Records, every animation frame, whether a turn runs and where the resting hand is. */
async function recordFrames(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __frames: Frame[] };
    w.__frames = [];
    const el = document.getElementById('badge')!;
    const hand = document.querySelector<HTMLElement>('#back-slot .held-view__hand--front');
    const sample = () => {
      let box: string | undefined;
      if (hand?.checkVisibility()) {
        const r = hand.getBoundingClientRect();
        box = `${r.x},${r.y},${r.width},${r.height}@${getComputedStyle(hand).opacity}`;
      }
      w.__frames.push({ flipping: el.dataset.flipping, side: el.dataset.side, hand: box });
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

const frames = (page: Page) => page.evaluate(() => (window as unknown as { __frames: Frame[] }).__frames);

test('a strip link swaps the back page in place: URL replaced, focus on the heading, the page at its top', async ({
  page,
  isMobile,
}) => {
  await flipIn(page);
  // Scrolled into the page. Held, the strip is pinned; on a phone it scrolls
  // away, so only as far as keeps it in view.
  await page.evaluate((phone) => {
    const strip = document.querySelector('#back-slot .back-nav')!.getBoundingClientRect();
    window.scrollTo(0, phone ? strip.top + window.scrollY - 40 : 400);
  }, isMobile);
  await expect.poll(() => scrollY(page)).toBeGreaterThan(0);
  const length = await historyLength(page);
  await recordFrames(page);

  // A plain mouse click where the link shows, with the page left scrolled
  // (locator clicks scroll their target into view first).
  const box = (await stripLink(page, 'PROJECTS').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expectSwappedTo(page, /\/projects\/?$/, /Projects/);
  expect(await historyLength(page)).toBe(length);
  expect(await scrollY(page)).toBe(0);
  await expect(page.locator('#back-slot .back-nav a[aria-current="page"]')).toHaveText('PROJECTS');

  // No turn ran: the badge stayed on its back the whole time.
  const all = await frames(page);
  expect(all.every((f) => f.side === 'back' && f.flipping === undefined)).toBe(true);

  if (!isMobile) {
    // Still held: the held close-up and the resting hand, which never moved or faded.
    const { height } = page.viewportSize()!;
    expect((await page.locator('#back-slot .held-view__badge').boundingBox())!.height / height).toBeGreaterThanOrEqual(
      0.9,
    );
    await expect(page.locator('#back-slot .held-view__hand--front')).toBeVisible();
    await expect(page.locator('#worn-scene')).toBeHidden();
    const hands = new Set(all.map((f) => f.hand));
    expect(hands.size).toBe(1);
    expect([...hands][0]).toMatch(/@1$/);
  }
});

for (const leave of ['browser Back', 'HOME'] as const) {
  test(`after several swaps one ${leave} returns to the front`, async ({ page }) => {
    await flipIn(page);
    const length = await historyLength(page);
    for (const [name, heading] of [
      ['PROJECTS', /Projects/],
      ['ABOUT', /About/],
      ['CONTACT', /Contact/],
    ] as const) {
      await stripLink(page, name).click();
      await expectSwappedTo(page, new RegExp(`/${name.toLowerCase()}/?$`), heading);
    }
    expect(await historyLength(page)).toBe(length);

    if (leave === 'HOME') await page.locator('#back-slot a[data-home]').click();
    else await page.goBack();
    await expect.poll(() => path(page)).toBe('/');
    await expect(badge(page)).toHaveAttribute('data-side', 'front');
    await expect(badge(page)).not.toHaveAttribute('data-flipping');
    await expect(page).toHaveTitle('Jim Burch');
    await expect(page.locator('#back-slot > .back-face')).toHaveCount(0);
    // Focus goes back to the control that turned the badge over in the first place.
    await expect(resumePad(page)).toBeFocused();
    expect(await sameDocument(page)).toBe(true);
  });
}

test('a project card swaps in place, and All projects swaps back', async ({ page }) => {
  await flipIn(page);
  const length = await historyLength(page);
  await stripLink(page, 'PROJECTS').click();
  await expectSwappedTo(page, /\/projects\/?$/, /Projects/);

  const card = page.locator('#back-slot .project-card h2 a').first();
  const title = (await card.textContent())!.trim();
  const href = (await card.getAttribute('href'))!;
  await card.click();
  await expectSwappedTo(page, new RegExp(`${href}/?$`), new RegExp(title));

  await page.locator('#back-slot').getByRole('link', { name: /All projects/ }).click();
  await expectSwappedTo(page, /\/projects\/?$/, /Projects/);
  expect(await historyLength(page)).toBe(length);
});

test('external links, the PDF and the vCard stay ordinary links', async ({ page }) => {
  await flipIn(page);
  // Notes whether the badge took each click, then keeps the browser from following it.
  await page.evaluate(() => {
    const w = window as unknown as { __taken: boolean[] };
    w.__taken = [];
    window.addEventListener('click', (e) => {
      w.__taken.push(e.defaultPrevented);
      e.preventDefault();
    });
  });
  const slot = page.locator('#back-slot');
  await slot.getByRole('link', { name: 'Download PDF' }).click();
  await slot.locator('.resume-links').getByRole('link', { name: 'LinkedIn' }).click();
  await slot.locator('a.back-qr').click();
  expect(await page.evaluate(() => (window as unknown as { __taken: boolean[] }).__taken)).toEqual([
    false,
    false,
    false,
  ]);
  await expect(page).toHaveURL(/\/resume\/?$/);
  await expect(badge(page)).toHaveAttribute('data-side', 'back');
});

test('rapid swaps settle to what the URL names', async ({ page }) => {
  await flipIn(page);
  const length = await historyLength(page);
  // Three in one go, all on the page the badge shows now.
  await page.evaluate(() => {
    for (const name of ['PROJECTS', 'ABOUT', 'CONTACT']) {
      const link = [...document.querySelectorAll<HTMLAnchorElement>('#back-slot .back-nav a')].find(
        (a) => a.textContent?.trim() === name,
      )!;
      link.click();
    }
  });
  await expectSwappedTo(page, /\/contact\/?$/, /Contact/);
  expect(await historyLength(page)).toBe(length);
});

test('a swap asked for mid-crossfade lands once the crossfade is over', async ({ page }) => {
  await flipIn(page);
  // Hold the crossfade still at its start, the old page over the new one,
  // before a frame of it is drawn (the observer runs as soon as the swap's
  // script has started it).
  await page.evaluate(() => {
    const slot = document.getElementById('back-slot')!;
    new MutationObserver((_, observer) => {
      if (slot.querySelectorAll(':scope > .back-face').length < 2) return;
      const held = (window as unknown as { __held: Animation[] }).__held = document.getAnimations();
      for (const a of held) a.pause();
      observer.disconnect();
    }).observe(slot, { childList: true });
  });
  await stripLink(page, 'PROJECTS').click();
  await expect(page).toHaveURL(/\/projects\/?$/);
  await expect(page.locator('#back-slot > .back-face')).toHaveCount(2);
  // The new page takes the clicks; the old one is inert and hidden from assistive tech.
  await expect(page.locator('#back-slot > [data-back-face] h1')).toHaveText(/Projects/);
  await expect(page.locator('#back-slot > .back-face[inert][aria-hidden="true"] h1')).toHaveText(/Resume/);
  await stripLink(page, 'ABOUT').click();
  await expect(page).toHaveURL(/\/about\/?$/);
  await page.evaluate(() => {
    for (const a of (window as unknown as { __held: Animation[] }).__held) a.play();
  });
  await expectSwappedTo(page, /\/about\/?$/, /About/);
});

test('a swap then Back settles on the front', async ({ page }) => {
  await flipIn(page);
  await page.evaluate(() => {
    [...document.querySelectorAll<HTMLAnchorElement>('#back-slot .back-nav a')]
      .find((a) => a.textContent?.trim() === 'ABOUT')!
      .click();
    history.back();
  });
  await expect.poll(() => path(page)).toBe('/');
  await expect(badge(page)).toHaveAttribute('data-side', 'front');
  await expect(badge(page)).not.toHaveAttribute('data-flipping');
  await expect(page.locator('#back-slot > .back-face')).toHaveCount(0);
  await expect(page).toHaveTitle('Jim Burch');
  // Settled: nothing later turns it over again.
  await page.waitForTimeout(800);
  await expect(badge(page)).toHaveAttribute('data-side', 'front');
  expect(path(page)).toBe('/');
});

test('a back page that cannot be fetched is loaded by normal navigation, and Back still returns to the front', async ({
  page,
}) => {
  await flipIn(page);
  await page.route('**/about', (r) => (r.request().resourceType() === 'fetch' ? r.abort() : r.continue()));
  await stripLink(page, 'ABOUT').click();
  await expect(page.locator('[data-back-face] h1')).toHaveText(/About/);
  await expect(page.locator('#badge')).toHaveCount(0);
  await page.goBack();
  await expect.poll(() => path(page)).toBe('/');
  await expect(badge(page)).toHaveAttribute('data-side', 'front');
});

test('reduced motion swaps in place too', async ({ browser, isMobile, viewport }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport, isMobile, hasTouch: isMobile });
  const page = await context.newPage();
  await flipIn(page);
  await recordFrames(page);
  const length = await historyLength(page);
  await stripLink(page, 'ABOUT').click();
  await expectSwappedTo(page, /\/about\/?$/, /About/);
  expect(await historyLength(page)).toBe(length);
  expect((await frames(page)).every((f) => f.flipping === undefined)).toBe(true);
  if (!isMobile) await expect(page.locator('#back-slot .held-view__hand--front')).toBeVisible();
  await context.close();
});
