import { expect, test } from 'vitest';
import { COMBOS, createComboDetector } from '../../src/badge/input/combos';
import { createInputBus } from '../../src/badge/input/bus';
import { keyToInput } from '../../src/badge/input/keymap';

const none = { meta: false, ctrl: false, alt: false };

test.each([
  ['ArrowUp', 'up'],
  ['ArrowLeft', 'left'],
  ['Enter', 'a'],
  ['z', 'a'],
  ['Z', 'a'],
  [' ', 'a'],
  ['Escape', 'b'],
  ['x', 'b'],
  ['s', 'start'],
  ['q', null],
] as const)('%s → %s', (key, out) => expect(keyToInput(key, null, none)).toBe(out));

test('Enter and Space on a focused button are left to the browser', () => {
  expect(keyToInput('Enter', 'BUTTON', none)).toBeNull();
  expect(keyToInput(' ', 'A', none)).toBeNull();
  expect(keyToInput('ArrowUp', 'BUTTON', none)).toBe('up');
});

test('modifier shortcuts are never hijacked', () =>
  expect(keyToInput('ArrowLeft', null, { ...none, meta: true })).toBeNull());

test('bare Shift is not a mapped key (handled as lone-Shift in controls)', () =>
  expect(keyToInput('Shift', null, none)).toBeNull());

test('text fields are ignored', () => expect(keyToInput('x', 'INPUT', none)).toBeNull());

test('combo fires on suffix match', () => {
  const hits: string[] = [];
  const feed = createComboDetector(COMBOS, (n) => hits.push(n));
  const results = (['left', 'up', 'left', 'left', 'a'] as const).map(feed);
  expect(hits).toEqual(['dev']);
  expect(results).toEqual([false, false, false, false, true]);
});

test('konami fires', () => {
  const hits: string[] = [];
  const feed = createComboDetector(COMBOS, (n) => hits.push(n));
  COMBOS.konami.forEach(feed);
  expect(hits).toContain('konami');
});

test('bus delivers to subscribers until unsubscribed', () => {
  const bus = createInputBus();
  const got: string[] = [];
  const off = bus.subscribe((i) => got.push(i));
  bus.emit('a');
  off();
  bus.emit('b');
  expect(got).toEqual(['a']);
});
