/* Reduced motion: a quick fade through the swap instead of a turn, and a
   crossfade as quick from one back page to another. */

import { crossfadeBack } from './back-swap';
import type { BadgeFaces, Side } from './faces';
import type { RunningTurn, TurnPresentation } from './presentation';

const FADE_MS = 150;

export function createFade(faces: BadgeFaces): TurnPresentation {
  const { badge } = faces;

  async function fade(to: Side): Promise<Side> {
    badge.dataset.flipping = 'fade';
    const out = badge.animate({ opacity: [1, 0] }, { duration: FADE_MS / 2, fill: 'forwards' });
    await out.finished.catch(() => {});
    faces.layOut(to);
    out.cancel();
    await badge.animate({ opacity: [0, 1] }, { duration: FADE_MS / 2 }).finished.catch(() => {});
    delete badge.dataset.flipping;
    return to;
  }

  function run(to: Side): RunningTurn {
    return {
      settled: fade(to),
      // Too short to turn back: it lands, and the controller turns again.
      steer() {},
    };
  }

  return { run, swapBack: (content) => crossfadeBack(faces, content, FADE_MS) };
}
