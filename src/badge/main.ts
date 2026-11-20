import { BACK_ROUTES } from '../data/site';
import { createPresentationChooser } from './flip/choose-presentation';
import { createBadgeFaces } from './flip/faces';
import { createFlipper, prefetchBackPages } from './flip/flipper';
import { COMBOS, createComboDetector } from './input/combos';
import { createInputBus } from './input/bus';
import { wireControls } from './input/controls';
import { APPS } from './os/registry';
import { createRuntime } from './os/runtime';
import { createLcd } from './os/screen';
import { readPageData } from './page-data';
import { safeStorage } from './storage';
import { createThemeController } from './theme/theme';
import { createTiltSource } from './tilt/tilt-source';
import { letSceneFollowTilt } from '../scene/worn-scene';

const root = document.getElementById('badge')!;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const session = safeStorage('session');
const local = safeStorage('local');

const tilt = createTiltSource({ root, reducedMotion, session });
const theme = createThemeController(document.documentElement, local);

// On a qualifying desktop the badge is worn; the lanyard catches the same light.
const scene = document.getElementById('worn-scene');
if (scene) letSceneFollowTilt(scene, tilt);

// Raw input from the badge's controls and keys.
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

const lcd = createLcd(document.getElementById('lcd-screen')!);

// What the OS sees: raw input minus the inputs that complete a combo.
const osBus = createInputBus();
const runtime = createRuntime({
  badge: root,
  lcd,
  apps: APPS,
  bus: osBus,
  ctxBase: { tilt, theme, storage: local, data: readPageData },
  reducedMotion,
  session,
});

// Front ↔ back. The flip lays out #badge's data-side, which wireControls' isActive reads.
const faces = createBadgeFaces(root, document.getElementById('back-slot')!);
const flipper = createFlipper({
  faces,
  presentation: createPresentationChooser(faces, { reducedMotion }),
  onSideChange: (side) => {
    // Tilt only means something while the front faces the visitor.
    tilt.setActive(side === 'front');
    // The flipper hands focus back to the control that started the flip; else the LCD.
    if (side === 'front' && !root.contains(document.activeElement)) lcd.view.focus({ preventScroll: true });
  },
});
// flipTo never throws or rejects (it falls back to normal navigation), so the
// runtime's listener loop is safe.
runtime.onFlip((route) => void flipper.flipTo(route));
runtime.onReady(() => prefetchBackPages(BACK_ROUTES.map((r) => r.route)));

const cheats: Record<keyof typeof COMBOS, () => void> = {
  dev: () => {
    runtime.dispatch({ type: 'UNLOCK_DEV' });
    lcd.toast('DEV MODE: ON');
  },
  konami: () => {
    theme.unlock('midnight');
    lcd.toast('CHEAT ENABLED');
  },
};
const completesCombo = createComboDetector(COMBOS, (name) => cheats[name as keyof typeof COMBOS]());
bus.subscribe((input) => {
  if (!completesCombo(input)) osBus.emit(input);
});

root
  .querySelector('[data-action="reset"]')
  ?.addEventListener('click', () => runtime.dispatch({ type: 'RESET' }));
