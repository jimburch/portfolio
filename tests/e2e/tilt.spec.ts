import { expect, test, type Page } from '@playwright/test';

test.skip(({ browserName }) => browserName !== 'chromium', 'pointer tilt is desktop-only');

const readTx = (page: Page) =>
  page.evaluate(
    () => parseFloat(getComputedStyle(document.getElementById('badge')!).getPropertyValue('--tx')) || 0,
  );

test('pointer drives --tx', async ({ page }) => {
  await page.goto('/');
  const box = (await page.locator('#badge').boundingBox())!;
  await page.mouse.move(box.x + box.width - 2, box.y + 2);
  await expect.poll(() => readTx(page)).toBeGreaterThan(0.5);
});

test('reduced motion keeps the badge at rest', async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  await page.goto('/');
  const box = (await page.locator('#badge').boundingBox())!;
  await page.mouse.move(box.x + box.width - 2, box.y + 2);
  await page.waitForTimeout(500);
  expect(await readTx(page)).toBe(0);
});

test('touch pointer drives --tx and recenters on release', async ({ page }) => {
  await page.goto('/');
  const box = (await page.locator('#badge').boundingBox())!;
  const fire = (type: string, x: number, y: number) =>
    page.evaluate(
      ([t, cx, cy]) =>
        window.dispatchEvent(
          new PointerEvent(t as string, { pointerType: 'touch', clientX: cx as number, clientY: cy as number, bubbles: true }),
        ),
      [type, x, y],
    );
  await fire('pointermove', box.x + box.width - 2, box.y + 2);
  await expect.poll(() => readTx(page)).toBeGreaterThan(0.5);
  await fire('pointerup', box.x, box.y);
  await expect.poll(() => readTx(page)).toBeLessThan(0.01);
});

test('tilt rests while the back shows and resumes on the front', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-part="resume-pad"]').click();
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'back');
  await expect(page.locator('#badge')).not.toHaveAttribute('data-flipping');
  await expect.poll(() => readTx(page)).toBe(0);
  await page.mouse.move(1200, 5);
  await page.mouse.move(1260, 10);
  await page.waitForTimeout(300);
  expect(await readTx(page)).toBe(0);

  await page.locator('#back-slot a[data-home]').click();
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'front');
  await expect(page.locator('#badge')).not.toHaveAttribute('data-flipping');
  const box = (await page.locator('#badge').boundingBox())!;
  await page.mouse.move(box.x + box.width - 2, box.y + 2);
  await expect.poll(() => readTx(page)).toBeGreaterThan(0.5);
});
