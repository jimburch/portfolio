import { expect, test } from 'vitest';
import { createSafeStorage } from '../../src/badge/storage';

test('falls back to memory when the backing store throws', () => {
  const boom = () => {
    throw new Error('blocked');
  };
  const s = createSafeStorage(
    () => ({ getItem: boom, setItem: boom, removeItem: boom }) as unknown as Storage,
  );
  s.set('k', 'v');
  expect(s.get('k')).toBe('v');
  s.remove('k');
  expect(s.get('k')).toBeNull();
});

test('falls back to memory when there is no backing store', () => {
  const s = createSafeStorage(() => undefined);
  s.set('a', '1');
  expect(s.get('a')).toBe('1');
});

test('falls back to memory when getting the backing store throws', () => {
  const s = createSafeStorage(() => {
    throw new Error('SecurityError');
  });
  s.set('a', '1');
  expect(s.get('a')).toBe('1');
});

test('uses the backing store while it works', () => {
  const data = new Map<string, string>();
  const backing = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  } as unknown as Storage;
  const s = createSafeStorage(() => backing);
  s.set('a', '1');
  expect(data.get('a')).toBe('1');
  expect(s.get('a')).toBe('1');
  s.remove('a');
  expect(data.has('a')).toBe(false);
});
