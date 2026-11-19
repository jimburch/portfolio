import { expect, test, type Page } from '@playwright/test';

async function launcher(page: Page): Promise<void> {
  await page.goto('/');
  await page.keyboard.press('Escape');
}

async function openSensors(page: Page): Promise<void> {
  await launcher(page);
  for (const k of ['ArrowLeft', 'ArrowLeft', 'z']) await page.keyboard.press(k);
  for (let i = 0; i < 7; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('z');
  await expect(page.locator('#lcd-screen .lcd-sensors')).toBeVisible(); // lazy chunk
}

test('now app shows the bench project and flips to its log', async ({ page }) => {
  await launcher(page);
  await page.keyboard.press('z'); // NOW is first
  await expect(page.locator('#lcd-screen')).toContainText('NOW TINKERING ON');
  await expect(page.locator('#lcd-screen')).toContainText('Showit badge');
  await page.locator('#lcd-screen a[data-flip]').click();
  await expect(page).toHaveURL(/\/projects\/showit-badge\/?$/);
});

test('A in the now app follows the build log link', async ({ page }) => {
  await launcher(page);
  await page.keyboard.press('z');
  await expect(page.locator('#lcd-screen a[data-flip]')).toBeVisible();
  await page.keyboard.press('z');
  await expect(page).toHaveURL(/\/projects\/showit-badge\/?$/);
});

test('sensors appear only in dev mode and report the source', async ({ page }) => {
  await launcher(page);
  await expect(page.locator('#lcd-screen')).not.toContainText('SENSORS');
  await openSensors(page);
  const screen = page.locator('#lcd-screen');
  await expect(screen).toContainText(/SOURCE (pointer|gyro|off)/);
  await expect(screen).toContainText(/X [+-]\d\.\d\d/);
  await expect(screen).toContainText(/Y [+-]\d\.\d\d/);
});

test('sensors readout follows pointer tilt and stops after leaving', async ({ page, isMobile }) => {
  test.skip(isMobile, 'pointer tilt is a desktop path');
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openSensors(page);
  await page.mouse.move(5, 5);
  await expect(page.locator('#lcd-screen')).not.toContainText('X +0.00');
  await page.keyboard.press('x');
  await page.mouse.move(300, 300);
  await page.waitForTimeout(200);
  expect(errors).toEqual([]);
});

test('the build log link is named without its glyph', async ({ page }) => {
  await launcher(page);
  await page.keyboard.press('z');
  await expect(page.locator('#lcd-screen a[data-flip]')).toHaveAccessibleName('READ BUILD LOG');
});

test('opening NOW takes focus only if it was in the LCD', async ({ page }) => {
  await launcher(page);
  await page.getByRole('button', { name: 'Case A', exact: true }).focus();
  await page.keyboard.press('Enter'); // a native click on the case A key
  await expect(page.locator('#lcd-screen a[data-flip]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Case A', exact: true })).toBeFocused();

  await page.keyboard.press('x');
  await page.locator('#lcd-screen button[aria-current="true"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#lcd-screen a[data-flip]')).toBeFocused();
});
