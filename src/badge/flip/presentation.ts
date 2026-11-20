/* How a turn looks. The flip controller (flipper.ts) decides when the badge
   turns and to which side; a turn presentation only shows it happening, on the
   badge's faces (faces.ts). Presentations know nothing of URLs, history or
   focus, and the controller knows nothing of how a turn is drawn.

   Contract with the controller:
   - The controller starts at most one turn or swap at a time, a turn always
     from the side the badge is laid out as, a swap only while it is laid out
     as the back, and waits for each to settle before starting another.
   - When turning to the back, the back slot already holds the back page's face.
     The controller empties it once a turn settles on the front.
   - While a turn runs the badge carries `data-flipping` (no taps land); once it
     settles the attribute is gone and the badge is laid out as the side it
     settled on. */

import type { Side } from './faces';

/** A turn under way. */
export interface RunningTurn {
  /**
   * Heads the turn for `side`: the side it set out for, or back to the side it
   * started from, turning back from wherever it is. A no-op if it already heads
   * there, or once it has settled. A presentation that cannot turn back keeps
   * going; the controller turns again after it settles.
   */
  steer(side: Side): void;
  /**
   * Resolves once the turn has come to rest and the badge is laid out as a
   * page again, with the side it settled on. An animation cut short still
   * settles; it rejects only if the presentation cannot run at all, and the
   * controller then falls back to normal navigation.
   */
  readonly settled: Promise<Side>;
}

export interface TurnPresentation {
  /** Starts turning the badge from the side it is laid out as over to `to`. */
  run(to: Side): RunningTurn;
  /**
   * Replaces the back page shown on the back with `content`, in place, without
   * turning to the front, and shows it from its top (the page scrolled there),
   * as a page load would. The badge stays on its back and carries no
   * `data-flipping`. Resolves once the new page is at rest, with the old one
   * gone. Optional: a presentation without it swaps backs by way of the front.
   */
  swapBack?(content: HTMLElement): Promise<void>;
}
