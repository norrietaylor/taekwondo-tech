# Research Report: taekwondo-tech (general)

**Generated:** 2026-04-27
**Topic:** general (no scope filter)
**Depth:** medium
**Repo:** /Users/norrie/code/taekwondo-tech
**Branch:** main @ 8eec23a

---

## Summary

Taekwondo Robot Builder is a vanilla-JS Phaser 3.70 side-scroller with **zero build infrastructure** — Phaser is loaded from CDN, scripts are concatenated by HTML `<script>` tag order, no bundler, no transpilation, no type system. Gameplay is procedurally rendered (no sprite assets); the entire visual layer uses `Rectangle`, `Container`, and `Graphics` primitives. State persists via `localStorage` through `SaveSystem.js`, deployment is static nginx in Docker, and tests are end-to-end Playwright specs that introspect a global `window.gameInstance` singleton.

The codebase has matured along one strong axis (costume/transformer feature growth) and is increasingly stressed along two axes:

1. **Player.js is a 7,405-line monolith** with 15+ costume variants, 6 transformer state machines (Grimlock, Bumblebee, Hot Rod, Elita, BMW Bouncer, Portal Bot), and ~6 duplicated `update*VisualsIfNeeded()` methods following identical structure.
2. **Global singleton coupling** — `window.gameInstance` has 275 references across `js/` and `tests/`, with zero use of Phaser's `scene.registry` or `scene.events.emit`. Mutations and reads happen directly on `gameData`; tests instantiate the singleton, making refactor expensive.

Quality tooling is sparse: no ESLint, Prettier, or TypeScript; CI runs Jekyll deploy only — the 1,856 lines of Playwright specs are not gated by automation. Two recent scenes (`BananaSurvivalScene`, `PacManScene`) have no test coverage. The costume system is well-paginated in UI but adding a transformer costume currently costs ~500–600 LOC of duplicated state and visual-rebuild boilerplate in `Player.js`.

The natural next investments are: (a) a `Transformer` strategy/state base inside Player to collapse the 6 duplicated transform pipelines, (b) a `spawnProjectile(type, config)` factory to unify `shootFireball` / `shootDragonProjectile` / `shootLaserEyes`, and (c) a thin facade layer to begin migrating direct `gameData` mutations toward Phaser's event/registry system.

---

## 1. Tech Stack & Project Structure

### Languages & Runtime

- **JS**: vanilla ES5+, no transpilation
- **Engine**: Phaser **3.70.0** via jsDelivr CDN — `index.html:168`, `nocache.html:40`
- **Markup**: HTML5 only, no CSS preprocessor
- **Testing**: `@playwright/test@^1.40.0` (only npm dep)
- **Build**: none — no webpack/rollup/esbuild

### Module Loading

No ES modules. Globals via ordered `<script>` tags: Phaser → utils → entities → scenes → `game.js` (instantiates `window.gameInstance`). `nocache.html` adds `?v=${Date.now()}` cache-busting for development.

### Directory Layout

```
js/
├── entities/   Player.js (~7400), Enemy.js, Collectible.js, Banana.js
├── scenes/     MenuScene, GameScene, CraftScene, BananaSurvivalScene, PacManScene
├── utils/      Controls.js, SaveSystem.js
└── game.js     TaekwondoRobotBuilder root + dragonCostumes config
tests/          5 Playwright .spec.js + unit-tests.html (manual browser unit tests)
docs/           project-plan.md, work-log.md (45 KB), testing-guide.md
```

### HTML Entry Points

| File           | Purpose                                                                            |
| -------------- | ---------------------------------------------------------------------------------- |
| `index.html`   | Production: canvas + mobile touchpad, ordered scripts, iOS fullscreen meta         |
| `nocache.html` | Dev: dynamic script loader with timestamp cache-bust                               |
| `debug-*.html` | Standalone harnesses (dragon-wings, finish-line, legendary, level, mobile, pacman) |
| `test-*.html`  | Playwright fixtures (test-game, test-ipad-fullscreen, etc.)                        |

### Assets

**Procedural only** — no images, sprite atlases, or audio files. Visuals are rectangles, stars, circles, and tween-driven graphics. All costume colors live in `game.js:5-536`.

### Deploy

