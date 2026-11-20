/* The clock a scripted turn runs on: one time value t, 0 the front at rest
   and 1 the back up, moved toward the side the turn heads for on animation
   frames, from elapsed time (so a stalled tab lands at once on return).
   Steering just changes the heading, so a turn reversed midway retraces
   exactly the path it came by. Shared by the held turn and the hand turn. */

import type { Side } from './faces';
import type { RunningTurn } from './presentation';

export interface TurnScript {
  /** Puts the turn at t on the page. Throwing lands the turn where it was heading. */
  draw(t: number): void;
  /** Lays the badge out as `side` once the turn comes to rest there. */
  land(side: Side): void;
}

/**
 * Runs a turn to `to` taking `ms` end to end. Draws the first frame at once
 * (the turn's start, from the side the badge is laid out as).
 */
export function playTurn(to: Side, ms: number, script: TurnScript): RunningTurn {
  let t = to === 'back' ? 0 : 1;
  let heading: Side = to;
  let done = false;

  const settled = new Promise<Side>((resolve) => {
    function land() {
      done = true;
      script.land(heading);
      resolve(heading);
    }

    let last: number | null = null;
    function tick(now: number) {
      try {
        const goal = heading === 'back' ? 1 : 0;
        if (last !== null) {
          const step = (now - last) / ms;
          t = goal > t ? Math.min(goal, t + step) : Math.max(goal, t - step);
        }
        last = now;
        if (t === goal) return land();
        script.draw(t);
        requestAnimationFrame(tick);
      } catch {
        // Never leave the badge half-turned: land where it was heading.
        land();
      }
    }

    try {
      script.draw(t);
      requestAnimationFrame(tick);
    } catch {
      land();
    }
  });

  return {
    settled,
    steer(side) {
      if (!done) heading = side;
    },
  };
}
