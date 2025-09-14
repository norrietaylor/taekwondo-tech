const { test, expect } = require('@playwright/test');

test.describe('Class Instantiation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the unit tests page
    await page.goto('http://localhost:8000/tests/unit-tests.html');
    
    // Wait for tests to complete
    await page.waitForFunction(() => {
      const summary = document.querySelector('#test-stats');
      return summary && summary.textContent.includes('Success Rate:');
    }, { timeout: 30000 });
  });

  test('All unit tests should pass', async ({ page }) => {
    // Check that all tests passed
    const summary = await page.textContent('#test-stats');
    console.log('Test Summary:', summary);
    
    // Extract results
    const failedMatch = summary.match(/❌ Failed: (\d+)/);
    const failedCount = failedMatch ? parseInt(failedMatch[1]) : 0;
    
    // If there are failures, get the details
    if (failedCount > 0) {
      const errorElements = await page.$$('.error-details');
      const errors = [];
      
      for (const errorEl of errorElements) {
        const errorText = await errorEl.textContent();
        errors.push(errorText);
      }
      
      console.error('Test failures:', errors);
      throw new Error(`${failedCount} unit tests failed:\n${errors.join('\n---\n')}`);
    }
    
    expect(failedCount).toBe(0);
  });

  test('No setTint errors should occur in console', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('setTint')) {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a bit longer for any delayed errors
    await page.waitForTimeout(5000);
    
    if (consoleErrors.length > 0) {
      console.error('Console errors found:', consoleErrors);
      throw new Error(`Found ${consoleErrors.length} setTint errors in console:\n${consoleErrors.join('\n')}`);
    }
    
    expect(consoleErrors).toHaveLength(0);
  });
});

test.describe('Main Game Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console error monitoring
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
    });
  });

  test('Game should load without setTint errors', async ({ page }) => {
    const consoleErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Try the cache-busted version first
    await page.goto('http://localhost:8000/nocache.html');
    
    // Wait for game to initialize
    await page.waitForFunction(() => {
      return document.querySelector('#loading').classList.contains('hidden');
    }, { timeout: 15000 });
    
    // Wait a bit more for any runtime errors
    await page.waitForTimeout(3000);
    
    // Check for setTint and clearTint errors specifically
    const setTintErrors = consoleErrors.filter(error => 
      (error.includes('setTint') || error.includes('clearTint')) && error.includes('not a function')
    );
    
    if (setTintErrors.length > 0) {
      console.error('setTint errors found:', setTintErrors);
      throw new Error(`Found ${setTintErrors.length} setTint errors:\n${setTintErrors.join('\n')}`);
    }
    
    expect(setTintErrors).toHaveLength(0);
  });

  test('Start Game button should work without errors', async ({ page }) => {
    const errors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:8000/nocache.html');
    
    // Wait for game to load
    await page.waitForFunction(() => {
      return document.querySelector('#loading').classList.contains('hidden');
    }, { timeout: 15000 });
    
    // Wait for menu to appear
    await page.waitForSelector('text=START GAME', { timeout: 10000 });
    
    // Click Start Game
    await page.click('text=START GAME');
    
    // Wait for game scene to load (should not be dark)
    await page.waitForTimeout(5000);
    
    // Check for any errors during game scene creation
    const gameErrors = errors.filter(error => 
      error.includes('setTint') || 
      error.includes('clearTint') ||
      error.includes('GameScene') ||
      error.includes('Player') ||
      error.includes('Enemy')
    );
    
    if (gameErrors.length > 0) {
      console.error('Game errors found:', gameErrors);
      throw new Error(`Found ${gameErrors.length} game errors:\n${gameErrors.join('\n')}`);
    }
    
    expect(gameErrors).toHaveLength(0);
  });

  test('Player and Enemy updates should not throw setTint/clearTint errors', async ({ page }) => {
    const setTintErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error' && (msg.text().includes('setTint') || msg.text().includes('clearTint'))) {
        setTintErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:8000/nocache.html');
    
    // Wait for game to load
    await page.waitForFunction(() => {
      return document.querySelector('#loading').classList.contains('hidden');
    }, { timeout: 15000 });
    
    // Start the game
    await page.click('text=START GAME');
    
    // Let the game run for a while to trigger update loops
    await page.waitForTimeout(10000);
    
    // Move the player to trigger visual updates
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(1000);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(1000);
    
    // Try some combat moves
    await page.keyboard.press('KeyQ'); // Kick
    await page.waitForTimeout(500);
    await page.keyboard.press('KeyE'); // Punch
    await page.waitForTimeout(500);
    
    if (setTintErrors.length > 0) {
      console.error('setTint/clearTint errors during gameplay:', setTintErrors);
      throw new Error(`Found ${setTintErrors.length} setTint/clearTint errors during gameplay:\n${setTintErrors.join('\n')}`);
    }
    
    expect(setTintErrors).toHaveLength(0);
  });
});
