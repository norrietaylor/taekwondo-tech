# 🥋 Taekwondo Robot Builder - Project Plan

## **Project Overview**
A side-scrolling platformer game where a taekwondo expert collects robot parts to build the ultimate robot. Features 3 themed levels, special abilities, and outfit customization.

## **Technical Specifications**

### **Platform & Technology**
- **Target Devices**: Desktop and mobile browsers
- **Technology**: Phaser.js with HTML5 Canvas
- **Performance**: 30 FPS, medium complexity
- **Experience Level**: Experienced coder, little JS-specific experience

### **Game Specifications**
- **Levels**: 3 levels (Ice, Fire, Ultimate Power Bomb)
- **Art Style**: Geometric/low-poly with muted teal/blue color palette
- **Animation**: Detailed character movements
- **World Themes**: Futuristic cities, natural landscapes, robot factories

## **Game Mechanics**

### **Character Abilities**
- **Basic Movement**: Run, jump
- **Combat**: Kick, punch (taekwondo moves)
- **Mario-Style Stomping**: Jump on enemy heads for instant defeat with bounce effect
- **Special Powers**: Breathing fire, ultra-blast, fly mode
- **Power-ups**: Temporary ability enhancements

### **Core Gameplay Loop**
1. Navigate through side-scrolling levels
2. Collect robot parts and coins
3. Combat titans (enemies with red line indicators)
4. Enter craft mode between levels
5. Assemble robot parts
6. Progress through increasingly difficult levels

### **Robot Building System**
- **Parts Available**: Immediately upon collection
- **Assembly**: Drag-and-drop craft mode interface
- **Goal**: Build one super robot to win
- **Part Types**: Head, Body, Arms, Legs, Power Core
- **Rarity System**: Common, Rare, Epic parts

### **Opposition & Combat**
- **Enemies**: Titans inspired by Greek mythology
- **Visual Indicator**: Red lines above enemy heads
- **Combat System**: Taekwondo moves + special abilities from power-ups
- **Head Stomping**: Mario-style jumping on enemy heads for instant defeat
- **Combat Choice**: Players can choose between ground combat (kick/punch) or aerial stomps
- **Combo Scoring**: Consecutive enemy stomps provide increasing point bonuses (100-500 points)

### **Progression & Customization**
- **Dragon Costume System**: 5 unique dragon-themed martial arts uniforms
  - **Default Gi**: Traditional blue uniform (always unlocked)
  - **Fire Dragon**: Red/orange flames costume (unlock: complete Level 1)
  - **Ice Dragon**: Light blue/white winter costume (unlock: collect 5 robot parts)
  - **Lightning Dragon**: Gold/purple electric costume (unlock: complete Level 2)
  - **Shadow Dragon**: Dark purple/black stealth costume (unlock: complete game)
- **Outfit Changes**: Between levels only in Craft Scene
- **Visual Effects**: Each dragon has unique particle effects and color schemes
- **Save System**: Local browser storage with outfit persistence
- **Scoring**: Points for coins (10 pts) and robot parts (50-200 pts)

## **📋 POC - COMPLETED**

### **Phase 1: Foundation ✅ COMPLETE**
- [x] Project Setup with Phaser.js
- [x] Core Player Mechanics (run, jump, basic combat)
- [x] Level Structure and Physics
- [x] Mobile-friendly controls

### **Phase 2: Level Completion System ✅ COMPLETE**
- [x] Robot Part Collection Bug Fix (parts not collecting when touched)
- [x] 3-Star Rating System with performance tracking
- [x] Enhanced level completion criteria (60%/80% parts vs 100% requirement)
- [x] Star-based progression tracking and save system
- [x] Animated level completion UI with performance statistics
- [x] Damage tracking and enemy defeat counting
- [x] Inventory stowing animation for collected robot parts

### **Phase 3: Game Loop ✅ COMPLETE**
- [] Craft Mode UI and mechanics

- [] Local save system
- [] Win condition implementation

### **Phase 4: Enhanced Testing & Bug Fixes ✅ COMPLETE**
- [] Comprehensive automated test suite
- [] Menu operation testing
- [] Error monitoring and debugging
- [] Performance testing
- [] Cross-platform validation
- [] Start game button fix

## **🎨 Art & Animation Specifications**

### **Visual Style**
- **Aesthetic**: Geometric/low-poly with smooth gradients
- **Color Palette**: Teals, blues, grays with accent colors
- **Character Design**: Clean, angular shapes
- **Environmental Storytelling**: Visual composition focus

### **Animation Requirements**
- **Player**: 8-frame walk, 4-frame jump, combat moves
- **Enemies**: 6-frame patrol, attack animations
- **Effects**: Power-up sparkles, impact effects, collectible shimmer

