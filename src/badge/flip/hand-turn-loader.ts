/* Loads the hand turn (hand-turn.ts: three.js and the hand model) in the
   background: only on a qualifying desktop (scene/gate.ts), only once the
   front has booted and the browser is idle, and never with reduced motion
   (which fades instead). A window resized into the gate later loads it then.
   Nothing waits on it: until it is ready, or if it fails (no WebGL, the
   model not loading), there is no hand turn and the held turn runs. Phones
   never load it. */

import type { BadgeFaces } from './faces';
import type { HeldStage } from './held-stage';
import type { HandTurn } from './hand-turn';
import type { TurnPresentation } from './presentation';

export interface HandTurnLoader {
  /** The hand turn, once it is loaded and can draw; else null. */
  ready(): TurnPresentation | null;
}

/** Runs `fn` when the browser is idle (soon after, where there is no idle callback). */
function whenIdle(fn: () => void) {
  if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 4000 });
  else setTimeout(fn, 500);
}

export function loadHandTurnWhenIdle(opts: {
  faces: BadgeFaces;
  stage: HeldStage;
  /** The qualifying-desktop gate (wornDesktopQuery()). */
  gate: MediaQueryList;
  reducedMotion: boolean;
  /** Calls back once the front has booted. */
  whenBooted: (fn: () => void) => void;
  /** Once loading is over: the hand turn is ready to run, or this visit has none. */
  onLoaded?: (outcome: 'ready' | 'unavailable') => void;
}): HandTurnLoader {
  const { faces, stage, gate, reducedMotion, whenBooted, onLoaded } = opts;
  let turn: HandTurn | null = null;
  let requested = false;

  function load() {
    if (requested || !gate.matches) return;
    requested = true;
    gate.removeEventListener('change', loadWhenIdle);
    import('./hand-turn')
      .then((m) => m.loadHandTurn(faces, stage))
      .then(
        (loaded) => {
          turn = loaded;
          onLoaded?.('ready');
        },
        () => {
          // No hand turn this visit: the held turn stands in.
          onLoaded?.('unavailable');
        },
      );
  }

  function loadWhenIdle() {
    if (!requested && gate.matches) whenIdle(load);
  }

  if (!reducedMotion)
    whenBooted(() => {
      loadWhenIdle();
      if (!requested) gate.addEventListener('change', loadWhenIdle);
    });

  return { ready: () => (turn?.usable() ? turn : null) };
}
