# 🥋 Taekwondo Tech

A side-scrolling action game where a taekwondo expert fights titans, collects robot parts, and builds the ultimate fighting robot — then unlocks a roster of transforming dragon and robot costumes. Built with Phaser.js for desktop and mobile browsers.

![Status](https://img.shields.io/badge/Status-Playable-brightgreen) ![Platform](https://img.shields.io/badge/Platform-Web%20Browser-blue) ![Mobile](https://img.shields.io/badge/Mobile-Touch%20Controls-green)

## 🎮 Quick Start

**Play now**: [Taekwondo Tech](https://norrietaylor.github.io/taekwondo-tech/)

Run locally:

```bash
npm start            # serves the game at http://localhost:8000
```

Then open `http://localhost:8000` (or `nocache.html` for a cache-busted dev build).

## 🕹️ Controls

| Key           | Action                                                        |
| ------------- | ------------------------------------------------------------- |
| ←/→ or A/D    | Move                                                          |
| ↑ / W / Space | Jump (press again mid-air for a double jump)                  |
| Z             | Punch                                                         |
| X             | Kick                                                          |
| E / Q         | Activate the next queued power-up                             |
| 2             | Transform (transformer costumes — robot ↔ alt form)           |
| V             | VibeCoder transform (robot ↔ computer)                        |
| L             | Laser combo (Duck / Dog / Laugh / Bounce Slam, by costume)    |
| T             | Teleport (Earth Dragon, Omega Prime)                          |
| T + S         | Stone Laser → Boulder (Stone Dragon)                          |
| K             | Omega Prime — swap robot theme (Cyberpunk Neon ↔ Solar Forge) |
| O             | Omega Prime — O-MEGA BLAST (8-way laser → vortex → blast)     |
| F             | Toggle fullscreen                                             |

On mobile, a virtual joystick and touch buttons cover movement and the core actions.

## 🌟 Game Features

### Core gameplay

- **Taekwondo combat** — kick and punch, with a combo multiplier for chained hits.
- **Mario-style stomping** — jump on a titan's head for an instant defeat.
- **Fluid movement** — physics-based running, jumping, double jump, and coyote-time.
- **6 themed levels** — collect robot parts and coins, fight through, then craft.
- **Power-ups** — Fire Breath, Ultra Blast, Fly Mode; queue up to two and activate on demand.
- **Save system** — progress, unlocks, and costume selection persist via `localStorage`.
- **Cross-platform** — desktop keyboard and mobile touch controls.

### Robot building

Collect Head, Body, Arms, Legs, and Power Core parts (Common / Rare / Epic) and assemble them in the Craft scene. Building the super robot completes the run.

### Costumes

19 unlockable costumes, selectable in the Craft scene's costume picker:

- **Elemental dragons** — Fire, Ice, Lightning, Shadow, Earth (each with a themed projectile).
- **Specials** — Banana Dragon, Present Dragon, Stone Dragon, Pac-Man Dragon.
- **Legendary Mode** — a 6-dragon fusion with rainbow fireballs (unlock: collect all robot parts).
- **Transformers** — Dino Grimlock, Bumblebee, Hot Rod, Elita, BMW Bouncer, Portal Bot, and VibeCoder, each with a `2`-key (or `V`) transform and a signature ability.
- **Omega Prime** — see below.

### 🐍 Omega Prime

The ultimate fusion costume (unlock: complete Level 1):

- **Robot ↔ red serpent** transform on `2`.
- **O-MEGA BLAST** (`O`) — fires a laser in all 8 directions; each laser collapses into a vortex that pulls in enemies, then detonates in the active theme colour.
- **Theme swap** (`K`) — toggle the robot between Cyberpunk Neon and Solar Forge palettes; the serpent always stays red.
- **Punch animal lasers** — punch cycles Duck → Dog → Cow lasers that turn enemies into harmless farm animals; kick keeps the fire laser / fusion fireball.
- Inherits the transformer arsenal (duck/dog lasers, sonic laughter, bounce slam, stone blast, teleport).

## 🛠️ Tech

- **Phaser.js 3.70** — HTML5 game engine, hardware-accelerated canvas.
- **Vanilla JavaScript** — `<script>`-tag modules, no build step; the only runtime dependency is Phaser.
- **LocalStorage** — client-side save system.

### Project structure

```
taekwondo-tech/
├── index.html                  # main entry point
├── nocache.html                # cache-busted dev entry point
├── js/
│   ├── game.js                 # game manager, costume catalog, config
│   ├── scenes/                 # MenuScene, GameScene, CraftScene, Banana, PacMan
│   ├── entities/
│   │   ├── Player.js           # player, costumes, abilities
│   │   ├── Enemy.js, Collectible.js, Banana.js, VibeSpawn.js
│   │   └── transformers/       # Transformer base + per-costume strategies
│   │       ├── BMWBouncerTransformer.js
│   │       ├── VibeCoderTransformer.js
│   │       └── OmegaPrimeTransformer.js
│   └── utils/                  # Controls, SaveSystem
├── tests/                      # Playwright specs + unit-tests.html
├── docs/                       # project plan, testing guide, feature docs
└── .github/workflows/ci.yml    # lint + test pipeline
```

## 🚀 Development

```bash
npm install                     # install dev dependencies
npx playwright install          # install browsers (first run only)

npm start                       # serve at http://localhost:8000
npm test                        # run the Playwright suite
npm run test:headed             # run with a visible browser
npm run lint                    # ESLint
npm run format:check            # Prettier check  (npm run format to fix)
npm run check                   # lint + format + test
```

A pre-commit hook runs lint-staged; the GitHub Actions **CI** workflow runs `lint` and `test` on every pull request.

### Documentation

- **[Project Plan](docs/project-plan.md)** — specifications, mechanics, level design.
- **[Testing Guide](docs/testing-guide.md)** — manual and automated test procedures.
- **[Work Log](docs/work-log.md)** — chronological development history.
- **[docs/features/](docs/features/)** — per-feature implementation write-ups.
- **[AGENTS.md](AGENTS.md)** — conventions for AI/agent contributors.

### Debug pages

- `debug.html` — console-logging dev build.
- `debug-mobile.html` — mobile control diagnostics.
- `tests/unit-tests.html` — browser-based unit test runner.

---

**🎮 Ready to play?** Visit [Taekwondo Tech](https://norrietaylor.github.io/taekwondo-tech/) and build your robot.
