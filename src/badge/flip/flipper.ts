/* The flip: turns #badge over between its front (JIM/OS) and a back page lifted
   out of that page's own static HTML, and keeps it in step with the URL.

   The URL is the source of truth. flipTo/flipBack only move the URL (when asked
   to) and then settle the badge to match it; popstate and bfcache restores just
   settle. Settling runs one turn at a time and re-reads the URL after every
   turn, so rapid input (a double tap, Back mid-flip) always ends on the side the
   URL names. A turn whose start the URL names again midway (Back mid-flip)
   turns back from where it is rather than finishing first. If a back page cannot be fetched, the visitor gets it by normal
   navigation instead, and the badge is never left half-turned. */

export type Side = 'front' | 'back';

export interface Flipper {
  flipTo(route: string, opts?: { push?: boolean }): Promise<void>;
  flipBack(opts?: { viaHistory?: boolean }): Promise<void>;
  side(): Side;
}

const TURN_MS = 600;
const TURN_EASING = 'cubic-bezier(.2,.7,.2,1)';
const PERSPECTIVE_PX = 1400;
const FADE_MS = 150;
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

/** The on-screen part of the badge: its size and where its top sits. */
interface Box {
  width: number;
  height: number;
  marginTop: number;
}

/** A turn under way: the routes at its two ends (null is the front). */
interface Turn {
  fromRoute: string | null;
  toRoute: string | null;
  animations: Animation[];
  /** Heading back to where it started. */
  reversed: boolean;
}

function frame(box: Box, deg: number): Keyframe {
  return {
    transform: `perspective(${PERSPECTIVE_PX}px) rotateY(${deg}deg)`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    marginTop: `${box.marginTop}px`,
  };
}

const SWAP_OUT: Keyframe[] = [{ opacity: 1 }, { opacity: 1, offset: 0.5 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }];
const SWAP_IN: Keyframe[] = [{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1, offset: 0.5 }, { opacity: 1 }];

