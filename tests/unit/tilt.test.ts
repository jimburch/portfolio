import { expect, test } from 'vitest';
import {
  clampUnit,
  driftBaseline,
  orientationToTilt,
  pointerToTilt,
  stepToward,
} from '../../src/badge/tilt/math';

test('clampUnit', () => {
  expect(clampUnit(2)).toBe(1);
  expect(clampUnit(-3)).toBe(-1);
  expect(clampUnit(NaN)).toBe(0);
});

test('stepToward uses 0.08 by default', () =>
  expect(stepToward({ x: 0, y: 0 }, { x: 1, y: -1 })).toEqual({ x: 0.08, y: -0.08 }));

const base = { beta: 45, gamma: 0 };
const r = { beta: 60, gamma: 15 };
test.each([
  [0, { x: 0.5, y: 0.5 }],
  [90, { x: 0.5, y: -0.5 }],
  [180, { x: -0.5, y: -0.5 }],
  [270, { x: -0.5, y: 0.5 }],
] as const)('orientation at screen angle %i', (angle, expected) =>
  expect(orientationToTilt(r, base, angle)).toEqual(expected),
);

test('orientation clamps', () =>
  expect(orientationToTilt({ beta: 45, gamma: 90 }, base, 0).x).toBe(1));

test('baseline drifts slowly', () => {
  const d = driftBaseline(base, { beta: 55, gamma: 10 });
  expect(d.beta).toBeCloseTo(45.02);
  expect(d.gamma).toBeCloseTo(0.02);
});

test('pointer mapping', () => {
  const rect = { left: 100, top: 0, width: 200, height: 400 };
  expect(pointerToTilt(200, 200, rect)).toEqual({ x: 0, y: 0 });
  expect(pointerToTilt(300, 0, rect)).toEqual({ x: 1, y: -1 });
  expect(pointerToTilt(900, 900, rect)).toEqual({ x: 1, y: 1 });
});
