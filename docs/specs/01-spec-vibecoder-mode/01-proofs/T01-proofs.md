# T01 Proofs — Transformer strategy base + BMW Bouncer migration

Spec: `docs/specs/01-spec-vibecoder-mode/01-spec-vibecoder-mode.md`
Unit: 1 (Transformer base + BMW Bouncer migration)
Task ID: #7 (T01)
Owner: worker-1
Run: 2026-04-27T19:42:00Z (Pacific)

## Summary

Extracted the duplicated transformer pipeline from `js/entities/Player.js`
into:

- `js/entities/Transformer.js` — shared base class (`window.Transformer`)
  + plain registry (`window.TransformerRegistry`)
- `js/entities/transformers/BMWBouncerTransformer.js` — config + factory
  registered under the `bmwBouncer` costume key

`Player.js` now constructs an active Transformer per outfit via
`syncTransformerForOutfit()` and ticks it once per frame inside
`updateVisuals()`. The five legacy `bmwBouncer*` instance fields are gone
from `Player`'s direct ownership; `bounceSlam` continues to live on
`Player` per the spec, reading the active form via
`this.transformer.currentForm()`.

`index.html`, `nocache.html`, and `tests/unit-tests.html` were updated to
load Transformer.js and BMWBouncerTransformer.js BEFORE Player.js.

## Requirements coverage

| Req   | Status | Evidence |
|-------|--------|----------|
| R1.1  | PASS   | `js/entities/Transformer.js` exposes `class Transformer` on `window`. |
| R1.2  | PASS   | `update`, `tryToggle`, `currentForm`, `rebuildVisualsIfNeeded` defined; rebuild guards on form/facing change mirror legacy `update*VisualsIfNeeded` pattern. |
| R1.3  | PASS   | `Player.syncTransformerForOutfit()` reads `window.TransformerRegistry[currentOutfit]`, builds on outfit change + on construction. |
| R1.4  | PASS   | `BMWBouncerTransformer.js` registers `TransformerRegistry.bmwBouncer`; visual rebuild + cooldown delegated to base. |
| R1.5  | PASS   | `bounceSlam` retained on `Player` (key, 6000ms cooldown, damage, trampoline visual unchanged); now reads form via `this.transformer.currentForm()`. |
| R1.6  | PASS   | All five legacy fields removed from `Player` direct ownership; verified via `grep "this\\.bmwBouncer" js/entities/Player.js` -> no matches. |
| R1.7  | PASS   | `npm test` shows zero new failures: 128 passed / 217 failed on both HEAD baseline AND post-migration. No `tests/*.spec.js` file modified. |

## Proof artifacts

| File                                       | Type | Status |
|--------------------------------------------|------|--------|
| `T01-01-test-dragon-costume.txt`           | test | PASS   |
| `T01-02-test-class-instantiation.txt`      | test | PASS   |
| `T01-03-file-transformer-globals.txt`      | file | PASS   |

## Test parity (R1.7)

Both runs were executed against the same Playwright config + spec set,
with the OrbStack/distillery container temporarily stopped so Playwright
could spawn its own `python3 -m http.server 8000`.

| Run                                          | Passed | Failed |
|----------------------------------------------|-------:|-------:|
| HEAD (no Transformer base, legacy code path) |   128  |   217  |
| With Transformer base + BMW migration        |   128  |   217  |

Delta: 0. No new failures, no spec modified.

The 217 pre-existing failures are unrelated to the BMW Bouncer migration
(see `T01-01-test-dragon-costume.txt` for the breakdown — costume count
drift in the legacy spec, Firefox/Mobile-Safari window.gameInstance
timing, and Phaser stub limitations in unit-tests.html).

## Files touched

- New: `js/entities/Transformer.js`
- New: `js/entities/transformers/BMWBouncerTransformer.js`
- Modified: `js/entities/Player.js` (~248 LOC removed, ~94 LOC added)
- Modified: `index.html` (script tags)
- Modified: `nocache.html` (script tags)
- Modified: `tests/unit-tests.html` (script tags — load-order fixture, not a spec)
