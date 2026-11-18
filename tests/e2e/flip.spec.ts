import { expect, test } from '@playwright/test';

test('RESUME pad is one tap to the resume, even mid-boot', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-part="resume-pad"]').click();
  await expect(page).toHaveURL(/\/resume\/?$/);
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'back');
  await expect(page.getByRole('heading', { level: 1, name: /Resume/ })).toBeFocused();
});

test('launcher flip, browser back and forward', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
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
  await page.route('**/resume', (r) => (r.request().resourceType() === 'fetch' ? r.abort() : r.continue()));
  await page.locator('[data-part="resume-pad"]').click();
  await expect(page).toHaveURL(/\/resume\/?$/);
  await expect(page.locator('[data-back-face] h1')).toHaveText(/Resume/);
});

// The flip pushes the URL before it fetches. Navigating to that same URL would
// leave the front's history entry pointing at the back page's document.
test('Back after the fallback returns to the front', async ({ page }) => {
  await page.goto('/');
  await page.route('**/resume', (r) => (r.request().resourceType() === 'fetch' ? r.abort() : r.continue()));
  await page.locator('[data-part="resume-pad"]').click();
  await expect(page.locator('[data-back-face] h1')).toHaveText(/Resume/);
  await expect(page.locator('#badge')).toHaveCount(0);
  await page.goBack();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/');
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'front');
  await expect(page).toHaveTitle('Jim Burch');
});

test('a second flip before landing still leaves HOME pointing at the front', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowDown'); // NOW → PROJECTS
  await page.keyboard.press('z'); // flips to /projects after the LCD's "loading…"
  await page.locator('[data-part="resume-pad"]').click(); // flips to /resume first
  await expect.poll(() => new URL(page.url()).pathname).toMatch(/^\/projects\/?$/);
  await expect(page.locator('#back-slot [data-back-face] h1')).toHaveText(/Projects/);
  await expect(page.locator('#badge')).not.toHaveAttribute('data-flipping');
  await page.locator('#back-slot a[data-home]').click();
  await expect.poll(() => new URL(page.url()).pathname).toBe('/');
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'front');
  await page.goBack();
  expect(new URL(page.url()).pathname).not.toMatch(/^\/resume\/?$/);
});

test('double tap and back mid-flip settle to match the URL', async ({ page }) => {
  await page.goto('/');
  const pad = page.locator('[data-part="resume-pad"]');
  await pad.click();
  await pad.click({ force: true });
  await page.goBack();
  await page.waitForTimeout(1200);
  const side = await page.locator('#badge').getAttribute('data-side');
  expect(new URL(page.url()).pathname === '/' ? 'front' : 'back').toBe(side);
});

test('the landed back lays out like its own page and scrolls', async ({ page }) => {
  await page.goto('/resume');
  const standalone = await page.locator('[data-back-face]').boundingBox();
  await page.goto('/');
  await page.locator('[data-part="resume-pad"]').click();
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'back');
  await expect(page.locator('#badge')).not.toHaveAttribute('data-flipping');
  await expect(page.locator('.face-front')).toBeHidden();
  expect(await page.locator('#back-slot [data-back-face]').boundingBox()).toEqual(standalone);
  expect(await page.evaluate(() => document.documentElement.scrollHeight > innerHeight)).toBe(true);
});

test('reduced motion still flips', async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  await page.goto('/');
  await page.locator('[data-part="resume-pad"]').click();
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'back', { timeout: 500 });
});

test('flipping back returns focus to the RESUME pad that started it', async ({ page }) => {
  await page.goto('/');
  const pad = page.getByRole('link', { name: 'RESUME', exact: true });
  await pad.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'back');
  await expect(page.getByRole('heading', { level: 1, name: /Resume/ })).toBeFocused();
  await page.goBack();
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'front');
  await expect(pad).toBeFocused();
});

test('flipping back returns focus to the launcher entry that started it', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await page.locator('#lcd-screen button[aria-current="true"]').focus();
  for (let i = 0; i < 2; i++) await page.keyboard.press('ArrowDown'); // → RESUME
  await page.keyboard.press('Enter');
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'back');
  await page.locator('#back-slot a[data-home]').click();
  await expect(page.locator('#badge')).toHaveAttribute('data-side', 'front');
  const entry = page.locator('#lcd-screen button[aria-current="true"]');
  await expect(entry).toHaveText(/RESUME/);
  await expect(entry).toBeFocused();
});
