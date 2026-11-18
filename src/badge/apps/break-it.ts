/* BREAK IT: two ways to misbehave. OVERCLOCK glitches the LCD (the glitch
   itself is CSS on #badge[data-glitch]); POWER OFF blacks it out until the
   board's RESET button reboots everything. The app only asks the OS; it owns
   no glitch or power state. */

import type { AppContext, BadgeApp, BadgeInput } from '../os/types';

interface Item {
  label(ctx: AppContext): string;
  /** What assistive tech hears for the row. */
  name(ctx: AppContext): string;
  run(ctx: AppContext): void;
}

/** The OS state is the source of truth; the app reads it back from #badge. */
const glitching = (ctx: AppContext): boolean => ctx.screen.closest('#badge')?.getAttribute('data-glitch') === 'on';

const ITEMS: readonly Item[] = [
  {
    label: (ctx) => `OVERCLOCK: ${glitching(ctx) ? 'ON' : 'OFF'}`,
    name: (ctx) => `Overclock: ${glitching(ctx) ? 'on' : 'off'}`,
    run: (ctx) => ctx.dispatch({ type: 'SET_GLITCH', on: !glitching(ctx) }),
  },
  {
    label: () => 'POWER OFF',
    name: () => 'Power off',
    run: (ctx) => ctx.dispatch({ type: 'POWER_OFF' }),
  },
];

let ctx: AppContext | null = null;
let selected = 0;
let root: HTMLElement | null = null;
let buttons: HTMLButtonElement[] = [];

function activate(index: number): void {
  if (!ctx) return;
  selected = index;
  const current = ctx;
  ITEMS[index].run(current);
  render(); // POWER OFF unmounts first, which clears `ctx`
}

/** The row buttons, built once per mount and updated in place so focus survives. */
function build(): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'lcd-break';
  buttons = ITEMS.map((_, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lcd-item';
    const marker = Object.assign(document.createElement('span'), { className: 'lcd-marker', textContent: '▸ ' });
    const label = document.createElement('span');
    marker.setAttribute('aria-hidden', 'true');
    label.setAttribute('aria-hidden', 'true');
    button.append(marker, label);
    button.addEventListener('click', () => activate(i));
    return button;
  });
  const hint = Object.assign(document.createElement('p'), {
    className: 'lcd-line lcd-break-hint',
    textContent: 'RESET button fixes it',
  });
  wrap.append(...buttons, hint);
  return wrap;
}

function render(): void {
  if (!ctx || !root) return;
  ITEMS.forEach((item, i) => {
    const button = buttons[i];
    button.setAttribute('aria-label', item.name(ctx!));
    button.toggleAttribute('aria-current', i === selected);
    if (i === selected) button.setAttribute('aria-current', 'true');
    button.children[1].textContent = item.label(ctx!);
  });
}

const breakIt: BadgeApp = {
  id: 'break',
  title: 'BREAK IT',
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
        selected = (selected + (input === 'down' ? 1 : -1) + ITEMS.length) % ITEMS.length;
        render();
        return true;
      case 'a':
        activate(selected);
        return true;
      default:
        return false;
    }
  },
};

export default breakIt;
