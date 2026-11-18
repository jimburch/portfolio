/* What JIM/OS tells assistive tech when its state changes. Pure: the runtime
   passes the states before and after an event and speaks the result through
   the LCD's status line. */

import { visibleApps } from './reducer';
import type { AppEntry, OsState } from './types';

export const OFF_ANNOUNCEMENT = 'Powered off. Press RESET to restart.';

/** `NOW TINKERING` → `Now tinkering`: screen readers spell out some all-caps words. */
export function spoken(title: string): string {
  return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
}

/** `Contact, 5 of 7`. */
export function position(name: string, index: number, count: number): string {
  return `${name}, ${index + 1} of ${count}`;
}

function selection(state: OsState, apps: readonly AppEntry[]): string {
  const entries = visibleApps(apps, state.devMode);
  const entry = entries[state.selected];
  return entry ? position(spoken(entry.title), state.selected, entries.length) : '';
}

/**
 * The announcement for going from `prev` to `next`, or null for none.
 * `selectionHasFocus`: focus sits on the selected launcher entry, so the screen
 * reader already speaks a selection move and it is not repeated here.
 */
export function describeChange(
  prev: OsState,
  next: OsState,
  apps: readonly AppEntry[],
  opts: { selectionHasFocus: boolean },
): string | null {
  if (next.mode === 'off') return prev.mode === 'off' ? null : OFF_ANNOUNCEMENT;
  if (next.mode === 'booting') return prev.mode === 'booting' ? null : 'Rebooting';
  if (next.mode === 'app') {
    if (prev.mode === 'app' && prev.appId === next.appId) return null;
    const entry = apps.find((a) => a.id === next.appId);
    return entry ? spoken(entry.title) : null;
  }
  // The launcher.
  if (prev.mode === 'booting') return 'Ready';
  if (prev.mode === 'app') return `Menu. ${selection(next, apps)}`;
  if (prev.selected !== next.selected && !opts.selectionHasFocus) return selection(next, apps);
  return null;
}
