import { expect, test } from '@playwright/test';

const PARTS = ['name', 'avatar', 'reserved', 'resume-pad', 'case'];

for (const vp of [
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 360, height: 780 },
]) {
  test(`front fits ${vp.width}x${vp.height} with no scroll or overlap`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto('/');
    const scroll = await page.evaluate(() => document.scrollingElement!.scrollHeight - innerHeight);
    expect(scroll).toBeLessThanOrEqual(0);
    const boxes = await Promise.all(
      PARTS.map((p) => page.locator(`[data-part="${p}"]`).boundingBox()),
    );
    for (const b of boxes) {
      expect(b).not.toBeNull();
      expect(b!.y + b!.height).toBeLessThanOrEqual(vp.height);
      expect(b!.x + b!.width).toBeLessThanOrEqual(vp.width);
    }
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!,
          b = boxes[j]!;
        const overlap =
          a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
        expect(overlap, `${PARTS[i]} overlaps ${PARTS[j]}`).toBe(false);
      }
  });
}

test('every control has an accessible name', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Case up', 'Case down', 'Case left', 'Case A', 'Case right', 'Reset badge'])
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  // The ↻ glyph is decoration, not part of the name.
  await expect(page.getByRole('link', { name: 'RESUME', exact: true })).toHaveAttribute('href', '/resume');
});

test('the board prints no controls; each case key has its own printed label', async ({ page }) => {
  await page.goto('/');
  // No A/B, SELECT/START or D-pad on the board: the five case keys are the only inputs.
  await expect(page.locator('[data-input]')).toHaveCount(5);
  await expect(page.locator('[data-input="b"], [data-input="select"], [data-input="start"]')).toHaveCount(0);
  for (const [name, glyph] of [
    ['Case up', '▲'],
    ['Case down', '▼'],
    ['Case left', '◀'],
    ['Case A', 'A'],
    ['Case right', '▶'],
  ] as const) {
    const label = page.getByRole('button', { name, exact: true }).locator('.key-silk');
    await expect(label).toBeVisible();
    await expect(label).toContainText(glyph);
    await expect(label).toHaveAttribute('aria-hidden', 'true');
  }
});

test('without JS the screen offers links to every back page', async ({ browser }) => {
  const page = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Badge menu' });
  for (const href of ['/projects', '/resume', '/about', '/contact'])
    await expect(nav.locator(`a[href="${href}"]`)).toBeVisible();
});
