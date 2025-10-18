# iOS/iPad Fullscreen Fix

## Problem
1. Standard fullscreen API doesn't work on iPad/iOS Safari for canvas elements
2. Buttons in Craft Mode weren't responding to clicks when in fullscreen mode
3. Coordinate system was getting out of sync with touch/pointer events

## Solution Implemented

### 1. iOS-Specific Fullscreen Mode (`js/game.js`)

Added iOS detection and custom fullscreen implementation:

```javascript
// Detects iOS/iPad devices (including new iPadOS that identifies as Mac)
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
```

**Key Changes:**
- `enterIOSFullscreen()`: Uses viewport manipulation instead of standard fullscreen API
- `exitIOSFullscreen()`: Properly resets all styles
- Uses Phaser's `scale.refresh()` to update coordinate system after viewport changes
- Added `fullscreenTarget` and `expandParent` to Phaser config

### 2. Enhanced Event Listeners

Added comprehensive event handling for fullscreen and viewport changes:

- `fullscreenchange` / `webkitfullscreenchange`: Handles standard fullscreen API
- `resize`: Handles window resize events (debounced to 250ms)
- `orientationchange`: Handles device rotation (300ms delay for iOS)

All events trigger `game.scale.refresh()` to keep Phaser's coordinate system in sync.

### 3. Fixed Button Interactivity (`js/scenes/CraftScene.js`)

**Changes Made:**
- Added `.setDepth(50)` to all navigation buttons (back, outfit, continue)
- Added `.setDepth(10)` to all part inventory items
- Added `.setDepth(50)` to craft button
- Added hover effects (scale 1.05) for better touch feedback
- Added pointerover/pointerout handlers for visual feedback

### 4. iOS-Friendly Meta Tags

Added to `index.html` and `debug-legendary-mode.html`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="format-detection" content="telephone=no">
```

### 5. Updated UI Text (`js/scenes/MenuScene.js`)

- Shows iOS-specific instructions: "Tap fullscreen button for immersive mode 🎮"
- Fullscreen button shows "Immersive" instead of "Fullscreen" on iOS
- Added visual flash feedback when toggling fullscreen on iOS

## Testing

Created `test-ipad-fullscreen.html` to verify:
1. Device detection works correctly
2. iOS fullscreen mode activates properly
3. Touch/click events work in fullscreen mode
4. Buttons remain interactive

### How to Test on iPad:

1. Open the game in Safari on iPad
2. Tap the fullscreen button (⛶) in the top-right corner
3. Verify that:
   - The game enters fullscreen-like mode
   - All buttons remain clickable
   - Touch controls work properly
   - Craft mode buttons respond to taps
4. Use `test-ipad-fullscreen.html` for detailed diagnostics

## Technical Details

### Why Standard Fullscreen API Fails on iOS

Safari on iOS deliberately doesn't support the Fullscreen API for non-video elements for security and UX reasons. Our solution:

1. Uses `position: fixed` on body
2. Lets Phaser's scale manager handle the canvas resizing
3. Calls `scale.refresh()` to update coordinate transforms
4. Maintains proper touch event coordinate mapping

### Depth Layering Strategy

- Background elements: Default depth (0)
- Interactive parts: Depth 10
- UI buttons: Depth 50
- Overlays: Depth 100+
- Notifications: Depth 200+

This ensures buttons are always above background and receive pointer events.

## Files Modified

1. `js/game.js` - iOS fullscreen implementation, event listeners
2. `js/scenes/MenuScene.js` - iOS-specific UI text and button feedback
3. `js/scenes/CraftScene.js` - Button depth values and hover effects
4. `index.html` - iOS meta tags
5. `debug-legendary-mode.html` - iOS meta tags

## Files Created

1. `test-ipad-fullscreen.html` - Diagnostic tool for fullscreen testing
2. `IOS_FULLSCREEN_FIX.md` - This documentation

## Known Limitations

1. iOS doesn't support true fullscreen - this provides a fullscreen-like experience
2. Status bar may still be visible on some iOS versions
3. Orientation lock may not work on all iOS versions (graceful fallback)
4. Home indicator on newer iPads may still be visible

## Browser Compatibility

- ✅ iPad/iOS Safari (primary target)
- ✅ Desktop Safari
- ✅ Chrome (all platforms)
- ✅ Firefox
- ✅ Edge
- ✅ Mobile Chrome/Android

## Future Improvements

Consider:
- Add PWA manifest for "Add to Home Screen" for true fullscreen
- Add landscape orientation enforcement
- Add haptic feedback for iOS devices
- Cache game assets for offline play

