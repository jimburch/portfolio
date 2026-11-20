/* Who gets the worn desktop scene: the one definition, shared by CSS and JS.

   A qualifying desktop is a screen window at least 768px wide and 600px tall
   with a hover-capable fine pointer (a mouse or trackpad). Phones, touch
   screens and short windows keep today's look and download none of the scene,
   and printing always gets the print stylesheet, never the scene.

   - CSS writes `@media (--worn-desktop) { … }`. The build swaps in the query
     below (astro.config.mjs, via scripts/postcss-custom-media.mjs).
   - JS asks `wornDesktopQuery()` (a live MediaQueryList: `.matches`, and
     `change` events as the window is resized or a mouse comes and goes). */

export const WORN_DESKTOP_QUERY =
  'screen and (min-width: 768px) and (min-height: 600px) and (hover: hover) and (pointer: fine)';

/** Custom media names for the stylesheets, resolved at build time. */
export const CUSTOM_MEDIA: Readonly<Record<string, string>> = {
  '--worn-desktop': WORN_DESKTOP_QUERY,
};

export function wornDesktopQuery(): MediaQueryList {
  return window.matchMedia(WORN_DESKTOP_QUERY);
}
