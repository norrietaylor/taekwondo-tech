// VibeCoder costume + robot<->computer transformer spec.
// Covers requirements R2.1–R2.6 from
// docs/specs/01-spec-vibecoder-mode/02-unit-2-vibecoder-transform.feature
//
// Proof artifact: npx playwright test tests/vibecoder-transform.spec.js
const { test, expect } = require('@playwright/test');

// Helper: load the game, clear saves and reload for a fresh state.
async function freshGame(page) {
    await page.goto('http://localhost:8000/nocache.html');
    await page.waitForFunction(
        () => window.gameInstance && typeof window.gameInstance.dragonCostumes === 'object',
        { timeout: 15000 }
    );
    // Clear save data and reset.
    await page.evaluate(() => {
        localStorage.clear();
        if (window.gameInstance && typeof window.gameInstance.resetGame === 'function') {
            window.gameInstance.resetGame();
        }
    });
    // Short wait after reset.
    await page.waitForTimeout(500);
}

// Helper: set vibeCoder as the active outfit (unlocking it first).
async function equipVibeCoder(page) {
    await page.evaluate(() => {
        // Unlock vibeCoder directly if not already unlocked.
        if (!window.gameInstance.gameData.outfits.unlocked.includes('vibeCoder')) {
            window.gameInstance.gameData.outfits.unlocked.push('vibeCoder');
        }
        window.gameInstance.setOutfit('vibeCoder');
    });
    await page.waitForTimeout(200);
}

// Helper: start the GameScene and wait for the player to exist.
async function startGameScene(page) {
    await page.evaluate(() => {
        window.gameInstance.game.scene.start('GameScene');
    });
    await page.waitForFunction(
        () => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            return gs && gs.player && gs.player.body;
        },
        { timeout: 10000 }
    );
    // Allow a couple of frames for the transformer to initialise.
    await page.waitForTimeout(300);
}

