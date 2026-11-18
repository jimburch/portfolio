/* What JIM/OS draws on the LCD: the boot log, the launcher, one-line messages
   and toasts, plus the LCD's status line for assistive tech. Everything is DOM
   text so assistive tech can read it. This module only renders; the runtime
   decides when. */

import type { AppEntry } from './types';

/** The boot readout, one line at a time. */
export const BOOT_LINES: readonly string[] = [
  'JIM/OS v0.1',
  'checking solder joints… ok',
  'warming up the LCD… ok',
  'loading coffee.sys… ok',
  'mounting portfolio… ok',
  'ready.',
];

/** Gap between boot lines, then a beat on the last one: 5 × 260 + 500 = 1800 ms. */
const BOOT_LINE_MS = 260;
const BOOT_HOLD_MS = 500;
const TOAST_MS = 1500;
const ANNOUNCE_GAP_MS = 50;

export const LAUNCHER_ROWS = 4;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Replaces what `screen` shows. If focus was inside it, focus stays in the LCD
 * (parked on `screen`, which the LCD makes programmatically focusable) instead
 * of falling back to the page.
 */
function show(screen: HTMLElement, ...nodes: Node[]): void {
  const hadFocus = screen.contains(document.activeElement);
  screen.replaceChildren(...nodes);
  if (hadFocus && !screen.contains(document.activeElement)) screen.focus({ preventScroll: true });
}

export interface Lcd {
  /** Where the OS and its apps render. */
  view: HTMLElement;
  /** Shows a one-line message over the view for ~1.5 s without disturbing it (and announces it). */
  toast(text: string): void;
  /**
   * Tells assistive tech `text` through the LCD's one polite status line, which
   * draws nothing. The view itself is not a live region: only what is passed
   * here is announced.
   */
  announce(text: string): void;
}

/** Takes over the LCD host (replacing the no-JS menu) with a view, a toast layer and a status line. */
export function createLcd(host: HTMLElement): Lcd {
  const view = el('div', 'lcd-view');
  view.tabIndex = -1;
  const toastEl = el('p', 'lcd-toast');
  toastEl.hidden = true;
  const status = el('p', 'lcd-status');
  status.setAttribute('role', 'status');
  host.replaceChildren(view, toastEl, status);

  let toastTimer = 0;
  let announceTimer = 0;

  function announce(text: string): void {
    // Clear first and write a beat later, so the same text twice is still a change.
    window.clearTimeout(announceTimer);
    status.textContent = '';
    announceTimer = window.setTimeout(() => {
      status.textContent = text;
    }, ANNOUNCE_GAP_MS);
  }

  return {
    view,
    announce,
    toast(text) {
      window.clearTimeout(toastTimer);
      toastEl.textContent = text;
      toastEl.hidden = false;
      announce(text);
      toastTimer = window.setTimeout(() => {
        toastEl.hidden = true;
        toastEl.textContent = '';
      }, TOAST_MS);
    },
  };
}

/**
 * Prints the boot log. Resolves when the last line has had its beat, at once
 * under reduced motion, or as soon as `signal` aborts (the caller checks it).
 */
