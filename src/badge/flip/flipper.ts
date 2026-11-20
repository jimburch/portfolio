/* The flip: turns #badge over between its front (JIM/OS) and a back page lifted
   out of that page's own static HTML, and keeps it in step with the URL.

   The URL is the source of truth. flipTo/flipBack only move the URL (when asked
   to) and then settle the badge to match it; popstate and bfcache restores just
   settle. Settling runs one turn at a time and re-reads the URL after every
   turn, so rapid input (a double tap, Back mid-flip) always ends on the side the
   URL names. A turn whose start the URL names again midway (Back mid-flip)
   turns back from where it is rather than finishing first. If a back page cannot be fetched, the visitor gets it by normal
   navigation instead, and the badge is never left half-turned.

   From one back page to another (the back's own links, marked data-flip) the
   badge swaps the page in place, if the presentation can, rather than turning
   by way of the front. A swap takes over the back's history entry rather than
   adding one, as a second flip before the first lands does, so Back and HOME
   always return to the front however many swaps there were.

   Focus: landing on a back, or swapping one in, moves it to the page's h1;
   landing on the front gives it back to the front control that had it when the
   badge turned over (the RESUME pad, a launcher entry), if that control is
   still there.

   This is the flip's controller: it decides when the badge turns and to which
   side. How a turn looks is a turn presentation's job (presentation.ts), picked
   afresh for every turn. */

import { oppositeSide, type BadgeFaces, type Side } from './faces';
import type { RunningTurn, TurnPresentation } from './presentation';

export type { Side } from './faces';

export interface Flipper {
  flipTo(route: string, opts?: { push?: boolean }): Promise<void>;
  flipBack(opts?: { viaHistory?: boolean }): Promise<void>;
  side(): Side;
}

const FRONT_PATH = '/';

/** `/resume/` → `/resume`; the front page (`/`) has none. */
export function backRouteOf(pathname: string): string | null {
  return pathname.replace(/\/+$/, '') || null;
}

/** Warms the HTTP cache so a later flip has its back page at hand. */
export function prefetchBackPages(routes: readonly string[]): void {
  for (const route of routes) {
    fetch(route, { priority: 'low' })
      .then((res) => res.text())
      .catch(() => {});
  }
}

interface BackPage {
  face: HTMLElement;
  title: string;
}

/** A presentation's in-place swap of the back page (TurnPresentation.swapBack). */
type Swap = (content: HTMLElement) => Promise<void>;

/** The back page's `[data-back-face]` and title, or null if it cannot be had. */
async function loadBackPage(route: string): Promise<BackPage | null> {
  try {
    const res = await fetch(route, { headers: { Accept: 'text/html' } });
    if (!res.ok) return null;
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const face = doc.querySelector<HTMLElement>('[data-back-face]');
    return face ? { face: document.adoptNode(face), title: doc.title } : null;
  } catch {
    return null;
  }
}

/** What the flipper stores on the history entries it creates. */
interface EntryState {
  side: Side;
  route?: string;
  /** Set on a back entry that sits directly on top of a front entry. */
  from?: 'front';
}

function entryState(): EntryState | null {
  const state: unknown = history.state;
  return state && typeof state === 'object' && 'side' in state ? (state as EntryState) : null;
}

/** A turn under way, and the routes at its two ends (null is the front). */
interface TurnUnderWay {
  turn: RunningTurn;
  from: { side: Side; route: string | null };
  to: { side: Side; route: string | null };
}

