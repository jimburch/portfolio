import { expect, test } from 'vitest';
import { OFF_ANNOUNCEMENT, describeChange, position, spoken } from '../../src/badge/os/announcements';
import { initialState, reduce } from '../../src/badge/os/reducer';
import { APPS } from '../../src/badge/os/registry';
import type { OsEvent, OsState } from '../../src/badge/os/types';

const launcher = initialState({ skipBoot: true });
const noFocus = { selectionHasFocus: false };

function after(state: OsState, event: OsEvent, opts = noFocus): string | null {
  return describeChange(state, reduce(state, event, APPS).state, APPS, opts);
}

test('spoken titles and positions', () => {
  expect(spoken('NOW TINKERING')).toBe('Now tinkering');
  expect(position('Contact', 4, 7)).toBe('Contact, 5 of 7');
});

test('a selection move names the entry and where it is', () => {
  const at3 = { ...launcher, selected: 3 };
  expect(after(at3, { type: 'INPUT', input: 'down' })).toBe('Contact, 5 of 7');
  expect(after(launcher, { type: 'INPUT', input: 'up' })).toBe('Break it, 7 of 7');
});

test('a selection move is not repeated when focus is on the selection', () => {
  expect(after(launcher, { type: 'INPUT', input: 'down' }, { selectionHasFocus: true })).toBeNull();
});

test('dev mode counts the hidden entry', () => {
  const dev = { ...launcher, devMode: true, selected: 6 };
  expect(after(dev, { type: 'INPUT', input: 'down' })).toBe('Sensors, 8 of 8');
});

test('opening an app, going back to the menu', () => {
  const reskin = { ...launcher, selected: 5 };
  expect(after(reskin, { type: 'INPUT', input: 'a' })).toBe('Reskin');
  const open = reduce(reskin, { type: 'INPUT', input: 'a' }, APPS).state;
  expect(after(open, { type: 'INPUT', input: 'b' })).toBe('Menu. Reskin, 6 of 7');
});

test('power off, reboot and ready', () => {
  expect(after(launcher, { type: 'POWER_OFF' })).toBe(OFF_ANNOUNCEMENT);
  const off = reduce(launcher, { type: 'POWER_OFF' }, APPS).state;
  expect(after(off, { type: 'POWER_OFF' })).toBeNull();
  expect(after(off, { type: 'RESET' })).toBe('Rebooting');
  const booting = reduce(off, { type: 'RESET' }, APPS).state;
  expect(after(booting, { type: 'BOOT_DONE' })).toBe('Ready');
});

test('nothing to say when nothing a listener cares about changed', () => {
  expect(after(launcher, { type: 'SET_GLITCH', on: true })).toBeNull();
  expect(after(launcher, { type: 'INPUT', input: 'left' })).toBeNull();
});
