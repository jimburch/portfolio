import { expect, test, vi } from 'vitest';
import { createHaptic, type HapticEnv } from '../../src/badge/input/haptics';

interface FakeEl {
  tag: string;
  attrs: Record<string, string>;
  style: { cssText: string };
  children: FakeEl[];
  tabIndex: number;
  type: string;
  click: ReturnType<typeof vi.fn>;
}

/** A stand-in DOM that records what the fallback builds. */
function fakeDocument() {
  const created: FakeEl[] = [];
  const appended: FakeEl[] = [];
  const document = {
    createElement(tag: string) {
      const el: FakeEl & { setAttribute(n: string, v: string): void; append(c: FakeEl): void } = {
        tag,
        attrs: {},
        style: { cssText: '' },
        children: [],
        tabIndex: 0,
        type: '',
        click: vi.fn(),
        setAttribute: (name, value) => void (el.attrs[name] = value),
        append: (child) => void el.children.push(child),
      };
      created.push(el);
      return el;
    },
    body: { append: (node: FakeEl) => void appended.push(node) },
  };
  return { document: document as unknown as HapticEnv['document'], created, appended };
}

test('vibrates ~8 ms where the Vibration API exists, and builds nothing', () => {
  const vibrate = vi.fn(() => true);
  const dom = fakeDocument();
  const haptic = createHaptic({ navigator: { vibrate }, document: dom.document, reducedMotion: () => false });
  haptic();
  expect(vibrate).toHaveBeenCalledWith(8);
  expect(dom.created).toHaveLength(0);
});

test('without it, toggles one hidden switch through its label, created once', () => {
  const dom = fakeDocument();
  const haptic = createHaptic({ navigator: {}, document: dom.document, reducedMotion: () => false });
  haptic();
  haptic();

  expect(dom.appended).toHaveLength(1);
  const label = dom.appended[0]!;
  expect(label.tag).toBe('label');
  expect(label.attrs['aria-hidden']).toBe('true');
  expect(label.style.cssText).toBe('display:none');
  const [input] = label.children;
  expect(input).toMatchObject({ tag: 'input', type: 'checkbox', tabIndex: -1 });
  expect(input!.attrs).toHaveProperty('switch', '');
  expect(dom.created.filter((el) => el.tag === 'input')).toHaveLength(1);
  expect(label.click).toHaveBeenCalledTimes(2);
});

test('does nothing under reduced motion', () => {
  const vibrate = vi.fn(() => true);
  const dom = fakeDocument();
  const haptic = createHaptic({ navigator: { vibrate }, document: dom.document, reducedMotion: () => true });
  haptic();
  createHaptic({ navigator: {}, document: dom.document, reducedMotion: () => true })();
  expect(vibrate).not.toHaveBeenCalled();
  expect(dom.created).toHaveLength(0);
});

test('never throws', () => {
  const boom = () => {
    throw new Error('blocked');
  };
  expect(() => createHaptic({ navigator: { vibrate: boom }, document: fakeDocument().document, reducedMotion: () => false })()).not.toThrow();
  expect(() =>
    createHaptic({ navigator: {}, document: { createElement: boom } as unknown as HapticEnv['document'], reducedMotion: () => false })(),
  ).not.toThrow();
  expect(() => createHaptic({ navigator: {}, document: fakeDocument().document, reducedMotion: boom })()).not.toThrow();
});