export function createFlipper(opts: {
  faces: BadgeFaces;
  /** The presentation to show the next turn with. */
  presentation: () => TurnPresentation;
  /** After landing. On the front, focus is already back on the control that started the flip, if it could be. */
  onSideChange: (side: Side) => void;
}): Flipper {
  const { faces, presentation, onSideChange } = opts;
  const { badge, front, backSlot } = faces;
  const frontTitle = document.title;

  /** The back route on the badge, or null while the front is showing. */
  let shown: string | null = null;
  let settling: Promise<void> | null = null;
  /** The turn under way, if any. */
  let turning: TurnUnderWay | null = null;
  /** The front control focused when the badge last turned to its back. */
  let returnFocus: HTMLElement | null = null;

  /**
   * Turns the badge to `to` (whose route is `toRoute`) and resolves with the
   * side it settled on: `to`, or the side it left if it was steered back.
   * Sides start and land at the top of the page, as a page load would.
   */
  async function show(to: Side, toRoute: string | null): Promise<Side> {
    window.scrollTo(0, 0);
    const turn = presentation().run(to);
    turning = { turn, from: { side: oppositeSide(to), route: shown }, to: { side: to, route: toRoute } };
    try {
      return await turn.settled;
    } finally {
      turning = null;
      window.scrollTo(0, 0);
    }
  }

  /** Mid-turn, heads the turn for whichever end the URL now names, if either. */
  function steerTurn({ turn, from, to }: TurnUnderWay) {
    const want = backRouteOf(location.pathname);
    if (want === from.route) turn.steer(from.side);
    else if (want === to.route) turn.steer(to.side);
  }

  /** The badge now shows back page `route`: title and focus follow. */
  function shownBack(route: string, page: BackPage) {
    shown = route;
    document.title = page.title;
    page.face.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }

  async function showBack(route: string, page: BackPage) {
    if (shown === null) {
      const active = document.activeElement;
      returnFocus = active instanceof HTMLElement && front.contains(active) ? active : null;
    }
    faces.setBack(page.face);
    if ((await show('back', route)) === 'front') {
      faces.setBack(null);
      return;
    }
    shownBack(route, page);
    onSideChange('back');
  }

  /** Swaps the back page on the badge for `route`'s, in place. */
  async function swapBack(route: string, page: BackPage, swap: Swap) {
    await swap(page.face);
    shownBack(route, page);
  }

  async function showFront() {
    if ((await show('front', null)) === 'back') return;
    shown = null;
    faces.setBack(null);
    document.title = frontTitle;
    if (returnFocus?.isConnected && front.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
    onSideChange('front');
  }

  /** Swaps the back page in place with the presentation, if it can. */
  function swapper(): Swap | null {
    const p = presentation();
    return p.swapBack ? (content) => p.swapBack!(content) : null;
  }

  /** Turns or swaps the badge, one at a time, until it shows what the URL names. */
  async function reconcile() {
    for (;;) {
      const want = backRouteOf(location.pathname);
      if (want === shown) return;
      const swap = shown !== null ? swapper() : null;
      // Back to back goes by way of the front when it can't swap in place.
      if (want === null || (shown !== null && !swap)) {
        await showFront();
        continue;
      }
      const page = await loadBackPage(want);
      if (backRouteOf(location.pathname) !== want) continue; // the URL moved on meanwhile
      if (!page) return navigateInstead(want);
      if (swap) await swapBack(want, page, swap);
      else await showBack(want, page);
    }
  }

  /**
   * Loads back page `route` by normal navigation, in place of the current
   * history entry, which is the front's (one the flip pushed or took over)
   * and already shows `route`. Navigating to the URL an entry already shows
   * would leave the front's other entries pointing at the new document (Back
   * would show `/` with the back page on it), so the entry is pointed at the
   * front first.
   */
  function navigateInstead(route: string) {
    history.replaceState(null, '', FRONT_PATH);
    location.replace(route);
  }

  function settle(): Promise<void> {
    if (turning) steerTurn(turning);
    settling ??= reconcile()
      .catch(() => {
        // Anything unexpected: load the URL for real rather than leave the badge mid-turn.
        const route = backRouteOf(location.pathname);
        if (route) navigateInstead(route);
        else location.reload();
      })
      .finally(() => {
        settling = null;
      });
    return settling;
  }

  /**
   * Runs the synchronous start of a flip (resolve the route, move the URL,
   * steer a turn under way). Its callers are click handlers and the runtime's
   * flip listener, so a throw here (a bad URL, a refused pushState, an animation
   * that will not reverse) must not escape into them: the visitor gets
   * `fallbackUrl` by normal navigation instead. Failures after that point are
   * settle()'s to handle.
   */
  function guarded(fallbackUrl: string, start: () => Promise<void>): Promise<void> {
    try {
      return start();
    } catch {
      try {
        location.assign(fallbackUrl);
      } catch {
        /* not even a URL: nothing more to do */
      }
      return Promise.resolve();
    }
  }

  function flipTo(route: string, { push = true }: { push?: boolean } = {}): Promise<void> {
    return guarded(route, () => {
      const target = backRouteOf(new URL(route, location.href).pathname);
      if (target === null) return flipBack({ viaHistory: !push });
      const current = backRouteOf(location.pathname);
      if (push && current !== target) {
        if (current === null) {
          history.pushState({ side: 'back', route: target, from: 'front' } satisfies EntryState, '', target);
        } else {
          // Already on a back entry (a second flip before the first landed):
          // take it over, so the front stays right behind it in history.
          const { from } = entryState() ?? {};
          history.replaceState({ side: 'back', route: target, from } satisfies EntryState, '', target);
        }
      }
      return settle();
    });
  }

  function flipBack({ viaHistory = false }: { viaHistory?: boolean } = {}): Promise<void> {
    return guarded(FRONT_PATH, () => {
      if (!viaHistory && backRouteOf(location.pathname) !== null) {
        history.pushState({ side: 'front' } satisfies EntryState, '', FRONT_PATH);
      }
      return settle();
    });
  }

  const isPlainClick = (e: MouseEvent) =>
    !e.defaultPrevented && e.button === 0 && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey);

  /** Whether a back link clicked now can swap the page in place; if not, the browser follows it. */
  const swapsInPlace = () => shown !== null && swapper() !== null;

  badge.addEventListener('click', (e) => {
    if (!isPlainClick(e) || !(e.target instanceof Element)) return;
    const link = e.target.closest<HTMLAnchorElement>('a[data-flip], a[data-home]');
    if (!link || link.origin !== location.origin) return;
    if (link.hasAttribute('data-flip') && (front.contains(link) || (backSlot.contains(link) && swapsInPlace()))) {
      e.preventDefault();
      void flipTo(link.pathname);
    } else if (link.hasAttribute('data-home') && backSlot.contains(link)) {
      e.preventDefault();
      // A back entry pushed from the front has the front right behind it: step back to it.
      if (entryState()?.from === 'front') history.back();
      else void flipBack();
    }
  });

  window.addEventListener('popstate', () => void settle());
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) void settle();
  });

  return {
    flipTo,
    flipBack,
    side: () => (shown === null ? 'front' : 'back'),
  };
}
