import { expect, test, type Page } from '@playwright/test';
import { readLighting, readTilt, tipDevice, waitForQuietFront } from './support/tilt';

/* Only a device's accelerometer/gyroscope tilts the badge. A mouse on a
   desktop or a finger dragging on a phone never does: without orientation the
   badge rests at its neutral light. */

/** Long enough for any tilt to have eased most of the way to its target. */
const SETTLE_MS = 600;
/** Room for a whole flip or hand turn, even on a loaded machine. */
const TURN_MS = 20_000;

const corners = async (page: Page) => {
  const box = (await page.locator('#badge').boundingBox())!;
  return [
    [box.x + 4, box.y + 4],
    [box.x + box.width - 4, box.y + box.height - 4],
  ] as const;
};

test('moving the mouse over the badge changes nothing', async ({ page, isMobile }) => {
  test.skip(isMobile, 'a mouse is a desktop path');
  await page.goto('/');
  await waitForQuietFront(page);
  const atRest = await readLighting(page);
  for (const [x, y] of await corners(page)) {
    await page.mouse.move(x, y, { steps: 6 });
    await page.waitForTimeout(SETTLE_MS);
    expect(await readTilt(page)).toEqual({ x: 0, y: 0 });
    expect(await readLighting(page)).toEqual(atRest);
  }
});

test('a finger dragging across the badge changes nothing', async ({ page }) => {
  await page.goto('/');
  await waitForQuietFront(page);
  const atRest = await readLighting(page);
  const fire = (type: string, x: number, y: number) =>
    page.evaluate(
      ([t, cx, cy]) =>
        window.dispatchEvent(
          new PointerEvent(t as string, { pointerType: 'touch', clientX: cx as number, clientY: cy as number, bubbles: true }),
        ),
      [type, x, y],
    );
  for (const [x, y] of await corners(page)) {
    await fire('pointermove', x, y);
    await page.waitForTimeout(SETTLE_MS);
    expect(await readTilt(page)).toEqual({ x: 0, y: 0 });
    expect(await readLighting(page)).toEqual(atRest);
  }
});

test('tipping the device moves the reflection', async ({ page }) => {
  await page.goto('/');
  await waitForQuietFront(page);
  const atRest = await readLighting(page);
  await tipDevice(page);
  await expect.poll(async () => (await readTilt(page)).x).toBeGreaterThan(0.5);
  const tipped = await readLighting(page);
  expect(tipped.sheen).not.toBe(atRest.sheen);
  expect(tipped.metal).not.toBe(atRest.metal);
  expect(tipped.glare).not.toBe(atRest.glare);
});

test('reduced motion keeps the badge at rest, whatever the device does', async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  await page.goto('/');
  await tipDevice(page);
  await page.waitForTimeout(SETTLE_MS);
  expect(await readTilt(page)).toEqual({ x: 0, y: 0 });
});

test('tilt rests while the back shows and resumes on the front', async ({ page }) => {
  await page.goto('/');
  await waitForQuietFront(page);
  await page.locator('[data-part="resume-pad"]').click();
  // On a qualifying desktop this is the hand turn, which takes a few seconds.
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'back', { timeout: TURN_MS });
  await expect(page.locator('#badge')).not.toHaveAttribute('data-flipping', { timeout: TURN_MS });
  await expect.poll(async () => (await readTilt(page)).x).toBe(0);
  await tipDevice(page);
  await page.waitForTimeout(300);
  expect((await readTilt(page)).x).toBe(0);

  await page.locator('#back-slot a[data-home]').click();
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'front', { timeout: TURN_MS });
  await expect(page.locator('#badge')).not.toHaveAttribute('data-flipping', { timeout: TURN_MS });
  await page.waitForLoadState('networkidle'); // on a phone, home is a page load
  await tipDevice(page); // its first reading is a fresh baseline after the back
  await expect.poll(async () => (await readTilt(page)).x).toBeGreaterThan(0.5);
});
