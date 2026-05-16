# 🐍 Omega Prime — Implementation Summary

**Date**: May 16, 2026
**Status**: ✅ **COMPLETE**

## Overview

Omega Prime is the game's ultimate fusion costume — a transformer built on the
Legendary fusion sprite that swaps between an armored robot and a long red
serpent. It adds a signature 8-way ultimate (O-MEGA BLAST), a runtime theme
swap, and a cycling punch attack, and inherits the full transformer arsenal.

Unlocks on **completing Level 1** (`currentLevel >= 2`), consistent with
VibeCoder. It is not the starting costume — the run still begins as the
Default Gi.

## Forms

Omega Prime uses the shared `Transformer` strategy (`js/entities/Transformer.js`)
with `js/entities/transformers/OmegaPrimeTransformer.js` registered under the
`omegaPrime` key. Press `2` to toggle:

- **Robot** — a Power Ranger / Megazord-style armor overlay. The underlying
  Legendary sprite is hidden so its sub-pixel physics bob can't jitter behind
  the pixel-snapped armor; `positionRobot` uses a 1.25px deadzone.
- **Red serpent** — a 14-segment swaying snake with hood, fangs, and tongue.
  The physics body shrinks (≈58×86 vs the robot's ≈83×163) so the thin snake
  isn't wedged on level geometry, and the serpent visuals are dropped to ground
  level so the belly rests on the floor rather than floating at torso height.

The serpent palette is always red regardless of the robot theme.

## Abilities

- **O-MEGA BLAST** (`O`) — fires a laser in all 8 directions; each laser
  travels, collapses into a spinning vortex that pulls nearby enemies in, then
  detonates in the active theme colour. 4s cooldown.
- **Theme swap** (`K`) — toggles the robot palette between **Cyberpunk Neon**
  (magenta/cyan/violet) and **Solar Forge** (orange/gold/crimson). The serpent
  stays red in both.
- **Punch animal lasers** — punch (`Z`) cycles **duck → dog → cow** lasers; each
  beam turns the enemies it hits into that harmless farm animal for 8s. Kick
  (`X`) keeps the fire laser (serpent form) / fusion fireball (robot form).
- **Inherited arsenal** — duck/dog L-key lasers, sonic laughter, bounce slam,
  stone blast, and teleport, gated on the `omegaPrime` outfit alongside their
  original costumes.

## Files

- `js/entities/transformers/OmegaPrimeTransformer.js` — transformer config:
  robot/snake visuals, positioning, body resize, theme-aware palette.
- `js/game.js` — `omegaPrime` costume entry; Level 1 unlock in `checkDragonUnlocks()`.
- `js/entities/Player.js` — O-MEGA BLAST, snake fire laser, cow laser path,
  theme-swap handler, transformer hooks.
- `js/utils/Controls.js` — `isOmegaBlast()` (`O` key).
- `js/scenes/CraftScene.js` — picker entry + unlock gating.
- `index.html` / `nocache.html` — load `OmegaPrimeTransformer.js`.

## Tests

`tests/omega-prime.spec.js` and `tests/costume-picker.spec.js` (Playwright):
costume catalog, Level 1 unlock gating, transformer binding, robot ↔ snake
toggle, snake body resize, robot armor anti-jitter, snake-stays-red,
death desync, O-MEGA BLAST 8-way fire + cooldown, and canvas input alignment.

## Related fixes

- Canvas click misalignment: the `<canvas>` CSS `border` was replaced with
  `outline`, and fullscreen now goes through Phaser's `scale.startFullscreen()`
  so the rendered game and input mapping stay aligned.
- The in-canvas keybinding HUD replaced an earlier DOM overlay and shows
  per-costume, per-form hints.
