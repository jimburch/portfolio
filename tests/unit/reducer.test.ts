import { expect, test } from 'vitest';
import { initialState, reduce, visibleApps } from '../../src/badge/os/reducer';
import { APPS } from '../../src/badge/os/registry';
import type { AppEntry } from '../../src/badge/os/types';

const apps: AppEntry[] = [
  { id: 'now', title: 'NOW', kind: 'screen' },
  { id: 'resume', title: 'RESUME', kind: 'flip', route: '/resume' },
  { id: 'sensors', title: 'SENSORS', kind: 'screen', hidden: true },
];
const L = { ...initialState({ skipBoot: true }) };
test('boot skips on any input', () => expect(reduce(initialState({ skipBoot: false }), { type: 'INPUT', input: 'b' }, apps).state.mode).toBe('launcher'));
test('BOOT_DONE leaves booting', () => expect(reduce(initialState({ skipBoot: false }), { type: 'BOOT_DONE' }, apps).state.mode).toBe('launcher'));
test('down wraps over visible apps only', () => {
  let s = reduce(L, { type: 'INPUT', input: 'down' }, apps).state;
  s = reduce(s, { type: 'INPUT', input: 'down' }, apps).state;
  expect(s.selected).toBe(0);
});
test('up wraps to the last visible app', () => {
  expect(reduce(L, { type: 'INPUT', input: 'up' }, apps).state.selected).toBe(1);
});
test('dev mode reveals hidden apps', () => {
  const s = reduce(L, { type: 'UNLOCK_DEV' }, apps).state;
  expect(visibleApps(apps, s.devMode).map(a => a.id)).toEqual(['now', 'resume', 'sensors']);
});
test('A on a flip entry emits flip', () => {
  const r = reduce({ ...L, selected: 1 }, { type: 'INPUT', input: 'a' }, apps);
  expect(r.effects).toEqual([{ type: 'flip', route: '/resume' }]);
  expect(r.state.mode).toBe('launcher');
});
test('SELECT_INDEX on a flip entry flips and selects; on a screen entry opens', () => {
  const f = reduce(L, { type: 'SELECT_INDEX', index: 1 }, apps);
  expect(f.effects).toEqual([{ type: 'flip', route: '/resume' }]);
  expect(f.state).toMatchObject({ mode: 'launcher', selected: 1 });
  const o = reduce(L, { type: 'SELECT_INDEX', index: 0 }, apps);
  expect(o.state).toMatchObject({ mode: 'app', appId: 'now' });
});
test('A on a screen entry opens it; B closes it', () => {
  const open = reduce(L, { type: 'INPUT', input: 'a' }, apps);
  expect(open.state).toMatchObject({ mode: 'app', appId: 'now' });
  expect(open.effects).toEqual([{ type: 'mountApp', id: 'now' }]);
  const close = reduce(open.state, { type: 'INPUT', input: 'b' }, apps);
  expect(close.state.mode).toBe('launcher');
  expect(close.effects).toEqual([{ type: 'unmountApp', id: 'now' }]);
});
test('EXIT_APP closes the app', () => {
  const open = reduce(L, { type: 'INPUT', input: 'a' }, apps).state;
  expect(reduce(open, { type: 'EXIT_APP' }, apps).effects).toEqual([{ type: 'unmountApp', id: 'now' }]);
});
test('off ignores input; reset reboots and clears glitch', () => {
  const off = reduce({ ...L, glitch: true }, { type: 'POWER_OFF' }, apps).state;
  expect(reduce(off, { type: 'INPUT', input: 'a' }, apps).state).toEqual(off);
  const r = reduce(off, { type: 'RESET' }, apps);
  expect(r.state).toMatchObject({ mode: 'booting', glitch: false });
  expect(r.effects).toEqual([{ type: 'startBoot' }]);
});
test('POWER_OFF inside an app unmounts it', () => {
  const inApp = reduce(L, { type: 'INPUT', input: 'a' }, apps).state;
  expect(reduce(inApp, { type: 'POWER_OFF' }, apps).effects).toEqual([{ type: 'unmountApp', id: 'now' }]);
});
test('reset from inside an app unmounts it first', () => {
  const inApp = reduce(L, { type: 'INPUT', input: 'a' }, apps).state;
  expect(reduce(inApp, { type: 'RESET' }, apps).effects).toEqual([{ type: 'unmountApp', id: 'now' }, { type: 'startBoot' }]);
});
test('SET_GLITCH sets glitch', () => {
  expect(reduce(L, { type: 'SET_GLITCH', on: true }, apps).state.glitch).toBe(true);
});
test('selected stays in range after dev mode changes', () => {
  const dev = reduce({ ...L, selected: 2, devMode: true }, { type: 'UNLOCK_DEV' }, apps).state;
  expect(dev.selected).toBe(2);
  const clamped = reduce({ ...L, selected: 2 }, { type: 'UNLOCK_DEV' }, apps).state;
  expect(clamped.selected).toBe(2);
  const stale = reduce({ ...L, selected: 5 }, { type: 'UNLOCK_DEV' }, apps).state;
  expect(stale.selected).toBe(2);
});
test('registry order and ids', () => {
  expect(APPS.map(a => a.id)).toEqual(['now', 'projects', 'resume', 'about', 'contact', 'reskin', 'break', 'sensors']);
  expect(APPS[1]).toMatchObject({ kind: 'flip', route: '/projects' });
  expect(APPS[7].hidden).toBe(true);
});
