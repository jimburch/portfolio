/* RESKIN: pick the board color and the metal. Applied live through the theme
   controller (which persists it), so the back pages pick it up too. */

import { BOARDS, METALS } from '../theme/palettes';
import type { AppContext, BadgeApp, BadgeInput } from '../os/types';
import { createLcdMenu, type LcdMenu, type RowView } from './lcd-menu';

type Field = 'board' | 'metal';

interface Row {
  field: Field;
  label: string;
  /** Option ids selectable right now (hidden boards only once unlocked). */
  options(ctx: AppContext): readonly { id: string; label: string }[];
}

const ROWS: readonly Row[] = [
  {
    field: 'board',
    label: 'BOARD',
    options: (ctx) => BOARDS.filter((b) => !b.hidden || ctx.theme.unlocked().includes(b.id)),
  },
  { field: 'metal', label: 'METAL', options: () => METALS },
];

let ctx: AppContext | null = null;
let menu: LcdMenu | null = null;

function view(context: AppContext, i: number): RowView {
  const row = ROWS[i]!;
  const value = row.options(context).find((o) => o.id === context.theme.get()[row.field])?.label ?? '';
  return {
    name: `${row.label[0]}${row.label.slice(1).toLowerCase()}: ${value.toLowerCase()}`,
    parts: [row.label, `‹ ${value.toUpperCase()} ›`],
  };
}

function cycle(row: number, step: 1 | -1): void {
  if (!ctx || !menu) return;
  const { field, options } = ROWS[row]!;
  const list = options(ctx);
  const theme = ctx.theme.get();
  const at = list.findIndex((o) => o.id === theme[field]);
  const next = list[(Math.max(at, 0) + step + list.length) % list.length]!;
  ctx.theme.set({ ...theme, [field]: next.id } as typeof theme);
  menu.changed();
}

const reskin: BadgeApp = {
  id: 'reskin',
  title: 'RESKIN',
  mount(context) {
    ctx = context;
    menu = createLcdMenu({
      className: 'lcd-reskin',
      rowClass: 'lcd-reskin-row',
      partClasses: ['lcd-reskin-label', 'lcd-reskin-value'],
      hint: { className: 'lcd-reskin-hint', text: '◀▶ change  B: back' },
      count: ROWS.length,
      view: (i) => view(context, i),
      onPick: (i) => cycle(i, 1),
      announce: context.announce,
    });
    menu.mount(context.screen);
  },
  unmount() {
    menu?.remove();
    menu = null;
    ctx = null;
  },
  onInput(input: BadgeInput) {
    if (!menu) return false;
    switch (input) {
      case 'up':
      case 'down':
        menu.move(input === 'down' ? 1 : -1);
        return true;
      case 'left':
      case 'right':
        cycle(menu.selected(), input === 'right' ? 1 : -1);
        return true;
      default:
        return false;
    }
  },
};

export default reskin;
