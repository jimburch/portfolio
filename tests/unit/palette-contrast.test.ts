import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { BOARDS, METALS, type BoardId, type MetalId } from '../../src/badge/theme/palettes';

/* Reads the palette straight from tokens.css, so the CSS stays the one source
   of truth. tokens.css keeps to single selectors (:root or one data attribute)
   of equal specificity, so applying the matching blocks in source order is the
   cascade; anything else fails here rather than being guessed at. */

const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

interface Block {
  board?: string;
  metal?: string;
  vars: Record<string, string>;
}

const blocks: Block[] = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selector, body]) => {
  const sel = selector!.trim();
  const attr = /^\[data-(board|metal)='([a-z]+)'\]$/.exec(sel);
  if (sel !== ':root' && !attr) throw new Error(`tokens.css: unsupported selector ${sel}`);
  const vars = Object.fromEntries(
    [...body!.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name!, value!.trim()]),
  );
  return attr ? { [attr[1]!]: attr[2], vars } : { vars };
});

function tokens(board: BoardId, metal: MetalId): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const b of blocks) {
    if ((b.board && b.board !== board) || (b.metal && b.metal !== metal)) continue;
    Object.assign(vars, b.vars);
  }
  return vars;
}

function resolve(vars: Record<string, string>, name: string, depth = 0): string {
  const value = vars[name];
  if (value === undefined || depth > 8) throw new Error(`unresolved ${name}`);
  const ref = /^var\((--[\w-]+)\)$/.exec(value);
  return ref ? resolve(vars, ref[1]!, depth + 1) : value;
}

function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`not a #rrggbb color: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1]!.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const combos = BOARDS.flatMap((b) => METALS.map((m) => [b.id, m.id] as const));

test.each(combos)('%s board, %s metal: printed text (lit or not) and focus ring read at 3:1', (board, metal) => {
  const t = tokens(board, metal);
  const on = resolve(t, '--board');
  expect(contrast(resolve(t, '--ink'), on), 'ink on board').toBeGreaterThanOrEqual(3);
  // The name's tilt highlight sweeps it toward --ink-glint, so that must read too.
  expect(contrast(resolve(t, '--ink-glint'), on), 'lit ink on board').toBeGreaterThanOrEqual(3);
  expect(contrast(resolve(t, '--focus'), on), 'focus ring on board').toBeGreaterThanOrEqual(3);
  // The LCD's own selection and focus color on its glass.
  expect(contrast(resolve(t, '--lcd-hl'), resolve(t, '--lcd-bg')), 'highlight on LCD').toBeGreaterThanOrEqual(3);
});

test('the parser sees every board and metal block', () => {
  expect(blocks.filter((b) => b.board).map((b) => b.board)).toEqual(BOARDS.filter((b) => b.id !== 'green').map((b) => b.id));
  expect(blocks.filter((b) => b.metal).map((b) => b.metal)).toEqual(['silver']);
});
