import { createInputBus } from './input/bus';
import { wireControls } from './input/controls';
import { safeStorage } from './storage';
import { createTiltSource } from './tilt/tilt-source';

const root = document.getElementById('badge')!;

const tilt = createTiltSource({
  root,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  session: safeStorage('session'),
});

const bus = createInputBus();

// Test hook: every emit rewrites a fresh value so repeated inputs still mutate.
let seq = 0;
bus.subscribe((input) => {
  document.documentElement.dataset.lastInput = `${input}:${seq++}`;
});

wireControls(root, bus, {
  onFirstGesture: () => void tilt.requestPermissionFromGesture(),
  isActive: () => root.dataset.side === 'front',
});
