/* The worn scene on the front: its straps catch the light as the badge tilts.

   The scene's look and framing are CSS (worn-scene.css) and build-time art
   (scene/art/); it renders without this module. This only mirrors the
   badge's tilt (`--tx`/`--ty`) onto the scene, and only while the window
   qualifies for it (scene/gate.ts). */

import type { TiltSource } from '../badge/tilt/tilt-source';
import type { Tilt } from '../badge/tilt/math';
import { wornDesktopQuery } from './gate';

export function letSceneFollowTilt(scene: HTMLElement, tilt: TiltSource): void {
  const query = wornDesktopQuery();
  let unsubscribe: (() => void) | null = null;

  function show(t: Tilt) {
    scene.style.setProperty('--tx', t.x.toFixed(4));
    scene.style.setProperty('--ty', t.y.toFixed(4));
  }

  function sync() {
    if (query.matches && !unsubscribe) {
      show(tilt.current());
      unsubscribe = tilt.subscribe(show);
    } else if (!query.matches && unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  query.addEventListener('change', sync);
  sync();
}
