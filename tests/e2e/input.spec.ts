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

test('lone Shift emits select, Shift+Tab and Shift+z do not', async ({ page }) => {
  await page.goto('/');
  await countEmits(page);
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+z');
  await page.waitForTimeout(50);
  // Shift+z maps to a (capital Z), Shift+Tab maps to nothing; neither is select.
  await expect(page.locator('html')).not.toHaveAttribute('data-last-input', /^select:/);
  const before = await emits(page);
  await page.keyboard.press('Shift');
  await expect(page.locator('html')).toHaveAttribute('data-last-input', /^select:\d+$/);
  expect(await emits(page)).toBe(before + 1);
});

async function stubPermission(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __perm: number };
    w.__perm = 0;
    (window as unknown as { DeviceOrientationEvent: object }).DeviceOrientationEvent = class {
      static requestPermission() {
        w.__perm++;
        return Promise.resolve('granted');
      }
    };
  });
}
const perms = (page: Page) => page.evaluate(() => (window as unknown as { __perm: number }).__perm);

function touchTap(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => {
    const opts = { pointerType: 'touch', bubbles: true, cancelable: true, isPrimary: true };
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new PointerEvent('pointerup', opts));
  });
}

test('touch tap on a board button requests tilt permission; Tab does not', async ({ page }) => {
  await stubPermission(page);
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  expect(await perms(page)).toBe(0);
  await touchTap(page, '[data-input="b"]:not([data-case])');
  await expect.poll(() => perms(page)).toBe(1);
});

test('touch pointerdown alone does not request permission', async ({ page }) => {
  await stubPermission(page);
  await page.goto('/');
  await page.locator('[data-input="b"]:not([data-case])').evaluate((el) =>
    el.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'touch', bubbles: true })),
  );
  await page.waitForTimeout(50);
  expect(await perms(page)).toBe(0);
});

test('tap on the RESUME pad does not request permission', async ({ page }) => {
  await stubPermission(page);
  await page.goto('/');
  await page.locator('[data-part="resume-pad"]').evaluate((el) => {
    el.addEventListener('click', (e) => e.preventDefault());
  });
  await touchTap(page, '[data-part="resume-pad"]');
  await page.locator('[data-part="resume-pad"]').click();
  await page.waitForTimeout(50);
  expect(await perms(page)).toBe(0);
});
