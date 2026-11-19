/* Rows on the LCD for screen apps.

   - `createLcdSelection`: a roving selection over an app's focusable rows
     (buttons or links). Up/down wrap, the selected row is marked
     `aria-current` with a `▸` and is the only one in the tab order, focus
     follows it only if it was already on a row, and A clicks it.
   - `createBackRow`: the BACK row every screen app ends with (the badge has no
     B key; keyboard B still exits through the OS).
   - `createLcdMenu`: a short menu built on both (RESKIN, BREAK IT): one real
     `<button>` per row, named for assistive tech, drawn in place so focus
     survives, then BACK. The app decides what each row shows and does. */

import { position } from '../os/announcements';
import type { BadgeInput } from '../os/types';

export interface RowView {
  /** What assistive tech hears for the row, e.g. `Board: green`. */
  name: string;
  /** The row's visible text, one per `partClasses` entry (hidden from assistive tech). */
  parts: readonly string[];
}

/** A row that can be selected: its element and what assistive tech calls it. */
export interface LcdChoice {
  el: HTMLElement;
  name(): string;
}

export interface LcdSelection {
  selected(): number;
  /** Selects row `i` without announcing it (a tap already says where it is). */
  select(i: number): void;
  /** Marks the selected row and puts only it in the tab order. */
  render(): void;
  /** Moves focus to the selected row. */
  focus(): void;
  /**
   * Up/down move the selection (wrapping): focus follows if it was on a row,
   * else the new row is announced. A activates the selected row as a tap
   * would. False for any other input.
   */
  input(input: BadgeInput): boolean;
}

export function createLcdSelection(
  choices: readonly LcdChoice[],
  announce: (text: string) => void,
): LcdSelection {
  let selected = 0;
  const count = choices.length;
  const hasFocus = () => choices.some((c) => c.el.contains(document.activeElement));

  function render(): void {
    choices.forEach(({ el }, i) => {
      if (i === selected) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
      el.tabIndex = i === selected ? 0 : -1;
    });
  }

  function focus(): void {
    choices[selected]?.el.focus({ preventScroll: true });
  }

  function move(step: 1 | -1): void {
    if (count === 0) return;
    const hadFocus = hasFocus();
    selected = (selected + step + count) % count;
    render();
    if (hadFocus) focus();
    // A screen reader speaks the newly focused row itself.
    else announce(position(choices[selected]!.name(), selected, count));
  }

  function pick(): void {
    choices[selected]?.el.click();
  }

  return {
    selected: () => selected,
    select(i) {
      selected = i;
      render();
    },
    render,
    focus,
    input(input) {
      if (input === 'up' || input === 'down') move(input === 'down' ? 1 : -1);
      else if (input === 'a') pick();
      else return false;
      return true;
    },
  };
}

/** An empty LCD row of the given element: the `▸` selection marker, then whatever the caller adds. */
export function createLcdRow<K extends 'button' | 'a'>(tag: K, className = ''): HTMLElementTagNameMap[K] {
  const row = document.createElement(tag);
  if (row instanceof HTMLButtonElement) row.type = 'button';
  row.className = className ? `lcd-item ${className}` : 'lcd-item';
  const marker = Object.assign(document.createElement('span'), { className: 'lcd-marker', textContent: '▸ ' });
  marker.setAttribute('aria-hidden', 'true');
  row.append(marker);
  return row;
}

/** The BACK row: a tap (or A while it is selected) leaves the app. */
export function createBackRow(onBack: () => void): HTMLButtonElement {
  const row = createLcdRow('button', 'lcd-back');
  row.setAttribute('aria-label', 'Back');
  const label = Object.assign(document.createElement('span'), { textContent: 'BACK' });
  label.setAttribute('aria-hidden', 'true');
  row.append(label);
  row.addEventListener('click', onBack);
  return row;
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
  /** A tap, Enter, Space or A on row `i`, which is selected first. */
  onPick(i: number): void;
  /** The BACK row after the app's rows: the app's `ctx.exit`. */
  onBack(): void;
  announce(text: string): void;
}

export interface LcdMenu {
  /** The selected app row, or null while BACK is selected. */
  selected(): number | null;
  /** Replaces what `screen` shows with the menu; focus moves to it if it was in `screen`. */
  mount(screen: HTMLElement): void;
  /** Up/down move the selection over the app's rows and BACK (wrapping), A picks; false for any other input. */
  input(input: BadgeInput): boolean;
  /** Redraws the rows in place after a value changed, and announces the selected row. */
  changed(): void;
  /** Takes the menu off the screen. */
  remove(): void;
}

export function createLcdMenu(spec: LcdMenuSpec): LcdMenu {
  const root = document.createElement('div');
  root.className = spec.className;

  const rows = Array.from({ length: spec.count }, (_, i) => {
    const row = createLcdRow('button', spec.rowClass);
    for (const className of spec.partClasses) {
      const part = Object.assign(document.createElement('span'), { className });
      part.setAttribute('aria-hidden', 'true');
      row.append(part);
    }
    row.addEventListener('click', () => {
      selection.select(i);
      spec.onPick(i);
    });
    return row;
  });
  const back = createBackRow(spec.onBack);
  const choices: LcdChoice[] = [
    ...rows.map((el, i) => ({ el, name: () => spec.view(i).name })),
    { el: back, name: () => 'Back' },
  ];
  const selection = createLcdSelection(choices, spec.announce);

  const hint = Object.assign(document.createElement('p'), {
    className: `lcd-line ${spec.hint.className}`,
    textContent: spec.hint.text,
  });
  root.append(...rows, back, hint);

  function render(): void {
    rows.forEach((row, i) => {
      const { name, parts } = spec.view(i);
      row.setAttribute('aria-label', name);
      parts.forEach((text, p) => {
        row.children[p + 1]!.textContent = text;
      });
    });
    selection.render();
  }

  return {
    selected: () => (selection.selected() < spec.count ? selection.selected() : null),
    mount(screen) {
      const hadFocus = screen.contains(document.activeElement);
      screen.replaceChildren(root);
      render();
      if (hadFocus) selection.focus();
    },
    input: (input) => selection.input(input),
    changed() {
      render();
      spec.announce(choices[selection.selected()]!.name());
    },
    remove() {
      root.remove();
    },
  };
}
