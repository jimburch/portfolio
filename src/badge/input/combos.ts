import type { BadgeInput } from '../os/types';

export const COMBOS = {
  dev: ['left', 'left', 'a'],
  konami: ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'],
} as const;

export function createComboDetector(
  combos: Record<string, readonly BadgeInput[]>,
  onMatch: (name: string) => void,
): (input: BadgeInput) => boolean {
  const entries = Object.entries(combos);
  const size = Math.max(0, ...entries.map(([, seq]) => seq.length));
  let buffer: BadgeInput[] = [];

  return (input) => {
    buffer.push(input);
    if (buffer.length > size) buffer = buffer.slice(-size);
    let matched = false;
    for (const [name, seq] of entries) {
      if (seq.length > 0 && seq.length <= buffer.length && seq.every((s, i) => buffer[buffer.length - seq.length + i] === s)) {
        matched = true;
        onMatch(name);
      }
    }
    if (matched) buffer = [];
    return matched;
  };
}
