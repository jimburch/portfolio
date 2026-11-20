import { expect, test, type Page } from '@playwright/test';
import { HAND_TURN_MS } from '../../src/scene/hand/timeline';

/* The hand turn's key frames, locked as screenshots. Jim approved the motion
   against v10's key frames (docs/reference/hand-turn-spike/screens/); these
   baselines hold the page to it, per browser that draws the hand (headless
   Chromium with SwiftShader, headless WebKit with the GPU), except where a
   browser's screenshots can't show the frame (WebKit's turned moments, below).
   Phones never get the hand turn, so there are no phone baselines.

   Determinism: the page's clock is paused, so time moves only when the test
   steps it, and the turn's t moves only on those steps. Nothing else on the
   page animates once the badge has booted (the LCD's glitch animations run
   only when OVERCLOCK is on), so nothing is masked. The turn is started with
   a synthetic click on the RESUME pad: no pointer over the badge, so no hover
   state and no pointer tilt, and no keyboard focus ring on the pad.

   One viewport, 1440×900 at DPR 1, keeps the baselines small. */

/** Playwright's clock runs animation frames every 16 ms. */
const FRAME_MS = 16;

/**
 * The seven moments, at v10's key-frame t values (the spike's "per key frame" checklist,
 * docs/reference/hand-turn-spike/spike-report.md; v10 kept v8's timing). The turn's t moves by
 * FRAME_MS / HAND_TURN_MS (1/112.5) per frame, so each moment is the frame nearest its t:
 *
 * | moment     | v10 t | frame | t on the page |
 * |------------|-------|-------|---------------|
 * | rest       | 0     | n/a   | 0 (before the click) |
 * | reach      | .11   | 12    | .1067         |
 * | grip       | .20   | 23    | .2044         |
 * | lift-turn  | .33   | 37    | .3289         |
 * | edge-on    | .43   | 48    | .4267         |
 * | late-turn  | .53   | 60    | .5333         |
 * | held       | 1     | n/a   | landed in the held close-up |
 */
interface Moment {
  name: string;
  /** Where the badge is: at rest before the click, the turn at v10's t, or landed in the held close-up. */
  when: 'rest' | number | 'held';
  /** The badge is turned in 3D (rotateY away from 0): a WebKit page screenshot can't show it (see below). */
  turned?: boolean;
}

const MOMENTS: Moment[] = [
  { name: 'rest', when: 'rest' },
  { name: 'reach', when: 0.11 },
  { name: 'grip', when: 0.2 },
  { name: 'lift-turn', when: 0.33, turned: true },
  { name: 'edge-on', when: 0.43, turned: true },
  { name: 'late-turn', when: 0.53, turned: true },
  { name: 'held', when: 'held' },
];

/**
 * Headless WebKit's page screenshots drop the perspective divide of a 3D transform: a bare
 * `perspective() rotateY()` box with no app code paints too wide and sheared in a screenshot, while
 * WebKit's own compositor (a recordVideo frame) draws it as Chromium does (the #32 report's "Fix round 1";
 * probe `.superpowers/sdd/2026-11-20-hand-turn-impl/32/fix1/min-probe.mjs`). A WebKit baseline of a turned
 * badge would lock in that artefact (and a black vCard QR), not what WebKit draws, so the turned moments
 * are baselined in Chromium only. Before the turn (rotateY 0) and once held there is no perspective to lose.
 */
const screenshotShowsTurned = (browserName: string) => browserName !== 'webkit';

/** The turn frame nearest `t`: the frame on which the page draws the turn at that t. */
const frameAt = (t: number) => Math.round((t * HAND_TURN_MS) / FRAME_MS);

/**
 * The tightest tolerance that held over repeated runs (see the #33 report): every pixel must match
 * to within a colour threshold of 0.01, which lets a pixel drift by about 2/255. The hand (SwiftShader,
 * Metal) and WebKit drew identical pixels every run; Chromium's blurred lanyard behind the badge
 * sometimes rasterizes 1–2/255 differently when the machine is busy. Anything a person could see
 * (an edge moving, a colour changing) is far past it.
 */
const TOLERANCE = { maxDiffPixels: 0, threshold: 0.01 } as const;

const badge = (page: Page) => page.locator('#badge');

/** The front at rest with the hand loaded, the clock paused: time moves only when the test moves it. */
async function showFrontAtRest(page: Page) {
  await page.clock.install({ time: 0 });
  await page.goto('/');
  await expect(badge(page)).toHaveAttribute('data-hand-turn', 'ready', { timeout: 20_000 });
  await page.waitForLoadState('networkidle');
  // 60 s is a whole number of frames, so the turn's first animation frame comes one frame after the click.
  await page.clock.pauseAt(60_000);
}

async function startHandTurn(page: Page) {
  await page.locator('[data-part="resume-pad"]').dispatchEvent('click');
  await expect(badge(page)).toHaveAttribute('data-flipping', 'hand-turn');
}

/**
 * Steps a turn that has just started to `frame`. The first frame only starts the turn's timer (t stays 0);
 * each frame after it moves t on. Steps to the middle of a frame, so the moment never hangs on where a
 * frame boundary falls.
 */
async function stepTurnTo(page: Page, frame: number) {
  await page.clock.runFor((frame + 1) * FRAME_MS + FRAME_MS / 2);
  await expect(badge(page)).toHaveAttribute('data-flipping', 'hand-turn');
}

async function landHeld(page: Page) {
  await page.clock.runFor(HAND_TURN_MS + 1000);
  await expect(badge(page)).not.toHaveAttribute('data-flipping');
  await expect(page).toHaveURL(/\/resume\/?$/);
  await page.waitForLoadState('networkidle');
}

test.describe('the hand turn key frames', () => {
  test.skip(({ isMobile }) => isMobile, 'phones never get the hand turn');
  test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

  for (const { name, when, turned } of MOMENTS) {
    test(`${name} matches the approved baseline`, async ({ page, browserName }) => {
      test.skip(
        Boolean(turned) && !screenshotShowsTurned(browserName),
        'WebKit page screenshots flatten 3D perspective; turned moments are baselined in Chromium only',
      );
      test.slow(); // every stepped frame renders the 3D hand, in software in headless Chromium
      await showFrontAtRest(page);
      if (when !== 'rest') {
        await startHandTurn(page);
        if (when === 'held') await landHeld(page);
        else await stepTurnTo(page, frameAt(when));
      }
      await expect(page).toHaveScreenshot(`${name}.png`, TOLERANCE);
    });
  }
});
