/* SENSORS (dev mode): live tilt readout, then BACK. The numbers change every
   frame, so only a change of source is announced. */

import type { AppContext, BadgeApp, BadgeInput } from '../os/types';
import type { Tilt, TiltSourceKind } from '../tilt/math';
import { createBackRow, createLcdSelection, type LcdSelection } from './lcd-menu';

let root: HTMLElement | null = null;
let unsubscribe: (() => void) | null = null;
let rows: { source: HTMLElement; x: HTMLElement; y: HTMLElement } | null = null;
let announce: ((text: string) => void) | null = null;
let shownKind: TiltSourceKind | null = null;
let selection: LcdSelection | null = null;

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
    // Like the launcher: focus moves only if it was already in the LCD.
    const hadFocus = ctx.screen.contains(document.activeElement);
    rows = { source: row(''), x: row(''), y: row('') };
    announce = ctx.announce;
    shownKind = null;
    root = document.createElement('div');
    root.className = 'lcd-sensors';
    const back = createBackRow(ctx.exit);
    root.append(rows.source, rows.x, rows.y, back);
    selection = createLcdSelection([{ el: back, name: () => 'Back' }], ctx.announce);
    ctx.screen.replaceChildren(root);
    selection.render();
    if (hadFocus) selection.focus();
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
    selection = null;
  },
  onInput(input: BadgeInput) {
    return selection?.input(input) ?? false;
  },
};

export default sensors;
