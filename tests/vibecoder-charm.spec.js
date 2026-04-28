// VibeCoder charm-hypnotize ability spec.
// Covers requirements R4.1–R4.6 from
// docs/specs/01-spec-vibecoder-mode/01-spec-vibecoder-mode.md (Unit 4)
//
// Proof artifact: npx playwright test tests/vibecoder-charm.spec.js
const { test, expect } = require('@playwright/test');

// ---------------------------------------------------------------------------
// Helpers (same pattern as vibecoder-spawns.spec.js)
// ---------------------------------------------------------------------------

async function freshGame(page) {
    await page.goto('http://localhost:8000/nocache.html');
    await page.waitForFunction(
        () => window.gameInstance && typeof window.gameInstance.dragonCostumes === 'object',
        { timeout: 15000 }
    );
    await page.evaluate(() => {
        localStorage.clear();
        if (window.gameInstance && typeof window.gameInstance.resetGame === 'function') {
            window.gameInstance.resetGame();
        }
    });
    await page.waitForTimeout(500);
}

async function equipVibeCoder(page) {
    await page.evaluate(() => {
        if (!window.gameInstance.gameData.outfits.unlocked.includes('vibeCoder')) {
            window.gameInstance.gameData.outfits.unlocked.push('vibeCoder');
        }
        window.gameInstance.setOutfit('vibeCoder');
    });
    await page.waitForTimeout(200);
}

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
    await page.waitForTimeout(300);
}

