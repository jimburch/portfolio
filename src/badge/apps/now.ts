/* NOW TINKERING: what Jim is building right now, with a link that flips to its build log. */

import type { AppContext, BadgeApp, BadgeInput } from '../os/types';

interface NowData {
  title: string;
  blurb: string;
  route: string;
}

let root: HTMLElement | null = null;
let link: HTMLAnchorElement | null = null;

function build(data: NowData | null): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'lcd-now';
  const heading = Object.assign(document.createElement('p'), {
    className: 'lcd-line lcd-now-kicker',
    textContent: 'NOW TINKERING ON',
  });
  if (!data) {
    wrap.append(heading, Object.assign(document.createElement('p'), { className: 'lcd-line', textContent: 'NOTHING ON THE BENCH' }));
    return wrap;
  }
  const title = Object.assign(document.createElement('p'), { className: 'lcd-line lcd-now-title', textContent: data.title });
  const blurb = Object.assign(document.createElement('p'), { className: 'lcd-now-blurb', textContent: data.blurb });
  link = Object.assign(document.createElement('a'), {
    className: 'lcd-now-link',
    href: data.route,
    textContent: 'READ BUILD LOG ↻',
  });
  link.setAttribute('data-flip', '');
  wrap.append(heading, title, blurb, link);
  return wrap;
}

const now: BadgeApp = {
  id: 'now',
  title: 'NOW TINKERING',
  mount(ctx: AppContext) {
    root = build(ctx.data<NowData>('now'));
    ctx.screen.replaceChildren(root);
    link?.focus({ preventScroll: true });
  },
  unmount() {
    root?.remove();
    root = null;
    link = null;
  },
  onInput(input: BadgeInput) {
    if (input !== 'a' || !link) return false;
    link.click();
    return true;
  },
};

export default now;
