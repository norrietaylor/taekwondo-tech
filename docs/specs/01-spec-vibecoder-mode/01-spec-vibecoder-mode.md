# 01-spec-vibecoder-mode

## Introduction/Overview

VibeCoder is a new transformer costume that toggles between a humanoid robot form and a stationary "vibecoding computer" form. While in computer form, the player cannot move or jump but gains the ability to spawn three kinds of combat allies (chickens, ducks, dogs from a dog house) and to hypnotize nearby enemies into temporary allies. On every transform-to-computer action, a "Challenge accepted" speech bubble appears above the player.

This spec also pioneers the `Transformer` strategy refactor recommended in `docs/specs/research-general/research-general.md`. The new base extracts the duplicated transformer pipeline that has shipped six times in `Player.js` (Grimlock, Bumblebee, Hot Rod, Elita, BMW Bouncer, Portal Bot). One existing transformer is migrated to the new base as a parity-tested proof, then VibeCoder is built on top of it. This makes adding the seventh transformer pay down debt instead of growing it.

## Goals

1. Ship a new playable costume **VibeCoder** with a robot ↔ stationary-computer transform, three ally spawn types, and a charm-hypnotize ability.
2. Extract a reusable `Transformer` base/strategy that collapses the per-costume duplication identified in the research report (target: ~50–80% LOC reduction for the pilot migrated transformer).
3. Migrate **BMW Bouncer** (the most recently added pre-VibeCoder transformer) onto the new base with byte-for-behavior parity, proven by the existing `dragon-costume.spec.js` and `class-instantiation.spec.js`.
4. Persist the unlock through `SaveSystem` so the costume survives reload, and surface it through the existing paginated `CraftScene` picker without UI changes.
5. Keep the codebase's zero-build, zero-runtime-deps invariant — no npm additions, no asset files, all visuals procedural.

## User Stories

- **As a player**, I want to unlock VibeCoder by completing level 1 so that I have a fresh transformer available early without having to grind specific objectives.
- **As a player**, I want to press `V` to transform into a vibecoding computer, see a "Challenge accepted" speech bubble, and stop moving so that the form's tactical identity (turret-style) is immediately legible.
- **As a player**, I want to press `1`, `2`, or `3` while in computer form to spawn a chicken, duck, or dog from a dog house that will waddle toward the nearest enemy and damage it, so that I can wage war asynchronously.
- **As a player**, I want to press `X` to charm all enemies within range for 8 seconds so that they fight on my side temporarily.
- **As a player**, I want to press `V` again to revert to robot form so that I can relocate.
- **As a developer**, I want a `Transformer` base class with a registry so that adding the next transformer costume costs ~100 LOC instead of ~600.

## Demoable Units of Work

> Requirement IDs use the format **R{unit}.{seq}**. These are referenced by the planner — do not renumber after approval.

### Unit 1: Transformer strategy base + BMW Bouncer migration

**Purpose:** Extract the duplicated transformer pipeline into a reusable base so VibeCoder (and future transformers) inherit cooldown decrement, form-state toggle, visual rebuild guards, and facing-direction tracking from one source. Migrate BMW Bouncer onto it as parity proof.

**Depends on:** None
**Affected areas:** `js/entities/Player.js`, `js/entities/Transformer.js` (new), `js/entities/transformers/BMWBouncerTransformer.js` (new), `index.html`, `nocache.html`, `tests/class-instantiation.spec.js`

**Functional Requirements:**

