import { expect, test, type Page } from '@playwright/test';

async function countEmits(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __n: number };
    w.__n = 0;
    new MutationObserver(() => w.__n++).observe(document.documentElement, {
      attributeFilter: ['data-last-input'],
    });
  });
}
const emits = (page: Page) => page.evaluate(() => (window as unknown as { __n: number }).__n);

test('Enter on a focused A button fires once', async ({ page }) => {
  await page.goto('/');
  await countEmits(page);
  await page.getByRole('button', { name: 'A button', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  expect(await emits(page)).toBe(1);
});

test('Space on a focused A button fires once', async ({ page }) => {
  await page.goto('/');
  await countEmits(page);
  await page.getByRole('button', { name: 'A button', exact: true }).focus();
  await page.keyboard.press(' ');
  await page.waitForTimeout(100);
  expect(await emits(page)).toBe(1);
});

test('arrow key emits and Ctrl+Arrow does not', async ({ page }) => {
  await page.goto('/');
  await countEmits(page);
  await page.keyboard.press('Control+ArrowRight');
  await page.waitForTimeout(50);
  expect(await emits(page)).toBe(0);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('html')).toHaveAttribute('data-last-input', /^left:\d+$/);
});

test('clicking a board button emits its input', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'B button', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-last-input', /^b:\d+$/);
});
