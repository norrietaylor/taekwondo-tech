# 🥋 Taekwondo Tech

A dynamic side-scrolling action game where players use taekwondo martial arts to fight titans, collect robot parts, and build the ultimate fighting robot. Built with Phaser.js for cross-platform compatibility on desktop and mobile browsers.

![Game Preview](https://img.shields.io/badge/Status-Complete-brightgreen) ![Platform](https://img.shields.io/badge/Platform-Web%20Browser-blue) ![Mobile](https://img.shields.io/badge/Mobile-Touch%20Controls-green)

## 🎮 Quick Start

**Play Now**: Open [Taekwondo Tech](https://norrietaylor.github.io/taekwondo-tech/) in your browser

The game is **already running** on your local server and ready to play!

### Controls
- **Desktop**: WASD/Arrow keys (movement), Space (jump), X (kick), Z (punch), **E/Q (activate power-up)**  
- **Mobile**: Virtual joystick + touch buttons for all actions
- **Combat**: Combine attacks for special abilities (Fire Breath, Ultra Blast, Fly Mode)
- **Power-Ups**: Collect power-ups and press E/Q to activate them when needed

## 🌟 Game Features

### Core Gameplay
- **🥋 Taekwondo Combat System**: Authentic martial arts moves with kick/punch combinations
- **🏃‍♂️ Fluid Movement**: Responsive physics-based movement with enhanced jumping mechanics
- **🚀 Double Jump System**: Air-based double jumping with golden visual effects and strategic timing
- **📱 Cross-Platform**: Full desktop keyboard and mobile touch control support
- **🌍 3 Themed Levels**: Ice World, Fire World, and Ultimate Power Bomb environments
- **💾 Save System**: Automatic progress saving with continue functionality

### Combat & Enemies
- **⚔️ Titan Battles**: Greek mythology-inspired enemies with distinctive red line indicators
- **🦶 Mario-Style Stomping**: Jump on enemy heads to instantly defeat them with satisfying bounce effects
- **🧠 Smart AI**: Dynamic enemy behavior with patrol, chase, attack, and stun states
- **🔥 Special Abilities**: Fire Breath (directional), Ultra Blast (360°), and Fly Mode
- **💪 Power-Ups**: Speed Boost, Invincibility, and various combat enhancements
  - **Queue System**: Collect up to 2 power-ups that queue for later use
  - **Manual Activation**: Press E/Q to activate the next power-up when you need it
  - **Strategic Gameplay**: Choose the right moment to activate power-ups for maximum effect
- **🎯 Combo System**: Chain consecutive enemy stomps for increasing score bonuses (up to 5x multiplier)

### Collection & Progression
- **⭐ Robot Parts**: Collect Common, Rare, and Epic parts with rarity-based visual effects
- **🪙 Coins & Scoring**: Point-based progression system (10 pts/coin, 50-200 pts/part)
- **🔧 Robot Building**: Interactive drag-and-drop assembly in craft mode
- **🏆 Win Condition**: Build the super robot to complete your martial arts journey

### Customization
- **🐉 Dragon Costume System**: 5 unique dragon-themed martial arts uniforms
  - **Default Gi**: Traditional blue uniform (always unlocked)
  - **Fire Dragon** 🔥: Red/orange flames (unlock: complete Level 1)
  - **Ice Dragon** ❄️: Light blue/white winter (unlock: collect 5 parts)
  - **Lightning Dragon** ⚡: Gold/purple electric (unlock: complete Level 2)
  - **Shadow Dragon** 🌙: Dark purple/black stealth (unlock: complete game)
- **🎨 Visual Effects**: Dragon-specific particle systems, multi-color costumes, animated effects
- **💾 Persistence**: Costume selection and unlocks saved automatically

## 🛠️ Technical Architecture

### Built With
- **Phaser.js 3.70.0** - Professional HTML5 game engine
- **HTML5 Canvas** - Hardware-accelerated rendering
- **Vanilla JavaScript** - No external dependencies beyond Phaser
- **LocalStorage API** - Client-side save system

### Project Structure
```
taekwondo-tech/
├── docs/                     # Project documentation
│   ├── project-plan.md       # Complete specifications & timeline
│   ├── testing-guide.md      # Testing procedures & checklists
│   └── work-log.md          # Development history & decisions
├── js/
│   ├── game.js              # Main game manager & configuration
│   ├── scenes/              # Game scenes (Menu, Game, Craft)
│   ├── entities/            # Game objects (Player, Enemy, Collectible)
│   └── utils/               # Utilities (Controls, SaveSystem)
├── tests/                   # Automated test suite
└── index.html              # Main game entry point
```

### Performance Targets
- **Frame Rate**: 30 FPS minimum on mobile devices
- **Load Time**: < 3 seconds on broadband connections
- **Memory Usage**: < 100MB peak usage
- **Browser Support**: Chrome, Firefox, Safari, Mobile browsers

### 📖 Development Documentation

### Core Documentation
- **[📋 Project Plan](docs/project-plan.md)**: Complete game specifications, mechanics, and development timeline
- **[🧪 Testing Guide](docs/testing-guide.md)**: Manual and automated testing procedures
- **[📝 Work Log](docs/work-log.md)**: Detailed development history and technical decisions

### Debug Tools
- **[debug.html](debug.html)**: Development debugging with console logging
- **[debug-mobile.html](debug-mobile.html)**: Mobile control testing and diagnostics
- **[nocache.html](nocache.html)**: Cache-busted version for development
- **[tests/unit-tests.html](tests/unit-tests.html)**: Browser-based unit test framework

## 🤝 Collaboration Process

### Collaboration Guidelines

#### For ALL Contributors
1. **Read Documentation First**
   - Review the [Project Plan](docs/project-plan.md) for game vision and technical specs
   - Check the [Work Log](docs/work-log.md) for development history and context
   - Follow the [Testing Guide](docs/testing-guide.md) to verify functionality

2. **Before Making Changes**
   - Update the Project Plan if your work changes specifications or adds features
   - Create a new Work Log session entry to document your planned work
   - Run existing tests to ensure you're starting from a working baseline

3. **During Development**
   - Document technical decisions and their rationale in the Work Log
   - Update relevant documentation as you implement features
   - Add or modify tests to cover your changes
   - Test across different browsers and devices

4. **After Completing Work**
   - Update your Work Log session with final results and time spent
   - Ensure all tests pass and add new ones for your features
   - Update the Project Plan if scope or timeline changed
   - Submit a comprehensive summary of changes and their impact

#### Documentation Standards
- **Project Plan**: Living document for specifications, timeline, and architecture
- **Work Log**: Chronological record of all development work and decisions  
- **Testing Guide**: Current procedures for validating functionality
- **Code Comments**: Inline documentation for complex logic and architectural decisions

### Development Workflow

#### 1. Project Planning Phase
- **📋 Update Project Plan**: Before starting any new feature or significant change
  - Review and modify [docs/project-plan.md](docs/project-plan.md)
  - Update technical specifications, timelines, or requirements
  - Document any architectural decisions or changes in approach
  - Add new features to the roadmap with priority and complexity estimates

#### 2. Development Phase
- **📝 Work Log Updates**: Document all development work in [docs/work-log.md](docs/work-log.md)
  - Create new session entry with date, duration, and focus area
  - Log completed tasks with time estimates and technical details
  - Document architectural decisions and reasoning behind choices
  - Record any challenges encountered and solutions implemented
  - Include file changes and new features added

#### 3. Testing & Quality Assurance
- **🧪 Testing Documentation**: Update [docs/testing-guide.md](docs/testing-guide.md)
  - Add new test cases for features implemented
  - Update manual testing checklists with new functionality
  - Document any new testing tools or procedures
  - Record known issues and their current status


#### Communication & Review Process
1. **Technical Decisions**: Document in Work Log with rationale and alternatives considered
2. **Feature Changes**: Update Project Plan first, then implement, then document completion
3. **Bug Reports**: Include browser, steps to reproduce, expected vs actual behavior
4. **Performance Issues**: Document with specific metrics and testing methodology


## 🚀 Getting Started (Development)

### Prerequisites
- Node.js and npm (for testing and development tools)
- Modern web browser (Chrome, Firefox, Safari)
- Local web server (included with npm start)

---

**🎮 Ready to play? Visit [Taekwondo Tech](https://norrietaylor.github.io/taekwondo-tech/) and start your taekwondo robot building adventure!**
