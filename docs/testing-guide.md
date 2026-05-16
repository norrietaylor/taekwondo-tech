# 🧪 Testing Guide - Taekwondo Robot Builder

## **Quick Start Testing**

Your game is **already running** at: **http://localhost:8000**

👆 **Open this link in your browser right now to test the game!**

---

## **Manual Testing Checklist**

### **🎮 Core Game Functionality**

- [ ] **Menu Navigation**
  - Start Game button works
  - Settings menu opens and closes
  - Credits screen displays
  - Keyboard navigation (Up/Down arrows, Enter)

- [ ] **Player Movement & Combat**
  - WASD/Arrow keys move player left/right
  - Space/W/Up Arrow makes player jump
  - X key triggers kick attack (red effect)
  - Z key triggers punch attack (green effect)
  - Player faces correct direction when moving
  - **Mario-Style Stomping**: Jump and land on enemy heads to defeat them
  - **Player Bounce**: Player bounces upward after successful head stomp
  - **Stomp vs Combat**: Side collisions trigger enemy attacks, head stomps defeat enemies

- [ ] **Game Physics**
  - Player falls with gravity
  - Player lands on platforms correctly
  - Player cannot pass through platforms
  - Camera follows player smoothly

- [ ] **Collection System**
  - Robot parts (star shapes) can be collected
  - Coins (golden circles) can be collected
  - Score increases when collecting items
  - Collection effects appear (particles, text)

- [ ] **UI Elements**
  - Score displays and updates
  - Parts counter shows progress
  - Health bar reflects player status
  - Level indicator shows current level

### **🦶 Mario-Style Stomping Mechanics**

- [ ] **Basic Stomp Functionality**
  - Jump on enemy heads while falling to execute stomp
  - Enemy is instantly defeated by head stomp
  - Player bounces upward after successful stomp
  - Golden impact effects appear at stomp location
  - Screen shakes briefly on impact for feedback

- [ ] **Collision Detection**
  - Head stomps only work when player is above and falling
  - Side collisions still trigger normal enemy attacks
  - Proper detection range (player must be close enough)
  - No double-collision during player bounce

- [ ] **Visual Effects**
  - Golden impact burst at stomp location
  - Particle explosion radiating outward
  - Dust clouds appear on ground impact
  - Enemy temporarily squashes during stomp
  - "STOMP!" text appears above defeated enemy

- [ ] **Combo Scoring System**
  - First stomp: +100 points
  - Consecutive stomps: +200, +300, +400, +500 points (max 5x)
  - Score popup shows points and combo multiplier
  - Combo resets after 2 seconds of no stomps
  - Score integrates properly with existing scoring system

- [ ] **Enemy Death Animations**
  - Stomp deaths: Enemy flattens with stars and poof clouds
  - Combat deaths: Original explosion effect (preserved)
  - Proper timing differences between death types
  - Visual differentiation between defeat methods

### **🐉 Costume System**

- [ ] **Costume Selection**
  - Open CraftScene and access the Change Outfit button
  - The picker paginates through all 19 costumes
  - Default Gi is unlocked and equipped at the start
  - Locked costumes show a lock icon and their unlock requirement
- [ ] **Unlock Conditions**
  - Fire / Banana / Stone / VibeCoder / Omega Prime unlock after Level 1
  - Ice Dragon unlocks after collecting 5 robot parts
  - Lightning / Hot Rod / Dino Grimlock / Portal Bot unlock after Level 2
  - Legendary Mode unlocks after collecting all robot part types
  - Unlock notifications display with animation
- [ ] **Transformers**
  - `2` toggles transformer costumes between robot and alt form (`V` for VibeCoder)
  - Omega Prime: `2` robot ↔ red serpent, `K` theme swap, `O` O-MEGA BLAST
  - Omega Prime: punch cycles duck/dog/cow lasers, kick fires the fire laser/fireball
- [ ] **Visual Effects**
  - Player visuals change when a costume is equipped
  - Jump and footstep effects match the costume colors
- [ ] **Persistence**
  - Equipped + unlocked costumes survive a page reload

### **📱 Mobile Testing**

- [ ] **Touch Controls** (test on mobile device or browser dev tools)
  - Virtual joystick responds to touch
  - Action buttons (jump, kick, punch) work
  - Controls are properly sized for fingers
  - Touch doesn't interfere with game performance

- [ ] **Responsive Layout**
  - Game scales properly on different screen sizes
  - Mobile controls only show on mobile devices
  - UI elements remain visible and usable

### **💾 Save System**

- [ ] **Persistence**
  - Game progress saves automatically
  - Refreshing page maintains progress
  - Continue button appears after playing
  - Settings are remembered

### **🎨 Visual & Performance**

- [ ] **Graphics**
  - All visual elements render correctly
  - Animations are smooth (30fps target)
  - Color scheme matches design (teal/blue theme)
  - No visual glitches or artifacts

