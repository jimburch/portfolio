// Bakes the hand's contact curls (src/scene/hand/contacts.json) and checks the result:
//
//   pnpm hand:contacts       (node runs this TypeScript directly; no browser, no WebGL)
//
// For each of SAMPLES evenly spaced t, the hand is posed as the spike posed it every frame (the shared pose code in
// src/scene/hand/, with the contact solve), on the page's own path (hand-checks.ts), and each digit's solved curl is
// recorded. Then the page's path with the baked curls, interpolated, is swept over CHECK_SAMPLES t (half of them
// between bake samples), and the solved path too, and the script fails if any skin triangle passes through the card,
// or if the held pose's digits don't all rest on the face.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CARD } from '../../src/scene/hand/timeline.ts';
import { HELD_ZOOM, loadHandForChecks, sweepCrossings } from './hand-checks.ts';
import { curlsAt, type ContactTable } from '../../src/scene/hand/contacts.ts';
import { DIGITS } from '../../src/scene/hand/rig.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'src', 'scene', 'hand', 'contacts.json');

/** Bake samples: every 0.001 of t (v10's largest fingertip step is 6.7 px per 0.001). */
const SAMPLES = 1001;
/** The check: every 0.0005 of t, as the spike report's sweep. */
const CHECK_SAMPLES = 2001;

const hand = await loadHandForChecks(readFileSync(join(ROOT, 'src', 'scene', 'hand', 'hand.glb')));

const curls = Object.fromEntries(DIGITS.map((d) => [d, [] as number[]])) as ContactTable['curls'];
const unsolved: Record<string, number> = {};
for (let i = 0; i < SAMPLES; i++) {
  const t = i / (SAMPLES - 1);
  const solved = hand.poseSolved(t);
  for (const d of DIGITS) {
    const c = solved[d];
    if (c === null) unsolved[d] = (unsolved[d] ?? 0) + 1;
    curls[d].push(Math.round((c ?? 0) * 100));
  }
}
const table: ContactTable = { samples: SAMPLES, curls };

// The held pose (t = 1) must have all five pads resting on the face.
const last = DIGITS.filter((d) => hand.poseSolved(1)[d] === null);
if (last.length) throw new Error(`held pose: ${last.join(', ')} not resting on the face`);

const sweep = sweepCrossings(hand, CHECK_SAMPLES, (t) => curlsAt(t, undefined, table));
let solvedCrossings = 0;
for (let i = 0; i < CHECK_SAMPLES; i++) {
  hand.poseSolved(i / (CHECK_SAMPLES - 1));
  solvedCrossings += Object.values(hand.crossings()).reduce((a, b) => a + (b ?? 0), 0);
}
console.log(`[contacts] ${SAMPLES} samples baked on the page's path (held zoom ${HELD_ZOOM}); unsolved contact samples per digit:`, unsolved);
console.log(`[contacts] crossings over ${sweep.samples} samples, baked curls interpolated: ${sweep.total}`, sweep.worst);
console.log(`[contacts] crossings over ${CHECK_SAMPLES} samples, solved every sample: ${solvedCrossings}`);
if (sweep.total > 0 || solvedCrossings > 0) throw new Error('the hand passes through the card');

writeFileSync(OUT, `${JSON.stringify(table)}\n`);
console.log(`[contacts] wrote ${OUT} (${readFileSync(OUT).length} B); card ${CARD.BW2 * 2} × ${CARD.BH2 * 2}`);
