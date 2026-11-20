export interface Tilt {
  x: number;
  y: number;
}
export interface Orientation {
  beta: number;
  gamma: number;
}
export type ScreenAngle = 0 | 90 | 180 | 270;
/**
 * What tilts the badge: the device's accelerometer/gyroscope (`gyro`), nothing
 * yet because no orientation reading has arrived (`none`, e.g. any desktop),
 * or nothing ever because the visitor prefers reduced motion (`off`). The
 * pointer is never a source.
 */
export type TiltSourceKind = 'gyro' | 'none' | 'off';

/** Degrees of device rotation that map to a full unit of tilt. */
const FULL_TILT_DEGREES = 30;

export function clampUnit(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.min(1, Math.max(-1, v));
}

export function stepToward(current: Tilt, target: Tilt, factor = 0.08): Tilt {
  return {
    x: current.x + (target.x - current.x) * factor,
    y: current.y + (target.y - current.y) * factor,
  };
}

export function orientationToTilt(
  reading: Orientation,
  baseline: Orientation,
  angle: ScreenAngle,
): Tilt {
  const dB = (reading.beta - baseline.beta) / FULL_TILT_DEGREES;
  const dG = (reading.gamma - baseline.gamma) / FULL_TILT_DEGREES;
  const [x, y] =
    angle === 90 ? [dB, -dG] : angle === 180 ? [-dG, -dB] : angle === 270 ? [-dB, dG] : [dG, dB];
  return { x: clampUnit(x), y: clampUnit(y) };
}

/** Moves the baseline slightly toward the reading so posture changes recenter. */
export function driftBaseline(baseline: Orientation, reading: Orientation, rate = 0.002): Orientation {
  return {
    beta: baseline.beta + (reading.beta - baseline.beta) * rate,
    gamma: baseline.gamma + (reading.gamma - baseline.gamma) * rate,
  };
}