- [ ] **Performance**
  - Game runs smoothly without lag
  - No console errors in browser dev tools
  - Memory usage remains stable during play

---

## **Browser Compatibility Testing**

Test the game in these browsers:

### **Desktop Browsers**

- [ ] **Chrome** (latest version)
- [ ] **Firefox** (latest version)
- [ ] **Safari** (if on macOS)
- [ ] **Edge** (if on Windows)

### **Mobile Browsers**

- [ ] **Chrome Mobile** (Android)
- [ ] **Safari Mobile** (iOS)
- [ ] **Firefox Mobile**

### **Testing Different Screen Sizes**

Use browser dev tools to test:

- [ ] **Desktop**: 1920x1080, 1366x768
- [ ] **Tablet**: iPad (768x1024), Android tablet
- [ ] **Mobile**: iPhone (375x667), Android (360x640)

---

## **Automated Testing Setup**

### **Prerequisites**

- Node.js installed
- npm package manager

### **Setup Instructions**

```bash
npm install              # install dev dependencies
npx playwright install   # install browsers (first run only)
```

### **Running Automated Tests**

```bash
npm start                # serve the game at http://localhost:8000
npm test                 # run the Playwright suite
npm run test:headed      # run with a visible browser
npm run test:debug       # step-by-step debug mode
npm run lint             # ESLint
npm run format:check     # Prettier check  (npm run format to fix)
npm run check            # lint + format + test
```

### **Continuous Integration**

`.github/workflows/ci.yml` runs two jobs on every pull request:

- **lint** — ESLint + Prettier format check.
- **test** — the Playwright suite on Chromium.

A pre-commit hook runs lint-staged on staged files.

### **Test Coverage**

Active Playwright specs:

- **`vibecoder-transform.spec.js` / `vibecoder-spawns.spec.js` / `vibecoder-charm.spec.js`** —
  VibeCoder costume: robot ↔ computer transform, ally spawning, charm ability.
- **`omega-prime.spec.js`** — Omega Prime: costume catalog, Level 1 unlock gating,
  robot ↔ snake transform, body resize, armor anti-jitter, theme swap,
  O-MEGA BLAST 8-way fire + cooldown.
- **`costume-picker.spec.js`** — canvas has no layout-affecting border,
  screen→game input transform is exact (windowed + fullscreen), EQUIP click lands.
- **`dragon-costume.spec.js`** — costume definitions, unlock conditions, selection,
  persistence (the rotted legendary/craft-UI cases are `test.skip`).

**Quarantined** (skipped, pending repair — see issue #39): `game-flow.spec.js`,
`level-completion.spec.js`, `menu-operations.spec.js`, `class-instantiation.spec.js`.
These predate later scene-flow, costume-roster, and menu changes.

---

## **Known Issues & Limitations**

### **Current Limitations**

- POC phase only complete

### **Performance Notes**

- Target: 30fps on medium complexity
- Optimized for mobile and desktop
- Uses Phaser.js physics engine

---

## **Testing Scenarios**

### **Happy Path Testing**

1. Load game → Start new game → Move around → Collect items → Complete level → Craft robot
2. Use mobile controls → Test touch responsiveness
3. Save game → Reload → Continue from save
4. **Mario-Style Stomping**: Jump on enemy heads → Build combo chains → Mix with ground combat

### **Stomp-Specific Testing Scenarios**

1. **Basic Stomp**: Jump and land directly on enemy head
2. **Combo Chain**: Defeat 3+ enemies in succession with stomps
3. **Mixed Combat**: Alternate between stomps and kick/punch attacks
4. **Edge Cases**: Try stomping at edge of collision range
5. **Timing Test**: Test combo reset after 2-second delay

### **Edge Case Testing**

1. **Rapid Input**: Mash keys quickly
2. **Browser Resize**: Change window size during play
3. **Tab Switching**: Switch tabs and return to game
4. **Long Play Sessions**: Play for extended periods

### **Error Testing**

1. **Network Issues**: Disconnect internet during play
2. **Console Errors**: Check browser console for errors
3. **Memory Leaks**: Monitor memory usage over time

---

## **Reporting Issues**

When reporting bugs, include:

- **Browser & Version**: e.g., Chrome 119.0.6045.105
- **Device**: Desktop/Mobile, screen resolution
- **Steps to Reproduce**: Exact sequence of actions
- **Expected vs Actual**: What should happen vs what happens
- **Console Errors**: Any error messages in browser console
- **Screenshots**: Visual evidence if applicable

---

## **Performance Benchmarks**

### **Target Metrics**

- **Frame Rate**: 30fps minimum
- **Load Time**: < 3 seconds on broadband
- **Memory Usage**: < 100MB peak
- **Bundle Size**: < 2MB total assets

### **Monitoring Tools**

- Browser Dev Tools → Performance tab
- Chrome → Lighthouse audit
- Firefox → Performance profiler

---

_Happy testing! 🎮✨_