- **R1.1**: The system shall expose a `Transformer` class (loaded as a global via `<script>` tag, no ES modules) with a constructor taking `(player, config)` where `config` declares `{ key, cooldownMs, forms: { primary, secondary }, buildVisuals(form, facingRight) }`.
- **R1.2**: The `Transformer` base shall provide `update(delta)` to decrement cooldowns, `tryToggle()` to switch between primary and secondary forms when the cooldown is clear, `currentForm()`, and `rebuildVisualsIfNeeded()` that mirrors the existing `update*VisualsIfNeeded()` pattern (early-return if costume mismatch, rebuild if form or facing direction changed).
- **R1.3**: The system shall provide a `TransformerRegistry` global keyed by costume name. `Player` shall instantiate the registered transformer for the active costume (if any) on outfit change and on construction.
- **R1.4**: The `BMWBouncerTransformer` shall be registered for costume key `bmwBouncer` and shall delegate visual rebuild and cooldown logic to the base such that all behavior in `Player.js:2779-3349` previously handled by the BMW-Bouncer-specific code path now flows through the base.
- **R1.5**: BMW Bouncer's `bounceSlam` ability (currently `Player.js` ~3351-3408) shall remain functionally identical from the player's perspective — same key, same cooldown (6s), same damage, same visual.
- **R1.6**: The legacy BMW-Bouncer-specific fields on `Player` (`bmwBouncerForm`, `bmwBouncerCurrentForm`, `bmwBouncerLastFacingRight`, `bmwBouncerTransformCooldown`, `bmwBouncerVisuals[]`) shall be removed from `Player.js` direct ownership and live inside the `BMWBouncerTransformer` instance instead.
- **R1.7**: All existing Playwright specs (`dragon-costume.spec.js`, `class-instantiation.spec.js`, `game-flow.spec.js`, `level-completion.spec.js`, `menu-operations.spec.js`) shall continue to pass without modification.

**Proof Artifacts:**

- Test: `tests/dragon-costume.spec.js` passes — demonstrates the BMW Bouncer transform (which the existing spec exercises) still works through the new base.
- Test: `tests/class-instantiation.spec.js` passes — demonstrates the new `Transformer` and `BMWBouncerTransformer` classes instantiate cleanly with their required methods.
- File: `js/entities/Transformer.js` exists and exports `Transformer` and `TransformerRegistry` on `window`.

### Unit 2: VibeCoder costume config + robot↔computer transform

**Purpose:** Register the VibeCoder costume in the catalog, hook up the V-key toggle through the new `Transformer` base, render the stationary "computer" form, suppress movement input while in computer form, and show the "Challenge accepted" speech bubble on every robot→computer transition. Wire the level-1-completion unlock through `checkDragonUnlocks()`.

**Depends on:** Unit 1
**Affected areas:** `js/game.js`, `js/entities/Player.js`, `js/entities/transformers/VibeCoderTransformer.js` (new), `js/utils/SpeechBubble.js` (new), `index.html`, `nocache.html`

**Functional Requirements:**

- **R2.1**: The system shall add a `vibeCoder` entry to `TaekwondoRobotBuilder.dragonCostumes` (in `js/game.js`) with all required costume fields (`name: 'VibeCoder'`, `icon`, `primaryColor`, `secondaryColor`, `beltColor`, `description`, `unlockCondition: 'Complete level 1'`, `effectColor`, plus `canTransform: true`, `transformKey: 'V'`, `currentForm: 'robot'`, `unlocked: false`).
- **R2.2**: The system shall add an unlock branch in `checkDragonUnlocks()` (`js/game.js`) such that when `gameData.currentLevel >= 2` (i.e. at least one level completed), `unlockOutfit('vibeCoder')` is called if not already unlocked.
- **R2.3**: The system shall register `VibeCoderTransformer` in `TransformerRegistry` for costume key `vibeCoder` with cooldown 1000ms, primary form `robot`, secondary form `computer`.
- **R2.4**: While the player's active costume is `vibeCoder` and the current form is `computer`, `Controls.getHorizontal()` and `Controls.isJump()` shall be ignored by `Player.update()` so the player remains stationary on the ground; physics velocity X shall be zeroed each frame.
- **R2.5**: When the transformer toggles from `robot` to `computer`, a `SpeechBubble` shall appear above the player containing the text "Challenge accepted" and shall fade out after 1500ms.
- **R2.6**: The computer form visual shall be a procedurally-drawn rectangle with a contrasting "screen" rectangle on top, rendered via `scene.add.container` + child `scene.add.rectangle` calls (no asset files).
- **R2.7**: VibeCoder shall appear in the existing `CraftScene` paginated picker without picker code changes (since the picker reads `dragonCostumes` keys at runtime).

