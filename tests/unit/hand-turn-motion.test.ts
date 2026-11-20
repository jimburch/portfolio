import { describe, expect, it } from 'vitest';
import type { HeldFraming } from '../../src/badge/flip/held-stage';
import { badgeToScreen, handFrameAt, type HandTurnFrame } from '../../src/badge/flip/hand-turn-motion';
import { centre } from '../../src/scene/geometry';
import { CARD } from '../../src/scene/hand/timeline';

/* The hand turn's motion (t → frame): one badge placement for the DOM faces,
   the page scene's camera and the 3D hand's eye. Pinned here because
   "lands exactly", "the clip never leaves the window", "never drawn larger
   than laid out" and "one switch of faces" are about every frame, which the
   page tests can only sample. */

/** The worn badge (77% of the window tall, its top 126 units down) and the held one (× 1.18, top 38 units down). */
function framingFor(width: number, height: number): HeldFraming {
  const wornH = height * 0.77;
  const heldH = wornH * 1.18;
  const box = (h: number, top: number) => ({ x: (width - (h * 390) / 844) / 2, y: top, width: (h * 390) / 844, height: h });
  return {
    worn: box(wornH, (126 * wornH) / 500),
    held: box(heldH, (38 * heldH) / 500),
    heldBlur: 4,
    view: { width, height },
  };
}
const SIZES = { '1440×900': framingFor(1440, 900), '800×620': framingFor(800, 620) };
const ts = Array.from({ length: 2001 }, (_, i) => i / 2000);

/** The clip on the badge's top edge: its top corners, in stage units from the badge's centre (scene/art/lanyard.ts). */
const CLIP_TOP = [
  { x: -21, y: -279 },
  { x: 21, y: -279 },
];

/** The clip's top corners on screen: scene art, rolled with the badge about its centre, under the scene's camera. */
function clipTopOnScreen(f: HandTurnFrame, { worn }: HeldFraming) {
  const c0 = centre(worn);
  const u = worn.height / 500;
  const r = (f.scene.roll * Math.PI) / 180;
  const { x, y, scale } = f.scene.camera;
  return CLIP_TOP.map((p) => ({
    x: c0.x + x + scale * u * (p.x * Math.cos(r) - p.y * Math.sin(r)),
    y: c0.y + y + scale * u * (p.x * Math.sin(r) + p.y * Math.cos(r)),
  }));
}

