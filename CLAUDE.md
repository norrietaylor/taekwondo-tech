# CLAUDE.md

`AGENTS.md` is the canonical operating guide for this repo. Read it first. This file only captures Claude-specific working notes that do not belong in the shared guide.

## Claude-specific notes

- **Use an Explore subagent** for any unfamiliar area before editing `js/entities/Player.js`. It is 7,400+ lines and a god file — skimming top-to-bottom wastes context. Have a subagent locate the exact handler / form / flag you need and report line ranges back.
- **Read `Player.js` in ~500-line chunks** centred on the nearest analogue (Grimlock, BMW Bouncer, Portal Bot, Stone Dragon). Never read the whole file in one pass.
- **Prefer `Edit` over `Write` for `js/game.js`.** The `dragonCostumes` registry (~lines 5-536) is dense and easy to clobber with a full rewrite. Append new entries with a targeted `Edit`.
- **Prefer `Edit` for `js/scenes/CraftScene.js` and `js/utils/Controls.js`** as well, for the same reason.
- **Match an existing costume** when adding a new one. Pick the closest analogue (transformer vs. non-transformer, projectile vs. melee) and clone its field shape rather than inventing fields.
- **Trust `window.gameInstance`** as the runtime entry point from tests and from cross-scene code. Do not introduce a new global.
- **Do not restate the costume-add checklist here.** It lives in `AGENTS.md` under "How to add a new costume character" and is maintained there. Link, do not duplicate.
- **Run `npm run check` before declaring work done.** Lint + tests in one shot.
- **PR descriptions:** follow the rules in `AGENTS.md`. Specifically, do not mention `cw-spec` / `cw-validate` / `cw-review` reports, proofs, or `docs/specs/` paths.
