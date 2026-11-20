/* The badge's two faces: the front (JIM/OS) and the back slot a back page is
   lifted into. Shared by the flip controller, which decides what the back
   holds, and the turn presentations, which lay the badge out as a side. */

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
  /** Puts a back page's face in the back slot, or empties it. */
  setBack(content: HTMLElement | null): void;
}

export function createBadgeFaces(badge: HTMLElement, backSlot: HTMLElement): BadgeFaces {
  const front = badge.querySelector<HTMLElement>(':scope > .face-front')!;
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
      if (content) backSlot.replaceChildren(content);
      else backSlot.replaceChildren();
    },
  };
}