test.describe('VibeCoder costume + robot<->computer transform', () => {

    test.beforeEach(async ({ page }) => {
        await freshGame(page);
    });

    // R2.1 — VibeCoder is registered in the costume catalog.
    test('R2.1: vibeCoder entry exists in dragonCostumes with required fields', async ({ page }) => {
        const costume = await page.evaluate(() => {
            const c = window.gameInstance.dragonCostumes.vibeCoder;
            if (!c) return null;
            return {
                name:          c.name,
                canTransform:  c.canTransform,
                transformKey:  c.transformKey,
                currentForm:   c.currentForm,
                icon:          c.icon,
                primaryColor:  c.primaryColor,
                secondaryColor: c.secondaryColor,
                beltColor:     c.beltColor,
                description:   c.description,
                effectColor:   c.effectColor
            };
        });

        expect(costume).not.toBeNull();
        expect(costume.name).toBe('VibeCoder');
        expect(costume.canTransform).toBe(true);
        expect(costume.transformKey).toBe('V');
        expect(costume.currentForm).toBe('robot');
        // Required cosmetic fields must be truthy/numeric.
        expect(costume.icon).toBeTruthy();
        expect(typeof costume.primaryColor).toBe('number');
        expect(typeof costume.secondaryColor).toBe('number');
        expect(typeof costume.beltColor).toBe('number');
        expect(costume.description).toBeTruthy();
        expect(typeof costume.effectColor).toBe('number');
    });

    // R2.2 — Completing level 1 unlocks vibeCoder via checkDragonUnlocks().
    test('R2.2: checkDragonUnlocks() unlocks vibeCoder when currentLevel >= 2', async ({ page }) => {
        const result = await page.evaluate(() => {
            // Ensure vibeCoder is NOT in the unlocked list first.
            window.gameInstance.gameData.outfits.unlocked =
                window.gameInstance.gameData.outfits.unlocked.filter(k => k !== 'vibeCoder');
            // Simulate level 1 completion.
            window.gameInstance.gameData.currentLevel = 2;
            window.gameInstance.checkDragonUnlocks();
            return {
                unlocked: window.gameInstance.gameData.outfits.unlocked.includes('vibeCoder')
            };
        });

        expect(result.unlocked).toBe(true);
    });

    // R2.2b — Save persistence.
    test('R2.2b: vibeCoder unlock persists after saveGameData()', async ({ page }) => {
        await page.evaluate(() => {
            window.gameInstance.gameData.outfits.unlocked =
                window.gameInstance.gameData.outfits.unlocked.filter(k => k !== 'vibeCoder');
            window.gameInstance.gameData.currentLevel = 2;
            window.gameInstance.checkDragonUnlocks();
            window.gameInstance.saveGameData();
        });

        // Read back from localStorage. Save format: { version, timestamp, data: gameData }.
        const savedUnlocked = await page.evaluate(() => {
            const raw = localStorage.getItem('taekwondo-robot-builder-save');
            if (!raw) return null;
            const save = JSON.parse(raw);
            // gameData is nested under save.data
            const gameData = save.data || save;
            return (gameData.outfits && gameData.outfits.unlocked) || null;
        });

        expect(savedUnlocked).not.toBeNull();
        expect(savedUnlocked).toContain('vibeCoder');
    });

    // R2.3 — VibeCoderTransformer has correct cooldown and form config.
    test('R2.3: VibeCoderTransformer cooldownMs=1000, forms robot/computer', async ({ page }) => {
        await equipVibeCoder(page);
        await startGameScene(page);

        const config = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const t = gs.player.transformer;
            if (!t || !t.config) return null;
            return {
                cooldownMs: t.config.cooldownMs,
                primary:    t.config.forms.primary,
                secondary:  t.config.forms.secondary
            };
        });

        expect(config).not.toBeNull();
        expect(config.cooldownMs).toBe(1000);
        expect(config.primary).toBe('robot');
        expect(config.secondary).toBe('computer');
    });

    // R2.4 — Computer form locks horizontal velocity to 0.
    test('R2.4: computer form zeroes velocity.x every frame', async ({ page }) => {
        await equipVibeCoder(page);
        await startGameScene(page);

        // Toggle to computer form by calling tryToggle() directly.
        await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            gs.player.transformer.tryToggle();
        });

        // Wait two frames (~32ms at 60fps, use 100ms to be safe).
        await page.waitForTimeout(100);

        // Simulate holding right-arrow for two frames by reading velocity after
        // each manual update tick (we can't drive real key events in headless).
        const velocities = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            // Force a non-zero velocity as if input were applied.
            player.body.setVelocityX(300);
            // Tick the transformer manually (mirrors what Player.update does).
            player.transformer.update(16);
            const v1 = player.body.velocity.x;
            // Second frame.
            player.body.setVelocityX(300);
            player.transformer.update(16);
            const v2 = player.body.velocity.x;
            return { v1, v2 };
        });

        expect(velocities.v1).toBe(0);
        expect(velocities.v2).toBe(0);
    });

    // R2.4 (Jump Block) — Computer form blocks jump input entirely.
    test('R2.4b: computer form blocks jump input (velocity.y and sprite.y unchanged)', async ({ page }) => {
        await equipVibeCoder(page);
        await startGameScene(page);

        // Toggle to computer form.
        await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            gs.player.transformer.tryToggle();
        });

        // Wait for transition to settle.
        await page.waitForTimeout(100);

        // Verify: Press space (simulated) should NOT change velocity.y or sprite.y.
        const jumpResult = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            const initialY = player.sprite.y;
            const initialVelY = player.body.velocity.y;

            // Simulate jump input by calling tryJump() directly
            // (as if Space was pressed in handleMovement via Controls.isJump()).
            // But in computer form, handleMovement should return early and never reach tryJump().
            // Verify by checking that velocity.y and sprite.y remain unchanged after frames.

            // Frame 1: simulate controls.isJump() == true
            player.controls.jump = true;
            player.handleMovement();
            const velY1 = player.body.velocity.y;
            const y1 = player.sprite.y;

            // Frame 2: simulate controls.isJump() == true again
            player.handleMovement();
            const velY2 = player.body.velocity.y;
            const y2 = player.sprite.y;

            // Also verify that facingRight was NOT flipped by horizontal input.
            const facingRight = player.facingRight;

            return {
                initialY,
                initialVelY,
                velY1,
                y1,
                velY2,
                y2,
                facingRight
            };
        });

        // Jump input should have been blocked, so velocity.y should not change to negative (jump).
        expect(jumpResult.velY1).toBe(jumpResult.initialVelY);
        expect(jumpResult.velY2).toBe(jumpResult.initialVelY);
        // sprite.y should remain unchanged
        expect(jumpResult.y1).toBe(jumpResult.initialY);
        expect(jumpResult.y2).toBe(jumpResult.initialY);
        // facingRight should not flip in response to horizontal input
        expect(jumpResult.facingRight).toBe(true);
    });

    // R2.5 — "Challenge accepted" bubble appears on robot->computer transition.
    test('R2.5: "Challenge accepted" bubble appears when toggling to computer', async ({ page }) => {
        await equipVibeCoder(page);
        await startGameScene(page);

        // Capture any text objects added to the scene after toggle.
        const result = await page.evaluate(async () => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            // Collect existing text object count.
            const before = gs.children.list.filter(
                obj => obj.type === 'Text'
            ).length;

            // Toggle: robot -> computer.
            gs.player.transformer.tryToggle();

            // Allow synchronous callbacks to run.
            await new Promise(r => setTimeout(r, 50));

            // Find any new text objects containing "Challenge accepted".
            const found = gs.children.list.some(
                obj => obj.type === 'Text' && obj.text && obj.text.includes('Challenge accepted')
            );
            return { found };
        });

        expect(result.found).toBe(true);
    });

    // R2.6 — Computer form visuals are procedural rectangles, no images/sprites/audio.
    test('R2.6: computer form visuals contain rectangle game objects only (no sprites/images)', async ({ page }) => {
        await equipVibeCoder(page);
        await startGameScene(page);

        await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            gs.player.transformer.tryToggle();
        });

        await page.waitForTimeout(100);

        const visualCheck = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const visuals = gs.player.transformer.visuals;
            if (!visuals || visuals.length === 0) return { ok: false, reason: 'no visuals' };
            const hasSpritesOrImages = visuals.some(v => {
                const t = v && v.type;
                return t === 'Image' || t === 'Sprite' || t === 'Audio';
            });
            const hasRectangles = visuals.some(v => v && v.type && (
                v.type === 'Rectangle' || v.type === 'Ellipse' || v.type === 'Arc' || v.type === 'Text'
            ));
            return {
                ok: !hasSpritesOrImages && hasRectangles,
                count: visuals.length,
                hasSpritesOrImages,
                hasRectangles
            };
        });

        expect(visualCheck.ok).toBe(true);
        expect(visualCheck.hasSpritesOrImages).toBe(false);
        expect(visualCheck.hasRectangles).toBe(true);
    });

    // R2.7 — vibeCoder appears in the costume catalog (no CraftScene.js modification needed).
    test('R2.7: vibeCoder key is visible in dragonCostumes keys (CraftScene-agnostic)', async ({ page }) => {
        const keys = await page.evaluate(() => Object.keys(window.gameInstance.dragonCostumes));
        expect(keys).toContain('vibeCoder');
    });
});
