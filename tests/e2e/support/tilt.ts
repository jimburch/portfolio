import { expect, type Page } from '@playwright/test';

/* Tilt helpers for specs: tip a simulated device, and read what the tilt
   paints. Only device orientation tilts the badge; the pointer never does. */

/**
 * Waits until the front has loaded and gone quiet. On a qualifying desktop the
 * hand turn loads in the background once the front has booted, and while it
 * warms up headless Chromium can run no animation frames for seconds, so a
 * tilt would neither move (a false failure) nor be seen to stay still (a
 * false pass). Wait for its outcome there; phones never load it.
 */
export async function waitForQuietFront(page: Page) {
  await page.waitForLoadState('networkidle');
  if (await page.locator('#worn-scene').isVisible()) {
    await expect(page.locator('#badge')).toHaveAttribute('data-hand-turn', /./, { timeout: 20_000 });
  }
}

/**
 * Fires a `deviceorientation` reading on the window, as a phone's sensor
 * would. A plain Event carrying the angles: WebKit won't construct a
 * DeviceOrientationEvent, and the tilt source reads only `beta` and `gamma`.
 */
export const fireOrientation = (page: Page, beta: number, gamma: number) =>
  page.evaluate(
    ([b, g]) => window.dispatchEvent(Object.assign(new Event('deviceorientation'), { beta: b, gamma: g })),
    [beta, gamma],
  );

/**
 * A baseline reading as the phone is held, then the phone tipped 20° on both
 * axes: two thirds of a full tilt, positive on x whichever way the screen is
 * turned (headless WebKit's iPhone reports a 90° screen angle, Chromium 0°).
 */
export async function tipDevice(page: Page) {
  await fireOrientation(page, 45, 0);
  await fireOrientation(page, 65, 20);
}

/** The badge's tilt (`--tx`/`--ty`), 0 at rest. */
export const readTilt = (page: Page) =>
  page.evaluate(() => {
    const style = getComputedStyle(document.getElementById('badge')!);
    return {
      x: parseFloat(style.getPropertyValue('--tx')) || 0,
      y: parseFloat(style.getPropertyValue('--ty')) || 0,
    };
  });

/**
 * How the light falls on the front, as painted: the board's sheen, the
 * highlight on the metal and its side face, the glare on the case and a lit
 * avatar dot. Any tilt changes some of these; at rest they hold still.
 */
export const readLighting = (page: Page) =>
  page.evaluate(() => {
    const style = (selector: string, pseudo?: string) =>
      getComputedStyle(document.querySelector(selector)!, pseudo);
    return {
      sheen: style('.face-front').backgroundImage,
      metal: `${style('.metal').backgroundPosition} | ${style('.metal').boxShadow}`,
      glare: style('.case', '::after').backgroundPosition,
      dot: style('.avatar i').backgroundColor,
    };
  });
