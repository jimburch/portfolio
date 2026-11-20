# Hand-turn spike (v10): reference for the desktop hand turn

A throwaway spike, not production code. It's the locked MVP motion for the
desktop flip (DECISIONS, 2026-11-19), kept here so the build has the exact
reference. Design: `docs/superpowers/specs/2026-11-19-desktop-hand-turn-design.md`.

| File | What it is |
|---|---|
| `spike-grab-turn-v10.html` | The spike page: the worn scene, the DOM badge, the three.js hand, a scrubber (`#sp-t`, 0–1000), play/reverse/speed controls. `render(t)` is synchronous and `window.__ready` is set once loaded. three.js 0.187.0 comes from jsDelivr. |
| `hand-v10.glb` | The hand + forearm + sleeve the page loads (220 KB, uncompressed). |
| *(moved)* | The Blender build, its source asset (`@webxr-input-profiles/assets@1.0.20`, `profiles/generic-hand/right.glb`) and the asset's MIT licence (© 2019 Amazon) now live in `scripts/hand/` (see its README). That build still produces this `hand-v10.glb` byte for byte. |
| `spike-report.md` | Round-by-round notes v3–v10: what changed, the numbers, what's still weak. |
| `screens/` | v10 video, contact sheet, final pose, hand close-up, wrist comparison. |

## Running it

- **The page:** serve this folder over HTTP (for example `python3 -m http.server`
  here) and open `spike-grab-turn-v10.html`. It loads `hand-v10.glb` from the
  same folder.
- **Rebuilding the hand:** see `scripts/hand/README.md` (`pnpm hand:model`
  builds the shipped, compressed model; the Blender command there writes the
  uncompressed `hand-v10.glb` this page loads).
