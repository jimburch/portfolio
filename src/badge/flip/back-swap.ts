/* Swapping one back page for another in place, with the badge staying as it
   is (held up in the held close-up, or laid out as a page): the crossfade the
   turn presentations' swapBack shows.

   The new page goes in from its top, as a page load would show it. The old
   one stays over it, pinned where it was showing, while it fades out, so the
   new page shows through as the old one goes. Opacity only, no motion: it
   suits reduced motion as well. */

import type { BadgeFaces } from './faces';

/** The quick crossfade between two back pages. */
export const SWAP_MS = 200;

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
