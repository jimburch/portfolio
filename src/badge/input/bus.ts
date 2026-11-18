import type { BadgeInput } from '../os/types';

export interface InputBus {
  emit(i: BadgeInput): void;
  subscribe(fn: (i: BadgeInput) => void): () => void;
}

export function createInputBus(): InputBus {
  const listeners = new Set<(i: BadgeInput) => void>();
  return {
    emit(i) {
      for (const fn of [...listeners]) fn(i);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => void listeners.delete(fn);
    },
  };
}
