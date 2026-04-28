# T03 Proofs — Ally spawning (chickens, ducks, dog houses)

Spec: `docs/specs/01-spec-vibecoder-mode/01-spec-vibecoder-mode.md`
Unit: 3 (VibeSpawn entity + Player integration)
Task ID: #9 (T03)
Owner: worker-3
Run: 2026-04-27T20:16:00Z

## Summary

Implemented the `VibeSpawn` entity class and wired it into `Player.js`:

- **`js/entities/VibeSpawn.js`** (new, 358 LOC) — four types (chicken, duck, dog, doghouse):
  - Chicken/duck/dog: waddle toward nearest alive/uncharmed enemy at ±60px/s; damage on contact and self-despawn.
  - Doghouse: stationary, emits a dog every 3000ms via `player.spawnVibeAlly('dog')`, despawns after 12000ms.
  - All visuals: procedural rectangles/triangles, no assets.

- **`js/entities/Player.js`** (modified):
  - `this.vibeSpawns = []` added to constructor.
  - `vibeSpawn1/2/3` keys added to `previousInputs`.
  - `handleVibeCoderSpawns()` — edge-detects Digit1/2/3 while in computer form and calls `spawnVibeAlly()`.
  - `spawnVibeAlly(type, x, y)` — enforces 6-ally cap before constructing.
  - `cleanupVibeSpawns()` — despawns all and clears array.
  - `_updateVibeSpawns(delta)` — ticks all live spawns each frame, prunes dead ones.
  - Scene `shutdown` event wired for automatic cleanup.

- **`js/entities/transformers/VibeCoderTransformer.js`** (modified):
  - `onToggle` now calls `player.cleanupVibeSpawns()` when toggling back to robot form.

- **`index.html`** + **`nocache.html`**: `VibeSpawn.js` added before `Player.js`.

- **`tests/vibecoder-spawns.spec.js`** (new, 9 tests): full R3.x coverage.

## Requirements coverage

| Req   | Status | Evidence |
|-------|--------|----------|
| R3.1  | PASS   | `window.VibeSpawn` is a function; verified by R3.1 test. |
| R3.2  | PASS   | Chicken velocity X sign matches enemy direction after manual update ticks. |
| R3.3  | PASS   | Doghouse emits a dog after 3001ms update; despawns after 12001ms. |
| R3.4  | PASS   | Keys 1/2/3 guarded by `transformer.currentForm() !== 'computer'` early return. |
| R3.5  | PASS   | 7 spawn calls produce exactly 6 live spawns (cap at 6, 7th returns null). |
| R3.6  | PASS   | All four types use Rectangle/Triangle/Arc objects; no Sprite/Image types. |
| R3.7  | PASS   | `cleanupVibeSpawns()` empties array; also called on robot toggle and scene shutdown. |

## Proof artifacts

| File                                          | Type | Status |
|-----------------------------------------------|------|--------|
| `T03-01-test-vibecoder-spawns.txt`            | test | PASS   |
| `T03-02-test-vibecoder-transform-regression.txt` | test | PASS |
| `T03-03-file-vibe-spawn-globals.txt`          | file | PASS   |

## Regression check

T02 spec (vibecoder-transform.spec.js): 8/8 PASS — no regressions.
Pre-existing dragon-costume.spec.js failures (8 tests) remain unchanged — these were failing before T03 (confirmed by T01 proof doc: 217 pre-existing failures on baseline).

## Files touched

- New: `js/entities/VibeSpawn.js`
- New: `tests/vibecoder-spawns.spec.js`
- New: `docs/specs/01-spec-vibecoder-mode/03-proofs/` (this directory)
- Modified: `js/entities/Player.js` (vibeSpawns init, handleVibeCoderSpawns, spawnVibeAlly, cleanupVibeSpawns, _updateVibeSpawns, scene shutdown hook, previousInputs)
- Modified: `js/entities/transformers/VibeCoderTransformer.js` (onToggle cleanup hook)
- Modified: `index.html` (script tag)
- Modified: `nocache.html` (script list)
