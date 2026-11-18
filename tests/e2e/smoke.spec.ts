import { expect, test } from '@playwright/test';

test('home responds with the site title', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(/Jim Burch/);
});
