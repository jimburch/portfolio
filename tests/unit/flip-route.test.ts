import { expect, test } from 'vitest';
import { backRouteOf } from '../../src/badge/flip/flipper';

test('the front page has no back route', () => {
  expect(backRouteOf('/')).toBeNull();
  expect(backRouteOf('')).toBeNull();
});
test('back routes lose their trailing slash', () => {
  expect(backRouteOf('/resume')).toBe('/resume');
  expect(backRouteOf('/resume/')).toBe('/resume');
  expect(backRouteOf('/projects/vonbox/')).toBe('/projects/vonbox');
});
