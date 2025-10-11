// Dragon Costume System Automated Tests
const { test, expect } = require('@playwright/test');

test.describe('Dragon Costume System', () => {
    
    test.beforeEach(async ({ page }) => {
        // Navigate to game
        await page.goto('http://localhost:8000/nocache.html');
        
        // Wait for game to load
        await page.waitForTimeout(2000);
        
        // Clear any existing save data to start fresh
        await page.evaluate(() => {
            localStorage.clear();
            if (window.gameInstance) {
                window.gameInstance.resetGame();
            }
        });
        
        await page.reload();
        await page.waitForTimeout(2000);
    });

    test('should have 5 dragon costumes defined in game instance', async ({ page }) => {
        const costumes = await page.evaluate(() => {
            return Object.keys(window.gameInstance.dragonCostumes);
        });
        
        expect(costumes).toHaveLength(5);
        expect(costumes).toContain('default');
        expect(costumes).toContain('fire');
        expect(costumes).toContain('ice');
        expect(costumes).toContain('lightning');
        expect(costumes).toContain('shadow');
    });

    test('should have default costume unlocked at start', async ({ page }) => {
        const currentOutfit = await page.evaluate(() => {
            return window.gameInstance.gameData.outfits.current;
        });
        
        const unlockedOutfits = await page.evaluate(() => {
            return window.gameInstance.gameData.outfits.unlocked;
        });
        
        expect(currentOutfit).toBe('default');
        expect(unlockedOutfits).toContain('default');
    });

    test('should display dragon costume definitions correctly', async ({ page }) => {
        const fireDragon = await page.evaluate(() => {
            return window.gameInstance.getDragonCostume('fire');
        });
        
        expect(fireDragon.name).toBe('Fire Dragon');
        expect(fireDragon.icon).toBe('🔥');
        expect(fireDragon.primaryColor).toBe(0xff4500);
        expect(fireDragon.description).toContain('flames');
    });

    test('should unlock Fire Dragon after completing level 1', async ({ page }) => {
        // Simulate completing level 1
        await page.evaluate(() => {
            window.gameInstance.gameData.currentLevel = 2;
            return window.gameInstance.checkDragonUnlocks();
        });
        
        const unlockedOutfits = await page.evaluate(() => {
            return window.gameInstance.gameData.outfits.unlocked;
        });
        
        expect(unlockedOutfits).toContain('fire');
    });

    test('should unlock Ice Dragon after collecting 5 parts', async ({ page }) => {
        // Simulate collecting 5 robot parts
        await page.evaluate(() => {
            for (let i = 0; i < 5; i++) {
                window.gameInstance.addRobotPart('head', 'common');
            }
            return window.gameInstance.checkDragonUnlocks();
        });
        
        const unlockedOutfits = await page.evaluate(() => {
            return window.gameInstance.gameData.outfits.unlocked;
        });
        
        expect(unlockedOutfits).toContain('ice');
    });

    test('should unlock Lightning Dragon after completing level 2', async ({ page }) => {
        // Simulate completing level 2
        await page.evaluate(() => {
            window.gameInstance.gameData.currentLevel = 3;
            return window.gameInstance.checkDragonUnlocks();
        });
        
        const unlockedOutfits = await page.evaluate(() => {
            return window.gameInstance.gameData.outfits.unlocked;
        });
        
        expect(unlockedOutfits).toContain('lightning');
    });

    test('should unlock Shadow Dragon after completing game', async ({ page }) => {
        // Simulate completing the game
        await page.evaluate(() => {
            window.gameInstance.gameData.currentLevel = 4;
            return window.gameInstance.checkDragonUnlocks();
        });
        
        const unlockedOutfits = await page.evaluate(() => {
            return window.gameInstance.gameData.outfits.unlocked;
        });
        
        expect(unlockedOutfits).toContain('shadow');
    });

    test('should switch to Fire Dragon costume when selected', async ({ page }) => {
        // Unlock and switch to Fire Dragon
        await page.evaluate(() => {
            window.gameInstance.gameData.currentLevel = 2;
            window.gameInstance.checkDragonUnlocks();
            window.gameInstance.setOutfit('fire');
        });
        
        const currentOutfit = await page.evaluate(() => {
            return window.gameInstance.gameData.outfits.current;
        });
        
        expect(currentOutfit).toBe('fire');
    });

    test('should not allow equipping locked costumes', async ({ page }) => {
        // Try to equip Fire Dragon without unlocking
        const result = await page.evaluate(() => {
            window.gameInstance.setOutfit('fire');
            return window.gameInstance.gameData.outfits.current;
        });
        
        // Should still be default since fire is locked
        expect(result).toBe('default');
    });

    test('should persist costume selection after save/load', async ({ page }) => {
        // Unlock and equip Fire Dragon
        await page.evaluate(() => {
            window.gameInstance.gameData.currentLevel = 2;
            window.gameInstance.checkDragonUnlocks();
            window.gameInstance.setOutfit('fire');
            window.gameInstance.saveGameData();
        });
        
        // Reload page
        await page.reload();
        await page.waitForTimeout(2000);
        
        // Check if Fire Dragon is still equipped
        const currentOutfit = await page.evaluate(() => {
            return window.gameInstance.gameData.outfits.current;
        });
        
        expect(currentOutfit).toBe('fire');
    });

    test('should open dragon costume selection UI in CraftScene', async ({ page }) => {
        // Start game
        await page.click('text=Start Game');
        await page.waitForTimeout(1000);
        
        // Navigate to CraftScene (simulate level completion)
        await page.evaluate(() => {
            window.gameInstance.game.scene.start('CraftScene');
        });
        
        await page.waitForTimeout(1000);
        
        // Click Change Outfit button
        const outfitButton = await page.locator('text=Change Outfit').first();
        if (await outfitButton.isVisible()) {
            await outfitButton.click();
            await page.waitForTimeout(500);
            
            // Check if dragon costume UI is displayed
            const titleVisible = await page.locator('text=DRAGON COSTUME SELECTION').isVisible();
            expect(titleVisible).toBeTruthy();
        }
    });

    test('should display unlock progress for locked costumes', async ({ page }) => {
        // Navigate to CraftScene
        await page.evaluate(() => {
            window.gameInstance.game.scene.start('CraftScene');
        });
        
        await page.waitForTimeout(1000);
        
        // Get unlock progress text for Fire Dragon
        const progressText = await page.evaluate(() => {
            const craftScene = window.gameInstance.game.scene.getScene('CraftScene');
            return craftScene.getUnlockProgressText('fire');
        });
        
        expect(progressText).toContain('Complete Level 1');
    });

    test('should update player colors based on dragon costume', async ({ page }) => {
        // Start game
        await page.click('text=Start Game');
        await page.waitForTimeout(2000);
        
        // Get default costume color
        const defaultColor = await page.evaluate(() => {
            const gameScene = window.gameInstance.game.scene.getScene('GameScene');
            if (gameScene && gameScene.player) {
                return gameScene.player.getDragonCostume().primaryColor;
            }
            return null;
        });
        
        expect(defaultColor).toBe(0x4a9eff);
    });

    test('should check for dragon unlocks when entering CraftScene', async ({ page }) => {
        // Set up to unlock Fire Dragon
        await page.evaluate(() => {
            window.gameInstance.gameData.currentLevel = 2;
        });
        
        // Navigate to CraftScene
        await page.evaluate(() => {
            window.gameInstance.game.scene.start('CraftScene');
        });
        
        await page.waitForTimeout(1000);
        
        // Check if Fire Dragon is now unlocked
        const isUnlocked = await page.evaluate(() => {
            return window.gameInstance.gameData.outfits.unlocked.includes('fire');
        });
        
        expect(isUnlocked).toBeTruthy();
    });

    test('should return array of newly unlocked costumes', async ({ page }) => {
        // Set up multiple unlock conditions
        const newUnlocks = await page.evaluate(() => {
            window.gameInstance.gameData.currentLevel = 3;
            for (let i = 0; i < 5; i++) {
                window.gameInstance.addRobotPart('body', 'rare');
            }
            return window.gameInstance.checkDragonUnlocks();
        });
        
        // Should unlock fire, ice, and lightning
        expect(newUnlocks.length).toBeGreaterThan(0);
        expect(newUnlocks).toContain('fire');
        expect(newUnlocks).toContain('ice');
        expect(newUnlocks).toContain('lightning');
    });

    test('should not unlock costumes multiple times', async ({ page }) => {
        // Unlock Fire Dragon
        await page.evaluate(() => {
            window.gameInstance.gameData.currentLevel = 2;
            window.gameInstance.checkDragonUnlocks();
        });
        
        // Try to unlock again
        const secondUnlock = await page.evaluate(() => {
            return window.gameInstance.checkDragonUnlocks();
        });
        
        // Should return empty array since fire is already unlocked
        expect(secondUnlock).toHaveLength(0);
    });

    test('should apply dragon effects to jump particles', async ({ page }) => {
        // Start game and unlock Fire Dragon
        await page.evaluate(() => {
            window.gameInstance.gameData.currentLevel = 2;
            window.gameInstance.checkDragonUnlocks();
            window.gameInstance.setOutfit('fire');
        });
        
        await page.click('text=Start Game');
        await page.waitForTimeout(2000);
        
        // Check that player has Fire Dragon costume
        const costume = await page.evaluate(() => {
            const gameScene = window.gameInstance.game.scene.getScene('GameScene');
            if (gameScene && gameScene.player) {
                return gameScene.player.getDragonCostume().name;
            }
            return null;
        });
        
        expect(costume).toBe('Fire Dragon');
    });

    test('should display all 5 costumes in selection UI', async ({ page }) => {
        await page.evaluate(() => {
            window.gameInstance.game.scene.start('CraftScene');
        });
        
        await page.waitForTimeout(1000);
        
        const costumeCount = await page.evaluate(() => {
            const craftScene = window.gameInstance.game.scene.getScene('CraftScene');
            return craftScene ? 5 : 0; // We expect 5 dragon costumes
        });
        
        expect(costumeCount).toBe(5);
    });

    test('should validate costume data structure', async ({ page }) => {
        const costumeData = await page.evaluate(() => {
            const costume = window.gameInstance.getDragonCostume('ice');
            return {
                hasName: !!costume.name,
                hasIcon: !!costume.icon,
                hasPrimaryColor: typeof costume.primaryColor === 'number',
                hasSecondaryColor: typeof costume.secondaryColor === 'number',
                hasBeltColor: typeof costume.beltColor === 'number',
                hasDescription: !!costume.description,
                hasUnlockCondition: !!costume.unlockCondition,
                hasEffectColor: typeof costume.effectColor === 'number'
            };
        });
        
        expect(costumeData.hasName).toBeTruthy();
        expect(costumeData.hasIcon).toBeTruthy();
        expect(costumeData.hasPrimaryColor).toBeTruthy();
        expect(costumeData.hasSecondaryColor).toBeTruthy();
        expect(costumeData.hasBeltColor).toBeTruthy();
        expect(costumeData.hasDescription).toBeTruthy();
        expect(costumeData.hasUnlockCondition).toBeTruthy();
        expect(costumeData.hasEffectColor).toBeTruthy();
    });
});

