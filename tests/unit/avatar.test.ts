import { expect, test } from 'vitest';
import { AVATAR } from '../../src/data/avatar';

test('avatar is a 16×16 bitmap of # and .', () => {
  expect(AVATAR).toHaveLength(16);
  for (const row of AVATAR) expect(row).toMatch(/^[#.]{16}$/);
});
