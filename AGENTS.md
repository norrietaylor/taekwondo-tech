# AGENTS.md

Operational guide for AI agents (and humans) working in the Taekwondo Tech repo.

## Project shape

- Phaser 3 HTML/JS game. **No bundler, no TypeScript, no build step.**
- Every JS file is loaded via plain `<script src="...">` tags in `index.html`. New files do not run until they have a script tag.
- Entry point: open `index.html` (or serve via `npm start`).
- Game class: `TaekwondoRobotBuilder` in `js/game.js`. Canonical runtime handle: `window.gameInstance`.
- Core mechanic this codebase revolves around: **costume characters** — robot transformations (dragons, BMW Bouncer, Portal Bot, Stone Dragon, Bumblebee, Hot Rod, Grimlock, etc.). Adding a new costume is the single most common change. See "How to add a new costume character" below.

## Run / test / lint loop

```bash
npm start              # python3 -m http.server 8000 — open http://localhost:8000
npm test               # Playwright end-to-end tests
npm run test:headed    # Playwright with a visible browser
npm run test:debug     # Playwright inspector
npm run lint           # Lint JS sources
npm run format         # Auto-format JS sources
npm run check          # Lint + tests, run everything before pushing
```

Run `npm run check` before opening a PR. Tests are Playwright; they drive the real browser and the real canvas — **do not mock the canvas**.

## Code layout map

- `index.html` — script tag order matters. Phaser + utils + entities + scenes + `game.js` last.
- `js/game.js` — the `TaekwondoRobotBuilder` class.
  - `this.dragonCostumes = { ... }` costume registry at line ~5 (continues to ~536). Source of truth for every costume.
  - `checkDragonUnlocks()` at line ~762 — line ~886 — unlock condition evaluator.
- `js/entities/Player.js` — **7,400+ line god file.** Per-costume transform logic, special moves, animation, projectiles. Read in chunks; do not read top-to-bottom.
  - Wing-hiding hardcoded transformer list around line ~460 (see gotchas).
  - Transformer-key handler examples: `isGrimlockTransform` calls at lines ~1617, ~2093, ~2298, ~2578, ~2780, ~2815.
  - BMW Bouncer car-form check example at line ~4109.
- `js/scenes/CraftScene.js` — costume picker overlay.
  - `showOutfitSelection()` at line ~638. Contains a **hardcoded array of costume keys** that drives the picker grid. Adding a costume to the registry is not enough — the key must also appear here.
- `js/utils/Controls.js` — input helpers; transform-key detectors like `isGrimlockTransform()` around line ~415. Every transformer costume needs an entry here.
- `js/utils/SaveSystem.js` — persistence of unlocks. Costume unlock state lives here.
- `tests/dragon-costume.spec.js` — Playwright costume tests. Reuse its patterns when adding tests for a new costume.
- `docs/features/*.md` — design notes for specific costumes (dragon-costume, dragon-wings, legendary-mode, power-ups). Reference these for tone and depth when adding a sibling doc.

## How to add a new costume character — end-to-end checklist

The costume system has surface area in 4-5 files. Skipping any step usually shows up as either an invisible costume in the picker, missing wings, or a transform key that does nothing. Follow all nine steps in order.

### Step 1 — Register the costume in `js/game.js`

Open `js/game.js` and add a new entry to the `this.dragonCostumes` object (begins line ~5). Use a unique snake_or_camelCase key. Copy the shape of a nearby costume — do not invent fields.

```js
this.dragonCostumes = {
  // ...existing entries...
  newCostumeKey: {
    name: 'Display Name',
    icon: 'icon-string',          // emoji or short label rendered in picker
    primaryColor: 0xRRGGBB,        // hex literal, no '#'
    secondaryColor: 0xRRGGBB,
    beltColor: 0xRRGGBB,
    description: 'One-line flavor text shown in picker.',
    unlockCondition: 'beat_level_N',  // string consumed by checkDragonUnlocks
    effectColor: 0xRRGGBB,            // particle / aura tint
    projectileEnabled: true,
    projectileType: 'fireball',       // see existing entries for valid values
    projectileColor: 0xRRGGBB,
    projectileDamage: 25,
    // Transformer-only fields (omit for non-transformers):
    canTransform: true,
    transformKey: 'newTransform',
    currentForm: 'robot',
    // Special-move flags (one per gameplay variant):
    // isBmwBouncer: true,
    // isPortalBot: true,
  },
};
```

**Use `Edit`, not `Write`.** The registry is large; a full rewrite risks clobbering sibling entries.

### Step 2 — Add the unlock branch in `checkDragonUnlocks()`

In the same file at line ~762, extend `checkDragonUnlocks()` with a branch that matches your `unlockCondition` string and flips the unlock for `newCostumeKey`. Match the style of existing branches — usually one `if` checking save state or level progress, then `this.unlockedCostumes.newCostumeKey = true;` (or whatever pattern the surrounding code uses).

### Step 3 — Add the costume key to the picker array in `CraftScene.js`

Open `js/scenes/CraftScene.js` and find `showOutfitSelection()` at line ~638. Append `'newCostumeKey'` to the hardcoded array of keys. Without this step the costume exists in the registry but never appears in the UI. (Tech-debt: this array should be derived from registry keys — issue is filed; do not refactor in the same PR as a new costume.)

