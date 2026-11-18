/* RESKIN: pick the board color and the metal. Applied live through the theme
   controller (which persists it), so the back pages pick it up too. */

import { BOARDS, METALS } from '../theme/palettes';
import type { AppContext, BadgeApp, BadgeInput } from '../os/types';

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
let selected = 0;
let root: HTMLElement | null = null;

function cycle(row: number, step: 1 | -1): void {
  if (!ctx) return;
  const { field, options } = ROWS[row];
  const list = options(ctx);
  const theme = ctx.theme.get();
  const at = list.findIndex((o) => o.id === theme[field]);
  const next = list[(Math.max(at, 0) + step + list.length) % list.length];
  ctx.theme.set({ ...theme, [field]: next.id } as typeof theme);
  render();
}

/** The two row buttons, built once per mount and updated in place so focus survives. */
let buttons: HTMLButtonElement[] = [];

function build(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'lcd-reskin';
  buttons = ROWS.map((row, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lcd-item lcd-reskin-row';
    const marker = Object.assign(document.createElement('span'), { className: 'lcd-marker', textContent: '▸ ' });
    const label = Object.assign(document.createElement('span'), { className: 'lcd-reskin-label', textContent: row.label });
    const value = Object.assign(document.createElement('span'), { className: 'lcd-reskin-value' });
    for (const n of [marker, label, value]) n.setAttribute('aria-hidden', 'true');
    button.append(marker, label, value);
    button.addEventListener('click', () => {
      selected = i;
      cycle(i, 1);
    });
    return button;
  });
  const hint = Object.assign(document.createElement('p'), {
    className: 'lcd-line lcd-reskin-hint',
    textContent: '◀▶ change  B: back',
  });
  wrap.append(...buttons, hint);
  return wrap;
}

function render(): void {
  if (!ctx || !root) return;
  const theme = ctx.theme.get();
  ROWS.forEach((row, i) => {
    const current = row.options(ctx!).find((o) => o.id === theme[row.field]);
    const name = current?.label ?? '';
    const button = buttons[i];
    button.setAttribute('aria-label', `${row.label[0]}${row.label.slice(1).toLowerCase()}: ${name.toLowerCase()}`);
    button.toggleAttribute('aria-current', i === selected);
    if (i === selected) button.setAttribute('aria-current', 'true');
    button.querySelector('.lcd-reskin-value')!.textContent = `‹ ${name.toUpperCase()} ›`;
  });
}

const reskin: BadgeApp = {
  id: 'reskin',
  title: 'RESKIN',
  mount(context) {
    ctx = context;
    selected = 0;
    root = build();
    context.screen.replaceChildren(root);
    render();
  },
  unmount() {
    root?.remove();
    root = null;
    buttons = [];
    ctx = null;
  },
  onInput(input: BadgeInput) {
    switch (input) {
      case 'up':
      case 'down':
        selected = (selected + (input === 'down' ? 1 : -1) + ROWS.length) % ROWS.length;
        render();
        return true;
      case 'left':
      case 'right':
        cycle(selected, input === 'right' ? 1 : -1);
        return true;
      default:
        return false;
    }
  },
};

export default reskin;
