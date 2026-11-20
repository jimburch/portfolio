import { describe, expect, it } from 'vitest';
import { handFrameAt } from '../../src/badge/flip/hand-turn-motion';
import type { HeldFraming } from '../../src/badge/flip/held-turn-motion';

/* The hand turn's motion (t → frame): one badge placement for the DOM faces,
   the page scene's camera and the 3D hand's eye. Pinned here because
   "lands exactly", "the scene arrives at the held camera" and "one switch of
   faces" are about every frame, which the page tests can only sample. */

// 1440×900: the badge worn (77% of the window) and held (91%), both centred.
const framing: HeldFraming = {
  worn: { x: 560.2, y: 175, width: 320.1, height: 693 },
  held: { x: 531, y: 62.2, width: 377.9, height: 818.2 },
  heldBlur: 4,
};
const ts = Array.from({ length: 2001 }, (_, i) => i / 2000);
const centre = (b: { x: number; y: number; width: number; height: number }) => ({
  x: b.x + b.width / 2,
  y: b.y + b.height / 2,
});

describe('hand turn motion', () => {
  it('starts with the front at rest: no camera, the badge on the chest, the eye on its centre', () => {
    const f = handFrameAt(0, framing);
    expect(f.front.shown).toBe(true);
    expect(f.back.shown).toBe(false);
    expect(f.scene.camera).toEqual({ x: 0, y: 0, scale: 1 });
    expect(f.scene.contact).toBe(1);
    expect(f.scene.lift).toBe(0);
    expect(f.eye).toEqual(centre(framing.worn));
    expect(f.pxPerUnit).toBeCloseTo(693 / 500, 10);
    expect(f.front.transform).toMatch(/^translate\(0\.000px, 0\.000px\) scale\(1\.000000\) .*rotateY\(0\.000deg\)$/);
  });

  it('lands with the back held exactly where the held close-up has it, and the scene at its camera', () => {
    const f = handFrameAt(1, framing);
    const zoom = framing.held.height / framing.worn.height;
    expect(f.back.shown).toBe(true);
    expect(f.front.shown).toBe(false);
    // The lift magnifies the badge by exactly the held zoom...
    const k0 = Number(/scale\(([\d.]+)\)/.exec(f.back.transform)![1]);
    expect(k0).toBeCloseTo(zoom, 5);
    expect(f.back.transform).toMatch(/rotateY\(0\.000deg\) scale\(([\d.]+)\)$/);
    expect(Number(/scale\(([\d.]+)\)$/.exec(f.back.transform)![1]) * k0).toBeCloseTo(1, 5);
    // ...and its centre, the eye moved by the badge's last screen offset, is the held badge's.
    const held = centre(framing.held);
    const worn = centre(framing.worn);
    expect(f.eye.x + f.badge.tx * f.pxPerUnit).toBeCloseTo(held.x, 6);
    expect(f.eye.y + f.badge.ty * f.pxPerUnit).toBeCloseTo(held.y, 6);
    // The scene is at the held close-up's camera: zoomed as much, the worn centre moved to the held one.
    expect(f.scene.camera.scale).toBeCloseTo(zoom, 5);
    expect(f.scene.camera.x).toBeCloseTo(held.x - worn.x, 6);
    expect(f.scene.camera.y).toBeCloseTo(held.y - worn.y, 6);
    expect(f.scene).toMatchObject({ blur: 4, contact: 0, lift: 1, roll: 0 });
  });

  it('switches from the front to the back once, edge-on, and stays there through the overshoot', () => {
    const switches = ts.filter((t, i) => i > 0 && handFrameAt(t, framing).front.shown !== handFrameAt(ts[i - 1], framing).front.shown);
    expect(switches).toHaveLength(1);
    const th = handFrameAt(switches[0], framing).badge.th;
    expect(Math.abs(th - 90)).toBeLessThan(3);
  });

  it('moves smoothly: no jump in the camera, the eye or the badge between neighbouring frames', () => {
    let last = handFrameAt(0, framing);
    for (const t of ts.slice(1)) {
      const f = handFrameAt(t, framing);
      expect(Math.abs(f.scene.camera.scale - last.scene.camera.scale)).toBeLessThan(0.01);
      expect(Math.hypot(f.eye.x - last.eye.x, f.eye.y - last.eye.y)).toBeLessThan(2);
      expect(Math.abs(f.badge.th - last.badge.th)).toBeLessThan(2);
      expect(Math.abs(f.scene.blur - last.scene.blur)).toBeLessThan(0.1);
      last = f;
    }
  });

  it('keeps the badge and the scene together: the clip rides on the badge top as the camera moves', () => {
    for (const t of ts) {
      const f = handFrameAt(t, framing);
      // The scene's camera follows the eye plus the badge's own screen offset (v10's tx/ty).
      expect(f.scene.camera.x).toBeCloseTo(f.eye.x - centre(framing.worn).x + f.badge.tx * f.pxPerUnit, 6);
      expect(f.scene.camera.y).toBeCloseTo(f.eye.y - centre(framing.worn).y + f.badge.ty * f.pxPerUnit, 6);
    }
  });
});
