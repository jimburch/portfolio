/* The hand's contact curls, baked: each digit's solved curl onto the card at
   evenly spaced t (contacts.json, written by scripts/hand/bake-contacts.ts,
   `pnpm hand:contacts`). The spike solved them every frame; the curls depend
   only on t (the key poses are in the badge's frame, and the forearm, which
   the framing moves, carries no pad), so the page reads them instead and
   interpolates between samples. Re-bake when the keys, the timeline or the
   model change. */

import table from './contacts.json' with { type: 'json' };
import type { DigitName } from './keys.ts';
import type { DigitCurls } from './rig.ts';
import { DIGITS } from './rig.ts';

/** The baked table: `samples` evenly spaced t from 0 to 1, each digit's curl in hundredths of a degree. */
export interface ContactTable {
  samples: number;
  curls: Record<DigitName, number[]>;
}

export const CONTACTS: ContactTable = table;

/** Each digit's curl at t, linearly between the two nearest samples. */
export function curlsAt(t: number, out = {} as DigitCurls, contacts: ContactTable = CONTACTS): DigitCurls {
  const x = Math.max(0, Math.min(1, t)) * (contacts.samples - 1);
  const i = Math.min(contacts.samples - 2, Math.floor(x));
  const u = x - i;
  for (const d of DIGITS) {
    const c = contacts.curls[d];
    out[d] = (c[i] + (c[i + 1] - c[i]) * u) / 100;
  }
  return out;
}
