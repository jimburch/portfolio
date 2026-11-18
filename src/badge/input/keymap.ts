import type { BadgeInput } from '../os/types';

const KEYS: Record<string, BadgeInput> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Enter: 'a',
  z: 'a',
  Z: 'a',
  ' ': 'a',
  Escape: 'b',
  x: 'b',
  X: 'b',
  s: 'start',
  S: 'start',
};

const TEXT_TARGETS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const NATIVE_ACTIVATION_TARGETS = new Set(['BUTTON', 'A']);

export type KeyMods = { meta: boolean; ctrl: boolean; alt: boolean };

/** True when a key press must never be treated as badge input (shortcuts, text fields). */
export function isIgnoredKeyContext(targetTag: string | null, mods: KeyMods): boolean {
  return mods.meta || mods.ctrl || mods.alt || (!!targetTag && TEXT_TARGETS.has(targetTag));
}

export function keyToInput(
  key: string,
  targetTag: string | null,
  mods: KeyMods,
): BadgeInput | null {
  if (isIgnoredKeyContext(targetTag, mods)) return null;
  const input = KEYS[key] ?? null;
  if (input && (key === 'Enter' || key === ' ') && targetTag && NATIVE_ACTIVATION_TARGETS.has(targetTag)) {
    return null;
  }
  return input;
}
