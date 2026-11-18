import { expect, test } from '@playwright/test';

const ROUTES = [
  ['/about', 'About'],
  ['/resume', 'Resume'],
  ['/projects', 'Projects'],
  ['/projects/vonbox', 'VonBox'],
  ['/contact', 'Contact'],
] as const;

for (const [route, heading] of ROUTES)
  test(`${route} renders its back face`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('[data-back-face] h1')).toHaveText(new RegExp(heading));
    await expect(page.locator('[data-back-face] a[data-home]')).toHaveAttribute('href', '/');
    // The flip lifts exactly one face into the front page and focuses its h1.
    await expect(page.locator('[data-back-face]')).toHaveCount(1);
    await expect(page.locator('[data-back-face] h1')).toHaveAttribute('tabindex', '-1');
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

// The Content-Type header is asserted in tests/unit/vcard-route.test.ts: the
// preview server types static files by extension and has no entry for .vcf,
// so here it sends an empty Content-Type whatever the route declares.
test('vcard is served', async ({ request }) => {
  const res = await request.get('/jim-burch.vcf');
  expect(res.ok()).toBe(true);
  expect(await res.text()).toContain('BEGIN:VCARD');
});

test('reading column is comfortable on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/resume');
  const w = (await page.locator('#back-main').boundingBox())!.width;
  expect(w).toBeLessThanOrEqual(760);
});