describe.each(Object.entries(SIZES))('hand turn motion at %s', (_, framing) => {
  const held = centre(framing.held);
  const worn = centre(framing.worn);
  const zoom = framing.held.height / framing.worn.height;

  it('starts with the front at rest: no camera, no pull-back, the eye on the badge centre', () => {
    const f = handFrameAt(0, framing);
    expect(f.front.shown).toBe(true);
    expect(f.back.shown).toBe(false);
    expect(f.pullBack).toBe(1);
    expect(f.scene.camera).toEqual({ x: 0, y: 0, scale: 1 });
    expect(f.scene.contact).toBe(1);
    expect(f.scene.lift).toBe(0);
    expect(f.eye).toEqual(worn);
    expect(f.pxPerUnit).toBeCloseTo(framing.worn.height / 500, 10);
    expect(f.front.transform).toMatch(/^translate\(0\.000px, 0\.000px\) scale\(1\.000000\) .*rotateY\(0\.000deg\)$/);
  });

  it('lands with the back held exactly where the held close-up has it, and the scene at its camera', () => {
    const f = handFrameAt(1, framing);
    expect(f.back.shown).toBe(true);
    expect(f.front.shown).toBe(false);
    expect(f.pullBack).toBe(1);
    // The lift magnifies the badge by exactly the held zoom, and the back is laid out at that size.
    const k0 = Number(/scale\(([\d.]+)\)/.exec(f.back.transform)![1]);
    expect(k0).toBeCloseTo(zoom, 5);
    expect(Number(/scale\(([\d.]+)\)$/.exec(f.back.transform)![1]) * k0).toBeCloseTo(1, 5);
    // Its centre is the held badge's, and its corners the held badge's corners.
    const c = badgeToScreen(f, 0, 0);
    expect(c.x).toBeCloseTo(held.x, 6);
    expect(c.y).toBeCloseTo(held.y, 6);
    // (Within 0.05 px: the 3D card is 231 units wide, the DOM badge 500 × 390 / 844 = 231.04.)
    const topLeft = badgeToScreen(f, CARD.BW2, CARD.BH2); // the back's top-left as the visitor sees it, turned
    expect(topLeft.x).toBeCloseTo(framing.held.x, 1);
    expect(topLeft.y).toBeCloseTo(framing.held.y, 3);
    // The scene is at the held close-up's camera: zoomed as much, the worn centre moved to the held one.
    expect(f.scene.camera.scale).toBeCloseTo(zoom, 5);
    expect(f.scene.camera.x).toBeCloseTo(held.x - worn.x, 6);
    expect(f.scene.camera.y).toBeCloseTo(held.y - worn.y, 6);
    expect(f.scene).toMatchObject({ blur: 4, contact: 0, lift: 1, roll: 0 });
  });

  it('keeps the clip and the badge top inside the window at every t', () => {
    let highest = Infinity;
    for (const t of ts) {
      const f = handFrameAt(t, framing);
      const tops = [
        ...clipTopOnScreen(f, framing),
        badgeToScreen(f, -CARD.BW2, CARD.BH2),
        badgeToScreen(f, CARD.BW2, CARD.BH2),
      ];
      highest = Math.min(highest, ...tops.map((p) => p.y));
      for (const p of tops) {
        expect(p.y, `t ${t}`).toBeGreaterThanOrEqual(0);
        expect(p.x, `t ${t}`).toBeGreaterThanOrEqual(0);
        expect(p.x, `t ${t}`).toBeLessThanOrEqual(framing.view.width);
      }
    }
    expect(highest).toBeGreaterThanOrEqual(0);
  });

  it('never draws the back larger than it is laid out (the lift is trimmed, the pull-back only shrinks)', () => {
    for (const t of ts) {
      const f = handFrameAt(t, framing);
      const k0 = Number(/scale\(([\d.]+)\)/.exec(f.back.transform)![1]);
      expect(k0 / zoom, `t ${t}`).toBeLessThanOrEqual(1 + 1e-6);
      expect(f.pullBack, `t ${t}`).toBeLessThanOrEqual(1);
    }
  });

  it('switches from the front to the back once, edge-on, and stays there through the overshoot', () => {
    const shown = ts.map((t) => handFrameAt(t, framing).front.shown);
    const switches = ts.filter((_, i) => i > 0 && shown[i] !== shown[i - 1]);
    expect(switches).toHaveLength(1);
    expect(Math.abs(handFrameAt(switches[0], framing).badge.th - 90)).toBeLessThan(3);
  });

  it('moves smoothly: no jump in the camera, the pull-back, the eye or the badge between neighbouring frames', () => {
    let last = handFrameAt(0, framing);
    for (const t of ts.slice(1)) {
      const f = handFrameAt(t, framing);
      expect(Math.abs(f.scene.camera.scale - last.scene.camera.scale)).toBeLessThan(0.01);
      expect(Math.abs(f.pullBack - last.pullBack)).toBeLessThan(0.005);
      expect(Math.hypot(f.eye.x - last.eye.x, f.eye.y - last.eye.y)).toBeLessThan(2);
      expect(Math.abs(f.badge.th - last.badge.th)).toBeLessThan(2);
      expect(Math.abs(f.scene.blur - last.scene.blur)).toBeLessThan(0.1);
      last = f;
    }
  });

  it('keeps the badge and the scene together: the scene moves with the badge as the camera moves', () => {
    for (const t of ts) {
      const f = handFrameAt(t, framing);
      // The badge's centre on screen is the scene's resting badge centre under the scene's camera.
      const c = badgeToScreen(f, 0, 0);
      expect(worn.x + f.scene.camera.x).toBeCloseTo(c.x, 6);
      expect(worn.y + f.scene.camera.y).toBeCloseTo(c.y, 6);
    }
  });
});