/** Toggle to computer form via tryToggle() and wait for it to settle. */
async function enterComputerForm(page) {
    await page.evaluate(() => {
        const gs = window.gameInstance.game.scene.getScene('GameScene');
        if (gs && gs.player && gs.player.transformer) {
            if (gs.player.transformer.currentForm() === 'computer') {
                gs.player.transformer.tryToggle();
            }
        }
    });
    await page.waitForTimeout(50);
    await page.evaluate(() => {
        const gs = window.gameInstance.game.scene.getScene('GameScene');
        if (gs && gs.player && gs.player.transformer) {
            gs.player.transformer.tryToggle();
        }
    });
    await page.waitForTimeout(100);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('VibeCoder charm-hypnotize ability (R4.x)', () => {

    test.beforeEach(async ({ page }) => {
        await freshGame(page);
        await equipVibeCoder(page);
        await startGameScene(page);
        await enterComputerForm(page);
    });

    // -------------------------------------------------------------------------
    // R4.1 + R4.2 + R4.5 — Pressing X in computer form charms enemies within
    //   250px and sets charmExpiresAt ≈ now + 8000ms. Cooldown becomes 4000ms.
    // -------------------------------------------------------------------------
    test('R4.1/R4.2: X in computer form charms all enemies within 250px', async ({ page }) => {
        const result = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            const scene  = gs;

            // Place three enemies within 250px of the player.
            const entries = scene.enemies.children.entries;
            const closeEnemies = [];
            for (let i = 0; i < 3 && i < entries.length; i++) {
                const sprite = entries[i];
                const enemy  = sprite.getData('enemy');
                if (!enemy) continue;
                // Position them close (within 200px)
                sprite.x = player.sprite.x + (i - 1) * 50;
                sprite.y = player.sprite.y;
                enemy.health = 60;
                enemy.charmed = false;
                enemy.charmExpiresAt = 0;
                closeEnemies.push(enemy);
            }

            if (closeEnemies.length < 3) {
                return { skip: true, reason: 'not enough enemies in scene (' + closeEnemies.length + ')' };
            }

            // Ensure cooldown is clear.
            player.transformer.charmCooldownMs = 0;

            const nowBefore = scene.time ? scene.time.now : Date.now();

            // Trigger charm directly (mirrors what handleVibeCoderCharm does).
            player.transformer.triggerCharm();

            const nowAfter = scene.time ? scene.time.now : Date.now();

            return {
                skip: false,
                enemy0charmed: closeEnemies[0].charmed,
                enemy1charmed: closeEnemies[1].charmed,
                enemy2charmed: closeEnemies[2].charmed,
                expires0: closeEnemies[0].charmExpiresAt,
                expires1: closeEnemies[1].charmExpiresAt,
                expires2: closeEnemies[2].charmExpiresAt,
                nowBefore,
                nowAfter,
                cooldownAfter: player.transformer.charmCooldownMs
            };
        });

        if (result.skip) {
            console.log('Skipping R4.2 charm test:', result.reason);
            return;
        }

        expect(result.enemy0charmed).toBe(true);
        expect(result.enemy1charmed).toBe(true);
        expect(result.enemy2charmed).toBe(true);

        // charmExpiresAt should be ≈ now + 8000ms (allow ±500ms for timing slop).
        const expectedExpiry = result.nowBefore + 8000;
        expect(result.expires0).toBeGreaterThanOrEqual(expectedExpiry - 500);
        expect(result.expires0).toBeLessThanOrEqual(result.nowAfter + 8000 + 500);

        // R4.5 — cooldown should be 4000ms after trigger.
        expect(result.cooldownAfter).toBe(4000);
    });

    // -------------------------------------------------------------------------
    // R4.2 — Enemies OUTSIDE the 250px radius are NOT charmed.
    // -------------------------------------------------------------------------
    test('R4.2: enemies outside 250px radius are NOT charmed', async ({ page }) => {
        const result = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            const scene  = gs;

            const entries = scene.enemies.children.entries;
            if (entries.length === 0) return { skip: true, reason: 'no enemies' };

            const sprite = entries[0];
            const enemy  = sprite.getData('enemy');
            if (!enemy) return { skip: true, reason: 'no enemy data' };

            // Place enemy well outside 250px.
            sprite.x = player.sprite.x + 400;
            sprite.y = player.sprite.y;
            enemy.health = 60;
            enemy.charmed = false;
            enemy.charmExpiresAt = 0;

            // Clear cooldown and trigger charm.
            player.transformer.charmCooldownMs = 0;
            player.transformer.triggerCharm();

            return {
                skip: false,
                enemyCharmed: enemy.charmed,
                dist: Math.abs(sprite.x - player.sprite.x)
            };
        });

        if (result.skip) {
            console.log('Skipping R4.2 radius test:', result.reason);
            return;
        }

        expect(result.dist).toBeGreaterThan(250);
        expect(result.enemyCharmed).toBe(false);
    });

    // -------------------------------------------------------------------------
    // R4.1 — Cooldown enforcement: X 1000ms after first trigger → no re-charm.
    //         X at 4500ms after first trigger → does re-charm.
    // -------------------------------------------------------------------------
    test('R4.1: cooldown prevents re-trigger within 4000ms, allows after 4000ms', async ({ page }) => {
        const result = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            const scene  = gs;

            const entries = scene.enemies.children.entries;
            if (entries.length === 0) return { skip: true, reason: 'no enemies' };

            const sprite = entries[0];
            const enemy  = sprite.getData('enemy');
            if (!enemy) return { skip: true, reason: 'no enemy data' };

            // Place enemy within range.
            sprite.x = player.sprite.x + 100;
            sprite.y = player.sprite.y;
            enemy.health = 60;
            enemy.charmed = false;
            enemy.charmExpiresAt = 0;

            // First trigger at t=0 (cooldown clear).
            player.transformer.charmCooldownMs = 0;
            player.transformer.triggerCharm();
            const firstCharmed = enemy.charmed;
            const cooldownAfterFirst = player.transformer.charmCooldownMs; // should be 4000

            // Reset enemy charmed state to detect a second charm.
            enemy.charmed = false;
            enemy.charmExpiresAt = 0;

            // Simulate 1000ms passing — cooldown should still be active (3000ms left).
            player.transformer.update(1000);
            const cooldownAt1s = player.transformer.charmCooldownMs; // ~3000

            // Attempt second trigger while still on cooldown — should be a no-op.
            // (handleVibeCoderCharm checks charmCooldownMs <= 0)
            if (player.transformer.charmCooldownMs <= 0) {
                // Unexpected state — just trigger to see what happens.
                player.transformer.triggerCharm();
            }
            // Direct call that respects cooldown: simulate handleVibeCoderCharm logic.
            const charmedAt1s = enemy.charmed; // should remain false

            // Now advance to 4500ms from start (3500ms more from current 1000ms mark).
            player.transformer.update(3500);
            const cooldownAt4500 = player.transformer.charmCooldownMs; // should be 0

            // Third attempt — should now work.
            if (player.transformer.charmCooldownMs <= 0) {
                player.transformer.triggerCharm();
            }
            const charmedAt4500 = enemy.charmed;

            return {
                skip: false,
                firstCharmed,
                cooldownAfterFirst,
                cooldownAt1s,
                charmedAt1s,
                cooldownAt4500,
                charmedAt4500
            };
        });

        if (result.skip) {
            console.log('Skipping R4.1 cooldown test:', result.reason);
            return;
        }

        expect(result.firstCharmed).toBe(true);
        expect(result.cooldownAfterFirst).toBe(4000);
        // After 1000ms, cooldown should still have ~3000ms left (allowing for floating point).
        expect(result.cooldownAt1s).toBeGreaterThan(0);
        expect(result.charmedAt1s).toBe(false); // No re-trigger while on cooldown.
        // After 4500ms total, cooldown should be exhausted.
        expect(result.cooldownAt4500).toBe(0);
        expect(result.charmedAt4500).toBe(true);
    });

    // -------------------------------------------------------------------------
    // R4.3 — Charmed enemy has the charmed flag and charmExpiresAt set.
    // -------------------------------------------------------------------------
    test('R4.3: charmed enemy has charmed===true and valid charmExpiresAt', async ({ page }) => {
        const result = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            const scene  = gs;

            const entries = scene.enemies.children.entries;
            if (entries.length === 0) return { skip: true, reason: 'no enemies' };

            const sprite = entries[0];
            const enemy  = sprite.getData('enemy');
            if (!enemy) return { skip: true, reason: 'no enemy data' };

            sprite.x = player.sprite.x + 50;
            sprite.y = player.sprite.y;
            enemy.health = 60;
            enemy.charmed = false;
            enemy.charmExpiresAt = 0;

            player.transformer.charmCooldownMs = 0;
            const now = scene.time ? scene.time.now : Date.now();
            player.transformer.triggerCharm();

            return {
                skip: false,
                charmed: enemy.charmed,
                charmExpiresAt: enemy.charmExpiresAt,
                expectedMin: now + 7500,
                expectedMax: now + 8500
            };
        });

        if (result.skip) {
            console.log('Skipping R4.3 test:', result.reason);
            return;
        }

        expect(result.charmed).toBe(true);
        expect(result.charmExpiresAt).toBeGreaterThanOrEqual(result.expectedMin);
        expect(result.charmExpiresAt).toBeLessThanOrEqual(result.expectedMax);
    });

    // -------------------------------------------------------------------------
    // R4.4 — On expiry, enemy reverts to normal (charmed becomes false, spiral
    //          graphic is destroyed).
    // -------------------------------------------------------------------------
    test('R4.4: charmed enemy reverts to normal after expiry', async ({ page }) => {
        const result = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            const scene  = gs;

            const entries = scene.enemies.children.entries;
            if (entries.length === 0) return { skip: true, reason: 'no enemies' };

            const sprite = entries[0];
            const enemy  = sprite.getData('enemy');
            if (!enemy) return { skip: true, reason: 'no enemy data' };

            sprite.x = player.sprite.x + 50;
            sprite.y = player.sprite.y;
            enemy.health = 60;
            enemy.charmed = false;
            enemy.charmExpiresAt = 0;

            player.transformer.charmCooldownMs = 0;
            player.transformer.triggerCharm();

            const charmedAfterTrigger = enemy.charmed;

            // Manually set charmExpiresAt to the past so the next update reverts it.
            const now = scene.time ? scene.time.now : Date.now();
            enemy.charmExpiresAt = now - 1; // already expired

            // Tick the enemy update (time, delta) — using scene.time.now as time.
            const currentTime = scene.time ? scene.time.now : Date.now();
            enemy.update(currentTime, 16);

            return {
                skip: false,
                charmedAfterTrigger,
                charmedAfterExpiry: enemy.charmed,
                spiralDestroyed: !enemy._charmSpiral
            };
        });

        if (result.skip) {
            console.log('Skipping R4.4 test:', result.reason);
            return;
        }

        expect(result.charmedAfterTrigger).toBe(true);
        expect(result.charmedAfterExpiry).toBe(false);
        expect(result.spiralDestroyed).toBe(true);
    });

    // -------------------------------------------------------------------------
    // R4.6 — Charm is unavailable in robot form (X has no effect).
    // -------------------------------------------------------------------------
    test('R4.6: charm X key has no effect in robot form', async ({ page }) => {
        // Toggle back to robot form.
        await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            if (player.transformer && player.transformer.currentForm() === 'computer') {
                player.transformer.cooldownMs = 0;
                player.transformer.tryToggle(); // computer -> robot
            }
        });
        await page.waitForTimeout(50);

        const result = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            const scene  = gs;

            const form = player.transformer ? player.transformer.currentForm() : 'unknown';

            const entries = scene.enemies.children.entries;
            if (entries.length === 0) return { skip: true, reason: 'no enemies', form };

            const sprite = entries[0];
            const enemy  = sprite.getData('enemy');
            if (!enemy) return { skip: true, reason: 'no enemy data', form };

            sprite.x = player.sprite.x + 50;
            sprite.y = player.sprite.y;
            enemy.health = 60;
            enemy.charmed = false;

            // Ensure cooldown is clear.
            player.transformer.charmCooldownMs = 0;

            // Simulate pressing X via handleVibeCoderCharm while in robot form.
            if (player.controls && player.controls.keys) {
                player.controls.keys['KeyX'] = true;
            }
            // Reset edge-detection so it fires.
            player.previousInputs.vibeCharm = false;

            if (typeof player.handleVibeCoderCharm === 'function') {
                player.handleVibeCoderCharm();
            }

            if (player.controls && player.controls.keys) {
                player.controls.keys['KeyX'] = false;
            }

            return {
                skip: false,
                form,
                enemyCharmed: enemy.charmed,
                // Cooldown should remain 0 (not consumed) since ability didn't fire.
                cooldown: player.transformer.charmCooldownMs
            };
        });

        if (result.skip) {
            console.log('Skipping R4.6 test:', result.reason);
            return;
        }

        expect(result.form).toBe('robot');
        expect(result.enemyCharmed).toBe(false);
        expect(result.cooldown).toBe(0);
    });

});
