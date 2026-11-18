import { expect, test, type Page } from '@playwright/test';

const status = (page: Page) => page.locator('#lcd-screen [role="status"]');

async function launcher(page: Page): Promise<void> {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher');
}

test('the LCD is not one big live region; it has one status line', async ({ page }) => {
  await launcher(page);
  await expect(page.locator('[aria-live]:not([role="status"])')).toHaveCount(0);
  await expect(status(page)).toHaveCount(1);
});

test('selection moves are announced with their position', async ({ page }) => {
  await launcher(page);
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowDown');
  await expect(status(page)).toHaveText('Contact, 5 of 7');
});

test('opening an app, changing a value and going back are announced', async ({ page }) => {
  await launcher(page);
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('z');
  await expect(status(page)).toHaveText('Reskin');
  await expect(page.locator('#lcd-screen .lcd-reskin')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(status(page)).toHaveText('Board: black');
  await page.keyboard.press('ArrowDown');
  await expect(status(page)).toHaveText('Metal: gold, 2 of 2');
  await page.keyboard.press('x');
  await expect(status(page)).toHaveText('Menu. Reskin, 6 of 7');
});

test('overclock, power off and reboot are announced', async ({ page }) => {
  await launcher(page);
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('z');
  await expect(page.locator('#lcd-screen .lcd-break')).toBeVisible();
  await page.keyboard.press('z');
  await expect(status(page)).toHaveText('Overclock: on');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('z');
  await expect(status(page)).toHaveText('Powered off. Press RESET to restart.');
  await page.getByRole('button', { name: 'Reset badge' }).click();
  await expect(status(page)).toHaveText(/Rebooting|Ready/);
  await expect(status(page)).toHaveText('Ready', { timeout: 3000 });
});

test('toasts are announced', async ({ page }) => {
  await launcher(page);
  for (const k of ['ArrowLeft', 'ArrowLeft', 'z']) await page.keyboard.press(k);
  await expect(status(page)).toHaveText('DEV MODE: ON');
});

test('focus moving through the launcher is not announced twice', async ({ page }) => {
  await launcher(page);
  await page.locator('#lcd-screen button[aria-current="true"]').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#lcd-screen button[aria-current="true"]')).toBeFocused();
  await page.waitForTimeout(150);
  await expect(status(page)).not.toHaveText(/Projects/);
});

test('app rows: focus follows the selection when it is on the menu', async ({ page }) => {
  await launcher(page);
  const current = page.locator('#lcd-screen button[aria-current="true"]');
  await current.focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Board: green' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('button', { name: 'Metal: gold' })).toBeFocused();
});
