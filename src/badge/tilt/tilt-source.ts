import type { SafeStorage } from '../storage';
import {
  driftBaseline,
  orientationToTilt,
  pointerToTilt,
  stepToward,
  type Orientation,
  type ScreenAngle,
  type Tilt,
  type TiltSourceKind,
} from './math';

export interface TiltSource {
  current(): Tilt;
  kind(): TiltSourceKind;
  subscribe(fn: (t: Tilt, kind: TiltSourceKind) => void): () => void;
  requestPermissionFromGesture(): Promise<void>;
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
  let kind: TiltSourceKind = reducedMotion ? 'off' : 'pointer';
  let current: Tilt = { x: 0, y: 0 };
  let target: Tilt = { x: 0, y: 0 };
  let baseline: Orientation | null = null;
  let frame = 0;
  let asked = false;

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
    if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function setTarget(next: Tilt) {
    target = next;
    wake();
  }

  function onOrientation(e: DeviceOrientationEvent) {
    if (e.beta === null || e.gamma === null) return;
    const reading = { beta: e.beta, gamma: e.gamma };
    if (!baseline) {
      baseline = reading;
      kind = 'gyro';
    }
    setTarget(orientationToTilt(reading, baseline, screenAngle()));
    baseline = driftBaseline(baseline, reading);
  }

  function onPointerMove(e: PointerEvent) {
    if (kind !== 'pointer' || e.pointerType === 'touch') return;
    setTarget(pointerToTilt(e.clientX, e.clientY, root.getBoundingClientRect()));
  }

  function onPointerLeave() {
    if (kind === 'pointer') setTarget({ x: 0, y: 0 });
  }

  if (!reducedMotion) {
    window.addEventListener('deviceorientation', onOrientation);
    window.addEventListener('pointermove', onPointerMove);
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', wake);
  }

  return {
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
      if (reducedMotion || asked || !ctor?.requestPermission) return;
      if (session.get(DENIED_KEY)) return;
      asked = true;
      try {
        if ((await ctor.requestPermission()) !== 'granted') session.set(DENIED_KEY, '1');
      } catch {
        session.set(DENIED_KEY, '1');
      }
    },
  };
}