- **Docker**: `nginx:alpine`; HTML `no-cache`, JS/CSS `1y immutable`, gzip on, `:80` (`Dockerfile:16-49`).
- **deploy-docker.sh** (164 lines): builds, optionally smoke-tests on `:8080`, pushes to Docker Hub, optionally emits `docker-compose.yml`.

### Root \*.md Files

A pile of feature implementation logs at repo root: `DRAGON_COSTUME_IMPLEMENTATION.md`, `DRAGON_WINGS_FEATURE.md`, `LEGENDARY_MODE_IMPLEMENTATION.md`, `NEW_LEVELS_IMPLEMENTATION.md`, `POWER_UP_SYSTEM.md`, `IOS_FULLSCREEN_FIX.md`. Combined with `docs/work-log.md` (45 KB) these are de-facto change logs/specs.

---

## 2. Architecture & Patterns

### Scene Lifecycle

- Scenes register in Phaser config array (`game.js:571-590`), transition via `this.scene.start()`.
- Flow: `MenuScene → GameScene → CraftScene → GameScene` loop, plus `BananaSurvivalScene`, `PacManScene` mini-games.
- **No formal shutdown/cleanup** patterns; level completion calls `window.gameInstance.nextLevel()` imperatively (`GameScene.js:1296-1448`).

### Entities: Composition, Not Inheritance

Entities **do not** extend `Phaser.GameObjects.Sprite`. They wrap `this.sprite` (Rectangle, Container, or Graphics) and `this.body` (physics) as composed properties. Example: Player swaps Rectangle → Container at runtime when entering Legendary mode.

### Player.js Monolith (7,405 lines)

Single class managing: movement, combat, 15+ costumes, 6 transformer state machines, legendary-mode sprite rebuild, projectiles, transforms, abilities. No subclassing or strategy pattern; all costume logic inline.

### Costume System (Data-Driven, Weakly Extensible)

- Costumes registered as flat config dicts in `game.js:5-536` (`this.dragonCostumes`).
- Player resolves current outfit via `window.gameInstance.getDragonCostume(name)` (`Player.js:7310-7313`).
- Adding a transformer costume requires touching `game.js`, `Player.js`, and (sometimes) `CraftScene.js` — see §6 deep-dive.

### Cross-Scene State

- Singleton: `window.gameInstance = new TaekwondoRobotBuilder()` (`game.js:642`).
- All scenes/entities access `gameData` directly. **Zero use** of `scene.registry` or `scene.events.emit`.
- 275 `window.gameInstance` references across the repo.

### Controls.js

Multiplexes keyboard + touch joystick + mobile buttons; mobile detected via UA + touch + iPad-in-desktop heuristic. Polling-based: `getHorizontal()`, `isJump()`, etc.; no events. Clean abstraction — scenes do not see input source.

### SaveSystem.js

LocalStorage adapter, key `taekwondo-robot-builder-save`, versioned envelope `{version: '1.0.0', timestamp, data}`, in-memory fallback when localStorage unavailable. Auto-save runs on a 30s timer; explicit `save()` is also called by mutation methods.

### Architectural Strengths

1. Composition lets sprite type swap at runtime (Rectangle ↔ Container for legendary).
2. Controls abstraction cleanly hides input source.
3. Costume catalog is a single editable data file for cosmetic-only additions.

### Fragilities

1. **Global singleton** — refactor blast radius spans every scene + entity + half the test suite.
2. **Player.js monolith** — extension cost grows superlinearly.
3. **Scene-tight entities** — `this.scene.add.*`, `this.scene.physics.add.*` make isolation testing infeasible.
4. **Legendary toggle requires scene restart** (`game.js:910-920`) — band-aid for runtime sprite-type swap.
5. **No event-driven state changes** — UI must poll or scene-restart to reflect state.

---

## 3. Dependencies & Integrations

### Runtime Dependencies

| Dep            | Source                  | Notes                |
| -------------- | ----------------------- | -------------------- |
| Phaser 3.70.0  | jsDelivr CDN script tag | only runtime dep     |
| localStorage   | browser native          | `SaveSystem.js:4-24` |
| Touch/Keyboard | browser native          | `Controls.js:36-50`  |

**Zero npm runtime deps. Zero analytics/telemetry/tracking.** No `fetch` or `XMLHttpRequest` in the code; the game is fully offline-capable.

### Cache-Busting (`nocache.html`)

