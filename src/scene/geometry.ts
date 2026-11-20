/* Small geometry shared by the desktop turns and the hand's timeline: boxes
   on screen and clamping. Node runs the hand's timeline directly (the bake),
   so this stays free of DOM and of other imports. */

/** A box on screen, in viewport px. */
export interface ScreenBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const centre = (box: ScreenBox) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