**Proof Artifacts:**

- Test: a new `tests/vibecoder-transform.spec.js` passes, asserting that after `setOutfit('vibeCoder')` and a simulated V-key press, `window.gameInstance.player.transformer.currentForm() === 'computer'` and the player's body velocity X is 0 across two consecutive frames despite a held right-arrow input.
- Test: the same spec asserts that `Player.transformer.lastSpeechBubbleText === 'Challenge accepted'` (or an equivalent observable) after the robot→computer transform.
- Browser: navigating to `index.html`, completing level 1, and opening the costume picker shows VibeCoder as `Unlocked`.

### Unit 3: Ally spawning (chickens, ducks, dog houses) with combat AI

**Purpose:** Add a `VibeSpawn` entity class for the three ally types, wire `1`/`2`/`3` keys to spawn them while in computer form, enforce a 6-ally cap, and give each spawn a simple "waddle to nearest enemy and damage on contact" AI. Dog houses are stationary structures that periodically emit a dog spawn.

**Depends on:** Unit 2
**Affected areas:** `js/entities/VibeSpawn.js` (new), `js/entities/Player.js`, `js/scenes/GameScene.js`, `index.html`, `nocache.html`

**Functional Requirements:**

- **R3.1**: The system shall expose a `VibeSpawn` class on `window` with constructor `(scene, x, y, type)` where `type ∈ { 'chicken', 'duck', 'dog', 'doghouse' }`.
- **R3.2**: A `VibeSpawn` of type `chicken`, `duck`, or `dog` shall, on each `update()`, locate the nearest enemy in `GameScene.enemies` and apply a horizontal velocity of ±60px/s toward it. On overlap with an enemy, it shall call `enemy.takeDamage(5)` (or the existing equivalent) and despawn itself.
- **R3.3**: A `VibeSpawn` of type `doghouse` shall be stationary, render a small house-shaped graphic, and emit a `dog` spawn at its position every 3000ms while it lives. The dog house shall live for 12000ms then despawn. Emitted dogs count against the global ally cap.
- **R3.4**: While the player's costume is `vibeCoder` and current form is `computer`, pressing key `1` spawns a chicken at the player's position, `2` spawns a duck, `3` spawns a dog house. While in robot form, these keys shall have no effect.
- **R3.5**: The system shall enforce a maximum of **6** simultaneously-active VibeSpawns (counting chickens, ducks, dogs, and the dog house itself). Spawn requests beyond the cap shall be silently ignored.
- **R3.6**: Each spawn type shall have a distinct procedural visual: chicken (small white rect with yellow beak), duck (small yellow rect with orange beak), dog (small brown rect), dog house (red triangular roof on a brown rect). All rendered with `scene.add.rectangle` / `scene.add.triangle` — no asset files.
- **R3.7**: All VibeSpawns belonging to the player shall be cleaned up on scene shutdown and on transform back to robot form (the ally session ends when the computer form ends).

**Proof Artifacts:**

- Test: `tests/vibecoder-spawns.spec.js` (new) asserts that pressing `1` six times in computer form produces exactly 6 chickens in `window.gameInstance.player.vibeSpawns`, and the seventh press leaves the count at 6.
- Test: same spec asserts that after spawning one chicken with an enemy present at a known position, the chicken's body velocity X has the same sign as `enemy.x - player.x` within 100ms of spawn (movement-toward-enemy AI).
- Test: same spec asserts that placing a `doghouse` and waiting > 3500ms results in at least one new `dog` VibeSpawn (the periodic dog emission).

### Unit 4: Charm-hypnotize ability with cooldown

**Purpose:** Add the `X`-key charm ability that flips all enemies within a radius onto the player's side for 8 seconds, with a 4-second cooldown. Charmed enemies attack other (still-hostile) enemies. Visualize the effect with a spiral overlay on each charmed enemy.