Sequential script loader appends `?v=${Date.now()}` and chains via `onload`/`onerror` callbacks (`nocache.html:43-82`).

### Test Infrastructure

- `playwright.config.js`: 5 projects (chromium, firefox, webkit, Pixel 5, iPhone 12).
- `baseURL: http://localhost:8000`.
- `webServer`: auto-spawns `python3 -m http.server 8000`.
- HTML reporter, video/screenshot on failure, trace on first retry.

### Docker

`nginx:alpine`, gzip on, HTML `no-cache`, static assets `1y immutable`, `curl -f localhost/` health check, port 80.

---

## 4. Test & Quality Patterns

### Strategy

Real browser, real HTTP server, real Phaser canvas. **No mocks.** Tests use `page.evaluate(() => window.gameInstance.gameData.currentLevel)` to introspect game state since the canvas is opaque to DOM selectors.

### Coverage

| Spec                          | Lines | Targets                                                     |
| ----------------------------- | ----- | ----------------------------------------------------------- |
| `class-instantiation.spec.js` | 192   | Class constructors, `setTint` vs `setFillStyle` correctness |
| `menu-operations.spec.js`     | 332   | Menu nav, settings, credits, layout, leaks                  |
| `game-flow.spec.js`           | 454   | Scene transitions, controls, FPS, error monitoring          |
| `dragon-costume.spec.js`      | 526   | Unlock flow, persistence, legendary, UI                     |
| `level-completion.spec.js`    | 352   | Level finish lines, progression                             |

**Tested scenes**: MenuScene, GameScene, CraftScene.
**Untested scenes**: `BananaSurvivalScene`, `PacManScene`.
**Untested**: Enemy AI behaviour, collectible spawn logic, physics interactions, scoring math, animation timing.

### unit-tests.html (522 lines)

Standalone in-browser unit harness — **not** invoked by Playwright. `MockScene` / `MockSprite` / `MockBody` stubs allow constructor smoke tests without a real scene. Runs manually by opening the file.

### Quality Tooling

- ❌ No ESLint, Prettier, tsconfig.
- ❌ No Husky / pre-commit hooks.
- ❌ No GitHub Actions test gating (CI is Jekyll-deploy only).
- ✅ `.gitignore` covers `test-results/`, `playwright-report/`, `coverage/`.

---

## 5. Data Models & Game "API" Surface

### Save Schema

```
localStorage['taekwondo-robot-builder-save'] =
  { version: '1.0.0', timestamp: ISO-8601, data: gameData }
```

`gameData` = `{ currentLevel, score, robotParts: { head, body, arms, legs, powerCore }, outfits: { current, unlocked[] }, powerUps, settings }` (`game.js:594-617`).

### Levels

Hardcoded in switch dispatch in `GameScene.createLevel()` (`GameScene.js:221-263`) → per-level method (`createIceLevelPlatforms()`, etc.). 6-color theme map at `GameScene.js:135-142`. Level dimensions 2048×576. **No external data files.**

### Pac-Man Maze

Static 21×21 grid in `PacManScene.MAZE` (lines 11-33). Tile codes: 0=path/food, 1=wall, 2=power pellet, 3=ghost spawn, 4=player spawn, 5=empty. `TILE_SIZE=25`.

### Costume Catalog (`game.js:5-536`)

**Required fields**: `name, icon, primaryColor, secondaryColor, beltColor, description, unlockCondition, effectColor, hasWings, wing*, projectile*, unlocked`.
**Optional**: `canTransform, transformKey, currentForm, [form]Speed, [form]Jump, [ability]Cooldown, isLegendary, isStoneDragon, ...` — boolean feature flags drive imperative branches in Player.

### Player Public API (called from scenes/tests)

Movement: `moveLeft, moveRight, jump, takeDamage`.
Combat: `shootFireball, shootDragonProjectile, shootLaserEyes, shootPresentBomb`.
Transform: `transformLaserToBoulder, transformToDuck, transformToDog`.
State props: `health, speed, jumpPower, facingRight, isGrounded, isSlipping, isAttacking`.

---

## 6. Deep-Dive Findings

### 6.1 Player.js Refactor Targets

**Costume-specific guard branches** (15+ occurrences):

