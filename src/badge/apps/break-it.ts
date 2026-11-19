/* BREAK IT: two ways to misbehave. OVERCLOCK glitches the LCD (the glitch
   itself is CSS on #badge[data-glitch]); POWER OFF blacks it out until the
   board's RESET button reboots everything. The app only asks the OS; it owns
   no glitch or power state. */

import type { AppContext, BadgeApp, BadgeInput } from '../os/types';
import { createLcdMenu, type LcdMenu, type RowView } from './lcd-menu';

interface Item {
  view(ctx: AppContext): RowView;
  run(ctx: AppContext): void;
}

/** The OS state is the source of truth; the app reads it back from the OS. */
const glitching = (ctx: AppContext): boolean => ctx.os().glitch;

const ITEMS: readonly Item[] = [
  {
    view: (ctx) => ({
      name: `Overclock: ${glitching(ctx) ? 'on' : 'off'}`,
      parts: [`OVERCLOCK: ${glitching(ctx) ? 'ON' : 'OFF'}`],
    }),
    run: (ctx) => ctx.dispatch({ type: 'SET_GLITCH', on: !glitching(ctx) }),
  },
  {
    view: () => ({ name: 'Power off', parts: ['POWER OFF'] }),
    run: (ctx) => ctx.dispatch({ type: 'POWER_OFF' }),
  },
];

let ctx: AppContext | null = null;
let menu: LcdMenu | null = null;

function activate(index: number): void {
  if (!ctx) return;
  ITEMS[index]!.run(ctx);
  menu?.changed(); // POWER OFF unmounts first, which clears `menu`
}

const breakIt: BadgeApp = {
  id: 'break',
  title: 'BREAK IT',
  mount(context) {
    ctx = context;
    menu = createLcdMenu({
      className: 'lcd-break',
      partClasses: ['lcd-break-label'],
      hint: { className: 'lcd-break-hint', text: 'RESET button fixes it' },
      count: ITEMS.length,
      view: (i) => ITEMS[i]!.view(context),
      onPick: activate,
      onBack: context.exit,
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
    return menu?.input(input) ?? false;
  },
};

export default breakIt;
