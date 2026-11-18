import type { BadgeInput } from '../os/types';
import type { InputBus } from './bus';
import { keyToInput } from './keymap';

const FLASH_MS = 120;

export function wireControls(
  root: HTMLElement,
  bus: InputBus,
  opts: { onFirstGesture: () => void; isActive: () => boolean },
): () => void {
  const ac = new AbortController();
  const { signal } = ac;
  const flashTimers = new Map<Element, number>();
  let gestured = false;

  const vibrate = () => {
    try {
      navigator.vibrate?.(8);
    } catch {
      /* haptics are optional */
    }
  };

  const inputOf = (el: Element | null) => el?.closest<HTMLElement>('[data-input]') ?? null;

  const gesture = (target: EventTarget | null) => {
    if (gestured) return;
    const el = target instanceof Element ? target : null;
    if (!el || el.closest('[data-no-permission]')) return;
    gestured = true;
    opts.onFirstGesture();
  };

  const flash = (el: Element) => {
    window.clearTimeout(flashTimers.get(el));
    el.setAttribute('data-pressed', '');
    flashTimers.set(
      el,
      window.setTimeout(() => {
        el.removeAttribute('data-pressed');
        flashTimers.delete(el);
      }, FLASH_MS),
    );
  };

  // Touch press visuals: iOS Safari does not apply :active without a touch listener.
  const held = new Set<Element>();
  const release = () => {
    for (const el of held) el.removeAttribute('data-pressed');
    held.clear();
  };
  root.addEventListener(
    'pointerdown',
    (e) => {
      gesture(e.target);
      const btn = inputOf(e.target as Element);
      if (btn && e.pointerType === 'touch') {
        btn.setAttribute('data-pressed', '');
        held.add(btn);
      }
    },
    { signal },
  );
  for (const type of ['pointerup', 'pointercancel', 'pointerleave'] as const) {
    root.addEventListener(type, release, { signal, capture: type === 'pointerleave' });
  }

  root.addEventListener(
    'click',
    (e) => {
      const btn = inputOf(e.target as Element);
      if (!btn) return;
      vibrate();
      bus.emit(btn.dataset.input as BadgeInput);
    },
    { signal },
  );

  document.addEventListener(
    'keydown',
    (e) => {
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest('#lcd, [data-input]')) gesture(target);
      const input = keyToInput(e.key, target?.tagName ?? null, {
        meta: e.metaKey,
        ctrl: e.ctrlKey,
        alt: e.altKey,
      });
      if (!input || !opts.isActive()) return;
      e.preventDefault();
      if (e.repeat) return;
      const board = root.querySelector<HTMLElement>(`[data-input="${input}"]:not([data-case])`);
      if (board) flash(board);
      vibrate();
      bus.emit(input);
    },
    { signal },
  );

  return () => {
    ac.abort();
    for (const t of flashTimers.values()) window.clearTimeout(t);
    release();
  };
}
