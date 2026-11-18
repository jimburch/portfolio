/* A short menu of rows for apps on the LCD (RESKIN, BREAK IT): one real
   `<button>` per row, named for assistive tech, drawn in place so focus
   survives, with up/down wrapping and the selected row marked `aria-current`
   with a `▸`. The app decides what each row shows and does. */

import { position } from '../os/announcements';

export interface RowView {
  /** What assistive tech hears for the row, e.g. `Board: green`. */
  name: string;
  /** The row's visible text, one per `partClasses` entry (hidden from assistive tech). */
  parts: readonly string[];
}

export interface LcdMenuSpec {
  className: string;
  rowClass?: string;
  /** Class of each visible span after the `▸` marker; every row has the same spans. */
  partClasses: readonly string[];
  hint: { className: string; text: string };
  count: number;
  /** What row `i` shows and is called right now. */
  view(i: number): RowView;
  /** A tap, Enter or Space on row `i`, which is selected first. */
  onPick(i: number): void;
  announce(text: string): void;
}

export interface LcdMenu {
  selected(): number;
  /** Replaces what `screen` shows with the menu; focus moves to it if it was in `screen`. */
  mount(screen: HTMLElement): void;
  /** Up/down: moves the selection (wrapping); focus follows if it was on the menu. */
  move(step: 1 | -1): void;
  /** Redraws the rows in place after a value changed, and announces the selected row. */
  changed(): void;
  /** Takes the menu off the screen. */
  remove(): void;
}

export function createLcdMenu(spec: LcdMenuSpec): LcdMenu {
  let selected = 0;
  const root = document.createElement('div');
  root.className = spec.className;

  const buttons = Array.from({ length: spec.count }, (_, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = spec.rowClass ? `lcd-item ${spec.rowClass}` : 'lcd-item';
    const marker = Object.assign(document.createElement('span'), { className: 'lcd-marker', textContent: '▸ ' });
    const parts = spec.partClasses.map((className) => Object.assign(document.createElement('span'), { className }));
    for (const n of [marker, ...parts]) n.setAttribute('aria-hidden', 'true');
    button.append(marker, ...parts);
    button.addEventListener('click', () => {
      selected = i;
      spec.onPick(i);
    });
    return button;
  });
  const hint = Object.assign(document.createElement('p'), {
    className: `lcd-line ${spec.hint.className}`,
    textContent: spec.hint.text,
  });
  root.append(...buttons, hint);

  function render(): void {
    buttons.forEach((button, i) => {
      const { name, parts } = spec.view(i);
      button.setAttribute('aria-label', name);
      if (i === selected) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
      button.tabIndex = i === selected ? 0 : -1;
      parts.forEach((text, p) => {
        button.children[p + 1]!.textContent = text;
      });
    });
  }

  return {
    selected: () => selected,
    mount(screen) {
      const hadFocus = screen.contains(document.activeElement);
      screen.replaceChildren(root);
      render();
      if (hadFocus) buttons[selected]!.focus({ preventScroll: true });
    },
    move(step) {
      const hadFocus = root.contains(document.activeElement);
      selected = (selected + step + spec.count) % spec.count;
      render();
      if (hadFocus) buttons[selected]!.focus({ preventScroll: true });
      // A screen reader speaks the newly focused row itself.
      else spec.announce(position(spec.view(selected).name, selected, spec.count));
    },
    changed() {
      render();
      spec.announce(spec.view(selected).name);
    },
    remove() {
      root.remove();
    },
  };
}