**Depends on:** Unit 2
**Affected areas:** `js/entities/Player.js`, `js/entities/Enemy.js`, `js/entities/transformers/VibeCoderTransformer.js`, `tests/vibecoder-charm.spec.js` (new)

**Functional Requirements:**

- **R4.1**: The `VibeCoderTransformer` shall track a `charmCooldownMs` that decrements each frame and starts at 0. Pressing `X` while in computer form, costume `vibeCoder`, AND `charmCooldownMs <= 0` shall trigger the charm; otherwise the press is a no-op.
- **R4.2**: On charm trigger, the system shall iterate enemies in `GameScene.enemies` and for every enemy within 250px of the player, set `enemy.charmed = true`, `enemy.charmExpiresAt = now + 8000`, and visually attach a spinning spiral graphic above the enemy.
- **R4.3**: A charmed enemy's existing AI (`Enemy.update()`) shall be branched: while `charmed === true`, the enemy shall locate the nearest **uncharmed** enemy and pursue/attack it instead of the player; when none remain, it shall idle.
- **R4.4**: When `charmExpiresAt < now`, the enemy shall revert to its prior AI (charmed flag false, spiral graphic destroyed).
- **R4.5**: The charm cooldown shall be 4000ms — set `charmCooldownMs = 4000` on each successful trigger.
- **R4.6**: The charm ability shall be unavailable in robot form even if the costume is `vibeCoder` (key X press has no effect).

**Proof Artifacts:**

- Test: `tests/vibecoder-charm.spec.js` asserts that with three enemies spawned within 250px of the player in computer form, pressing X marks all three as `charmed === true` and starts their `charmExpiresAt` timer ≈ 8000ms in the future.
- Test: same spec asserts that an enemy outside the 250px radius remains `charmed === false` after X is pressed (radius enforcement).
- Test: same spec asserts that calling X again 1000ms after the first activation does NOT re-trigger (cooldown enforcement) but calling X again 4500ms after does re-trigger.

## Non-Goals (Out of Scope)

- **Audio.** No `.mp3`/`.ogg` files; the speech bubble is text-only. The codebase ships zero audio assets and we are not adding any.
- **Migrating the other five transformers** (Grimlock, Bumblebee, Hot Rod, Elita, Portal Bot) onto the new base. Only BMW Bouncer is migrated as proof. The remaining five stay on the legacy code path and can be migrated incrementally in follow-up specs.
- **Refactoring the `window.gameInstance` singleton** to use Phaser's registry/events. That is a separate spec.
- **A unique mini-game scene** like Pac-Man. VibeCoder lives entirely inside `GameScene` (and any other gameplay scene where the player exists).
- **Save data migration tooling beyond the existing pattern.** New costume keys are added to the unlocked-defaults list using the same approach as BMW Bouncer (`game.js:712-715`).
- **Networking, multiplayer, persistence beyond localStorage, or analytics.** None of these exist in the codebase and we are not introducing them.
- **Mobile touch buttons for the new keys.** Keyboard is primary; mobile parity for `1`/`2`/`3`/`V`/`X` is a follow-up.

## Design Considerations

- **Visual identity**: VibeCoder reads as a "code-y" cyan-and-magenta theme. Suggested palette: `primaryColor: 0x00ffff` (cyan), `secondaryColor: 0xff00ff` (magenta), `beltColor: 0x222244`, `effectColor: 0x66ffaa`. Computer form adds a "screen" rectangle in `0x111122` with scanline overlay drawn as 3 horizontal lines.
- **Speech bubble**: simple white rounded-rectangle behind black text, drawn via `scene.add.graphics()` for the bubble + `scene.add.text()` for the text. Fade-out via `scene.tweens.add({ alpha: 0, duration: 600 })` after a 900ms hold.
- **Spawn visuals**: tiny silhouettes (12–20px). Chickens jitter slightly; ducks have a flat waddle; the dog house is the largest (~40×40px) and immobile.
- **Charm spiral**: drawn as a `Phaser.Geom.Polyline`-spiral with `scene.tweens.add({ angle: 360, repeat: -1, duration: 800 })` for rotation.