- Stone Dragon — `Player.js:841`
- Earth Dragon — `Player.js:1254, 1431`
- Grimlock — `Player.js:1612, 1858, 1869`
- Bumblebee — `Player.js:2092, 2247`
- Hot Rod — `Player.js:2297, 2328, 2527`
- Elita — `Player.js:2577, 2730`
- BMW Bouncer — `Player.js:2779, 3244, 3349`
- Portal Bot — `Player.js:2814, 3295`

**Per-costume parallel state (~36 fields, `Player.js:163-219`)**:
Each transformer maintains `{form, currentForm, lastFacingRight, transformCooldown, visuals[]}` plus ability cooldowns (`duckLaserCooldown`, `bounceSlamCooldown`, `portalTeleportCooldown`, etc.). All decremented every frame regardless of active costume (`Player.js:641-670`).

**Update loop** (`Player.js:551-603`) calls 6 sequential `updateXyzVisualsIfNeeded()` every frame. Each method follows identical structure: early-return if costume mismatch, rebuild if form/direction changed.

**Legendary sprite rebuild** (`Player.js:278-370`): builds 9-part Container statically once; no per-frame rebuild.

**Refactor priority table:**
| Pattern | LOC | Action |
|---|---|---|
| Transform cooldown dispatcher | ~200 | Replace 6 toggles with `Transformer` strategy + dispatch table |
| Projectile factory | ~400 | Unify `shootFireball / shootDragonProjectile / shootLaserEyes` into `spawnProjectile(type, config)` |
| Visual rebuild guards | ~1200 | 6 near-duplicate methods → 1 generic visual rebuilder per costume in a registry |
| State consolidation | (clarity) | Move 36 scattered fields to `this.transforms[name] = {...}` |

### 6.2 Costume Extensibility (Cost to Add One)

| Costume Type   | LOC     | Files Touched                                                                 | Notes                                |
| -------------- | ------- | ----------------------------------------------------------------------------- | ------------------------------------ |
| Color-only     | ~20     | `game.js` only                                                                | Add config + unlock check            |
| With transform | 300–600 | `game.js`, `Player.js`, `CraftScene.js`                                       | Duplicate transformer state pipeline |
| With ability   | 100–200 | `game.js`, `Player.js`                                                        | Cooldown + handler                   |
| With mini-game | 1000+   | new `*Scene.js` + `game.js` + `CraftScene.js` + `index.html` + `nocache.html` | imperative unlock                    |

**Real PR sizes (recent commits):**

