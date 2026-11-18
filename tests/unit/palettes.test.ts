import { expect, test } from 'vitest';
import { BOARDS, DEFAULT_THEME } from '../../src/badge/theme/palettes';
import { createThemeController, parseTheme } from '../../src/badge/theme/theme';
import { createSafeStorage } from '../../src/badge/storage';

test('null → default', () =>
  expect(parseTheme(null, [])).toEqual({ board: 'green', metal: 'gold' }));
test('valid json', () =>
  expect(parseTheme('{"board":"blue","metal":"silver"}', [])).toEqual({
    board: 'blue',
    metal: 'silver',
  }));
test('garbage → default', () => expect(parseTheme('not json', [])).toEqual(DEFAULT_THEME));
test('unknown ids fall back per field', () =>
  expect(parseTheme('{"board":"pink","metal":"silver"}', [])).toEqual({
    board: 'green',
    metal: 'silver',
  }));
test('hidden board needs unlock', () => {
  expect(parseTheme('{"board":"midnight","metal":"gold"}', [])).toEqual(DEFAULT_THEME);
  expect(parseTheme('{"board":"midnight","metal":"gold"}', ['midnight'])).toEqual({
    board: 'midnight',
    metal: 'gold',
  });
});
test('board order', () =>
  expect(BOARDS.map((b) => b.id)).toEqual(['green', 'black', 'blue', 'red', 'white', 'midnight']));

function fakeRoot() {
  const attrs: Record<string, string> = {};
  return { attrs, root: { dataset: attrs } as unknown as HTMLElement };
}

test('controller applies, persists and unlocks', () => {
  const store = createSafeStorage(() => undefined);
  const { attrs, root } = fakeRoot();
  const c = createThemeController(root, store);
  expect(c.get()).toEqual(DEFAULT_THEME);
  expect(attrs).toMatchObject({ board: 'green', metal: 'gold' });
  c.set({ board: 'midnight', metal: 'silver' });
  expect(c.get()).toEqual({ board: 'green', metal: 'silver' });
  c.unlock('midnight');
  expect(c.unlocked()).toEqual(['midnight']);
  c.set({ board: 'midnight', metal: 'silver' });
  expect(attrs).toMatchObject({ board: 'midnight', metal: 'silver' });
  const again = createThemeController(fakeRoot().root, store);
  expect(again.get()).toEqual({ board: 'midnight', metal: 'silver' });
});
