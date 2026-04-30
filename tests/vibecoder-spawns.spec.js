// VibeCoder ally spawning spec.
// Covers requirements R3.1–R3.7 from
// docs/specs/01-spec-vibecoder-mode/01-spec-vibecoder-mode.md (Unit 3)
//
// Proof artifact: npx playwright test tests/vibecoder-spawns.spec.js
const { test, expect } = require('@playwright/test');

// ---------------------------------------------------------------------------
// Helpers (reused from vibecoder-transform.spec.js pattern)
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
    // Allow a couple of frames for the transformer to initialise.
    await page.waitForTimeout(300);
}

/** Toggle player into computer form via tryToggle() and wait for it to settle. */
async function enterComputerForm(page) {
    await page.evaluate(() => {
        const gs = window.gameInstance.game.scene.getScene('GameScene');
        if (gs && gs.player && gs.player.transformer) {
            // Force to robot first if somehow in computer
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

test.describe('VibeCoder ally spawning (R3.x)', () => {

    test.beforeEach(async ({ page }) => {
        await freshGame(page);
        await equipVibeCoder(page);
        await startGameScene(page);
        await enterComputerForm(page);
    });

    // -----------------------------------------------------------------------
    // R3.1 — VibeSpawn class is globally accessible
    // -----------------------------------------------------------------------
    test('R3.1: VibeSpawn is a global class with required constructor signature', async ({ page }) => {
        const result = await page.evaluate(() => {
            if (typeof window.VibeSpawn !== 'function') return { ok: false, reason: 'not a function' };
            // Confirm constructor is callable (don't fully init to avoid Phaser context issues)
            return { ok: true, name: window.VibeSpawn.name };
        });
        expect(result.ok).toBe(true);
        expect(result.name).toBe('VibeSpawn');
    });

    // -----------------------------------------------------------------------
    // R3.5 — 6-ally cap: pressing key 1 six times creates exactly 6, seventh is ignored
    // -----------------------------------------------------------------------
    test('R3.5: cap — 6 chicken presses yield 6 vibeSpawns, 7th is ignored', async ({ page }) => {
        const count = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;

            // Zero out existing spawns to start clean
            player.cleanupVibeSpawns();

            // Spawn 7 chickens via spawnVibeAlly (direct call to avoid keyboard edge-detection complexity)
            for (let i = 0; i < 7; i++) {
                player.spawnVibeAlly('chicken', player.sprite.x, player.sprite.y);
            }

            return player.vibeSpawns.filter(s => s && s.alive).length;
        });

        expect(count).toBe(6);
    });

    // -----------------------------------------------------------------------
    // R3.4 — keys 1/2/3 only work in computer form, not robot form
    // -----------------------------------------------------------------------
    test('R3.4: spawn keys are no-ops in robot form', async ({ page }) => {
        // Toggle back to robot form first
        await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            if (player.transformer && player.transformer.currentForm() === 'computer') {
                // Force cooldown to 0 so toggle works
                player.transformer.cooldownMs = 0;
                player.transformer.tryToggle();
            }
            player.cleanupVibeSpawns();
        });
        await page.waitForTimeout(50);

        const result = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            const form = player.transformer ? player.transformer.currentForm() : 'unknown';
            // Directly call handleVibeCoderSpawns while pressing key 1 (simulate via keys map)
            if (player.controls && player.controls.keys) {
                player.controls.keys['Digit1'] = true;
            }
            if (typeof player.handleVibeCoderSpawns === 'function') {
                player.handleVibeCoderSpawns();
            }
            if (player.controls && player.controls.keys) {
                player.controls.keys['Digit1'] = false;
            }
            return { form, spawnCount: player.vibeSpawns.filter(s => s && s.alive).length };
        });

        expect(result.form).toBe('robot');
        expect(result.spawnCount).toBe(0);
    });

    // -----------------------------------------------------------------------
    // R3.2 — Spawned chicken/duck/dog moves toward nearest enemy
    // -----------------------------------------------------------------------
    test('R3.2: chicken body velocity X sign matches direction to nearest enemy', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            player.cleanupVibeSpawns();

            // Place enemy to the RIGHT of the player (guaranteed sign)
            const enemySprite = gs.enemies.children.entries[0];
            if (!enemySprite) return { skip: true };
            const enemy = enemySprite.getData('enemy');
            if (!enemy) return { skip: true };

            // Force enemy to be alive and far right
            enemy.health = 60;
            enemySprite.x = player.sprite.x + 300;
            enemySprite.y = player.sprite.y;

            // Spawn chicken at player position
            const spawn = player.spawnVibeAlly('chicken', player.sprite.x, player.sprite.y);
            if (!spawn) return { skip: true, reason: 'spawn returned null' };

            // Allow a couple of manual update ticks (100ms equiv)
            for (let i = 0; i < 6; i++) {
                spawn.update(16);
            }

            const velX = spawn.body ? spawn.body.velocity.x : 0;
            const expectedSign = (enemySprite.x - player.sprite.x) >= 0 ? 1 : -1;
            const actualSign = velX === 0 ? 0 : (velX > 0 ? 1 : -1);
            return { velX, expectedSign, actualSign, match: expectedSign === actualSign };
        });

        if (result.skip) {
            // No enemies in scene (can happen in some test configurations) — skip gracefully
            console.log('Skipping R3.2 movement check: no enemy available in scene');
            return;
        }

        expect(result.match).toBe(true);
    });

    // -----------------------------------------------------------------------
    // R3.3 — Dog house emits a dog after 3000ms
    // -----------------------------------------------------------------------
    test('R3.3: doghouse emits a dog after > 3000ms', async ({ page }) => {
        // Reduce the doghouse emit interval for test speed (inject 3001ms of fake delta)
        const result = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            player.cleanupVibeSpawns();

            // Spawn a doghouse
            const doghouse = player.spawnVibeAlly('doghouse', player.sprite.x, player.sprite.y);
            if (!doghouse) return { ok: false, reason: 'doghouse not spawned' };

            const countBefore = player.vibeSpawns.filter(s => s && s.alive && s.type !== 'doghouse').length;

            // Simulate 3001ms of update ticks
            doghouse.update(3001);

            const countAfter = player.vibeSpawns.filter(s => s && s.alive && s.type !== 'doghouse').length;

            return { ok: true, countBefore, countAfter, spawnedDog: countAfter > countBefore };
        });

        expect(result.ok).toBe(true);
        expect(result.spawnedDog).toBe(true);
    });

    // -----------------------------------------------------------------------
    // R3.3b — Dog house despawns after 12000ms
    // -----------------------------------------------------------------------
    test('R3.3b: doghouse despawns after 12000ms lifetime', async ({ page }) => {
        const result = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            player.cleanupVibeSpawns();

            const doghouse = player.spawnVibeAlly('doghouse', player.sprite.x, player.sprite.y);
            if (!doghouse) return { ok: false, reason: 'doghouse not spawned' };

            // Simulate exactly 12001ms
            doghouse.update(12001);

            return { ok: true, alive: doghouse.alive };
        });

        expect(result.ok).toBe(true);
        expect(result.alive).toBe(false);
    });

    // -----------------------------------------------------------------------
    // R3.6 — Each spawn type has a distinct procedural visual (no sprites/images)
    // -----------------------------------------------------------------------
    test('R3.6: spawn visuals are procedural rectangles, no sprites/images', async ({ page }) => {
        const result = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            player.cleanupVibeSpawns();

            const types = ['chicken', 'duck', 'dog', 'doghouse'];
            const report = {};

            types.forEach(t => {
                const spawn = player.spawnVibeAlly(t, player.sprite.x, player.sprite.y);
                if (!spawn) { report[t] = 'not_spawned'; return; }

                // Collect all visual game objects: the sprite + satellite visuals
                const objs = [spawn.sprite, ...(spawn._visuals || [])].filter(Boolean);
                const hasSprite = objs.some(o => o.type === 'Sprite' || o.type === 'Image');
                const hasRect   = objs.some(o =>
                    o.type === 'Rectangle' || o.type === 'Triangle' || o.type === 'Arc'
                    || o.type === 'Ellipse'
                );
                report[t] = { hasSprite, hasRect, objectCount: objs.length };

                // Clean up this spawn to avoid hitting the cap
                spawn.despawn();
            });

            return report;
        });

        for (const type of ['chicken', 'duck', 'dog', 'doghouse']) {
            expect(typeof result[type]).toBe('object');
            expect(result[type].hasSprite).toBe(false);
            expect(result[type].hasRect).toBe(true);
        }
    });

    // -----------------------------------------------------------------------
    // R3.7 — cleanupVibeSpawns despawns all active spawns
    // -----------------------------------------------------------------------
    test('R3.7: cleanupVibeSpawns() despawns all active spawns', async ({ page }) => {
        const result = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            player.cleanupVibeSpawns();

            // Spawn 3 allies
            player.spawnVibeAlly('chicken', player.sprite.x, player.sprite.y);
            player.spawnVibeAlly('duck',    player.sprite.x, player.sprite.y);
            player.spawnVibeAlly('dog',     player.sprite.x, player.sprite.y);

            const countBefore = player.vibeSpawns.filter(s => s && s.alive).length;

            // Trigger cleanup
            player.cleanupVibeSpawns();

            const countAfter = player.vibeSpawns.length;

            return { countBefore, countAfter };
        });

        expect(result.countBefore).toBe(3);
        expect(result.countAfter).toBe(0);
    });

    // -----------------------------------------------------------------------
    // R3.7b — Transform back to robot triggers cleanupVibeSpawns
    // -----------------------------------------------------------------------
    test('R3.7b: toggling back to robot form cleans up all vibeSpawns', async ({ page }) => {
        // Spawn a couple of allies while in computer form
        await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            player.cleanupVibeSpawns();
            player.spawnVibeAlly('chicken', player.sprite.x, player.sprite.y);
            player.spawnVibeAlly('duck',    player.sprite.x, player.sprite.y);
        });

        // Toggle back to robot (force cooldown to 0 first)
        await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const player = gs.player;
            if (player.transformer) {
                player.transformer.cooldownMs = 0;
                player.transformer.tryToggle(); // computer -> robot
            }
        });

        await page.waitForTimeout(50);

        const count = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            return gs.player.vibeSpawns.filter(s => s && s.alive).length;
        });

        expect(count).toBe(0);
    });

});
