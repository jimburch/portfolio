import { safeStorage } from './storage';
import { createTiltSource } from './tilt/tilt-source';

const root = document.getElementById('badge')!;

createTiltSource({
  root,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  session: safeStorage('session'),
});
