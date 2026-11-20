import { describe, expect, it } from 'vitest';
import type { HeldFraming } from '../../src/badge/flip/held-stage';
import { frameAt, poseAt } from '../../src/badge/flip/held-turn-motion';

/* The held turn's motion (t → frame): the seam the hand turn (#32) drives.
   Pinned here because "never scaled up" and "lands exactly" are about every
   frame, which the page tests can only sample. */

// 1440×900: the badge worn (77% of the window) and held (91%), both centred.
const framing: HeldFraming = {
  worn: { x: 560.2, y: 175, width: 320.1, height: 693 },
  held: { x: 531, y: 62.2, width: 377.9, height: 818.2 },
  heldBlur: 4,
  view: { width: 1440, height: 900 },
};
const ts = Array.from({ length: 1001 }, (_, i) => i / 1000);

describe('held turn motion', () => {
  it('starts with the front at rest and ends with the back held, untransformed', () => {
    const start = frameAt(0, framing);
    expect(start.front).toMatchObject({ scale: 1, rotateY: 0, shown: true });
    expect(Math.abs(start.front.x) + Math.abs(start.front.y)).toBe(0);
    expect(start.camera).toMatchObject({ scale: 1, blur: 0 });
    expect(start.contact).toBe(1);
    expect(start.pose.grip).toBe(0);

    const end = frameAt(1, framing);
    expect(end.back).toMatchObject({ scale: 1, rotateY: 0, shown: true });
    expect(Math.abs(end.back.x) + Math.abs(end.back.y)).toBe(0);
    expect(end.front.shown).toBe(false);
    expect(end.camera.blur).toBe(4);
    expect(end.camera.scale).toBeCloseTo(818.2 / 693, 10);
    expect(end.pose.grip).toBe(1);
    expect(end.contact).toBe(0);
  });

  it('shows each face only at its laid-out size or smaller, never scaled up', () => {
    for (const t of ts) {
      const { front, back } = frameAt(t, framing);
      expect(front.shown).not.toBe(back.shown);
      if (front.shown) expect(front.scale).toBe(1);
      if (back.shown) expect(back.scale).toBeLessThanOrEqual(1);
    }
  });

  it('turns first and pushes in after, the push starting as the badge goes edge-on', () => {
    for (const t of ts) {
      const { turn, push } = poseAt(t);
      if (turn < 0.5) expect(push).toBe(0);
      if (push > 0) expect(turn).toBeGreaterThanOrEqual(0.5);
    }
    expect(poseAt(0.5).turn).toBe(1);
  });

  it('moves smoothly: no jumps between neighbouring frames, and still at both ends', () => {
    for (let i = 1; i < ts.length; i++) {
      const a = frameAt(ts[i - 1]!, framing);
      const b = frameAt(ts[i]!, framing);
      // At most about 1.1° per thousandth (the eased turn's top speed).
      expect(Math.abs(b.front.rotateY - a.front.rotateY)).toBeLessThan(1.1);
      expect(Math.abs(b.camera.y - a.camera.y)).toBeLessThan(0.5);
      expect(Math.abs(b.camera.scale - a.camera.scale)).toBeLessThan(0.001);
    }
    expect(frameAt(0.001, framing).front.rotateY).toBeLessThan(0.01);
    expect(1 - frameAt(0.999, framing).camera.scale / frameAt(1, framing).camera.scale).toBeLessThan(1e-6);
  });

  it('keeps the badge in the scene: both faces move with the camera', () => {
    for (const t of [0.1, 0.4, 0.6, 0.9]) {
      const { camera, front, back } = frameAt(t, framing);
      // Front: laid out worn, so it is the camera's move itself.
      expect(front).toMatchObject({ x: camera.x, y: camera.y, scale: camera.scale });
      // Back: laid out held, so the camera relative to the held one.
      expect(back.scale).toBeCloseTo(camera.scale / (818.2 / 693), 10);
    }
  });
});
