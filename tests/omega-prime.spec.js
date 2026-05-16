// Omega Prime costume + robot<->red snake transformer spec.
// Covers:
//   - costume catalog entry & required fields
//   - default unlock + checkDragonUnlocks() gating (legendary + all parts)
//   - transformer wiring through window.TransformerRegistry
//   - Digit2 toggles robot <-> snake form (and stat changes)
//   - snake palette stays RED regardless of robot theme
//   - K-key swaps robot theme (Cyberpunk Neon <-> Solar Forge)
//
// Run: npx playwright test tests/omega-prime.spec.js
const { test, expect } = require('@playwright/test');

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
    await page.waitForTimeout(400);
}

async function equipOmegaPrime(page) {
    await page.evaluate(() => {
        const u = window.gameInstance.gameData.outfits.unlocked;
        if (!u.includes('omegaPrime')) u.push('omegaPrime');
        window.gameInstance.setOutfit('omegaPrime');
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
    await page.waitForTimeout(500);
    // Force transformer rebind in case scene started before outfit applied
    await page.evaluate(() => {
        const gs = window.gameInstance.game.scene.getScene('GameScene');
        if (gs && gs.player && typeof gs.player.syncTransformerForOutfit === 'function') {
            gs.player.syncTransformerForOutfit();
        }
    });
    await page.waitForTimeout(200);
}

test.describe('Omega Prime costume + robot<->snake transform', () => {

    test.beforeEach(async ({ page }) => {
        await freshGame(page);
    });

    test('omegaPrime entry exists in dragonCostumes with required fields', async ({ page }) => {
        const costume = await page.evaluate(() => {
            const c = window.gameInstance.dragonCostumes.omegaPrime;
            if (!c) return null;
            return {
                name: c.name,
                isOmegaPrime: c.isOmegaPrime,
                isLegendary: c.isLegendary,
                canTransform: c.canTransform,
                transformKey: c.transformKey,
                currentForm: c.currentForm,
                size: c.size,
                robotSpeed: c.robotSpeed,
                snakeSpeed: c.snakeSpeed,
                snakeColorsPrimary: c.snakeColors && c.snakeColors.primary,
                altThemeKey: c.altThemeKey,
                hasAltPalette: !!c.altPalette
            };
        });
        expect(costume).not.toBeNull();
        expect(costume.name).toBe('Omega Prime');
        expect(costume.isOmegaPrime).toBe(true);
        expect(costume.isLegendary).toBe(true);
        expect(costume.canTransform).toBe(true);
        expect(costume.transformKey).toBe('Digit2');
        expect(costume.currentForm).toBe('robot');
        expect(costume.size).toBeGreaterThanOrEqual(2.5);
        expect(costume.robotSpeed).toBeGreaterThan(0);
        expect(costume.snakeSpeed).toBeGreaterThan(costume.robotSpeed);
        // Snake primary should be RED (high R, low G/B)
        const r = (costume.snakeColorsPrimary >> 16) & 0xff;
        const g = (costume.snakeColorsPrimary >> 8) & 0xff;
        const b = costume.snakeColorsPrimary & 0xff;
        expect(r).toBeGreaterThan(200);
        expect(g).toBeLessThan(80);
        expect(b).toBeLessThan(80);
        expect(costume.altThemeKey).toBe('KeyK');
        expect(costume.hasAltPalette).toBe(true);
    });

    test('omegaPrime is locked on a fresh game, not the starting outfit', async ({ page }) => {
        const state = await page.evaluate(() => ({
            current: window.gameInstance.gameData.outfits.current,
            unlocked: window.gameInstance.gameData.outfits.unlocked.slice()
        }));
        expect(state.unlocked).not.toContain('omegaPrime');
        expect(state.current).not.toBe('omegaPrime');
    });

    test('checkDragonUnlocks() unlocks omegaPrime once Level 1 is complete', async ({ page }) => {
        const result = await page.evaluate(() => {
            const g = window.gameInstance;
            g.gameData.outfits.unlocked = ['default'];
            g.gameData.outfits.current = 'default';
            // Still on Level 1 → omegaPrime must NOT unlock yet.
            g.gameData.currentLevel = 1;
            g.checkDragonUnlocks();
            const onLevel1 = g.gameData.outfits.unlocked.includes('omegaPrime');
            // Level 1 complete (currentLevel advances to 2) → omegaPrime unlocks.
            g.gameData.currentLevel = 2;
            g.checkDragonUnlocks();
            const afterLevel1 = g.gameData.outfits.unlocked.includes('omegaPrime');
            return { onLevel1, afterLevel1 };
        });
        expect(result.onLevel1).toBe(false);
        expect(result.afterLevel1).toBe(true);
    });

    test('Omega Prime transformer is registered and bound to the player', async ({ page }) => {
        await equipOmegaPrime(page);
        await startGameScene(page);
        const info = await page.evaluate(() => {
            const reg = window.TransformerRegistry;
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const p = gs.player;
            return {
                registryHasOmega: !!(reg && typeof reg.omegaPrime === 'function'),
                hasTransformer: !!p.transformer,
                form: p.transformer && typeof p.transformer.currentForm === 'function'
                    ? p.transformer.currentForm()
                    : null
            };
        });
        expect(info.registryHasOmega).toBe(true);
        expect(info.hasTransformer).toBe(true);
        expect(info.form).toBe('robot');
    });

    test('Digit2 toggles between robot and snake form and swaps stats', async ({ page }) => {
        await equipOmegaPrime(page);
        await startGameScene(page);

        const before = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const p = gs.player;
            return {
                form: p.transformer.currentForm(),
                speed: p.speed,
                damageMultiplier: p.damageMultiplier
            };
        });
        expect(before.form).toBe('robot');

        // Robot -> Snake
        await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            gs.player.transformer.tryToggle();
        });
        await page.waitForTimeout(300);
        const afterToSnake = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const p = gs.player;
            return {
                form: p.transformer.currentForm(),
                speed: p.speed,
                damageMultiplier: p.damageMultiplier,
                spriteAlpha: p.sprite && p.sprite.alpha
            };
        });
        expect(afterToSnake.form).toBe('snake');
        expect(afterToSnake.speed).toBeGreaterThan(before.speed);
        // Snake form hides the underlying legendary sprite (segments are drawn).
        expect(afterToSnake.spriteAlpha).toBe(0);

        // Snake -> Robot (clear the per-frame cooldown explicitly — Phaser's
        // delta-based decrement is unreliable under test pacing).
        await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            gs.player.transformer.cooldownMs = 0;
            gs.player.transformer.tryToggle();
        });
        await page.waitForTimeout(300);
        const afterBack = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const p = gs.player;
            return {
                form: p.transformer.currentForm(),
                speed: p.speed,
                spriteAlpha: p.sprite && p.sprite.alpha
            };
        });
        expect(afterBack.form).toBe('robot');
        expect(afterBack.speed).toBe(before.speed);
        // Robot form ALSO hides the base legendary sprite — the Power Ranger
        // armor is the complete visual, and the hidden sprite avoids the
        // sub-pixel physics jitter showing through the (pixel-snapped) armor.
        expect(afterBack.spriteAlpha).toBe(0);
    });

    test('K-key swaps robot theme palette (Cyberpunk Neon <-> Solar Forge)', async ({ page }) => {
        await equipOmegaPrime(page);
        await startGameScene(page);

        const original = await page.evaluate(() => {
            const c = window.gameInstance.dragonCostumes.omegaPrime;
            return { primary: c.primaryColor, secondary: c.secondaryColor, belt: c.beltColor };
        });

        // Simulate K-key edge-press via the player's previousInputs gate.
        await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const p = gs.player;
            p.controls = p.controls || { keys: {} };
            p.controls.keys = p.controls.keys || {};
            p.previousInputs = p.previousInputs || {};
            p.previousInputs.omegaAltTheme = false;
            p.controls.keys['KeyK'] = true;
            p.handleOmegaPrimeAltTheme();
            p.controls.keys['KeyK'] = false;
        });
        await page.waitForTimeout(150);

        const swapped = await page.evaluate(() => {
            const c = window.gameInstance.dragonCostumes.omegaPrime;
            return { primary: c.primaryColor, secondary: c.secondaryColor, belt: c.beltColor };
        });
        expect(swapped.primary).not.toBe(original.primary);
        expect(swapped.secondary).not.toBe(original.secondary);
        expect(swapped.belt).not.toBe(original.belt);

        // Press K again — palette should swap back.
        await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const p = gs.player;
            p.previousInputs.omegaAltTheme = false;
            p.controls.keys['KeyK'] = true;
            p.handleOmegaPrimeAltTheme();
            p.controls.keys['KeyK'] = false;
        });
        await page.waitForTimeout(150);
        const restored = await page.evaluate(() => {
            const c = window.gameInstance.dragonCostumes.omegaPrime;
            return { primary: c.primaryColor, secondary: c.secondaryColor, belt: c.beltColor };
        });
        expect(restored.primary).toBe(original.primary);
        expect(restored.secondary).toBe(original.secondary);
        expect(restored.belt).toBe(original.belt);
    });

    test('Snake form stays RED even after a K-key theme swap', async ({ page }) => {
        await equipOmegaPrime(page);
        await startGameScene(page);

        // Swap to Solar Forge first.
        await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const p = gs.player;
            p.controls = p.controls || { keys: {} };
            p.controls.keys = p.controls.keys || {};
            p.previousInputs = p.previousInputs || {};
            p.previousInputs.omegaAltTheme = false;
            p.controls.keys['KeyK'] = true;
            p.handleOmegaPrimeAltTheme();
            p.controls.keys['KeyK'] = false;
        });
        await page.waitForTimeout(150);

        // Transform to snake.
        await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            gs.player.transformer.tryToggle();
        });
        await page.waitForTimeout(300);

        // Inspect the first snake segment's fill — must be pure RED, not the
        // Solar Forge orange. Orange (0xff7a00) is also "red-dominant", so the
        // green channel must be explicitly low to distinguish red from orange.
        const segColor = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const t = gs.player.transformer;
            const parts = t && t._parts;
            const seg = parts && parts.segments && parts.segments[0];
            return seg ? seg.fillColor : null;
        });
        expect(segColor).not.toBeNull();
        const r = (segColor >> 16) & 0xff;
        const g = (segColor >> 8) & 0xff;
        const b = segColor & 0xff;
        expect(r).toBeGreaterThan(200);
        expect(g).toBeLessThan(80);  // orange 0xff7a00 has g=122 — would fail here
        expect(b).toBeLessThan(80);
    });

    // Snake form must use a much smaller physics body than the robot — the
    // robot-sized 83x163 body wedged the thin serpent on level geometry.
    test('Snake form shrinks the physics body; robot form restores it', async ({ page }) => {
        await equipOmegaPrime(page);
        await startGameScene(page);

        const robotBody = await page.evaluate(() => {
            const b = window.gameInstance.game.scene.getScene('GameScene').player.body;
            // Divide out the squash-and-stretch container scale.
            const s = window.gameInstance.game.scene.getScene('GameScene').player.sprite;
            return { w: b.width / (s.scaleX || 1), h: b.height / (s.scaleY || 1) };
        });

        await page.evaluate(() => {
            const t = window.gameInstance.game.scene.getScene('GameScene').player.transformer;
            t.cooldownMs = 0;
            t.tryToggle();
        });
        await page.waitForTimeout(300);
        const snakeBody = await page.evaluate(() => {
            const p = window.gameInstance.game.scene.getScene('GameScene').player;
            const s = p.sprite;
            return { w: p.body.width / (s.scaleX || 1), h: p.body.height / (s.scaleY || 1) };
        });
        // Snake body must be clearly smaller in both dimensions.
        expect(snakeBody.w).toBeLessThan(robotBody.w * 0.8);
        expect(snakeBody.h).toBeLessThan(robotBody.h * 0.6);

        // Toggle back — robot body must grow back to the robot range. Exact
        // px comparison is fragile (the squash-and-stretch container scale
        // flickers with the resting bob), so assert the body returned to
        // clearly-robot dimensions, well above the snake body.
        await page.evaluate(() => {
            const t = window.gameInstance.game.scene.getScene('GameScene').player.transformer;
            t.cooldownMs = 0;
            t.tryToggle();
        });
        await page.waitForTimeout(300);
        const restored = await page.evaluate(() => {
            const p = window.gameInstance.game.scene.getScene('GameScene').player;
            const s = p.sprite;
            return { w: p.body.width / (s.scaleX || 1), h: p.body.height / (s.scaleY || 1) };
        });
        expect(restored.w).toBeGreaterThan(snakeBody.w * 1.2);
        expect(restored.h).toBeGreaterThan(snakeBody.h * 1.5);
    });

    // Robot armor must stay pinned while the player rests — the arcade body
    // bobs <1px every physics step and that jitter must not reach the armor.
    test('Robot armor stays pinned while resting (no jitter)', async ({ page }) => {
        await equipOmegaPrime(page);
        await startGameScene(page);
        // Let the player settle on the ground.
        await page.waitForTimeout(600);

        const result = await page.evaluate(() => {
            const p = window.gameInstance.game.scene.getScene('GameScene').player;
            return new Promise(resolve => {
                const spriteYs = [], helmetYs = [];
                let n = 0;
                (function tick() {
                    const helmet = p.transformer._parts && p.transformer._parts.helmet;
                    spriteYs.push(p.sprite.y);
                    if (helmet) helmetYs.push(helmet.y);
                    if (++n < 16) requestAnimationFrame(tick);
                    else resolve({
                        spriteYRange: Math.max(...spriteYs) - Math.min(...spriteYs),
                        helmetYRange: helmetYs.length ? Math.max(...helmetYs) - Math.min(...helmetYs) : null
                    });
                })();
            });
        });
        // The base sprite is expected to bob (physics). The armor must NOT.
        expect(result.helmetYRange).not.toBeNull();
        expect(result.helmetYRange).toBeLessThanOrEqual(1);
    });

    // After dying in snake form the base legendary sprite must stay hidden —
    // previously the death flash reset its alpha to 1 and the boxy robot
    // reappeared behind the serpent.
    test('Base sprite stays hidden after death in snake form', async ({ page }) => {
        await equipOmegaPrime(page);
        await startGameScene(page);

        await page.evaluate(() => {
            const p = window.gameInstance.game.scene.getScene('GameScene').player;
            p.transformer.cooldownMs = 0;
            p.transformer.tryToggle(); // -> snake
        });
        await page.waitForTimeout(300);

        await page.evaluate(() => {
            window.gameInstance.game.scene.getScene('GameScene').player.die();
        });
        await page.waitForTimeout(300);

        const alphas = await page.evaluate(() => {
            const p = window.gameInstance.game.scene.getScene('GameScene').player;
            return new Promise(resolve => {
                const out = [];
                let n = 0;
                (function tick() {
                    out.push(p.sprite.alpha);
                    if (++n < 10) requestAnimationFrame(tick);
                    else resolve({ form: p.transformer.currentForm(), alphas: out });
                })();
            });
        });
        expect(alphas.form).toBe('snake');
        expect(alphas.alphas.every(a => a === 0)).toBe(true);
    });

    // O-MEGA BLAST: pressing O fires a laser in all 8 directions, each in the
    // current robot theme colour.
    test('O key fires an 8-direction O-MEGA BLAST in the theme colour', async ({ page }) => {
        await equipOmegaPrime(page);
        await startGameScene(page);

        const result = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const p = gs.player;
            p.omegaBlastCooldown = 0;
            p.previousInputs.omegaBlast = false;
            const themePrimary = window.gameInstance.dragonCostumes.omegaPrime.primaryColor;
            p.performOmegaBlast();
            // The 8 lasers are the moving depth-100 rectangles just spawned.
            const lasers = gs.children.list.filter(o =>
                o.type === 'Rectangle' && o.depth === 100 && o.body
                && (o.body.velocity.x !== 0 || o.body.velocity.y !== 0));
            // Bucket each laser's travel direction to a compass octant.
            const octants = new Set();
            lasers.forEach(l => {
                const a = Math.atan2(l.body.velocity.y, l.body.velocity.x);
                octants.add(Math.round((a / (Math.PI / 4)) + 8) % 8);
            });
            return {
                laserCount: lasers.length,
                distinctDirections: octants.size,
                allThemeColoured: lasers.every(l => l.fillColor === themePrimary),
                cooldownSet: p.omegaBlastCooldown > 0
            };
        });

        expect(result.laserCount).toBe(8);
        expect(result.distinctDirections).toBe(8);
        expect(result.allThemeColoured).toBe(true);
        expect(result.cooldownSet).toBe(true);
    });

    // The blast must respect its cooldown — a second immediate press is a no-op.
    test('O-MEGA BLAST does not re-fire while on cooldown', async ({ page }) => {
        await equipOmegaPrime(page);
        await startGameScene(page);

        const counts = await page.evaluate(() => {
            const gs = window.gameInstance.game.scene.getScene('GameScene');
            const p = gs.player;
            const movingLasers = () => gs.children.list.filter(o =>
                o.type === 'Rectangle' && o.depth === 100 && o.body
                && (o.body.velocity.x !== 0 || o.body.velocity.y !== 0)).length;
            p.omegaBlastCooldown = 0;
            p.performOmegaBlast();
            const afterFirst = movingLasers();
            p.performOmegaBlast(); // still on cooldown — should add nothing
            const afterSecond = movingLasers();
            return { afterFirst, afterSecond };
        });
        expect(counts.afterFirst).toBe(8);
        expect(counts.afterSecond).toBe(8);
    });
});
