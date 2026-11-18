import { afterEach, expect, test, vi } from 'vitest';
import { createSafeStorage } from '../../src/badge/storage';
import { createTiltSource } from '../../src/badge/tilt/tilt-source';

afterEach(() => vi.unstubAllGlobals());

function setup(requestPermission: () => Promise<string>) {
  const noop = () => {};
  vi.stubGlobal('window', { addEventListener: noop });
  vi.stubGlobal('document', { addEventListener: noop, documentElement: { addEventListener: noop } });
  vi.stubGlobal('DeviceOrientationEvent', { requestPermission });
  const data = new Map<string, string>();
  const session = createSafeStorage(
    () =>
      ({
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => void data.set(k, v),
        removeItem: (k: string) => void data.delete(k),
      }) as unknown as Storage,
  );
  const source = createTiltSource({ root: {} as HTMLElement, reducedMotion: false, session });
  return { source, session };
}

test('a throw is not a denial and a later gesture may retry; denied is remembered and final', async () => {
  const fn = vi
    .fn<() => Promise<string>>()
    .mockRejectedValueOnce(new Error('NotAllowedError'))
    .mockResolvedValueOnce('denied');
  const { source, session } = setup(fn);

  await source.requestPermissionFromGesture();
  expect(session.get('tilt-denied')).toBeNull();

  await source.requestPermissionFromGesture();
  expect(fn).toHaveBeenCalledTimes(2);
  expect(session.get('tilt-denied')).toBe('1');

  await source.requestPermissionFromGesture();
  expect(fn).toHaveBeenCalledTimes(2);
});

test('granted is asked only once', async () => {
  const fn = vi.fn<() => Promise<string>>().mockResolvedValue('granted');
  const { source, session } = setup(fn);
  await source.requestPermissionFromGesture();
  await source.requestPermissionFromGesture();
  expect(fn).toHaveBeenCalledTimes(1);
  expect(session.get('tilt-denied')).toBeNull();
});

test('overlapping calls prompt once', async () => {
  const fn = vi.fn<() => Promise<string>>().mockResolvedValue('granted');
  const { source } = setup(fn);
  await Promise.all([source.requestPermissionFromGesture(), source.requestPermissionFromGesture()]);
  expect(fn).toHaveBeenCalledTimes(1);
});
