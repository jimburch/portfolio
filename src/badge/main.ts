import { BACK_ROUTES } from '../data/site';
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

const root = document.getElementById('badge')!;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const session = safeStorage('session');
const local = safeStorage('local');

const tilt = createTiltSource({ root, reducedMotion, session });
const theme = createThemeController(document.documentElement, local);

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
  screen: lcd.view,
  apps: APPS,
  bus: osBus,
  ctxBase: { tilt, theme, storage: local, data: readPageData },
  reducedMotion,
  session,
});

// Front ↔ back. The flipper owns #badge's data-side, which wireControls' isActive reads.
const flipper = createFlipper({
  badge: root,
  backSlot: document.getElementById('back-slot')!,
  reducedMotion,
  onSideChange: (side) => {
    if (side === 'front') lcd.view.focus({ preventScroll: true });
  },
});
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
