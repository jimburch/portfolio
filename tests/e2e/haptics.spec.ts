import { expect, test, type Page } from '@playwright/test';

/* The haptic tick itself can only be felt on a device; these check its
   plumbing: which presses tick, and that the iOS fallback (a hidden switch)
   never disturbs layout, scroll or focus. */

/** Replaces navigator.vibrate with a counter (or removes it, for the iOS path). */
async function stubVibrate(page: Page, present: boolean): Promise<void> {
  await page.addInitScript((has) => {
    const w = window as unknown as { __vibes: number };
    w.__vibes = 0;
    Object.defineProperty(Navigator.prototype, 'vibrate', {
      configurable: true,
      value: has ? () => ((w.__vibes += 1), true) : undefined,
    });
  }, present);
}
const vibes = (page: Page) => page.evaluate(() => (window as unknown as { __vibes: number }).__vibes);

function layout(page: Page) {
  return page.evaluate(() => ({
    parts: [...document.querySelectorAll('[data-part]')].map((el) => {
      const r = el.getBoundingClientRect();
      return [r.x, r.y, r.width, r.height].map((n) => Math.round(n * 10) / 10).join(',');
    }),
    scrollY: window.scrollY,
    overflow: document.scrollingElement!.scrollHeight - innerHeight,
  }));
}

test('pressing a case key without the Vibration API toggles one hidden switch, with no layout shift or focus move', async ({ page }) => {
  await stubVibrate(page, false);
  await page.goto('/');
  await page.keyboard.press('Escape');
  const selected = page.locator('#lcd-screen button[aria-current="true"]');
  await selected.focus();
  const before = await layout(page);

  // A pointer-style click (detail 1) dispatched straight at the key: everything
  // that changes focus here would be the haptic's doing.
  const press = () =>
    page.getByRole('button', { name: 'Case down', exact: true }).evaluate((el) =>
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 })),
    );
  await press();
  await press();

  const switches = page.locator('input[type="checkbox"][switch]');
  await expect(switches).toHaveCount(1);
  await expect(switches).toBeChecked({ checked: false }); // toggled twice
  expect(await switches.evaluate((el) => el.closest('label')!.getAttribute('aria-hidden'))).toBe('true');
  expect(await switches.evaluate((el) => (el as HTMLInputElement).tabIndex)).toBe(-1);
  await expect(page.locator('#lcd-screen button[aria-current="true"]')).toBeFocused();
  expect(await layout(page)).toEqual(before);

  // A real press: focus never lands on the switch.
  await page.getByRole('button', { name: 'Case up', exact: true }).click();
  expect(await page.evaluate(() => !!document.activeElement?.closest('label[aria-hidden]'))).toBe(false);
  expect(await layout(page)).toEqual(before);
});

test('every front control ticks on a pointer press; keyboard presses do not', async ({ page }) => {
  await stubVibrate(page, true);
  await page.goto('/');
  await page.keyboard.press('Escape');
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher');
  let expected = 0;
  const tick = async () => expect.poll(() => vibes(page)).toBe(++expected);

  for (const name of ['Case up', 'Case down', 'Case left', 'Case right']) {
    await page.getByRole('button', { name, exact: true }).click();
    await tick();
  }

  // Keyboard: arrows, and Enter on a focused key, stay silent.
  await page.keyboard.press('ArrowDown');
  await page.getByRole('button', { name: 'Case up', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(50);
  expect(await vibes(page)).toBe(expected);

  // An LCD row (RESKIN, scrolled into the LCD's window by keyboard) opens the app; its BACK row closes it.
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowDown');
  await page.locator('#lcd-screen button[data-index="5"]').click();
  await tick();
  await page.locator('#lcd-screen').getByRole('button', { name: 'Back', exact: true }).click();
  await tick();
  await expect(page.locator('#badge')).toHaveAttribute('data-mode', 'launcher');

  // Case A opens the selected app (A on the badge is one press, one tick).
  await page.getByRole('button', { name: 'Case A', exact: true }).click();
  await tick();

  await page.getByRole('button', { name: 'Reset badge' }).click();
  await tick();

  const pad = page.locator('[data-part="resume-pad"]');
  await pad.evaluate((el) => el.addEventListener('click', (e) => e.preventDefault()));
  await pad.click();
  await tick();
});

test('no haptic under reduced motion', async ({ browser }) => {
  const page = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
  await stubVibrate(page, false);
  await page.goto('/');
  await page.getByRole('button', { name: 'Case down', exact: true }).click();
  await page.waitForTimeout(50);
  await expect(page.locator('input[switch]')).toHaveCount(0);
  await page.context().close();
});
