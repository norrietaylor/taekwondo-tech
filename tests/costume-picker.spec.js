// Costume picker (CraftScene → showOutfitSelection) input-alignment spec.
//
// Regression: the game canvas had a 2px CSS *border*. A border grows the
// element's box, so canvas.getBoundingClientRect() (border-box) no longer
// matched the area the game renders into (content-box). Phaser maps DOM
// clicks against the border-box, so every click was offset — worst at the
// screen edges, most visible in fullscreen where the canvas fills the
// screen. Fix: use `outline` (painted outside the box, no layout effect)
// instead of `border`.
//
// Run: npx playwright test tests/costume-picker.spec.js
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

async function openCostumePicker(page) {
    await page.evaluate(() => window.gameInstance.game.scene.start('CraftScene'));
    await page.waitForFunction(
        () => {
            const cs = window.gameInstance.game.scene.getScene('CraftScene');
            return cs && cs.scene.isActive() && typeof cs.showOutfitSelection === 'function';
        },
        { timeout: 10000 }
    );
    await page.waitForTimeout(400);
    await page.evaluate(() => {
        window.gameInstance.game.scene.getScene('CraftScene').showOutfitSelection();
    });
    await page.waitForTimeout(300);
}

// Measure the canvas box model + Phaser's screen->game transform error at
// fractional points across the rendered game area.
async function measureAlignment(page) {
    return page.evaluate(() => {
        const game = window.gameInstance.game;
        const sm = game.scale;
        const canvas = game.canvas;
        const cs = getComputedStyle(canvas);
        const rect = canvas.getBoundingClientRect();
        const bL = parseFloat(cs.borderLeftWidth) || 0;
        const bR = parseFloat(cs.borderRightWidth) || 0;
        const bT = parseFloat(cs.borderTopWidth) || 0;
        const bB = parseFloat(cs.borderBottomWidth) || 0;
        const contentW = rect.width - bL - bR;
        const contentH = rect.height - bT - bB;
        const gW = sm.gameSize.width, gH = sm.gameSize.height;
        let maxErr = 0;
        for (const frac of [0, 0.25, 0.5, 0.75, 1]) {
            const clientX = rect.x + bL + frac * contentW;
            const clientY = rect.y + bT + frac * contentH;
            maxErr = Math.max(maxErr,
                Math.abs(sm.transformX(clientX) - frac * gW),
                Math.abs(sm.transformY(clientY) - frac * gH));
        }
        return {
            borderTotal: bL + bR + bT + bB,
            rect: { w: rect.width, h: rect.height },
            contentBox: { w: contentW, h: contentH },
            displaySize: { w: sm.displaySize.width, h: sm.displaySize.height },
            maxTransformErrorPx: maxErr
        };
    });
}

test.describe('Costume picker — input alignment', () => {

    test.beforeEach(async ({ page }) => {
        await freshGame(page);
    });

    // The canvas must not carry a layout-affecting border — the border-box
    // must equal the content-box, otherwise Phaser's click mapping is offset.
    test('canvas has no layout-affecting border (border-box == content-box)', async ({ page }) => {
        const m = await measureAlignment(page);
        expect(m.borderTotal).toBe(0);
        expect(m.rect.w).toBe(m.contentBox.w);
        expect(m.rect.h).toBe(m.contentBox.h);
        // Phaser renders into exactly the box it measures for input.
        expect(m.rect.w).toBe(m.displaySize.w);
        expect(m.rect.h).toBe(m.displaySize.h);
    });

    // Phaser's screen->game transform must be exact across the whole canvas.
    test('screen-to-game transform has zero error across the canvas', async ({ page }) => {
        await openCostumePicker(page);
        const m = await measureAlignment(page);
        expect(m.maxTransformErrorPx).toBeLessThan(0.1);
    });

    // Same invariant must hold in fullscreen (the canvas becomes the
    // fullscreen element and fills the screen). Best-effort: if the test
    // environment refuses the Fullscreen API, the assertion is skipped.
    test('transform stays exact in fullscreen', async ({ page }) => {
        await openCostumePicker(page);
        const entered = await page.evaluate(async () => {
            try {
                await window.gameInstance.game.canvas.requestFullscreen();
                return !!document.fullscreenElement;
            } catch (e) {
                return false;
            }
        });
        test.skip(!entered, 'Fullscreen API unavailable in this environment');
        await page.waitForTimeout(500);
        const m = await measureAlignment(page);
        expect(m.maxTransformErrorPx).toBeLessThan(0.1);
        await page.evaluate(() => document.exitFullscreen().catch(() => {}));
    });

    // End-to-end: a real mouse click at an EQUIP button's on-screen position
    // must reach that button and equip the costume.
    test('clicking an EQUIP button at its visual position equips the costume', async ({ page }) => {
        await openCostumePicker(page);

        const target = await page.evaluate(() => {
            const game = window.gameInstance.game;
            const cs = game.scene.getScene('CraftScene');
            const canvas = game.canvas;
            const rect = canvas.getBoundingClientRect();
            const style = getComputedStyle(canvas);
            const bL = parseFloat(style.borderLeftWidth) || 0;
            const bT = parseFloat(style.borderTopWidth) || 0;
            const contentW = rect.width - bL - (parseFloat(style.borderRightWidth) || 0);
            const contentH = rect.height - bT - (parseFloat(style.borderBottomWidth) || 0);
            // First interactive EQUIP button in the picker.
            let eq = null;
            cs.children.list.forEach(o => {
                if (!eq && o.input && o.input.enabled && o.type === 'Text'
                    && o.depth >= 150 && o.text === 'EQUIP') eq = o;
            });
            if (!eq) return null;
            return {
                currentBefore: window.gameInstance.gameData.outfits.current,
                clientX: rect.x + bL + eq.x * (contentW / game.scale.gameSize.width),
                clientY: rect.y + bT + eq.y * (contentH / game.scale.gameSize.height)
            };
        });
        expect(target).not.toBeNull();

        await page.mouse.click(target.clientX, target.clientY);
        await page.waitForTimeout(300);

        const after = await page.evaluate(() => {
            const cs = window.gameInstance.game.scene.getScene('CraftScene');
            // The picker overlay (depth 150 rectangle) is destroyed on equip.
            const overlayOpen = cs.children.list.some(
                o => o.type === 'Rectangle' && o.depth === 150);
            return {
                current: window.gameInstance.gameData.outfits.current,
                overlayOpen
            };
        });
        // The click landed on the EQUIP button: outfit changed + picker closed.
        expect(after.current).not.toBe(target.currentBefore);
        expect(after.overlayOpen).toBe(false);
    });
});
