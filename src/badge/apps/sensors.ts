/* SENSORS (dev mode): live tilt readout. The numbers change every frame, so
   only a change of source is announced. */

import type { AppContext, BadgeApp } from '../os/types';
import type { Tilt, TiltSourceKind } from '../tilt/math';

let root: HTMLElement | null = null;
let unsubscribe: (() => void) | null = null;
let rows: { source: HTMLElement; x: HTMLElement; y: HTMLElement } | null = null;
let announce: ((text: string) => void) | null = null;
let shownKind: TiltSourceKind | null = null;

const signed = (n: number): string => `${n < 0 ? '-' : '+'}${Math.abs(n).toFixed(2)}`;

function row(text: string): HTMLElement {
  return Object.assign(document.createElement('p'), { className: 'lcd-line', textContent: text });
}

function render(tilt: Tilt, kind: TiltSourceKind): void {
  if (!rows) return;
  if (shownKind !== null && kind !== shownKind) announce?.(`Source ${kind}`);
  shownKind = kind;
  rows.source.textContent = `SOURCE ${kind}`;
  rows.x.textContent = `X ${signed(tilt.x)}`;
  rows.y.textContent = `Y ${signed(tilt.y)}`;
}

const sensors: BadgeApp = {
  id: 'sensors',
  title: 'SENSORS',
  mount(ctx: AppContext) {
    rows = { source: row(''), x: row(''), y: row('') };
    announce = ctx.announce;
    shownKind = null;
    root = document.createElement('div');
    root.className = 'lcd-sensors';
    root.append(rows.source, rows.x, rows.y);
    ctx.screen.replaceChildren(root);
    render(ctx.tilt.current(), ctx.tilt.kind()); // subscribers only hear while tilt moves
    unsubscribe = ctx.tilt.subscribe(render);
  },
  unmount() {
    unsubscribe?.();
    unsubscribe = null;
    root?.remove();
    root = null;
    rows = null;
    announce = null;
  },
};

export default sensors;
