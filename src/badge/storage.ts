export interface SafeStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/**
 * Wraps a Storage so it never throws. If the backing store is missing or any
 * call on it fails (Safari private mode, blocked site data), it switches to an
 * in-memory Map for the rest of the session.
 */
export function createSafeStorage(getBacking: () => Storage | undefined): SafeStorage {
  const memory = new Map<string, string>();
  let failed = false;

  function attempt<T>(use: (backing: Storage) => T): T | undefined {
    if (failed) return undefined;
    try {
      const backing = getBacking();
      if (backing) return use(backing);
    } catch {
      // fall through to memory
    }
    failed = true;
    return undefined;
  }

  return {
    get(key) {
      const value = attempt((b) => b.getItem(key));
      if (!failed) return value ?? null;
      return memory.get(key) ?? null;
    },
    set(key, value) {
      attempt((b) => b.setItem(key, value));
      if (failed) memory.set(key, value);
    },
    remove(key) {
      attempt((b) => b.removeItem(key));
      if (failed) memory.delete(key);
    },
  };
}

export function safeStorage(kind: 'local' | 'session'): SafeStorage {
  return createSafeStorage(() =>
    typeof window === 'undefined'
      ? undefined
      : kind === 'local'
        ? window.localStorage
        : window.sessionStorage,
  );
}
