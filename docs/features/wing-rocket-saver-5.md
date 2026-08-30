# 🥷🤖 Wing Rocket Saver 5 — Implementation Summary

**Date**: August 30, 2026
**Status**: ✅ **COMPLETE**

## Overview

Wing Rocket Saver 5 is a green ninja who fights by summoning a red winged mech and
climbing inside it. Every other transformer costume is a straight A⇄B toggle on the
player; this one splits the transformation in two. The ninja calls the mech into the
world as its own entity, walks over to it, and boards it. Ejecting leaves the mech
standing where you left it, ready to be re-boarded.

Available **from the very start** — no unlock condition. A Settings toggle lets a new
game begin already wearing it; otherwise the run still opens as the Default Gi.

## Forms

The costume uses the shared `Transformer` strategy (`js/entities/Transformer.js`) with
`js/entities/transformers/WingRocketSaver5Transformer.js` registered under the
`wingRocketSaver5` key.

- **Ninja** — a slim green shinobi: hood, masked face, headband with trailing tails.
  Fast and floaty, with plain melee and no projectile. This is the traversal and
  summoning state.
- **Mech** — a red war machine with layered wings, a gold crest and chest star, and a
  dragon head mounted on the forward shoulder. Slower and heavier, but it carries the
  costume's whole arsenal.

Both forms share the same physics-body **bottom edge**, so boarding and ejecting never
pop the player vertically. The mech's body is wider and taller.

## The two-step summon

| Input | Ninja form                                                           | Mech form                                |
| ----- | -------------------------------------------------------------------- | ---------------------------------------- |
| `M`   | Hands-together charge (~600 ms), then the mech materializes in front | —                                        |
| `2`   | Board the mech, if you are standing close enough                     | Eject, leaving the mech standing         |
| `Z`   | Plain melee                                                          | Fires a **sword** from alternating hands |
| `X`   | Plain melee                                                          | Launches the **dragon arm** rocket punch |

The charge pose is a Street-Fighter hadouken stance: the positioner reads the countdown
and brings both arms together in front of the chest, with an energy orb building between
the palms. There is only ever **one** mech — summoning is refused while one already
stands or while you are piloting.

Boarding is gated on proximity. Pressing `2` away from the mech does nothing, so the
`Transformer` base's blind toggle is fronted by an explicit check in the Player handler.

## Abilities

- **Sword throw** (`Z`, mech only) — a blade with a gold edge, thrown from alternating
  hands. It rides the shared dragon-projectile pipeline, so it damages, knocks back, and
  can be deflected by bananas like any other costume projectile.
- **Dragon arm rocket punch** (`X`, mech only) — the shoulder dragon head launches on a
  visible eight-link chain, extends to its maximum reach or the first enemy it bites,
  then retracts onto the shoulder. The chain re-anchors to the shoulder every frame, so
  moving and turning mid-flight keeps it attached. Ejecting cancels it.

## Lifecycle

A summoned mech is destroyed on death, on scene shutdown, and when the costume is
swapped away, so one can never be stranded or block a re-summon. `die()` teleports the
player back to the level start rather than restarting the scene, which is precisely why
the death case matters.

## Files

- `js/entities/MechSuit.js` — the standing, unboarded mech entity (composition over
  inheritance, mirroring `VibeSpawn`); lands on platforms and shows a board prompt.
- `js/entities/transformers/WingRocketSaver5Transformer.js` — ninja/mech visuals,
  positioning, body resize, and the board/eject entity hand-off.
- `js/game.js` — `wingRocketSaver5` costume entry; from-start unlock; the
  `startAsWingRocketSaver5` setting. `resetGame()` now preserves settings.
- `js/entities/Player.js` — summon/board handlers, the mech-form combat branch, the
  `sword` projectile, and the dragon-arm state machine.
- `js/utils/Controls.js` — `isSummonMech()` (`M`).
- `js/scenes/CraftScene.js` — picker entry + unlock gating.
- `js/scenes/MenuScene.js` — the Settings start toggle.
- `js/scenes/GameScene.js` — per-form keybinding HUD hints.
- `index.html` / `nocache.html` — load the two new files.

## Tests

`tests/wing-rocket-saver-5.spec.js` (Playwright, 19 cases): catalog entry and green/red
channel checks, from-start unlock, picker parity, transformer binding, base-sprite
hiding, the board proximity gate, summon → board → eject → re-board, shared body bottom,
mech-only weapons, dragon-arm launch/retract/cancel, cleanup on death and costume swap,
and the start setting surviving `resetGame()`.

## Notes

- The mech draws its own wings, so the costume sets `hasWings: false` and the generic
  dragon-wing renderer short-circuits — no change to the hardcoded wing-hide list.
- `resetGame()` previously wiped `settings` wholesale. Preserving them across a reset is
  required for the start toggle, and incidentally fixes the sound setting being lost
  whenever a new game began.
