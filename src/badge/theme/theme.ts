import type { SafeStorage } from '../storage';
import { BOARDS, DEFAULT_THEME, METALS, type BoardId, type Theme } from './palettes';

const THEME_KEY = 'badge-theme';
const UNLOCKED_KEY = 'badge-unlocked';

export interface ThemeController {
  get(): Theme;
  set(t: Theme): void;
  /** Back to the default colors; boards already unlocked stay unlocked. */
  reset(): void;
  unlock(id: BoardId): void;
  unlocked(): BoardId[];
}

function parseJson(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Never throws; unknown ids fall back per field, hidden boards need an unlock. */
export function parseTheme(raw: string | null, unlocked: readonly BoardId[]): Theme {
  const data = parseJson(raw);
  const obj = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {};
  const board = BOARDS.find(
    (b) => b.id === obj.board && (!b.hidden || unlocked.includes(b.id)),
  )?.id;
  const metal = METALS.find((m) => m.id === obj.metal)?.id;
  return { board: board ?? DEFAULT_THEME.board, metal: metal ?? DEFAULT_THEME.metal };
}

function parseUnlocked(raw: string | null): BoardId[] {
  const data = parseJson(raw);
  if (!Array.isArray(data)) return [];
  return BOARDS.filter((b) => b.hidden && data.includes(b.id)).map((b) => b.id);
}

export function createThemeController(root: HTMLElement, storage: SafeStorage): ThemeController {
  const unlocked = (): BoardId[] => parseUnlocked(storage.get(UNLOCKED_KEY));
  const read = (): Theme => parseTheme(storage.get(THEME_KEY), unlocked());

  function apply(theme: Theme): void {
    root.dataset.board = theme.board;
    root.dataset.metal = theme.metal;
  }

  apply(read());

  return {
    get: read,
    set(t) {
      const next = parseTheme(JSON.stringify(t), unlocked());
      storage.set(THEME_KEY, JSON.stringify(next));
      apply(next);
    },
    reset() {
      storage.remove(THEME_KEY);
      apply(DEFAULT_THEME);
    },
    unlock(id) {
      if (!BOARDS.some((b) => b.id === id && b.hidden)) return;
      const current = unlocked();
      if (current.includes(id)) return;
      storage.set(UNLOCKED_KEY, JSON.stringify([...current, id]));
    },
    unlocked,
  };
}
