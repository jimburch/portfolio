/* The stage the desktop turns play on (scene/gate.ts): the badge on the
   page's worn scene, and the back slot laid out as the held close-up it
   lands in (HeldView.astro, badge-front.css "The held turn"). Shared by the
   held turn and the hand turn: each works out a frame for its t, and this
   puts the frame on the page and takes it all off again once the turn
   settles, so the landed back is laid out exactly as a direct load of it.

   - the page's own scene (#worn-scene) takes the camera;
   - the front face turns in its box where it hangs;
   - the back slot, laid out as the held close-up over the whole window,
     turns and scales as one piece. While `turning` it is clipped to the
     badge (only the badge shows of the back); after that the held view's
     own scene frames it as on a direct load, and the resting hand shows as
     much as `grip` says. */

import { frameScene, releaseScene, type SceneView } from '../../scene/camera';
import type { BadgeFaces } from './faces';
import type { HeldFraming, ScreenBox } from './held-turn-motion';

/** The held close-up the back lands in: the held view in the back slot. */
export interface HeldStage {
  /** The page's own scene, the badge worn at rest (#worn-scene). */
  scene: HTMLElement;
  /** The held view ahead of the back face in the back slot. */
  heldView: HTMLElement;
}

/** How a face shows: its CSS transform, about its transform origin, and whether it is the one facing the visitor. */
export interface FaceView {
  transform: string;
  shown: boolean;
}

export interface StageFrame {
  /** The page's scene. */
  scene: SceneView;
  /** The extra blur on the held view's own scene, in stage units. */
  heldBlur: number;
  /** The front, about its own centre (its box is the worn badge). */
  front: FaceView;
  /** The back slot, about the held badge's centre (its box is the window, laid out held). */
  back: FaceView;
  /** Only the badge shows of the back: the slot is clipped to the held badge's outline. */
  turning: boolean;
  /** Otherwise the slot is clipped this far (px) inside its edge. */
  inset: number;
  /** How much the resting hand and the held badge's shadow show, 0 to 1. */
  grip: number;
}

export interface HeldStageView {
  /** The two ends, with both faces laid out for the turn and nothing transformed. */
  measure(): HeldFraming;
  show(frame: StageFrame): void;
  /** Takes every frame off the page. */
  release(): void;
}

const boxOf = (el: Element): ScreenBox => {
  const { x, y, width, height } = el.getBoundingClientRect();
  return { x, y, width, height };
};

export function createHeldStageView(faces: BadgeFaces, { scene, heldView }: HeldStage): HeldStageView {
  const { front, backSlot } = faces;
  const heldScene = heldView.querySelector<HTMLElement>('.worn-scene')!;
  const heldBadge = heldView.querySelector<HTMLElement>('.held-view__badge')!;

  return {
    measure: () => ({
      worn: boxOf(front),
      held: boxOf(heldBadge),
      heldBlur: parseFloat(getComputedStyle(heldScene).getPropertyValue('--scene-blur')) || 0,
    }),

    show(f) {
      frameScene(scene, f.scene);
      // The face turned away is see-through, not hidden: hiding the front would
      // take focus off the control that started the turn.
      front.style.transform = f.front.transform;
      front.style.opacity = f.front.shown ? '' : '0';
      backSlot.style.transform = f.back.transform;
      backSlot.style.opacity = f.back.shown ? '' : '0';
      backSlot.toggleAttribute('data-turning', f.turning);
      backSlot.style.setProperty('--held-turn-inset', `${f.inset.toFixed(2)}px`);
      // Seen through the back slot the held scene is pushed in only as far as
      // the page's: blurred as much, so the two meet without a seam.
      frameScene(heldScene, { blur: f.heldBlur });
      heldView.style.setProperty('--held-grip', f.grip.toFixed(4));
    },

    release() {
      releaseScene(scene);
      releaseScene(heldScene);
      heldView.style.removeProperty('--held-grip');
      backSlot.style.removeProperty('--held-turn-inset');
      for (const el of [front, backSlot]) {
        for (const name of ['transform', 'opacity']) el.style.removeProperty(name);
      }
      backSlot.removeAttribute('data-turning');
    },
  };
}
