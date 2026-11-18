import { expect, test, type Locator, type Page } from '@playwright/test';
import { BOARDS } from '../../src/badge/theme/palettes';

/** `rgb(…)`, `rgba(…)` or `color(srgb …)` (how color-mix() computes) → 0–255 channels. */
function channels(color: string): [number, number, number] {
  const rgb = /^rgba?\(([\d.]+),? ([\d.]+),? ([\d.]+)/.exec(color);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  const srgb = /^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/.exec(color);
  if (srgb) return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255];
  throw new Error(`unparsed color ${color}`);
}

function contrast(a: string, b: string): number {
  const lum = (c: string) => {
    const [r, g, bl] = channels(c).map((v) => {
      const s = v / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const style = (el: Locator, prop: 'color' | 'backgroundColor' | 'outlineColor' | 'outlineStyle') =>
  el.evaluate((node, p) => getComputedStyle(node)[p], prop);

async function setBoard(page: Page, board: string): Promise<void> {
  await page.addInitScript((b) => localStorage.setItem('badge-theme', JSON.stringify({ board: b, metal: 'gold' })), board);
}

/** Focuses `el` from the keyboard's point of view, so :focus-visible applies. */
async function ring(el: Locator): Promise<string> {
  await el.focus();
  await expect(el).toBeFocused();
  expect(await style(el, 'outlineStyle')).not.toBe('none');
  return style(el, 'outlineColor');
}

test('a focused link on the resume label has a ring that reads (3:1)', async ({ page }) => {
  await page.goto('/resume');
  const link = page.locator('#back-main a').first();
  const on = await style(page.locator('#back-main'), 'backgroundColor');
  expect(contrast(await ring(link), on)).toBeGreaterThanOrEqual(3);
});

for (const board of ['green', 'white']) {
  test(`${board} board: focus rings read on the board, front and back`, async ({ page }) => {
    await setBoard(page, board);
    await page.goto('/');
    const front = await style(page.locator('.face-front'), 'backgroundColor');
    const reset = page.getByRole('button', { name: 'Reset badge' });
    expect(contrast(await ring(reset), front)).toBeGreaterThanOrEqual(3);
    expect(contrast(await style(page.locator('.face-front .name'), 'color'), front)).toBeGreaterThanOrEqual(3);

    await page.goto('/resume');
    const back = await style(page.locator('[data-back-face]'), 'backgroundColor');
    expect(contrast(await ring(page.locator('.back-home')), back)).toBeGreaterThanOrEqual(3);
  });
}

test('the powered-off hint reads at 4.5:1 on every board', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Escape');
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('z');
  await expect(page.locator('#lcd-screen .lcd-break')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('z'); // POWER OFF
  await page.keyboard.press('z'); // shows the hint
  const hint = page.locator('.lcd-off-hint');
  await expect(hint).toBeVisible();
  for (const { id } of BOARDS) {
    await page.evaluate((b) => (document.documentElement.dataset.board = b), id);
    const glass = await style(page.locator('#lcd'), 'backgroundColor');
    expect(contrast(await style(hint, 'color'), glass), id).toBeGreaterThanOrEqual(4.5);
  }
});
