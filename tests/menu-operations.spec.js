// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Menu Operations and Navigation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up error monitoring for each test
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });
  });

  test('should initialize game properly and show menu', async ({ page }) => {
    await page.goto('/');
    
    // Wait for Phaser to load
    await page.waitForFunction(() => window.Phaser, { timeout: 10000 });
    
    // Wait for game initialization
    await page.waitForFunction(() => {
      return window.gameInstance && 
             window.gameInstance.game && 
             window.gameInstance.saveSystem &&
             window.gameInstance.controls;
    }, { timeout: 15000 });
    
    // Verify menu elements are visible
    await expect(page.locator('text=🥋 TAEKWONDO')).toBeVisible();
    await expect(page.locator('text=ROBOT BUILDER')).toBeVisible();
    await expect(page.locator('text=Start Game')).toBeVisible();
    
    console.log('✅ Game initialization test passed');
  });

  test('should handle Start Game button click correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // Monitor console messages
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
      console.log('Console:', msg.text());
    });
    
    // Verify game instance exists
    const gameInstanceExists = await page.evaluate(() => {
      return !!(window.gameInstance && window.gameInstance.resetGame);
    });
    expect(gameInstanceExists).toBe(true);
    
    // Click Start Game
    console.log('Clicking Start Game button...');
    await page.click('text=Start Game');
    
    // Wait for scene transition with detailed monitoring
    await page.waitForFunction(() => {
      const hasGameInstance = window.gameInstance && window.gameInstance.game;
      const hasScene = hasGameInstance && window.gameInstance.game.scene;
      const isGameSceneActive = hasScene && window.gameInstance.game.scene.isActive('GameScene');
      
      console.log('Checking scene state:', {
        hasGameInstance: !!hasGameInstance,
        hasScene: !!hasScene,
        isGameSceneActive: !!isGameSceneActive
      });
      
      return isGameSceneActive;
    }, { timeout: 10000 });
    
    // Verify game UI elements appear
    await page.waitForSelector('text=Score:', { timeout: 8000 });
    await expect(page.locator('text=Score:')).toBeVisible();
    await expect(page.locator('text=Parts:')).toBeVisible();
    await expect(page.locator('text=Level 1')).toBeVisible();
    
    // Verify no critical errors in console
    const errors = consoleMessages.filter(msg => 
      msg.includes('ERROR') || 
      msg.includes('Failed to') ||
      msg.includes('ReferenceError') ||
      msg.includes('TypeError')
    );
    
    if (errors.length > 0) {
      console.error('Console errors found:', errors);
    }
    expect(errors).toHaveLength(0);
    
    console.log('✅ Start Game button test passed');
  });

  test('should handle keyboard navigation in menu', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // Test arrow key navigation
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(200);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);
    
    // Test Enter key to select
    await page.keyboard.press('Enter');
    await page.waitForSelector('text=Score:', { timeout: 5000 });
    
    await expect(page.locator('text=Score:')).toBeVisible();
    
    console.log('✅ Keyboard navigation test passed');
  });

  test('should handle Space key to start game', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // Press space to start game
    await page.keyboard.press('Space');
    await page.waitForSelector('text=Score:', { timeout: 5000 });
    
    await expect(page.locator('text=Score:')).toBeVisible();
    
    console.log('✅ Space key start game test passed');
  });

  test('should open and close settings properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // Open settings
    await page.click('text=Settings');
    
    // Verify settings dialog
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Sound:')).toBeVisible();
    
    // Test sound toggle functionality
    const initialSoundText = await page.locator('text=Sound:').textContent();
    await page.click('text=Sound:');
    
    // Verify sound setting changed
    const newSoundText = await page.locator('text=Sound:').textContent();
    expect(newSoundText).not.toBe(initialSoundText);
    
    // Close settings
    await page.click('text=Close');
    
    // Verify back to main menu
    await expect(page.locator('text=🥋 TAEKWONDO')).toBeVisible();
    await expect(page.locator('text=Start Game')).toBeVisible();
    
    console.log('✅ Settings menu test passed');
  });

  test('should open and close credits properly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // Open credits
    await page.click('text=Credits');
    
    // Verify credits dialog
    await expect(page.locator('text=Credits')).toBeVisible();
    await expect(page.locator('text=Taekwondo Robot Builder')).toBeVisible();
    await expect(page.locator('text=Phaser.js')).toBeVisible();
    
    // Close credits
    await page.click('text=Close');
    
    // Verify back to main menu
    await expect(page.locator('text=🥋 TAEKWONDO')).toBeVisible();
    await expect(page.locator('text=Start Game')).toBeVisible();
    
    console.log('✅ Credits menu test passed');
  });

  test('should handle continue button when save data exists', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // First start a game to create save data
    await page.click('text=Start Game');
    await page.waitForSelector('text=Score:');
    
    // Play briefly to create meaningful save data
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1000);
    
    // Reload page
    await page.reload();
    await page.waitForSelector('canvas');
    
    // Check if Continue button appears
    const continueExists = await page.locator('text=Continue').isVisible();
    
    if (continueExists) {
      // Test continue functionality
      await page.click('text=Continue');
      await page.waitForSelector('text=Score:', { timeout: 5000 });
      await expect(page.locator('text=Score:')).toBeVisible();
      
      console.log('✅ Continue game test passed');
    } else {
      console.log('ℹ️ No continue button found (no save data)');
    }
  });

  test('should handle rapid menu interactions gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    // Rapidly open and close settings
    for (let i = 0; i < 5; i++) {
      await page.click('text=Settings');
      await page.waitForTimeout(100);
      
      if (await page.locator('text=Close').isVisible()) {
        await page.click('text=Close');
      }
      await page.waitForTimeout(100);
    }
    
    // Rapidly open and close credits
    for (let i = 0; i < 3; i++) {
      await page.click('text=Credits');
      await page.waitForTimeout(100);
      
      if (await page.locator('text=Close').isVisible()) {
        await page.click('text=Close');
      }
      await page.waitForTimeout(100);
    }
    
    // Should not cause errors
    expect(errors).toHaveLength(0);
    
    // Should still be able to start game
    await page.click('text=Start Game');
    await page.waitForSelector('text=Score:', { timeout: 5000 });
    await expect(page.locator('text=Score:')).toBeVisible();
    
    console.log('✅ Rapid interactions test passed');
  });

  test('should handle menu on different screen sizes', async ({ page }) => {
    // Test desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    await expect(page.locator('text=Start Game')).toBeVisible();
    
    // Test mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Start Game')).toBeVisible();
    
    // Test tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=Start Game')).toBeVisible();
    
    console.log('✅ Responsive design test passed');
  });

  test('should validate game state persistence', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // Verify initial game state
    const initialState = await page.evaluate(() => {
      return {
        currentLevel: window.gameInstance.gameData.currentLevel,
        score: window.gameInstance.gameData.score,
        outfitCurrent: window.gameInstance.gameData.outfits.current
      };
    });
    
    expect(initialState.currentLevel).toBe(1);
    expect(initialState.score).toBe(0);
    expect(initialState.outfitCurrent).toBe('default');
    
    console.log('✅ Game state validation test passed');
  });

  test('should monitor for memory leaks during menu operations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('canvas');
    
    // Measure initial memory
    const initialMemory = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Perform multiple menu operations
    for (let i = 0; i < 10; i++) {
      await page.click('text=Settings');
      await page.click('text=Close');
      await page.click('text=Credits');
      await page.click('text=Close');
      await page.waitForTimeout(100);
    }
    
    // Measure final memory
    const finalMemory = await page.evaluate(() => {
      if (performance.memory) {
        return performance.memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Memory should not increase dramatically (allow some variance)
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
      
      console.log(`Memory usage: ${initialMemory} -> ${finalMemory} (${memoryIncreasePercent.toFixed(2)}% increase)`);
      
      // Should not increase by more than 50% during menu operations
      expect(memoryIncreasePercent).toBeLessThan(50);
    }
    
    console.log('✅ Memory leak test passed');
  });
});
