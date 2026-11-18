/** Sorts content entries by their `order` frontmatter, lowest first. */
export function byOrder<T extends { data: { order: number } }>(a: T, b: T): number {
  return a.data.order - b.data.order;
}
