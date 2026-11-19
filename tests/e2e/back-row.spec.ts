import { expect, test, type Page } from '@playwright/test';

/* Every screen app ends with an on-screen BACK row (the badge has no B key). */

interface App {
  id: string;
  /** The app's root on the LCD, once its lazy chunk has mounted. */
  root: string;
  /** Launcher index (sensors needs dev mode first). */
  index: number;
  /** Down presses from the app's first row to BACK. */
  toBack: number;
}

const APPS: App[] = [
  { id: 'now', root: '.lcd-now', index: 0, toBack: 1 },
  { id: 'reskin', root: '.lcd-reskin', index: 5, toBack: 2 },
  { id: 'break', root: '.lcd-break', index: 6, toBack: 2 },
  { id: 'sensors', root: '.lcd-sensors', index: 7, toBack: 0 },
];

async function open(page: Page, app: App): Promise<void> {
  await page.goto('/');
  await page.keyboard.press('Escape');
  if (app.id === 'sensors') for (const k of ['ArrowLeft', 'ArrowLeft', 'z']) await page.keyboard.press(k);
  for (let i = 0; i < app.index; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('z');
  await expect(page.locator(`#lcd-screen ${app.root}`)).toBeVisible();
}

const back = (page: Page) => page.locator('#lcd-screen').getByRole('button', { name: 'Back', exact: true });

async function expectLauncherOn(page: Page, index: number): Promise<void> {
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher');
  await expect(page.locator('#lcd-screen button[aria-current="true"]')).toHaveAttribute('data-index', String(index));
}

for (const app of APPS) {
  test(`${app.id}: up/down reach BACK and A on it returns to the launcher`, async ({ page }) => {
    await open(page, app);
    await expect(back(page)).toBeVisible();
    for (let i = 0; i < app.toBack; i++) await page.keyboard.press('ArrowDown');
    await expect(back(page)).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('z');
    await expectLauncherOn(page, app.index);
  });

  test(`${app.id}: tapping BACK returns to the launcher`, async ({ page, isMobile }) => {
    await open(page, app);
    if (isMobile) await back(page).tap();
    else await back(page).click();
    await expectLauncherOn(page, app.index);
  });

  test(`${app.id}: keyboard B still exits`, async ({ page }) => {
    await open(page, app);
    await page.keyboard.press('x');
    await expectLauncherOn(page, app.index);
  });

  test(`${app.id}: BACK fits inside the LCD at 375x667`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await open(page, app);
    const screen = (await page.locator('#lcd-screen').boundingBox())!;
    const row = (await back(page).boundingBox())!;
    expect(row.y).toBeGreaterThanOrEqual(screen.y);
    expect(row.y + row.height).toBeLessThanOrEqual(screen.y + screen.height + 0.5);
  });
}

test('focus in the LCD follows the selection onto BACK', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  await page.locator('#lcd-screen button[aria-current="true"]').focus();
  await page.keyboard.press('z'); // NOW, with focus in the LCD
  await expect(page.locator('#lcd-screen a[data-flip]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(back(page)).toBeFocused();
  await page.keyboard.press('ArrowDown'); // wraps back to the link
  await expect(page.locator('#lcd-screen a[data-flip]')).toBeFocused();
});

test('moving onto BACK does not take focus from outside the LCD', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown'); // → RESKIN
  await page.keyboard.press('z');
  await expect(page.locator('#lcd-screen .lcd-reskin')).toBeVisible();
  const reset = page.getByRole('button', { name: 'Reset badge' });
  await reset.focus();
  for (let i = 0; i < 2; i++) await page.keyboard.press('ArrowDown');
  await expect(back(page)).toHaveAttribute('aria-current', 'true');
  await expect(reset).toBeFocused();
  // Left/right on BACK change nothing.
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('html')).not.toHaveAttribute('data-board', /black/);
});