## Repository Standards

- **Globals via `<script>` tags**: every new class is exposed via `window.ClassName` and added to `index.html` and `nocache.html` script load lists. No ES modules, no bundler, no transpilation.
- **No npm runtime deps**: only `@playwright/test` exists in `package.json` devDependencies. No additions.
- **Procedural visuals only**: all sprites use `scene.add.rectangle` / `scene.add.triangle` / `scene.add.circle` / `scene.add.graphics`. No image, sprite-sheet, or audio asset files.
- **`window.gameInstance` singleton stays**: this spec does NOT touch the global. New transformers reach `gameData` and `getDragonCostume(name)` via the singleton, consistent with current code.
- **Cache-busting**: any new JS file must be added to BOTH `index.html` (production load order) and `nocache.html` (dev cache-bust loader).
- **Costume catalog convention**: new costumes are added as a flat config dict in `dragonCostumes` (`game.js:5-536`). Optional fields default to falsy; existing costumes' shapes are not modified.
- **Test pattern**: Playwright drives a real browser against the auto-spawned `python3 -m http.server 8000`. Tests introspect game state via `page.evaluate(() => window.gameInstance.*)`. No mocks.

## Verification

**Project maturity:** Partial.

**Available commands:**

| Check | Command |
|-------|---------|
| Lint  | none |
| Build | none (no build step — vanilla JS served as-is) |
| Test  | `npm test` (runs `playwright test` against an auto-spawned `python3 -m http.server 8000`) |

**Greenfield bootstrapping:** N/A — `npm test` is available and is the verification gate for every unit. Lint and build do not exist in the repo and are explicitly out of scope per Repository Standards.

## Technical Considerations

### Transformer base shape (Unit 1)

The base must be small and observably equivalent to existing per-costume code. Suggested signature:

```js
class Transformer {
  constructor(player, config) {
    this.player = player;
    this.config = config;
    this.form = config.forms.primary;
    this.cooldownMs = 0;
    this.lastFacingRight = player.facingRight;
    this.visuals = [];
  }
  update(delta) {
    if (this.cooldownMs > 0) this.cooldownMs -= delta;
    this.rebuildVisualsIfNeeded();
  }
  tryToggle() {
    if (this.cooldownMs > 0) return false;
    this.cooldownMs = this.config.cooldownMs;
    this.form = (this.form === this.config.forms.primary)
      ? this.config.forms.secondary
      : this.config.forms.primary;
    this.rebuildVisualsIfNeeded(true);
    if (this.config.onToggle) this.config.onToggle(this.form, this.player);
    return true;
  }
  rebuildVisualsIfNeeded(force = false) {
    const facing = this.player.facingRight;
    if (!force && facing === this.lastFacingRight && this.visuals.length > 0) return;
    this.visuals.forEach(v => v.destroy());
    this.visuals = this.config.buildVisuals(this.form, facing, this.player);
    this.lastFacingRight = facing;
  }
  currentForm() { return this.form; }
  destroy() {
    this.visuals.forEach(v => v.destroy());
    this.visuals = [];
  }
}
```

`TransformerRegistry` is a plain `{}` map: `TransformerRegistry.bmwBouncer = (player) => new Transformer(player, bmwBouncerConfig)`.

`Player` constructs `this.transformer = TransformerRegistry[outfit]?.(this) ?? null` on outfit change and on init, calls `this.transformer?.update(delta)` once per frame, and routes the relevant transform key (V for VibeCoder, L for BMW Bouncer) to `this.transformer?.tryToggle()`.

### BMW Bouncer migration risk

