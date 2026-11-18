import { expect, test, type Page } from '@playwright/test';

async function openBreak(page: Page): Promise<void> {
  await page.goto('/');
  await page.keyboard.press('Escape');
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowDown'); // → BREAK IT
  await page.keyboard.press('z');
  await expect(page.locator('#lcd-screen .lcd-break')).toBeVisible(); // the app chunk loads lazily
}

test('overclock glitches and RESET restores', async ({ page }) => {
  await openBreak(page);
  await page.keyboard.press('z'); // OVERCLOCK on
  await expect(page.locator('#badge')).toHaveAttribute('data-glitch', 'on');
  await expect(page.getByRole('button', { name: /overclock: on/i })).toBeVisible();
  await page.getByRole('button', { name: 'Reset badge' }).click();
  await expect(page.locator('#badge')).toHaveAttribute('data-glitch', 'off');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', /booting|launcher/);
});

test('overclock toggles back off from the app', async ({ page }) => {
  await openBreak(page);
  await page.keyboard.press('z');
  await expect(page.locator('#badge')).toHaveAttribute('data-glitch', 'on');
  await page.keyboard.press('z');
  await expect(page.locator('#badge')).toHaveAttribute('data-glitch', 'off');
});

test('power off ignores input until RESET', async ({ page }) => {
  await openBreak(page);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('z'); // POWER OFF
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'off');
  await expect(page.locator('#lcd-screen')).not.toContainText('press RESET');
  await page.keyboard.press('z');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'off');
  await expect(page.locator('#lcd-screen')).toContainText('press RESET');
  await page.getByRole('button', { name: 'Reset badge' }).click();
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher', { timeout: 3000 });
  await expect(page.locator('#lcd-screen')).not.toContainText('press RESET');
});

test('RESUME pad still works while powered off', async ({ page }) => {
  await openBreak(page);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('z');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'off');
  await page.locator('[data-part="resume-pad"]').click();
  await expect(page).toHaveURL(/\/resume\/?$/);
});
