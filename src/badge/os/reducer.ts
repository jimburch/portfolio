import type { AppEntry, OsEffect, OsEvent, OsState } from './types';

type Result = { state: OsState; effects: OsEffect[] };

export function initialState(opts: { skipBoot: boolean }): OsState {
  return {
    mode: opts.skipBoot ? 'launcher' : 'booting',
    selected: 0,
    appId: null,
    devMode: false,
    glitch: false,
  };
}

export function visibleApps(apps: readonly AppEntry[], devMode: boolean): AppEntry[] {
  return apps.filter((a) => devMode || !a.hidden);
}

const none = (state: OsState): Result => ({ state, effects: [] });

function clampSelected(state: OsState, apps: readonly AppEntry[]): OsState {
  const max = Math.max(visibleApps(apps, state.devMode).length - 1, 0);
  const selected = Math.min(Math.max(state.selected, 0), max);
  return selected === state.selected ? state : { ...state, selected };
}

/** Activates entry `index` of the visible list: flip entries emit `flip`, screen entries open. */
function activate(state: OsState, index: number, apps: readonly AppEntry[]): Result {
  const entry = visibleApps(apps, state.devMode)[index];
  if (!entry) return none(state);
  const selected = { ...state, selected: index };
  if (entry.kind === 'flip') {
    return entry.route
      ? { state: selected, effects: [{ type: 'flip', route: entry.route }] }
      : none(selected);
  }
  return {
    state: { ...selected, mode: 'app', appId: entry.id },
    effects: [{ type: 'mountApp', id: entry.id }],
  };
}

function closeApp(state: OsState): Result {
  if (state.mode !== 'app' || state.appId === null) return none(state);
  return {
    state: { ...state, mode: 'launcher', appId: null },
    effects: [{ type: 'unmountApp', id: state.appId }],
  };
}

function leaveApp(state: OsState): OsEffect[] {
  return state.mode === 'app' && state.appId !== null
    ? [{ type: 'unmountApp', id: state.appId }]
    : [];
}

function reduceInput(state: OsState, input: string, apps: readonly AppEntry[]): Result {
  switch (state.mode) {
    case 'booting':
      return none({ ...state, mode: 'launcher' });
    case 'launcher': {
      const count = visibleApps(apps, state.devMode).length;
      if (count === 0) return none(state);
      if (input === 'up') return none({ ...state, selected: (state.selected - 1 + count) % count });
      if (input === 'down') return none({ ...state, selected: (state.selected + 1) % count });
      if (input === 'a') return activate(state, state.selected, apps);
      return none(state);
    }
    case 'app':
      return input === 'b' ? closeApp(state) : none(state);
    case 'off':
      return none(state);
  }
}

export function reduce(state: OsState, event: OsEvent, apps: readonly AppEntry[]): Result {
  switch (event.type) {
    case 'BOOT_DONE':
      return state.mode === 'booting' ? none({ ...state, mode: 'launcher' }) : none(state);
    case 'INPUT':
      return reduceInput(state, event.input, apps);
    case 'SELECT_INDEX':
      return state.mode === 'launcher' ? activate(state, event.index, apps) : none(state);
    case 'EXIT_APP':
      return closeApp(state);
    case 'POWER_OFF':
      return state.mode === 'off'
        ? none(state)
        : { state: { ...state, mode: 'off', appId: null }, effects: leaveApp(state) };
    case 'RESET':
      return {
        state: { ...state, mode: 'booting', appId: null, selected: 0, glitch: false },
        effects: [...leaveApp(state), { type: 'startBoot' }],
      };
    case 'UNLOCK_DEV':
      return none(clampSelected({ ...state, devMode: true }, apps));
    case 'SET_GLITCH':
      return none({ ...state, glitch: event.on });
  }
}
