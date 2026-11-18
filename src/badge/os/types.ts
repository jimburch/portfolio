export type BadgeInput = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start' | 'select';

import type { SafeStorage } from '../storage';
import type { ThemeController } from '../theme/theme';
import type { TiltSource } from '../tilt/tilt-source';

export type AppKind = 'screen' | 'flip';

export interface AppContext {
  screen: HTMLElement;
  tilt: TiltSource;
  theme: ThemeController;
  storage: SafeStorage;
  exit(): void;
  dispatch(e: OsEvent): void;
  /** Reads JSON from `<script type="application/json" id="data-{id}">`. */
  data<T>(id: string): T | null;
}

export interface BadgeApp {
  id: string;
  title: string;
  mount(ctx: AppContext): void | Promise<void>;
  unmount(): void;
  onInput?(input: BadgeInput): boolean;
}

export interface AppEntry {
  id: string;
  title: string;
  kind: AppKind;
  route?: string;
  hidden?: boolean;
  load?: () => Promise<{ default: BadgeApp }>;
}

export type OsMode = 'booting' | 'launcher' | 'app' | 'off';

export interface OsState {
  mode: OsMode;
  selected: number;
  appId: string | null;
  devMode: boolean;
  glitch: boolean;
}

export type OsEvent =
  | { type: 'BOOT_DONE' }
  | { type: 'INPUT'; input: BadgeInput }
  | { type: 'SELECT_INDEX'; index: number }
  | { type: 'EXIT_APP' }
  | { type: 'POWER_OFF' }
  | { type: 'RESET' }
  | { type: 'UNLOCK_DEV' }
  | { type: 'SET_GLITCH'; on: boolean };

export type OsEffect =
  | { type: 'flip'; route: string }
  | { type: 'mountApp'; id: string }
  | { type: 'unmountApp'; id: string }
  | { type: 'startBoot' };
