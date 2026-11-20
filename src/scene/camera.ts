/* The worn scene's camera, for whatever moves it (the held turn): the custom
   properties worn-scene.css frames the scene with, set on one scene element.
   Releasing them hands the scene back to the stylesheet's framing (at rest on
   the front, pushed in for the held close-up). */

/** One transform on the whole scene, about the resting badge's centre. */
export interface CameraMove {
  /** Translation in px, applied after the scale. */
  x: number;
  y: number;
  scale: number;
}

export interface SceneView {
  camera?: CameraMove;
  /** Extra depth-of-field blur, in stage units (`--scene-blur`). */
  blur?: number;
  /** How much the badge rests on the chest, 0 to 1 (`--scene-contact`). */
  contact?: number;
}

export const cameraTransform = ({ x, y, scale }: CameraMove): string =>
  `translate(${x.toFixed(3)}px, ${y.toFixed(3)}px) scale(${scale.toFixed(5)})`;

/** Frames `scene` as `view` says, leaving what it doesn't mention as it is. */
export function frameScene(scene: HTMLElement, view: SceneView): void {
  if (view.camera) scene.style.setProperty('--scene-camera', cameraTransform(view.camera));
  if (view.blur !== undefined) scene.style.setProperty('--scene-blur', view.blur.toFixed(4));
  if (view.contact !== undefined) scene.style.setProperty('--scene-contact', view.contact.toFixed(4));
}

/** Hands `scene` back to the stylesheet's framing. */
export function releaseScene(scene: HTMLElement): void {
  for (const name of ['--scene-camera', '--scene-blur', '--scene-contact']) scene.style.removeProperty(name);
}
