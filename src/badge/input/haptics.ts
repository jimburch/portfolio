/* A short haptic tick for a press on the badge.

   With the Vibration API (Android) it is an ~8 ms vibrate. iOS Safari has no
   Vibration API, but since iOS 18 toggling an `<input type="checkbox" switch>`
   plays the system haptic, so a hidden switch is toggled through its label.
   That only works inside the press's own event handler (user activation), so
   call `haptic()` synchronously from it. Off under reduced motion. Never throws. */

const VIBRATE_MS = 8;

/* The switch is never rendered: that keeps it out of layout and hit testing,
   and makes it unfocusable, so the label click cannot pull focus onto it (the
   badge ignores keys aimed at an input). The toggle still runs; that the
   haptic still plays for an unrendered switch can only be confirmed on an
   iPhone. */
const HIDDEN = 'display:none';

export interface HapticEnv {
  navigator: { vibrate?: Navigator['vibrate'] };
  document: Pick<Document, 'createElement' | 'body'>;
  reducedMotion(): boolean;
}

export function createHaptic(env: HapticEnv): () => void {
  let label: HTMLLabelElement | null = null;

  /** The hidden switch's label, created on first use. */
  function switchLabel(): HTMLLabelElement {
    if (label) return label;
    const input = env.document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    input.tabIndex = -1;
    const created = env.document.createElement('label');
    created.setAttribute('aria-hidden', 'true');
    created.style.cssText = HIDDEN;
    created.append(input);
    env.document.body.append(created);
    label = created;
    return created;
  }

  return () => {
    try {
      if (env.reducedMotion()) return;
      if (typeof env.navigator.vibrate === 'function') env.navigator.vibrate(VIBRATE_MS);
      else switchLabel().click();
    } catch {
      /* haptics are optional */
    }
  };
}

let browserHaptic: (() => void) | null = null;

/** One haptic tick in this browser. Call it synchronously from a press's event handler. */
export function haptic(): void {
  browserHaptic ??= createHaptic({
    navigator,
    document,
    reducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  });
  browserHaptic();
}
