/* NOW TINKERING: what Jim is building right now, with a link that flips to its
   build log, then BACK. Up/down move between the two; A follows the selected one. */

import type { AppContext, BadgeApp, BadgeInput } from '../os/types';
import { createBackRow, createLcdRow, createLcdSelection, type LcdChoice, type LcdSelection } from './lcd-menu';

interface NowData {
  title: string;
  blurb: string;
  route: string;
}

let root: HTMLElement | null = null;
let selection: LcdSelection | null = null;

function line(className: string, text: string): HTMLElement {
  return Object.assign(document.createElement('p'), { className, textContent: text });
}

/** The build log link, named "READ BUILD LOG" (the flip glyph is decoration). */
function logLink(route: string): HTMLAnchorElement {
  const link = createLcdRow('a', 'lcd-now-link');
  link.href = route;
  link.setAttribute('data-flip', '');
  const glyph = Object.assign(document.createElement('span'), { className: 'lcd-now-flip', textContent: '↻' });
  glyph.setAttribute('aria-hidden', 'true');
  link.append('READ BUILD LOG', glyph);
  return link;
}

const now: BadgeApp = {
  id: 'now',
  title: 'NOW TINKERING',
  mount(ctx: AppContext) {
    // Like the launcher: focus moves only if it was already in the LCD.
    const hadFocus = ctx.screen.contains(document.activeElement);
    const data = ctx.data<NowData>('now');
    root = document.createElement('div');
    root.className = 'lcd-now';
    root.append(line('lcd-line lcd-now-kicker', 'NOW TINKERING ON'));

    const choices: LcdChoice[] = [];
    if (data) {
      const link = logLink(data.route);
      root.append(line('lcd-line lcd-now-title', data.title), line('lcd-now-blurb', data.blurb), link);
      choices.push({ el: link, name: () => 'Read build log' });
    } else {
      root.append(line('lcd-line', 'NOTHING ON THE BENCH'));
    }
    const back = createBackRow(ctx.exit);
    root.append(back);
    choices.push({ el: back, name: () => 'Back' });

    selection = createLcdSelection(choices, ctx.announce);
    ctx.screen.replaceChildren(root);
    selection.render();
    if (hadFocus) selection.focus();
  },
  unmount() {
    root?.remove();
    root = null;
    selection = null;
  },
  onInput(input: BadgeInput) {
    return selection?.input(input) ?? false;
  },
};

export default now;
