import type { BadgeInput } from '../os/types';
import type { InputBus } from './bus';
import { haptic } from './haptics';
import { isIgnoredKeyContext, keyToInput } from './keymap';

const FLASH_MS = 120;
/** Every control on the front: the case keys, RESET, the RESUME pad and the LCD's rows. */
const FRONT_CONTROL = '.face-front button, .face-front a';

export function wireControls(
  root: HTMLElement,
  bus: InputBus,
  opts: { onFirstGesture: () => void; isActive: () => boolean },
): () => void {
  const ac = new AbortController();
  const { signal } = ac;
  const flashTimers = new Map<Element, number>();
  let gestured = false;

  const inputOf = (el: Element | null) => el?.closest<HTMLElement>('[data-input]') ?? null;

  // Only activation-triggering events (click, non-mouse pointerup, mapped keydown) call this.
  const gesture = (target: EventTarget | null) => {
    if (gestured) return;
    const el = target instanceof Element ? target : null;
    if (!el || el.closest('[data-no-permission]')) return;
    if (!el.closest('[data-input], [data-action], #lcd')) return;
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
      const btn = inputOf(e.target as Element);
      if (btn && e.pointerType === 'touch') {
        btn.setAttribute('data-pressed', '');
        held.add(btn);
      }
    },
    { signal },
  );
  root.addEventListener(
    'pointerup',
    (e) => {
      if (e.pointerType !== 'mouse') gesture(e.target);
      release();
    },
    { signal },
  );
  for (const type of ['pointercancel', 'pointerleave'] as const) {
    root.addEventListener(type, release, { signal, capture: type === 'pointerleave' });
  }

  // A pointer press on any front control ticks the haptic, from inside the
  // press's own handler as iOS needs. Capture phase, because the control's own
  // handler may take it off the screen. Keyboard activation and the apps' own
  // synthetic clicks (detail 0) get none.
  root.addEventListener(
    'click',
    (e) => {
      if (e.detail > 0 && e.target instanceof Element && e.target.closest(FRONT_CONTROL)) haptic();
    },
    { signal, capture: true },
  );

  root.addEventListener(
    'click',
    (e) => {
      const btn = inputOf(e.target as Element);
      gesture(e.target);
      if (!btn) return;
      bus.emit(btn.dataset.input as BadgeInput);
    },
    { signal },
  );

  // A key press lights the badge key it stands for, if the badge has one
  // (SELECT and START are keyboard-only).
  const emitKey = (input: BadgeInput) => {
    const key = root.querySelector<HTMLElement>(`[data-input="${input}"]`);
    if (key) flash(key);
    bus.emit(input);
  };

  // A lone Shift press-and-release is SELECT; Shift+Tab, Shift+letter never are.
  let shiftArmed = false;

  document.addEventListener(
    'keydown',
    (e) => {
      const target = e.target instanceof Element ? e.target : null;
      const mods = { meta: e.metaKey, ctrl: e.ctrlKey, alt: e.altKey };
      if (e.key === 'Shift') {
        if (!e.repeat) shiftArmed = !isIgnoredKeyContext(target?.tagName ?? null, mods);
        return;
      }
      shiftArmed = false;
      const input = keyToInput(e.key, target?.tagName ?? null, mods);
      if (!input || !opts.isActive()) return;
      gesture(target);
      e.preventDefault();
      if (e.repeat) return;
      emitKey(input);
    },
    { signal },
  );

  document.addEventListener(
    'keyup',
    (e) => {
      if (e.key !== 'Shift') return;
      const armed = shiftArmed;
      shiftArmed = false;
      const target = e.target instanceof Element ? e.target : null;
      const mods = { meta: e.metaKey, ctrl: e.ctrlKey, alt: e.altKey };
      if (armed && opts.isActive() && !isIgnoredKeyContext(target?.tagName ?? null, mods)) emitKey('select');
    },
    { signal },
  );
  const disarmShift = () => {
    shiftArmed = false;
  };
  window.addEventListener('blur', disarmShift, { signal });
  document.addEventListener('pointerdown', disarmShift, { signal, capture: true });

  return () => {
    ac.abort();
    for (const t of flashTimers.values()) window.clearTimeout(t);
    release();
  };
}