- BMW Bouncer (#22, `c9a7e83`): +566 LOC across `Player.js, game.js, CraftScene.js`.
- Portal Bot (#20, `6b1819d`): +673 LOC across same 3 files.
- Pac-Man (#21, `7c02e59`): +1147 LOC; new `PacManScene.js` (1068 lines), deletes `BananaBonusScene.js`, edits `index.html`, `nocache.html`.

**Unlock pattern split:**

- Data-driven (preferred): condition in `checkDragonUnlocks()` (`game.js:762-886`) e.g., `if (currentLevel >= 3) unlockOutfit('portalbot')`.
- Imperative (escape hatch): scene-completion calls `gameData.outfits.unlocked.push('pacman')` directly (`PacManScene.js:1006-1008`).

**UI is paginated and self-scaling** — `CraftScene.js:642-815` reads `dragonCostumes` keys at runtime, 8/page. New costumes appear automatically.

### 6.3 Singleton Coupling

| File                             | `window.gameInstance` refs |
| -------------------------------- | -------------------------- |
| `tests/dragon-costume.spec.js`   | 95                         |
| `js/entities/Player.js`          | 38                         |
| `tests/level-completion.spec.js` | 36                         |
| `js/scenes/MenuScene.js`         | 24                         |
| `js/scenes/CraftScene.js`        | 24                         |
| **Total (js/ + tests/)**         | **275**                    |

**De facto API surface (18 members):**
_Read-only_: `gameData, dragonCostumes, controls, game, saveSystem`.
_Methods_: `addScore, addRobotPart, unlockOutfit, setOutfit, nextLevel, checkDragonUnlocks, getDragonCostume, getTotalPartsCollected, saveGameData, loadGameData, resetGameData, completeGame, resetGame, requestFullscreen, toggleFullscreen`.

**Read/write asymmetry**: methods wrap mutations with `saveGameData()`, but `MenuScene.js:540` mutates `gameData.settings.soundEnabled` directly — bypassing the facade. A migration to events/registry must first audit and gate every direct mutation.

**Phaser-native alternatives unused**: 0 references to `scene.registry`, `this.registry`, `scene.events.emit`, `this.events.emit`.

**Refactor seams (incremental path):**

1. **Phase 1**: facade-only — wrap every `gameData` mutation in a method, including settings.
2. **Phase 2**: methods emit `scene.events.emit(...)`; `SaveSystem` listens and saves on event.
3. **Phase 3**: replace direct reads with `scene.registry.get(...)`.
4. **Phase 4**: inject scene/registry into entity constructors instead of `window.gameInstance`.

**Critical blocker**: ~131/275 refs are in tests (`page.evaluate(() => window.gameInstance...)`). Tests read internal state because the canvas is opaque to selectors. Decoupling production code requires a parallel test-introspection contract — likely a `window.__gameTestApi` shim that survives the refactor.

---

## 7. Recommended Next Steps

1. **`Transformer` strategy in Player.js** — collapse 6 duplicated transform pipelines into one base + per-costume config. Highest ROI (~1,500 LOC reduction projected).
2. **`spawnProjectile(type, config)` factory** — unify 3 projectile spawners.
3. **Test stubs for BananaSurvivalScene + PacManScene** — close the two untested scene gaps before next mini-game ships.
4. **`gameInstance` facade audit** — find every direct `gameData.*` mutation, gate behind methods. Foundation for any future event-driven migration.
5. **Add ESLint + Prettier** with a single `npm run lint` script. Zero-config setup; would catch the `setTint`/`setFillStyle` class of bugs that `class-instantiation.spec.js` was created to detect.
6. **Wire Playwright into a GH Actions workflow** so the 1,856 spec lines actually gate merges.

---

## Meta-Prompt

The following prompt is ready to paste into `/cw-spec` for any of the recommended initiatives above. Adjust the **Feature** line to choose the one to spec.

---

```
Feature: Refactor Player.js transformer pipelines into a Transformer strategy

Problem statement:
Player.js has grown to 7,405 lines because each new transformer costume
(Grimlock, Bumblebee, Hot Rod, Elita, BMW Bouncer, Portal Bot) duplicates
~500 LOC of state, cooldown decrement, visual-rebuild, and form-toggle
boilerplate. Adding the next transformer is projected at 500–700 LOC of
near-identical copy-paste, and untested cooldown decrement runs every frame
for every inactive costume.

Key components touched:
- js/entities/Player.js (lines 163-219 state, 551-603 update, 1612-3349
  transformer methods, 1865-3348 visual rebuilders, 4010-4400 projectiles)
- js/game.js (dragonCostumes config, lines 5-536; unlock map 762-886)
- tests/dragon-costume.spec.js, tests/class-instantiation.spec.js

Architectural constraints:
- No build system; must remain pure ES5+ globals loadable via <script> tags.
- No new npm runtime deps; Phaser 3.70 is the only runtime dep.
- Must preserve the window.gameInstance.getDragonCostume(name) contract —
  275 references across js/ and tests/ depend on it.
- Tests introspect via page.evaluate(window.gameInstance.*); refactor
  surface must keep that test API stable, or supply a shim.
- Costume catalog must remain a flat data dict in game.js so cosmetic-only
  additions stay a one-file change.

Patterns to follow:
- Composition over inheritance (already established for entities).
- Polling-based update loop (already established in Controls + scenes).
- Single dispatch through Player.update().

Suggested demoable units:
1. Transformer base + registry — extract one transformer (Grimlock) into
   the new structure with parity tests.
2. Migrate the remaining 5 transformers (Bumblebee, Hot Rod, Elita, BMW
   Bouncer, Portal Bot) one at a time, each under regression test.
3. Unify projectile spawners into spawnProjectile(type, config).
4. Consolidate per-costume cooldown fields into this.transforms[name].

Code references:
- Player.js:163-219    — current transformer state fields
- Player.js:551-603    — main update() dispatch
- Player.js:1612-3349  — six transformer methods (the duplication)
- Player.js:4010-4400  — three projectile spawners
- game.js:5-536        — dragonCostumes config
- game.js:762-886      — checkDragonUnlocks
- docs/specs/research-general/research-general.md — full research report
```
