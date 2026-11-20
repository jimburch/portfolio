/* Swapping one back page for another in place while the badge is held up in
   the held close-up (a qualifying desktop, scene/gate.ts): the controller's
   (flipper.ts), whatever turn brought the back up. Everywhere else a back
   page's links are ordinary page loads.

   The new page goes in from its top, as a page load would show it. The old
   one stays over it, pinned where it was showing, while it fades out, so the
   new page shows through as the old one goes. Opacity only, no motion: it
   suits reduced motion as well, only quicker. */

import type { BadgeFaces } from './faces';

/** The quick crossfade between two back pages. */
export const SWAP_MS = 200;
/** With reduced motion: quicker still (as quick as the reduced-motion fade's turn). */
export const REDUCED_MOTION_SWAP_MS = 150;

/** The in-place swap of the back page, while it can happen. */
export interface BackSwap {
  /** Whether a back page shown now would swap in place: only while the badge is held. */
  available(): boolean;
  /** Replaces the back page shown with `content`, in place, from its top; resolves once the old page is gone. */
  swap(content: HTMLElement): Promise<void>;
}

export function createHeldSwap(
  faces: BadgeFaces,
  { isHeld, reducedMotion }: { isHeld: () => boolean; reducedMotion: boolean },
): BackSwap {
  const ms = reducedMotion ? REDUCED_MOTION_SWAP_MS : SWAP_MS;
  return { available: isHeld, swap: (content) => crossfadeBack(faces, content, ms) };
}

/**
 * Takes `el` out of the page's flow and pins it to the viewport where `at`
 * says it was showing. Right under any containing block: it is placed,
 * measured, then moved by however far off it is. Pin it again after the page
 * scrolls, in case what it is pinned to scrolled with it.
 */
function pinTo(el: HTMLElement, at: DOMRect) {
  Object.assign(el.style, {
    position: 'fixed',
    top: `${at.top}px`,
    left: `${at.left}px`,
    width: `${at.width}px`,
    margin: '0',
    pointerEvents: 'none',
  });
  const now = el.getBoundingClientRect();
  el.style.top = `${2 * at.top - now.top}px`;
  el.style.left = `${2 * at.left - now.left}px`;
}

/**
 * Replaces the back page on the badge with `content`, crossfading over `ms`
 * (0: at once), with the page scrolled to the new page's top. Resolves once
 * the old page has gone.
 */
export async function crossfadeBack(faces: BadgeFaces, content: HTMLElement, ms = SWAP_MS): Promise<void> {
  const old = faces.backFace();
  if (!old || ms <= 0) {
    faces.setBack(content);
    window.scrollTo(0, 0);
    return;
  }
  // All in one task, so nothing is drawn in between: the old page never jumps.
  // It leaves the flow before the new page comes in, so the browser's scroll
  // anchoring doesn't scroll the page to follow it.
  const at = old.getBoundingClientRect();
  pinTo(old, at);
  faces.replaceBack(content);
  window.scrollTo(0, 0);
  pinTo(old, at);
  try {
    await old.animate({ opacity: [1, 0] }, { duration: ms, easing: 'ease-out', fill: 'forwards' }).finished;
  } catch {
    // Cut short (the page hidden, say): the old page goes all the same.
  } finally {
    old.remove();
  }
}
