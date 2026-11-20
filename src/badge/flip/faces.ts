/* The badge's two faces: the front (JIM/OS) and the back slot a back page is
   lifted into. Shared by the flip controller, which decides what the back
   holds, and the turn presentations, which lay the badge out as a side.

   The back slot keeps the page furniture a back page has ahead of its face
   (the held close-up, HeldView.astro), so a lifted face lands in the same
   markup as on its own page; only the face itself comes and goes. */

export type Side = 'front' | 'back';

export const oppositeSide = (side: Side): Side => (side === 'front' ? 'back' : 'front');

export interface BadgeFaces {
  readonly badge: HTMLElement;
  readonly front: HTMLElement;
  readonly backSlot: HTMLElement;
  /** Lays the badge out as a settled side: the front, or the back as a page. */
  layOut(side: Side): void;
  /** The side the badge is laid out as. */
  laidOutAs(): Side;
  /** Puts a back page's face in the back slot, or takes it out. */
  setBack(content: HTMLElement | null): void;
  /**
   * Puts a back page's face in the back slot in place of the one there, and
   * hands back that old face, if any: still in the slot, after the new one
   * (so drawn over it), but no longer the back's face. It is inert, hidden
   * from assistive tech, and its links carry no flip markers; the caller takes
   * it out.
   */
  replaceBack(content: HTMLElement): HTMLElement | null;
  /** The back page's face in the back slot, if any. */
  backFace(): HTMLElement | null;
}

export function createBadgeFaces(badge: HTMLElement, backSlot: HTMLElement): BadgeFaces {
  const front = badge.querySelector<HTMLElement>(':scope > .face-front')!;
  const backFace = () => backSlot.querySelector<HTMLElement>(':scope > [data-back-face]');
  return {
    badge,
    front,
    backSlot,
    layOut(side) {
      badge.dataset.side = side;
      front.hidden = side === 'back';
      backSlot.hidden = side === 'front';
      if (side === 'back') backSlot.removeAttribute('aria-hidden');
      else backSlot.setAttribute('aria-hidden', 'true');
    },
    laidOutAs: () => (badge.dataset.side === 'back' ? 'back' : 'front'),
    setBack(content) {
      backFace()?.remove();
      if (content) backSlot.append(content);
    },
    replaceBack(content) {
      const old = backFace();
      if (!old) {
        backSlot.append(content);
        return null;
      }
      // Retired: a picture of the old page while it goes, no longer a page. Its
      // links lose the flip's markers too, so only the shown page has them.
      old.removeAttribute('data-back-face');
      old.inert = true;
      old.setAttribute('aria-hidden', 'true');
      for (const link of old.querySelectorAll('[data-flip], [data-home]')) {
        link.removeAttribute('data-flip');
        link.removeAttribute('data-home');
      }
      old.before(content);
      return old;
    },
    backFace,
  };
}
