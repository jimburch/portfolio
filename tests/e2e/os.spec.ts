import { expect, test } from '@playwright/test';

test('boots by itself into the launcher', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher', { timeout: 3000 });
  await expect(page.locator('#lcd-screen button[aria-current="true"]')).toBeVisible();
});

test('any key skips the boot', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher', { timeout: 300 });
});

test('second visit in the session skips the boot', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher', { timeout: 3000 });
  await page.reload();
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher', { timeout: 300 });
});

test('reduced motion boots instantly', async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  await page.goto('/');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher', { timeout: 300 });
});

test('keyboard moves the selection', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#lcd-screen button[aria-current="true"]')).toHaveText(/PROJECTS/);
});

test('← ← A unlocks dev mode', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  for (const k of ['ArrowLeft', 'ArrowLeft', 'z']) await page.keyboard.press(k);
  await expect(page.locator('#lcd-screen')).toContainText('DEV MODE: ON');
});

test('reset replays the boot', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Reset badge' }).click();
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'booting');
});

test('mode and glitch attributes are always written', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher');
  await expect(page.locator('#badge')).toHaveAttribute('data-glitch', 'off');
});

test('the launcher shows a window of four items with a more indicator', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  const screen = page.locator('#lcd-screen');
  await expect(screen.getByRole('button')).toHaveCount(4);
  await expect(screen).toContainText('▼');
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowDown');
  await expect(screen.locator('button[aria-current="true"]')).toHaveText(/CONTACT/);
  await expect(screen).toContainText('▲');
});

test('tapping a screen entry opens it and B returns to the launcher', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await page.locator('#lcd-screen').getByRole('button', { name: /NOW TINKERING/ }).click();
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'app');
  await expect(page.locator('#lcd-screen')).toContainText('COMING SOON');
  await page.keyboard.press('x');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher');
  await expect(page.locator('#lcd-screen button[aria-current="true"]')).toHaveText(/NOW TINKERING/);
});

test('the konami code unlocks midnight and toasts over the launcher', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  const keys = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'x', 'z'];
  for (const k of keys) await page.keyboard.press(k);
  await expect(page.locator('#lcd-screen')).toContainText('CHEAT ENABLED');
  await expect(page.locator('#lcd-screen button[aria-current="true"]')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('badge-unlocked'))).toContain('midnight');
  await expect(page.locator('#lcd-screen')).not.toContainText('CHEAT ENABLED', { timeout: 3000 });
});

test('re-rendering the launcher does not steal focus', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'B button', exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#lcd-screen button[aria-current="true"]')).toHaveText(/PROJECTS/);
  await expect(page.getByRole('button', { name: 'B button', exact: true })).toBeFocused();
});

test('focus inside the LCD follows the selection', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await page.locator('#lcd-screen button[aria-current="true"]').focus();
  for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowDown');
  await expect(page.locator('#lcd-screen button[aria-current="true"]')).toHaveText(/CONTACT/);
  await expect(page.locator('#lcd-screen button[aria-current="true"]')).toBeFocused();
});
