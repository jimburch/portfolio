/* JIM/OS runtime: holds the OS state, feeds events through the pure reducer,
   runs the effects it asks for (boot, mount/unmount apps, flip), reflects the
   state on the screen and on #badge, and announces what changed. */

import type { InputBus } from '../input/bus';
import type { SafeStorage } from '../storage';
import { OFF_ANNOUNCEMENT, describeChange } from './announcements';
import { initialState, reduce, visibleApps } from './reducer';
import { BOOT_LINES, clearScreen, renderBoot, renderLauncher, renderMessage, renderOffHint, type Lcd } from './screen';
import type { AppContext, AppEntry, BadgeApp, OsEffect, OsEvent, OsState } from './types';

export interface Runtime {
  dispatch(e: OsEvent): void;
  state(): OsState;
  onFlip(fn: (route: string) => void): void;
  /** Runs `fn` once, when the OS first leaves its boot (at once if it skipped it). */
  onReady(fn: () => void): void;
}

const BOOTED_KEY = 'booted';
const FLIP_LOADING_MS = 300;
const OFF_HINT = 'press RESET';

/** Stand-in for apps that have nothing on screen yet, or failed to load. */
function messageApp(entry: AppEntry, message: string): BadgeApp {
  return {
    id: entry.id,
    title: entry.title,
    mount: (ctx) => renderMessage(ctx.screen, [entry.title, message, 'B: back']),
    unmount: () => {},
  };
}

async function loadApp(entry: AppEntry): Promise<BadgeApp> {
  if (!entry.load) return messageApp(entry, 'COMING SOON');
  try {
    return (await entry.load()).default;
  } catch {
    return messageApp(entry, 'LOAD FAILED');
  }
}

export function createRuntime(opts: {
  lcd: Lcd;
  apps: readonly AppEntry[];
  bus: InputBus;
  ctxBase: Omit<AppContext, 'screen' | 'announce' | 'exit' | 'dispatch'>;
  reducedMotion: boolean;
  session: SafeStorage;
}): Runtime {
  const { lcd, apps, bus, ctxBase, reducedMotion, session } = opts;
  const screen = lcd.view;
  const badge = screen.closest<HTMLElement>('#badge');
  const flipListeners = new Set<(route: string) => void>();
  const readyListeners = new Set<() => void>();
  let ready = false;

  let state = initialState({ skipBoot: session.get(BOOTED_KEY) !== null });
  let mounted: BadgeApp | null = null;
  /** Bumped on every mount/unmount so a slow `load()` cannot mount a stale app. */
  let mountSeq = 0;
  let boot: AbortController | null = null;
  let pendingFlip = 0;
  /** True once this power-off has shown its `press RESET` hint. */
  let offHinted = false;

  function reflect() {
    if (!badge) return;
    badge.dataset.mode = state.mode;
    badge.dataset.glitch = state.glitch ? 'on' : 'off';
  }

  function render() {
    if (state.mode === 'launcher' && !pendingFlip) {
      renderLauncher(screen, visibleApps(apps, state.devMode), state.selected, (index) =>
        dispatch({ type: 'SELECT_INDEX', index }),
      );
    } else if (state.mode === 'off') {
      clearScreen(screen);
    }
  }

  function startBoot() {
    boot?.abort();
    const controller = new AbortController();
    boot = controller;
    void renderBoot(screen, BOOT_LINES, { reducedMotion, signal: controller.signal }).then(() => {
      if (!controller.signal.aborted) dispatch({ type: 'BOOT_DONE' });
    });
  }

  async function mountApp(id: string) {
    const seq = ++mountSeq;
    const entry = apps.find((a) => a.id === id);
    if (!entry) return;
    clearScreen(screen);
    const app = await loadApp(entry);
    if (seq !== mountSeq || state.appId !== id) return;
    mounted = app;
    const ctx: AppContext = {
      ...ctxBase,
      screen,
      announce: lcd.announce,
      exit: () => {
        if (mounted === app) dispatch({ type: 'EXIT_APP' });
      },
      dispatch,
    };
    try {
      await app.mount(ctx);
    } catch {
      if (mounted === app) renderMessage(screen, [entry.title, 'APP CRASHED', 'B: back']);
    }
  }

  function unmountApp() {
    mountSeq++;
    const app = mounted;
    mounted = null;
    app?.unmount();
  }

  function flip(route: string) {
    if (pendingFlip) return;
    renderMessage(screen, ['loading…']);
    pendingFlip = window.setTimeout(
      () => {
        pendingFlip = 0;
        try {
          for (const fn of flipListeners) fn(route);
        } finally {
          render();
        }
      },
      reducedMotion ? 0 : FLIP_LOADING_MS,
    );
  }

  function cancelFlip() {
    window.clearTimeout(pendingFlip);
    pendingFlip = 0;
  }

  function run(effect: OsEffect) {
    switch (effect.type) {
      case 'startBoot':
        return startBoot();
      case 'mountApp':
        return void mountApp(effect.id);
      case 'unmountApp':
        return unmountApp();
      case 'flip':
        return flip(effect.route);
    }
  }

  function dispatch(event: OsEvent) {
    const prev = state;
    const result = reduce(state, event, apps);
    state = result.state;

    if (prev.mode === 'booting' && state.mode !== 'booting') {
      boot?.abort();
      boot = null;
      session.set(BOOTED_KEY, '1');
    }
    if (state.mode !== 'launcher') cancelFlip();
    if (state.mode !== 'off') offHinted = false;

    reflect();
    for (const effect of result.effects) run(effect);
    render();
    announce(prev);
    if (!ready && state.mode !== 'booting') markReady();
  }

  function announce(prev: OsState) {
    const text = describeChange(prev, state, apps, {
      // renderLauncher moves focus onto the selection if it was in the LCD.
      selectionHasFocus: screen.contains(document.activeElement),
    });
    if (text) lcd.announce(text);
  }

  function markReady() {
    ready = true;
    for (const fn of readyListeners) fn();
    readyListeners.clear();
  }

  bus.subscribe((input) => {
    if (state.mode === 'off') {
      // The reducer ignores input while off; the first press just says why.
      if (!offHinted) {
        offHinted = true;
        renderOffHint(screen, OFF_HINT);
        lcd.announce(OFF_ANNOUNCEMENT);
      }
      return;
    }
    if (state.mode === 'app' && mounted?.onInput?.(input)) return;
    dispatch({ type: 'INPUT', input });
  });

  // A tap on the screen also skips the boot.
  screen.addEventListener('click', () => {
    if (state.mode === 'booting') dispatch({ type: 'BOOT_DONE' });
  });

  reflect();
  if (state.mode === 'booting') startBoot();
  else ready = true;
  render();

  return {
    dispatch,
    state: () => state,
    onFlip(fn) {
      flipListeners.add(fn);
    },
    onReady(fn) {
      if (ready) fn();
      else readyListeners.add(fn);
    },
  };
}
