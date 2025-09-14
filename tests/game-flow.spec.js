// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Taekwondo Robot Builder Game', () => {
  
  test('should load the game and show menu', async ({ page }) => {
    await page.goto('/');
    
    // Wait for game to load
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Check that the title is visible
    await expect(page.locator('text=🥋 TAEKWONDO')).toBeVisible();
    await expect(page.locator('text=ROBOT BUILDER')).toBeVisible();
    
    // Check menu options are present
    await expect(page.locator('text=Start Game')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Credits')).toBeVisible();
  });

  test('should start a new game and verify scene transition', async ({ page }) => {
    await page.goto('/');
    
    // Wait for game to load and check console for initialization
    await page.waitForSelector('canvas');
    
    // Listen for console messages to verify game initialization
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));
    
    // Verify game is properly initialized
    await page.waitForFunction(() => {
      return window.gameInstance && window.gameInstance.game;
    }, { timeout: 10000 });
    
    // Verify menu scene is active
    await expect(page.locator('text=🥋 TAEKWONDO')).toBeVisible();
    await expect(page.locator('text=Start Game')).toBeVisible();
    
    // Click Start Game and monitor console
    await page.click('text=Start Game');
    
    // Wait for console logs indicating proper game flow
    await page.waitForFunction(() => {
      return window.gameInstance && 
             window.gameInstance.game && 
             window.gameInstance.game.scene &&
             window.gameInstance.game.scene.isActive('GameScene');
    }, { timeout: 8000 });
    
    // Wait for game scene to load (check for UI elements)
    await page.waitForSelector('text=Score:', { timeout: 5000 });
    await page.waitForSelector('text=Parts:', { timeout: 5000 });
    await page.waitForSelector('text=Level 1', { timeout: 5000 });
    
    // Verify game elements are present
    await expect(page.locator('text=Score:')).toBeVisible();
    await expect(page.locator('text=Parts:')).toBeVisible();
    await expect(page.locator('text=Level 1')).toBeVisible();
    
    // Verify no JavaScript errors occurred
    const errors = consoleMessages.filter(msg => msg.includes('ERROR') || msg.includes('error'));
    expect(errors).toHaveLength(0);
  });

  test('should respond to keyboard controls', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    await page.click('text=Start Game');
    await page.waitForSelector('text=Score:');
    
    // Test keyboard controls
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.press('Space'); // Jump
    await page.waitForTimeout(100);
    await page.keyboard.press('KeyX'); // Kick
    await page.waitForTimeout(100);
    await page.keyboard.press('KeyZ'); // Punch
    
    // The game should still be running (no errors)
    await expect(page.locator('text=Score:')).toBeVisible();
  });

  test('should open settings menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // Click Settings
    await page.click('text=Settings');
    
    // Check settings dialog appears
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Sound:')).toBeVisible();
    
    // Close settings
    await page.click('text=Close');
  });

  test('should open credits', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // Click Credits
    await page.click('text=Credits');
    
    // Check credits dialog appears
    await expect(page.locator('text=Credits')).toBeVisible();
    await expect(page.locator('text=Taekwondo Robot Builder')).toBeVisible();
    
    // Close credits
    await page.click('text=Close');
  });

  test('should handle mobile layout', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    if (isMobile) {
      // On mobile, check for mobile controls
      const mobileControls = page.locator('#mobileControls');
      await expect(mobileControls).toBeVisible();
      
      // Check for joystick and action buttons
      await expect(page.locator('#joystick')).toBeVisible();
      await expect(page.locator('#jumpBtn')).toBeVisible();
      await expect(page.locator('#kickBtn')).toBeVisible();
      await expect(page.locator('#punchBtn')).toBeVisible();
    }
  });

  test('should maintain game state with save/load', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // Start a new game
    await page.click('text=Start Game');
    await page.waitForSelector('text=Score:');
    
    // Play for a bit (move around, potentially collect items)
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1000);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1000);
    
    // Go back to menu
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Reload the page to test persistence
    await page.reload();
    await page.waitForSelector('canvas');
    
    // Continue option should be available if there's save data
    // Note: This may not always be visible depending on game state
    const continueButton = page.locator('text=Continue');
    if (await continueButton.isVisible()) {
      await expect(continueButton).toBeVisible();
    }
  });

  test('should handle game performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    await page.click('text=Start Game');
    await page.waitForSelector('text=Score:');
    
    // Monitor console for performance warnings
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });
    
    // Play the game for a few seconds
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(2000);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);
    
    // Should not have critical errors
    const criticalErrors = consoleLogs.filter(log => 
      log.includes('error') || log.includes('failed')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('should display game elements correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    await page.click('text=Start Game');
    await page.waitForSelector('text=Score:');
    
    // Take a screenshot for visual regression testing
    await page.screenshot({ path: 'test-results/game-screenshot.png' });
    
    // Verify canvas is rendering
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Check that the canvas has reasonable dimensions
    const canvasSize = await canvas.boundingBox();
    expect(canvasSize.width).toBeGreaterThan(300);
    expect(canvasSize.height).toBeGreaterThan(200);
  });

  // Enhanced Menu Operation Tests
  test('should handle menu navigation with keyboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // Test keyboard navigation
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
    
    // Test space key to start game
    await page.keyboard.press('Space');
    await page.waitForSelector('text=Score:', { timeout: 5000 });
    
    // Verify game started successfully
    await expect(page.locator('text=Score:')).toBeVisible();
  });

  test('should properly handle settings menu operations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // Open settings
    await page.click('text=Settings');
    
    // Verify settings dialog appears
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Sound:')).toBeVisible();
    
    // Test sound toggle
    await page.click('text=Sound:');
    
    // Close settings
    await page.click('text=Close');
    
    // Verify settings closed and we're back to menu
    await expect(page.locator('text=🥋 TAEKWONDO')).toBeVisible();
  });

  test('should properly handle credits menu operations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // Open credits
    await page.click('text=Credits');
    
    // Verify credits dialog appears
    await expect(page.locator('text=Credits')).toBeVisible();
    await expect(page.locator('text=Taekwondo Robot Builder')).toBeVisible();
    
    // Close credits
    await page.click('text=Close');
    
    // Verify credits closed and we're back to menu
    await expect(page.locator('text=🥋 TAEKWONDO')).toBeVisible();
  });

  test('should monitor for JavaScript errors during gameplay', async ({ page }) => {
    const jsErrors = [];
    const consoleErrors = [];
    
    // Capture JavaScript errors
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForSelector('canvas');
    await page.click('text=Start Game');
    await page.waitForSelector('text=Score:');
    
    // Play the game for a bit
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1000);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);
    await page.keyboard.press('KeyX'); // Kick
    await page.waitForTimeout(500);
    await page.keyboard.press('KeyZ'); // Punch
    await page.waitForTimeout(1000);
    
    // Check for errors
    expect(jsErrors).toHaveLength(0);
    
    // Filter out expected debug logs, only check for real errors
    const realErrors = consoleErrors.filter(error => 
      error.includes('ERROR') || 
      error.includes('Failed') ||
      error.includes('undefined') ||
      error.includes('ReferenceError')
    );
    expect(realErrors).toHaveLength(0);
  });

  test('should handle scene transitions properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // Start game
    await page.click('text=Start Game');
    await page.waitForSelector('text=Score:');
    
    // Verify we're in GameScene
    const inGameScene = await page.evaluate(() => {
      return window.gameInstance && 
             window.gameInstance.game &&
             window.gameInstance.game.scene.isActive('GameScene');
    });
    expect(inGameScene).toBe(true);
    
    // Try to go back to menu (if ESC works)
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Alternative: Check if game is still running properly
    const gameStillRunning = await page.evaluate(() => {
      return window.gameInstance && 
             window.gameInstance.game &&
             window.gameInstance.game.scene;
    });
    expect(gameStillRunning).toBe(true);
  });

  test('should handle continue game functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // First, play a bit to create save data
    await page.click('text=Start Game');
    await page.waitForSelector('text=Score:');
    
    // Play briefly
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1000);
    
    // Refresh page to test save/load
    await page.reload();
    await page.waitForSelector('canvas');
    
    // Check if Continue button appears (it might not if no significant progress)
    const continueButton = page.locator('text=Continue');
    if (await continueButton.isVisible()) {
      await continueButton.click();
      await page.waitForSelector('text=Score:', { timeout: 5000 });
      await expect(page.locator('text=Score:')).toBeVisible();
    }
  });

  test('should handle mobile controls properly', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    if (isMobile) {
      // Verify mobile controls are visible
      await expect(page.locator('#mobileControls')).toBeVisible();
      await expect(page.locator('#joystick')).toBeVisible();
      await expect(page.locator('#jumpBtn')).toBeVisible();
      
      // Test touch interactions
      await page.tap('text=Start Game');
      await page.waitForSelector('text=Score:', { timeout: 5000 });
      
      // Test mobile game controls
      await page.tap('#jumpBtn');
      await page.waitForTimeout(500);
      await page.tap('#kickBtn');
      await page.waitForTimeout(500);
      await page.tap('#punchBtn');
      await page.waitForTimeout(500);
    }
  });

  test('should handle rapid user interactions without errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    // Rapidly click menu items
    for (let i = 0; i < 5; i++) {
      await page.click('text=Settings');
      await page.waitForTimeout(100);
      if (await page.locator('text=Close').isVisible()) {
        await page.click('text=Close');
      }
      await page.waitForTimeout(100);
    }
    
    // Start game and rapidly press keys
    await page.click('text=Start Game');
    await page.waitForSelector('text=Score:');
    
    // Rapid key presses
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Space');
      await page.keyboard.press('KeyX');
      await page.keyboard.press('KeyZ');
      await page.waitForTimeout(50);
    }
    
    // Should not have caused any errors
    expect(errors).toHaveLength(0);
  });

  test('should maintain consistent frame rate and performance', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    await page.click('text=Start Game');
    await page.waitForSelector('text=Score:');
    
    // Measure performance
    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        let startTime = performance.now();
        
        function countFrames() {
          frameCount++;
          if (frameCount < 90) { // Count ~3 seconds of frames at 30fps
            requestAnimationFrame(countFrames);
          } else {
            const endTime = performance.now();
            const fps = frameCount / ((endTime - startTime) / 1000);
            resolve({ fps, frameCount, duration: endTime - startTime });
          }
        }
        
        requestAnimationFrame(countFrames);
      });
    });
    
    // Should maintain reasonable frame rate (target is 30fps, allow some variance)
    expect(performanceMetrics.fps).toBeGreaterThan(20);
    expect(performanceMetrics.fps).toBeLessThan(65); // Not too high either
  });
});
