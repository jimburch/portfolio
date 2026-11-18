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

export function keyToInput(
  key: string,
  targetTag: string | null,
  mods: { meta: boolean; ctrl: boolean; alt: boolean },
): BadgeInput | null {
  if (mods.meta || mods.ctrl || mods.alt) return null;
  if (targetTag && TEXT_TARGETS.has(targetTag)) return null;
  const input = KEYS[key] ?? null;
  if (input && (key === 'Enter' || key === ' ') && targetTag && NATIVE_ACTIVATION_TARGETS.has(targetTag)) {
    return null;
  }
  return input;
}
