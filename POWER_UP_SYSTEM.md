# Power-Up Queue System

## Overview
The power-up system has been completely redesigned to give players strategic control over when they use their power-ups. Instead of auto-activating upon collection, power-ups are now queued and activated manually by the player.

## Key Features

### 1. **Queue System**
- Power-ups are collected and stored in a queue
- Queue capacity: **2 power-ups maximum**
- When collecting a 3rd power-up, the **oldest** power-up is automatically discarded without activation
- Visual feedback shows which power-up will be discarded

### 2. **Manual Activation**
- **Desktop Controls**: Press **E** or **Q** to activate the next power-up in queue
- **Mobile Controls**: Tap the **⚡ (lightning)** button
- Only one power-up can be active at a time
- Attempting to activate while a power-up is already active shows a message

### 3. **Visual UI**

#### Queue Display (Top Center of Screen)
- Shows the next 2 power-ups in queue
- **First slot** (with ▶ arrow): Next power-up to be activated
- **Second slot**: Power-up that will be activated after the first
- Empty slots show "Empty" text
- Each power-up has a unique color and icon:
  - 🔥 **Fire Breath** (Red/Orange)
  - 💥 **Ultra Blast** (Cyan)
  - 🦋 **Fly Mode** (Light Green)
  - 🛡️ **Invincibility** (Gold)
  - ⚡ **Speed Boost** (Pink)
  - 🎁 **Present Bomb** (Red)

#### Active Power-Up Display
- Shows currently active power-up
- Displays remaining duration visually
- Border color matches the power-up type
- Shows "No Active Power-Up" when none are active

### 4. **Available Power-Ups**

All power-ups now follow the queue system:

1. **Fire Breath** 🔥
   - Duration: 10 seconds
   - Effect: Allows directional fire breath attacks
   - Strategic Use: Clear groups of enemies ahead

2. **Ultra Blast** 💥
   - Duration: 10 seconds
   - Effect: 360° area attack with knockback
   - Strategic Use: Escape when surrounded

3. **Fly Mode** 🦋
   - Duration: 10 seconds
   - Effect: Vertical movement and hover capability
   - Strategic Use: Reach high platforms or avoid ground hazards

4. **Invincibility** 🛡️
   - Duration: 10 seconds
   - Effect: Immune to all damage with visual flicker
   - Strategic Use: Navigate through dangerous areas safely

5. **Speed Boost** ⚡
   - Duration: 10 seconds
   - Effect: 1.5x movement speed
   - Strategic Use: Quickly traverse levels or escape danger

6. **Present Bomb** 🎁
   - Duration: 10 seconds
   - Effect: Replaces elemental attack with wrapped presents that land and transform into bombs. After 1 second, the bomb explodes AND spawns a friendly dragon ally that fights for you for 8 seconds!
   - Dragon Ally Stats:
     - Automatically targets and attacks nearby enemies
     - Shoots fireballs dealing 25 damage
     - Hovers and follows enemies
     - Lasts 8 seconds before flying away
   - Strategic Use: Area denial, summoning backup in tough fights, and creating explosive chaos!

## Present Dragon Costume 🎁🐉

A special dragon costume that uses the Present Bomb attack as its **default elemental attack** (no power-up needed!).

### How to Unlock
- Complete Level 3

### Appearance
- **Primary Color**: Festive red
- **Secondary Color**: Christmas green
- **Belt**: Gold ribbon
- **Wings**: Green with gold tips (festive style)

### Abilities
- **Default Attack (Kick)**: Shoots wrapped presents that become bombs and summon dragon allies
- **Laser Eyes (Punch)**: Red laser beams

### Stats
- Explosion damage: 60
- Dragon ally duration: 8 seconds
- Dragon ally damage: 25 per fireball

This is the only dragon that can summon allies as part of its normal attack kit!

## Gameplay Strategy

### When to Activate Power-Ups
- **Save for tough sections**: Don't waste power-ups on easy areas
- **Boss fights**: Invincibility or Ultra Blast can be game-changers
- **Platforming challenges**: Fly Mode helps with difficult jumps
- **Speed runs**: Speed Boost for time-based challenges

### Queue Management
- **Prioritize**: Keep the most useful power-up in first position
- **Plan ahead**: Know which power-up you'll need next
- **Don't hoard**: Use power-ups before reaching the 2-item limit
- **Strategic collecting**: Sometimes it's better to skip a power-up if your queue is already optimal

## Implementation Details

### Code Changes

1. **Player.js**
   - Added `powerUpQueue` array (max 2 items)
   - Added `activePowerUp` tracking
   - Added `addPowerUpToQueue()` method
   - Added `handlePowerUpActivation()` method
   - Modified `activatePowerUp()` to work with queue system

2. **Controls.js**
   - Added `isActivate()` method for E/Q keys
   - Added mobile button handler for activation
   - Updated input tracking

3. **Collectible.js**
   - Modified `collectPowerUp()` to queue instead of auto-activate
   - Removed direct activation logic

4. **GameScene.js**
   - Added `createPowerUpQueueUI()` for visual display
   - Added `updatePowerUpQueueUI()` for queue updates
   - Added `updateActivePowerUpUI()` for active power-up display
   - Added `showPowerUpMessage()` for feedback messages

5. **index.html**
   - Added `activateBtn` mobile control button with ⚡ icon
   - Styled with gold/yellow theme to stand out

### Technical Notes
- Queue uses FIFO (First In, First Out) principle
- Edge detection prevents accidental multiple activations
- UI updates happen automatically on queue changes
- No power-up is lost when queue is full - oldest is explicitly discarded

## Testing Checklist

- [ ] Collect a power-up and verify it appears in queue
- [ ] Press E/Q (or mobile button) to activate the queued power-up
- [ ] Verify power-up effects work correctly when activated
- [ ] Collect 2 power-ups and verify both appear in queue
- [ ] Collect a 3rd power-up and verify first one is discarded
- [ ] Try to activate when queue is empty - should show message
- [ ] Try to activate when power-up already active - should block
- [ ] Verify UI updates correctly on all actions
- [ ] Test on both desktop (keyboard) and mobile (touch) controls
- [ ] Verify invincibility works as a queued power-up

## User Feedback
The system provides clear feedback for:
- ✅ Power-up collected and queued
- ✅ Power-up activated
- ⚠️ Queue full - power-up discarded
- ⚠️ No power-ups to activate
- ⚠️ Power-up already active

All feedback appears as temporary messages near the player character for easy visibility during gameplay.