export function createFlipper(opts: {
  badge: HTMLElement;
  backSlot: HTMLElement;
  reducedMotion: boolean;
  onSideChange: (side: Side) => void;
}): Flipper {
  const { badge, backSlot, reducedMotion, onSideChange } = opts;
  const front = badge.querySelector<HTMLElement>(':scope > .face-front')!;
  const frontTitle = document.title;

  /** The back route on the badge, or null while the front is showing. */
  let shown: string | null = null;
  let settling: Promise<void> | null = null;
  /** The turn under way, if any. */
  let turning: Turn | null = null;

  /** Lays the badge out as a settled side: the front, or the back as a page. */
  function layOut(side: Side) {
    badge.dataset.side = side;
    front.hidden = side === 'back';
    backSlot.hidden = side === 'front';
    if (side === 'back') backSlot.removeAttribute('aria-hidden');
    else backSlot.setAttribute('aria-hidden', 'true');
  }

  /** Measures the on-screen badge box for the side it is laid out as. */
  function visibleBox(): Box {
    const badgeRect = badge.getBoundingClientRect();
    const face = badge.dataset.side === 'back' ? backSlot.firstElementChild : null;
    const rect = face ? face.getBoundingClientRect() : badgeRect;
    return {
      width: rect.width,
      height: Math.min(rect.height, window.innerHeight - rect.top),
      marginTop: parseFloat(getComputedStyle(badge).marginTop) + rect.top - badgeRect.top,
    };
  }

  /**
   * 3D turn: both faces back to back while the badge grows or shrinks between
   * sides. Resolves with the side it ended on: `to`, or the side it left if it
   * was turned back midway.
   */
  async function turn(to: Side, toRoute: string | null): Promise<Side> {
    // Measure both ends (FLIP), then turn from one to the other.
    const origin: Side = to === 'back' ? 'front' : 'back';
    const from = visibleBox();
    layOut(to);
    const target = visibleBox();
    layOut(origin);

    badge.dataset.flipping = 'turn';
    front.hidden = false;
    backSlot.hidden = false;
    const [fromDeg, toDeg] = to === 'back' ? [0, 180] : [180, 0];
    const [leaving, arriving] = to === 'back' ? [front, backSlot] : [backSlot, front];
    // 'both' so a turn reversed back to its start still holds its first frame.
    const timing: KeyframeAnimationOptions = { duration: TURN_MS, easing: TURN_EASING, fill: 'both' };
    const run: Turn = {
      fromRoute: shown,
      toRoute,
      reversed: false,
      animations: [
        badge.animate([frame(from, fromDeg), frame(target, toDeg)], timing),
        // Swap faces exactly edge-on (offsets are in eased progress, like the
        // rotation), so the turn never relies on backface-visibility alone.
        leaving.animate(SWAP_OUT, timing),
        arriving.animate(SWAP_IN, timing),
      ],
    };
    turning = run;
    await Promise.all(run.animations.map((a) => a.finished)).catch(() => {});
    turning = null;

    const landed = run.reversed ? origin : to;
    delete badge.dataset.flipping;
    layOut(landed);
    for (const a of run.animations) a.cancel();
    return landed;
  }

  /** Mid-turn, heads the turn for whichever end the URL now names, if either. */
  function steerTurn(run: Turn) {
    const want = backRouteOf(location.pathname);
    const headBack = want === run.fromRoute ? true : want === run.toRoute ? false : run.reversed;
    if (headBack === run.reversed) return;
    run.reversed = headBack;
    for (const a of run.animations) a.reverse();
  }

  /** Reduced motion: a quick fade through the swap instead of the turn. */
  async function fade(to: Side): Promise<Side> {
    badge.dataset.flipping = 'fade';
    const out = badge.animate({ opacity: [1, 0] }, { duration: FADE_MS / 2, fill: 'forwards' });
    await out.finished.catch(() => {});
    layOut(to);
    out.cancel();
    await badge
      .animate({ opacity: [0, 1] }, { duration: FADE_MS / 2 })
      .finished.catch(() => {});
    delete badge.dataset.flipping;
    return to;
  }

  async function show(to: Side, route: string | null): Promise<Side> {
    window.scrollTo(0, 0);
    const landed =
      reducedMotion || typeof badge.animate !== 'function' ? await fade(to) : await turn(to, route);
    window.scrollTo(0, 0);
    return landed;
  }

  async function showBack(route: string, page: BackPage) {
    backSlot.replaceChildren(page.face);
    if ((await show('back', route)) === 'front') {
      backSlot.replaceChildren();
      return;
    }
    shown = route;
    document.title = page.title;
    page.face.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    onSideChange('back');
  }

  async function showFront() {
    if ((await show('front', null)) === 'back') return;
    shown = null;
    backSlot.replaceChildren();
    document.title = frontTitle;
    onSideChange('front');
  }

  /** Turns the badge, one turn at a time, until it shows what the URL names. */
  async function reconcile() {
    for (;;) {
      const want = backRouteOf(location.pathname);
      if (want === shown) return;
      // Back to back goes by way of the front.
      if (want === null || shown !== null) {
        await showFront();
        continue;
      }
      const page = await loadBackPage(want);
      if (backRouteOf(location.pathname) !== want) continue; // the URL moved on meanwhile
      if (!page) return navigateInstead(want);
      await showBack(want, page);
    }
  }

  /**
   * Loads back page `route` by normal navigation, in place of the current
   * history entry, which is the front's and already shows `route`. Navigating
   * to the URL an entry already shows would leave the front's other entries
   * pointing at the new document (Back would show `/` with the back page on
   * it), so the entry is pointed at the front first.
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

  function flipTo(route: string, { push = true }: { push?: boolean } = {}): Promise<void> {
    const target = backRouteOf(new URL(route, location.href).pathname);
    if (target === null) return flipBack({ viaHistory: !push });
    if (push && backRouteOf(location.pathname) !== target) {
      history.pushState({ side: 'back', route: target }, '', target);
    }
    return settle();
  }

  function flipBack({ viaHistory = false }: { viaHistory?: boolean } = {}): Promise<void> {
    if (!viaHistory && backRouteOf(location.pathname) !== null) {
      history.pushState({ side: 'front' }, '', FRONT_PATH);
    }
    return settle();
  }

  const isPlainClick = (e: MouseEvent) =>
    !e.defaultPrevented && e.button === 0 && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey);

  badge.addEventListener('click', (e) => {
    if (!isPlainClick(e) || !(e.target instanceof Element)) return;
    const link = e.target.closest<HTMLAnchorElement>('a[data-flip], a[data-home]');
    if (!link || link.origin !== location.origin) return;
    if (link.hasAttribute('data-flip') && front.contains(link)) {
      e.preventDefault();
      void flipTo(link.pathname);
    } else if (link.hasAttribute('data-home') && backSlot.contains(link)) {
      e.preventDefault();
      // A back we pushed has the front right behind it in history: step back to it.
      if ((history.state as { side?: string } | null)?.side === 'back') history.back();
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
