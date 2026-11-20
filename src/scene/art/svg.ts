/* SVG building blocks for the scene art: number formatting, curves, ribbons,
   and the document wrapper every layer shares. */

import type { Box, Point } from './stage';

/** A coordinate to one decimal place, which is finer than a pixel at any size. */
export const num = (n: number): string => (Math.round(n * 10) / 10).toString();

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Smoothstep on [0, 1]. */
export const smooth = (t: number): number => t * t * (3 - 2 * t);

/** The point at `u` along the quadratic curve a → b with control c. */
export function quadPoint(a: Point, c: Point, b: Point, u: number): Point {
  const v = 1 - u;
  return {
    x: v * v * a.x + 2 * v * u * c.x + u * u * b.x,
    y: v * v * a.y + 2 * v * u * c.y + u * u * b.y,
  };
}

/** `count + 1` points along a quadratic curve, from a to b. */
export function quadPoints(a: Point, c: Point, b: Point, count: number): Point[] {
  return Array.from({ length: count + 1 }, (_, i) => quadPoint(a, c, b, i / count));
}

/** A closed path for a ribbon that follows `points`, `widths[i]` wide at each point. */
export function ribbonPath(points: readonly Point[], widths: readonly number[]): string {
  const left: string[] = [];
  const right: string[] = [];
  const n = points.length;
  points.forEach((p, i) => {
    const before = points[Math.max(0, i - 1)];
    const after = points[Math.min(n - 1, i + 1)];
    const tx = after.x - before.x;
    const ty = after.y - before.y;
    const len = Math.hypot(tx, ty) || 1;
    const half = widths[i] / 2;
    const nx = (-ty / len) * half;
    const ny = (tx / len) * half;
    left.push(`${num(p.x + nx)} ${num(p.y + ny)}`);
    right.unshift(`${num(p.x - nx)} ${num(p.y - ny)}`);
  });
  return `M${left.join('L')}L${right.join('L')}Z`;
}

/** A box as SVG x/y/width/height attributes, for masks that must cover all of it. */
export const boxAttributes = ({ x, y, width, height }: Box): string =>
  `x="${x}" y="${y}" width="${width}" height="${height}"`;

/** A standalone SVG document over `box`, stretched to the layer it paints. */
export function artDocument(box: Box, content: string): string {
  const { x, y, width, height } = box;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${height}" ` +
    `width="${width}" height="${height}" preserveAspectRatio="none">${content}</svg>`
  );
}
