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

---

## **Known Issues & Limitations**

### **Current Limitations**
- **Enemies**: Not yet implemented (placeholder system in place)
- **Power-ups**: Basic framework only
- **Audio**: Minimal implementation
- **Advanced Animations**: Simple geometric shapes used

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