## **🔧 Technical Architecture**

```
Project Structure:
taekwando-tech/
├── docs/
│   └── project-plan.md
├── index.html
├── js/
│   ├── game.js
│   ├── scenes/
│   │   ├── MenuScene.js
│   │   ├── GameScene.js
│   │   └── CraftScene.js
│   ├── entities/
│   │   ├── Player.js
│   │   ├── Enemy.js
│   │   └── Collectible.js
│   └── utils/
│       ├── Controls.js
│       └── SaveSystem.js
└── assets/
    ├── sprites/
    ├── levels/
    └── audio/
```

## **🎯 Level Design**

### **Level 1: Ice World**
- **Theme**: Slippery platforms, ice hazards
- **Enemies**: Ice titans
- **Color Palette**: Blue/white/silver
- **Mechanics**: Reduced friction, ice block obstacles

### **Level 2: Fire World**
- **Theme**: Lava hazards, volcanic environment
- **Enemies**: Fire titans
- **Color Palette**: Red/orange/black
- **Mechanics**: Heat damage zones, fire geysers

### **Level 3: Ultimate Power Bomb**
- **Theme**: Final challenge, mixed environments
- **Enemies**: Elite titans + boss
- **Color Palette**: Purple/gold/electric blue
- **Mechanics**: All previous mechanics + new challenges

## **📱 Mobile Optimization**

### **Controls**
- **Touch Interface**: Virtual joystick + action buttons
- **Responsive Design**: 320px - 1920px width support
- **Gesture Support**: Swipe for special moves

### **Performance**
- **Frame Rate**: Locked 30 FPS
- **Optimization**: Sprite atlases, object pooling
- **Battery Efficiency**: Efficient rendering pipeline

## **🚀 Post-POC Roadmap**

### **Week 2-3: Polish & Content**
- Complete all 3 levels with unique mechanics
- Full outfit system with holiday themes
- Enhanced titan AI and boss battles
- Particle effects and screen shake
- Combo system for taekwondo moves

### **Week 4: Advanced Features**
- Achievement system
- Multiple robot builds with different abilities
- Enhanced audio with dynamic music
- Social features (score sharing)

## **🎵 Audio Design**
- **Approach**: Minimal audio for POC
- **Sound Effects**: 
  - Collection sounds (coins, parts)
  - Combat impacts
  - Power-up activation
  - UI feedback
- **Music**: Simple ambient tracks per level theme

## **💾 Save System**
- **Method**: Browser localStorage
- **Data Stored**:
  - Level progress
  - Collected robot parts
  - High scores
  - Outfit unlocks
  - Game settings

## **🏆 Scoring System**
- **Coins**: 10 points each
- **Robot Parts**: 50-200 points (based on rarity)
- **Enemy Stomps**: 100-500 points (based on consecutive combo multiplier)
- **Combat Bonuses**: Style points for combo moves
- **Time Bonuses**: Fast level completion rewards
- **Perfect Level**: Bonus for collecting all items

## **🧪 Testing Strategy**

### **Automated Testing Framework**
- **Tool**: Playwright for cross-browser automation
- **Coverage**: 40+ test cases across 5 test files
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari

### **Test Categories**
1. **Menu Operations** (`menu-operations.spec.js`)
   - Game initialization and menu display
   - Start Game button functionality
   - Keyboard navigation (arrows, Enter, Space)
   - Settings and Credits dialogs
   - Save/Continue functionality
   - Rapid interaction stress testing
   - Memory leak detection

2. **Game Flow** (`game-flow.spec.js`)
   - Complete gameplay scenarios
   - Scene transitions
   - Player controls and combat
   - Mobile touch controls
   - Performance monitoring
   - Error detection during gameplay

3. **Dragon Costume System** (`dragon-costume.spec.js`)
   - Dragon costume definitions and data validation
   - Unlock condition testing (level completion, parts collection)
   - Costume selection and persistence
   - Visual effects validation
   - UI integration in CraftScene
   - Multi-costume unlock scenarios

### **Running Tests**
```bash
# Install test dependencies
npm install
npx playwright install

# Run all tests
npm test

# Run with browser visible
npm run test:headed

# Run in debug mode
npm run test:debug
```

### **Test Features**
- **Error Monitoring**: Automatic JavaScript error detection
- **Performance Testing**: Frame rate and memory usage validation
- **Cross-Platform**: Desktop and mobile browser testing
- **Visual Regression**: Screenshot comparison for UI consistency
- **Stress Testing**: Rapid user interaction handling

---

*This document serves as the master plan for the Taekwondo Robot Builder game development. Updated with comprehensive testing strategy and bug fixes.*
