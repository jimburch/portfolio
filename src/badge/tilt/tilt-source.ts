import type { SafeStorage } from '../storage';
import {
  driftBaseline,
  orientationToTilt,
  stepToward,
  type Orientation,
  type ScreenAngle,
  type Tilt,
  type TiltSourceKind,
} from './math';

/**
 * The badge's tilt, from the device's orientation only (never the pointer).
 * Writes `--tx`/`--ty` in [-1, 1] on `root`; without an orientation reading,
 * or under reduced motion, they stay at 0, the badge's neutral light.
 */
export interface TiltSource {
  current(): Tilt;
  kind(): TiltSourceKind;
  subscribe(fn: (t: Tilt, kind: TiltSourceKind) => void): () => void;
  requestPermissionFromGesture(): Promise<void>;
  /**
   * Inactive (while the back of the badge shows): the loop stops, readings are
   * ignored and the badge sits at rest (`--tx`/`--ty` 0). Active again, the
   * next reading picks up from rest with a fresh gyro baseline.
   */
  setActive(active: boolean): void;
}

const REST_EPSILON = 0.0005;
const DENIED_KEY = 'tilt-denied';

type PermissionedOrientationEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

function screenAngle(): ScreenAngle {
  const a = ((screen.orientation?.angle ?? 0) % 360 + 360) % 360;
  return a === 90 || a === 180 || a === 270 ? a : 0;
}

export function createTiltSource(opts: {
  root: HTMLElement;
  reducedMotion: boolean;
  session: SafeStorage;
}): TiltSource {
  const { root, reducedMotion, session } = opts;
  const listeners = new Set<(t: Tilt, kind: TiltSourceKind) => void>();
  let kind: TiltSourceKind = reducedMotion ? 'off' : 'none';
  let current: Tilt = { x: 0, y: 0 };
  let target: Tilt = { x: 0, y: 0 };
  let baseline: Orientation | null = null;
  let frame = 0;
  let inFlight = false;
  let answered = false;
  let active = true;

  function render() {
    root.style.setProperty('--tx', current.x.toFixed(4));
    root.style.setProperty('--ty', current.y.toFixed(4));
    for (const fn of listeners) fn(current, kind);
  }

  function tick() {
    frame = 0;
    if (document.hidden) return;
    current = stepToward(current, target);
    const atRest =
      Math.abs(target.x - current.x) < REST_EPSILON && Math.abs(target.y - current.y) < REST_EPSILON;
    if (atRest) current = target;
    render();
    if (!atRest) frame = requestAnimationFrame(tick);
  }

  function wake() {
    if (active && !frame && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function setTarget(next: Tilt) {
    if (!active) return;
    target = next;
    wake();
  }

  function onOrientation(e: DeviceOrientationEvent) {
    if (!active || e.beta === null || e.gamma === null) return;
    const reading = { beta: e.beta, gamma: e.gamma };
    if (!baseline) {
      baseline = reading;
      kind = 'gyro';
    }
    setTarget(orientationToTilt(reading, baseline, screenAngle()));
    baseline = driftBaseline(baseline, reading);
  }

  if (!reducedMotion) {
    window.addEventListener('deviceorientation', onOrientation);
    document.addEventListener('visibilitychange', wake);
  }

  function setActive(next: boolean) {
    if (next === active) return;
    active = next;
    if (active) return;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    current = target = { x: 0, y: 0 };
    baseline = null;
    render();
  }

  return {
    setActive,
    current: () => current,
    kind: () => kind,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    async requestPermissionFromGesture() {
      const ctor = (typeof DeviceOrientationEvent === 'undefined'
        ? undefined
        : DeviceOrientationEvent) as PermissionedOrientationEvent | undefined;
      if (reducedMotion || inFlight || answered || !ctor?.requestPermission) return;
      if (session.get(DENIED_KEY)) return;
      inFlight = true;
      try {
        const result = await ctor.requestPermission();
        answered = true;
        if (result === 'denied') session.set(DENIED_KEY, '1');
      } catch {
        // A throw (e.g. outside a gesture) is not an answer; a later gesture may retry.
      } finally {
        inFlight = false;
      }
    },
  };
}