BMW Bouncer's `bounceSlam` (its special move, separate from the transform) lives at roughly `Player.js:3351-3408` and reads from BMW-specific cooldown fields. Migration must keep the slam wired: simplest path is to keep `bounceSlam()` as a method on `Player` that reads `this.transformer?.config.bounceSlam` for tuning while leaving the slam logic in `Player.js`. The base only owns the transform pipeline; per-costume special abilities continue to live on `Player` for now (refactoring those is out of scope).

### Stationary computer form

`Player.update()` already branches on the active costume in many places. For the stationary lock, the cleanest hook is a single conditional at the start of the movement section:

```js
const lockedStationary = this.transformer?.config.stationaryInForm === this.transformer?.currentForm();
if (lockedStationary) {
  this.body.setVelocityX(0);
  // skip movement input
} else {
  // existing movement code
}
```

The flag lives in `VibeCoderTransformer`'s config: `stationaryInForm: 'computer'`.

### Speech bubble lifecycle

`SpeechBubble` is a small utility that owns its own graphics, text, and tween. The transformer holds a reference and replaces it on each invocation; on destroy, the bubble cleans itself up. Position updates each frame to follow the player.

### Ally cap enforcement

The cap is enforced inside `Player.spawnVibeAlly(type)` by checking `this.vibeSpawns.length` (filtered to live spawns) before constructing. Dog-house-emitted dogs go through the same path so they share the cap.

### Charm AI branch

`Enemy.update()` already has state branches (`patrol`, `chase`, `attack`, `stunned`). Adding `charmed` follows the same pattern: a top-level `if (this.charmed)` early-exits to charmed-state logic. Cleanup on expiry restores the prior state.

### Test introspection

To keep tests assertable, every new piece of state needed by Playwright must be reachable from `window.gameInstance`:

- `gameInstance.player.transformer` (Transformer instance, has `.currentForm()`, `.cooldownMs`, `.charmCooldownMs` for VibeCoder)
- `gameInstance.player.vibeSpawns[]` (array of live VibeSpawn instances)
- `gameInstance.player.transformer.lastSpeechBubbleText` (string | null)
- Each `Enemy` exposes `.charmed`, `.charmExpiresAt`

This is the same access pattern existing specs use (`window.gameInstance.gameData.*`, `window.gameInstance.player.*`).

### Load order

`Transformer.js` must load before `BMWBouncerTransformer.js`, `VibeCoderTransformer.js`, and `Player.js`. `VibeSpawn.js` must load before `Player.js`. Both `index.html` and `nocache.html` need updates.

## Security Considerations

None. The change is entirely client-side, all-local game logic. No network, no auth, no PII, no secrets, no user input beyond key presses. `localStorage` already holds the save blob; we only add a new boolean unlock entry to the existing schema.

## Success Metrics

- **Functional**: All four units' Playwright specs pass green on `npm test` across the existing browser projects (chromium, firefox, webkit, Mobile Chrome, Mobile Safari).
- **Refactor payoff**: Lines of BMW-Bouncer-specific code remaining in `Player.js` after Unit 1 is **≤ 50** (down from ~570 across state/visuals/cooldown/toggle). Measured by `grep -c bmwBouncer js/entities/Player.js`.
- **Regression budget**: Zero existing Playwright specs modified; all pass without flakes on three consecutive runs.
- **LOC budget**: Total net additions across the four units ≤ 1500 LOC including tests. Of that, the `Transformer` base is ≤ 200 LOC.
- **Player UX**: completing level 1, equipping VibeCoder, transforming to computer, spawning all three ally types, charming an enemy group, and reverting to robot is achievable end-to-end inside the existing GameScene.

## Open Questions

- **Speech bubble re-trigger window**: should rapidly retransforming (V-V-V) queue multiple bubbles, replace the current one, or rate-limit to once per 2s? Current spec implies replace-on-each-trigger; can adjust if it feels noisy in playtest.
- **Charm visual cost**: on screens with many enemies, attaching a spiral graphic per charmed enemy could visibly drop frames. If profiling shows an issue we can switch to a single full-screen tint pulse instead. Out of scope to decide before implementation.