export function renderBoot(
  screen: HTMLElement,
  lines: readonly string[],
  opts: { reducedMotion: boolean; signal: AbortSignal },
): Promise<void> {
  const log = el('div', 'lcd-boot');
  const print = (line: string) => log.append(el('p', 'lcd-line', line));
  show(screen, log);

  if (opts.reducedMotion) {
    lines.forEach(print);
    return Promise.resolve();
  }

  const { signal } = opts;
  return new Promise((resolve) => {
    let next = 0;
    let timer = 0;
    const finish = () => {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const step = () => {
      if (next >= lines.length) return finish();
      print(lines[next++]!);
      timer = window.setTimeout(step, next < lines.length ? BOOT_LINE_MS : BOOT_HOLD_MS);
    };
    if (signal.aborted) return finish();
    signal.addEventListener('abort', finish);
    step();
  });
}

/** Shows a short, centered message (e.g. `loading…`, `COMING SOON`). */
export function renderMessage(screen: HTMLElement, lines: readonly string[]): void {
  const box = el('div', 'lcd-message');
  for (const line of lines) box.append(el('p', 'lcd-line', line));
  show(screen, box);
}

/** Blanks the screen (before an app mounts, or when powered off). */
export function clearScreen(screen: HTMLElement): void {
  show(screen);
}

/**
 * First visible row of a `rows`-tall window over `count` items: the previous
 * window if it still shows `selected`, otherwise the nearest one that does.
 */
export function launcherWindow(count: number, selected: number, prevStart: number, rows: number): number {
  const maxStart = Math.max(count - rows, 0);
  let start = Math.min(Math.max(prevStart, 0), maxStart);
  if (selected < start) start = selected;
  else if (selected >= start + rows) start = selected - rows + 1;
  return Math.min(Math.max(start, 0), maxStart);
}

/** The pick handler for each rendered menu; kept current across in-place updates. */
const pickers = new WeakMap<HTMLElement, (index: number) => void>();

/** Every entry as a `<button>` in one list; CSS shows a `LAUNCHER_ROWS`-tall window of it. */
function buildMenu(entries: readonly AppEntry[], key: string): HTMLElement {
  const menu = el('div', 'lcd-launcher');
  menu.dataset.entries = key;

  const list = el('ul', 'lcd-menu');
  entries.forEach((entry, index) => {
    const button = el('button', 'lcd-item');
    button.type = 'button';
    button.dataset.index = String(index);
    const marker = el('span', 'lcd-marker', '▶');
    marker.setAttribute('aria-hidden', 'true');
    button.append(marker, el('span', 'lcd-title', entry.title));
    const li = document.createElement('li');
    li.append(button);
    list.append(li);
  });

  // Visual only: assistive tech has the whole list.
  const more = (dir: 'up' | 'down') => {
    const m = el('span', `lcd-more lcd-more-${dir}`);
    m.setAttribute('aria-hidden', 'true');
    return m;
  };

  menu.append(list, more('up'), more('down'));
  menu.addEventListener('click', (e) => {
    const button = (e.target as Element).closest<HTMLElement>('button[data-index]');
    if (button) pickers.get(menu)?.(Number(button.dataset.index));
  });
  return menu;
}

/**
 * Draws the launcher: every entry is a `<button>` (so assistive tech can reach
 * them all), the selected one marked `aria-current` with a `▶` and the only one
 * in the tab order. The LCD shows four rows of the list at a time, scrolled
 * inside the screen to keep the selection in view, with `▲`/`▼` when more
 * entries are out of view. Updates in place unless the entries change. Focus
 * moves only if it was already in the LCD.
 */
export function renderLauncher(
  screen: HTMLElement,
  entries: readonly AppEntry[],
  selected: number,
  onPick: (index: number) => void,
): void {
  const hadFocus = screen.contains(document.activeElement);
  const current = screen.querySelector<HTMLElement>(':scope > .lcd-launcher');
  const start = launcherWindow(entries.length, selected, Number(current?.dataset.start ?? 0), LAUNCHER_ROWS);
  const key = entries.map((e) => e.id).join(',');

  let menu = current;
  if (!menu || menu.dataset.entries !== key) {
    menu = buildMenu(entries, key);
    screen.replaceChildren(menu);
  }
  pickers.set(menu, onPick);

  menu.dataset.start = String(start);
  menu.style.setProperty('--start', String(start));
  menu.querySelector('.lcd-more-up')!.textContent = start > 0 ? '▲' : '';
  menu.querySelector('.lcd-more-down')!.textContent = start + LAUNCHER_ROWS < entries.length ? '▼' : '';

  let selectedButton: HTMLElement | null = null;
  for (const button of menu.querySelectorAll<HTMLElement>('button[data-index]')) {
    const isSelected = Number(button.dataset.index) === selected;
    if (isSelected) {
      button.setAttribute('aria-current', 'true');
      selectedButton = button;
    } else {
      button.removeAttribute('aria-current');
    }
    button.tabIndex = isSelected ? 0 : -1;
  }

  if (hadFocus && selectedButton && document.activeElement !== selectedButton) {
    selectedButton.focus({ preventScroll: true });
  }
}

/** The one dim line a powered-off LCD shows when someone presses something. */
export function renderOffHint(screen: HTMLElement, text: string): void {
  show(screen, el('p', 'lcd-off-hint', text));
}
