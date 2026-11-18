import { expect, test, type Page } from '@playwright/test';

async function openReskin(page: Page): Promise<void> {
  await page.goto('/');
  await page.keyboard.press('Escape');
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown'); // → RESKIN
  await page.keyboard.press('z');
  await expect(page.locator('#lcd-screen .lcd-reskin')).toBeVisible(); // the app chunk loads lazily
}

test('reskin changes the board, persists, and carries to the back', async ({ page }) => {
  await openReskin(page);
  await page.keyboard.press('ArrowRight');
  const board = await page.locator('html').getAttribute('data-board');
  expect(board).not.toBe('green');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-board', board!);
  await page.goto('/resume');
  await expect(page.locator('html')).toHaveAttribute('data-board', board!);
});

test('reskin works when storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    const boom = () => {
      throw new DOMException('blocked', 'SecurityError');
    };
    Object.defineProperty(window, 'localStorage', { get: boom });
    Object.defineProperty(window, 'sessionStorage', { get: boom });
  });
  await openReskin(page);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('html')).not.toHaveAttribute('data-board', 'green');
});

test('konami unlocks the midnight board', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'x', 'z']) {
    await page.keyboard.press(k);
  }
  await expect(page.locator('#lcd-screen')).toContainText('CHEAT ENABLED');
  // the konami's up/up/down/down nets the selection back to 0, and its final A was swallowed
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown'); // → RESKIN
  await page.keyboard.press('z');
  await expect(page.locator('#lcd-screen .lcd-reskin')).toBeVisible();
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight'); // green → black → blue → red → white → midnight
  await expect(page.locator('html')).toHaveAttribute('data-board', 'midnight');
});

test('values are tappable buttons that cycle, and the metal row works', async ({ page }) => {
  await openReskin(page);
  await page.getByRole('button', { name: 'Board: green' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-board', 'black');
  await expect(page.getByRole('button', { name: 'Board: black' })).toBeVisible();
  await page.getByRole('button', { name: 'Metal: gold' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-metal', 'silver');
  // the tap selected the METAL row, so left cycles it back
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('html')).toHaveAttribute('data-metal', 'gold');
});
