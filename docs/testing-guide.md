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

### **🐉 Dragon Costume System**
- [ ] **Costume Selection**
  - Open CraftScene and access Change Outfit button
  - Verify all 5 dragon costumes display correctly
  - Default Gi is unlocked and equipped
  - Locked costumes show lock icon and requirements
  
- [ ] **Unlock Conditions**
  - Fire Dragon unlocks after completing Level 1
  - Ice Dragon unlocks after collecting 5 robot parts
  - Lightning Dragon unlocks after completing Level 2
  - Shadow Dragon unlocks after completing the game
  - Unlock notifications display with animation
  
- [ ] **Visual Effects**
  - Player color changes when costume is equipped
  - Jump effects match dragon costume colors
  - Footstep particles use costume colors
  - Belt color updates with costume
  
- [ ] **Persistence**
  - Equipped costume persists after page reload
  - Unlocked costumes remain unlocked
  - Save/load maintains costume selection

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

1. **Run the setup script:**
   ```bash
   ./test-setup.sh
   ```

2. **Install dependencies manually (alternative):**
   ```bash
   npm install
   npx playwright install
   ```

### **Running Automated Tests**

```bash
# Run all tests (headless)
npm test

# Run tests with browser visible
npm run test:headed

# Run tests in debug mode (step-by-step)
npm run test:debug

# Start development server
npm start
```

### **Enhanced Test Coverage**
Our comprehensive automated test suite covers:

#### **Menu Operations Testing** (`menu-operations.spec.js`)
- ✅ **Game Initialization**: Phaser.js loading and game instance creation
- ✅ **Start Game Button**: Specific fix validation for reported issue
- ✅ **Keyboard Navigation**: Arrow keys, Enter, Space key functionality
- ✅ **Settings Dialog**: Sound toggle and state management
- ✅ **Credits Display**: Content verification and dialog handling
- ✅ **Save/Continue**: Game state persistence and reload testing
- ✅ **Rapid Interactions**: Stress testing for UI responsiveness
- ✅ **Memory Leak Detection**: Long-term stability monitoring
- ✅ **Responsive Design**: Multi-screen size validation
- ✅ **Error Monitoring**: Real-time JavaScript error detection

#### **Game Flow Testing** (`game-flow.spec.js`)
- ✅ **Complete Gameplay**: Full game session from menu to gameplay
- ✅ **Scene Transitions**: Menu → Game → Craft scene validation
- ✅ **Player Controls**: Keyboard and touch input testing
- ✅ **Combat System**: Attack animations and hit detection
- ✅ **Mobile Touch Controls**: Virtual joystick and button testing
- ✅ **Performance Metrics**: Frame rate and rendering efficiency
- ✅ **Cross-Platform**: Desktop and mobile browser compatibility
- ✅ **Visual Regression**: Screenshot comparison for UI consistency
- ✅ **Error Handling**: Console error monitoring during gameplay
- ✅ **Stress Testing**: Rapid key presses and user interactions

#### **Dragon Costume System Testing** (`dragon-costume.spec.js`)
- ✅ **Costume Definitions**: Validates all 5 dragon costumes exist and data structure
- ✅ **Unlock Conditions**: Tests Fire (Level 1), Ice (5 parts), Lightning (Level 2), Shadow (Complete)
- ✅ **Costume Selection**: Verifies costume switching and locked costume prevention
- ✅ **Save Persistence**: Confirms costume selection survives page reload
- ✅ **UI Integration**: Tests CraftScene costume selection interface
- ✅ **Progress Display**: Validates unlock progress text generation
- ✅ **Multi-Unlock**: Tests multiple simultaneous unlocks
- ✅ **Visual Effects**: Validates dragon effects are applied to player
- ✅ **Data Validation**: Comprehensive costume data structure validation
- ✅ **Duplicate Prevention**: Ensures costumes don't unlock multiple times

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

*Happy testing! 🎮✨*