### Step 4 — Add an input mapping in `Controls.js` (transformers only)

If `canTransform: true`, open `js/utils/Controls.js` near line ~415 and add a detector method matching your `transformKey`:

```js
isNewTransform() {
  return this.keys && this.keys.NEW_TRANSFORM && this.keys.NEW_TRANSFORM.isDown;
}
```

Wire the key binding up the same way neighbouring transformers do (e.g. `Phaser.Input.Keyboard.KeyCodes.X`). Re-use an existing key only if the costume genuinely shares semantics.

### Step 5 — Implement transform / special-move handlers in `Player.js`

In `js/entities/Player.js` add handlers for your costume. The patterns to mirror:

- **Cooldown gate** at the top of any new ability method:
  ```js
  if (this.newCostumeCooldown > 0) return;
  this.newCostumeCooldown = 30; // frames
  ```
  Decrement the cooldown in `Player.update()` alongside the existing `*Cooldown` decrements.
- **Form switching** for transformers: read `this.controls.isNewTransform()` in `update()`, gated on `!this.previousInputs.newTransform` (rising-edge), and toggle `costume.currentForm`. Search for `isGrimlockTransform` (~line 1617) to see the established shape.
- **Flag checks** for special moves: `if (costume.isNewCostume && ...) { ... }`. Search for `isBmwBouncer` (~line 4109) for an example.

Because `Player.js` is 7,400+ lines, read it in 500-line chunks centred on the closest existing analogue (Grimlock, BMW Bouncer, Portal Bot). Do not skim end-to-end.

### Step 6 — Update `previousInputs` bookkeeping

Near the bottom of `Player.update()` (~line 6016) every transform input has a `this.previousInputs.fooTransform = this.controls.isFooTransform();` line. Add the matching line for your new transform so the rising-edge check in step 5 works.

### Step 7 — Wing-hiding gotcha (transformers only)

`Player.js` line ~460 has a **hardcoded list of transformer costume keys** that suppresses the dragon-wing render when the costume is in vehicle/alt form. If your transformer costume hides wings while transformed, add its key to that list. Symptom of missing this step: wings poke out through a car/jet body.

(Tech-debt issue: refactor this list into a `suppressWings: true` boolean on the costume entry. Do not bundle that refactor with a new-costume PR.)

### Step 8 — Add a Playwright test

Add a test case to `tests/dragon-costume.spec.js` (or a sibling spec file if the costume warrants its own). Mirror the existing patterns: navigate to the picker, select the costume, assert the player sprite tint / form / projectile fires. **Do not mock the canvas.** Tests drive real Phaser via `window.gameInstance`.

### Step 9 — Run the full check loop and update docs

```bash
npm run check
```

If your costume has notable behaviour, add a short markdown note under `docs/features/<costume>.md` matching the tone of existing files there. Keep it design-focused, not implementation-focused.

## Conventions

- **Plain ES2022 JavaScript.** No TypeScript, no JSX, no decorators.
- **No bundler.** Module-style `import`/`export` is not used in app code. Files communicate via globals attached to `window` (most commonly `window.gameInstance`).
- **Script-tag order matters.** New files must be added to `index.html` after their dependencies.
- **Cooldown pattern:**
  ```js
  if (this.fooCooldown > 0) return;
  this.fooCooldown = N;
  // ...in update():
  if (this.fooCooldown > 0) this.fooCooldown--;
  ```
- **Hex colors as `0xRRGGBB` literals** directly on costume entries. There is no central palette yet — match neighbour entries for tonal consistency.
- **Globals:** `window.gameInstance` is the canonical access pattern from tests and from cross-scene code.
- **Persistence:** any new unlock or progress flag goes through `js/utils/SaveSystem.js`. Do not write directly to `localStorage` from gameplay code.

## What NOT to do

- **Do not introduce a bundler** (webpack/vite/rollup/esbuild) or a transpile step. The "open index.html" workflow is load-bearing.
- **Do not add TypeScript** or `.ts` files. Convert nothing.
- **Do not mock the canvas** in Playwright tests. Tests are end-to-end against real Phaser.
- **Do not leave `console.log` in production paths.** Use them while debugging, strip before commit. `console.warn` / `console.error` for genuine error paths is fine.
- **Do not refactor the costume picker array** (`CraftScene.js` ~line 638) or the wing-hide list (`Player.js` ~line 460) in the same PR as a new costume. Those refactors have their own tracked tech-debt issues.
- **Do not edit files under `node_modules/`.** Ever.
- **Do not duplicate state across the registry and the picker array** beyond the documented key. The picker reads display data from the registry.

## PR description rules

- Keep PR titles short (under 70 chars). Use the body for detail.
- Describe the user-visible change and the gameplay rationale.
- **Do not reference internal workflow artifacts** in PR bodies or commit messages — no mentions of `cw-spec`, `cw-validate`, `cw-review`, proof files, or `docs/specs/` paths. Those are local tooling artifacts and do not belong in shared history.
- Include a short manual-test checklist (e.g. "select costume in picker", "transform via key X", "projectile fires and damages enemy"). Playwright covers regression; manual-test bullets cover gameplay feel.
