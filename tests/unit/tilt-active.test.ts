import { afterEach, expect, test, vi } from 'vitest';
import { createSafeStorage } from '../../src/badge/storage';
import { createTiltSource } from '../../src/badge/tilt/tilt-source';

afterEach(() => vi.unstubAllGlobals());

/** A tilt source over stubbed globals: fire window events, run frames, read --tx/--ty. */
function setup() {
  const handlers = new Map<string, (e: unknown) => void>();
  let frames: FrameRequestCallback[] = [];
  const noop = () => {};
  vi.stubGlobal('window', { addEventListener: (type: string, fn: (e: unknown) => void) => handlers.set(type, fn) });
  vi.stubGlobal('document', { hidden: false, addEventListener: noop, documentElement: { addEventListener: noop } });
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => frames.push(fn));
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = [];
  });
  const props = new Map<string, string>();
  const root = {
    style: { setProperty: (k: string, v: string) => props.set(k, v) },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
  } as unknown as HTMLElement;
  const source = createTiltSource({ root, reducedMotion: false, session: createSafeStorage(() => undefined) });
  const runFrames = (n: number) => {
    for (let i = 0; i < n; i++) {
      const pending = frames;
      frames = [];
      pending.forEach((fn) => fn(0));
    }
  };
  const move = (x: number, y: number) => handlers.get('pointermove')!({ clientX: x, clientY: y, pointerType: 'mouse' });
  return { source, runFrames, move, tx: () => Number(props.get('--tx') ?? 0), pending: () => frames.length };
}

test('inactive: rests at zero, ignores the pointer, runs no frames; active again it follows', () => {
  const t = setup();
  t.move(100, 0);
  t.runFrames(20);
  expect(t.tx()).toBeGreaterThan(0.1);

  t.source.setActive(false);
  expect(t.tx()).toBe(0);
  expect(t.pending()).toBe(0);
  t.move(100, 0);
  expect(t.pending()).toBe(0);
  t.runFrames(20);
  expect(t.tx()).toBe(0);

  t.source.setActive(true);
  t.move(100, 0);
  t.runFrames(20);
  expect(t.tx()).toBeGreaterThan(0.1);
});
