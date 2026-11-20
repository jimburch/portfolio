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
  vi.stubGlobal('document', { hidden: false, addEventListener: noop });
  vi.stubGlobal('screen', { orientation: { angle: 0 } });
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => frames.push(fn));
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = [];
  });
  const props = new Map<string, string>();
  const root = { style: { setProperty: (k: string, v: string) => props.set(k, v) } } as unknown as HTMLElement;
  const source = createTiltSource({ root, reducedMotion: false, session: createSafeStorage(() => undefined) });
  const runFrames = (n: number) => {
    for (let i = 0; i < n; i++) {
      const pending = frames;
      frames = [];
      pending.forEach((fn) => fn(0));
    }
  };
  const orient = (beta: number, gamma: number) => handlers.get('deviceorientation')!({ beta, gamma });
  /** A baseline reading, then the phone tipped right by a full unit of tilt. */
  const tipRight = () => {
    orient(45, 0);
    orient(45, 30);
  };
  return {
    source,
    handlers,
    runFrames,
    tipRight,
    tx: () => Number(props.get('--tx') ?? 0),
    pending: () => frames.length,
  };
}

test('the pointer is not a tilt source: no pointer listeners, and the source waits for the device', () => {
  const t = setup();
  expect([...t.handlers.keys()]).toEqual(['deviceorientation']);
  expect(t.source.kind()).toBe('none');
  expect(t.source.current()).toEqual({ x: 0, y: 0 });
});

test('device orientation drives the tilt and makes the source a gyro', () => {
  const t = setup();
  t.tipRight();
  t.runFrames(20);
  expect(t.source.kind()).toBe('gyro');
  expect(t.tx()).toBeGreaterThan(0.1);
});

test('a reading without angles (no sensor) leaves the source waiting', () => {
  const t = setup();
  t.handlers.get('deviceorientation')!({ beta: null, gamma: null });
  expect(t.source.kind()).toBe('none');
  expect(t.pending()).toBe(0);
});

test('inactive: rests at zero, ignores the device, runs no frames; active again it follows', () => {
  const t = setup();
  t.tipRight();
  t.runFrames(20);
  expect(t.tx()).toBeGreaterThan(0.1);

  t.source.setActive(false);
  expect(t.tx()).toBe(0);
  expect(t.pending()).toBe(0);
  t.tipRight();
  expect(t.pending()).toBe(0);
  t.runFrames(20);
  expect(t.tx()).toBe(0);

  t.source.setActive(true);
  t.tipRight();
  t.runFrames(20);
  expect(t.tx()).toBeGreaterThan(0.1);
});
