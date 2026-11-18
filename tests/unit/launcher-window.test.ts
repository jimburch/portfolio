import { describe, expect, it } from 'vitest';
import { launcherWindow } from '../../src/badge/os/screen';

describe('launcherWindow', () => {
  it('shows everything when the list fits', () => {
    expect(launcherWindow(3, 2, 0, 4)).toBe(0);
  });

  it('keeps the window still while the selection stays inside it', () => {
    expect(launcherWindow(7, 3, 0, 4)).toBe(0);
    expect(launcherWindow(7, 3, 2, 4)).toBe(2);
  });

  it('scrolls down just enough to show the selection', () => {
    expect(launcherWindow(7, 4, 0, 4)).toBe(1);
    expect(launcherWindow(7, 6, 1, 4)).toBe(3);
  });

  it('scrolls up just enough to show the selection', () => {
    expect(launcherWindow(7, 2, 3, 4)).toBe(2);
  });

  it('jumps to the top when the selection wraps to the first item', () => {
    expect(launcherWindow(7, 0, 3, 4)).toBe(0);
  });

  it('never leaves empty rows at the bottom', () => {
    expect(launcherWindow(7, 6, 5, 4)).toBe(3);
    expect(launcherWindow(5, 1, 3, 4)).toBe(1);
  });
});
