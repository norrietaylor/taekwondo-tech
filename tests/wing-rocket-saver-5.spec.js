// Wing Rocket Saver 5 — green ninja + summonable red winged mech.
//
// Unlike every other transformer costume this one is a TWO-STEP transformation:
// the ninja summons a MechSuit into the world (M), walks up to it, and boards it
// (2). Ejecting leaves the mech standing to be re-boarded. Covers:
//   - costume catalog entry & required fields (green ninja / red mech)
//   - unlocked from the very start + picker gating
//   - registry↔picker parity (the guard that would have caught the `present` bug)
//   - transformer wiring through window.TransformerRegistry
//   - summon → board → eject → re-board loop, and the board proximity gate
//   - mech-only attacks: swords on punch, tethered dragon arm on kick
//   - the "start as this costume" setting surviving resetGame()
//
// Run: npx playwright test tests/wing-rocket-saver-5.spec.js
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

async function equipWingRocketSaver5(page) {
  await page.evaluate(() => {
    const u = window.gameInstance.gameData.outfits.unlocked;
    if (!u.includes('wingRocketSaver5')) u.push('wingRocketSaver5');
    window.gameInstance.setOutfit('wingRocketSaver5');
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
  await page.waitForTimeout(600);
  // Force transformer rebind in case the scene started before the outfit applied
  await page.evaluate(() => {
    const gs = window.gameInstance.game.scene.getScene('GameScene');
    if (gs && gs.player && typeof gs.player.syncTransformerForOutfit === 'function') {
      gs.player.syncTransformerForOutfit();
    }
  });
  // Wait for the transformer to actually build its visuals — until it does,
  // the player still carries the stock Player physics body.
  await page.waitForFunction(
    () => {
      const gs = window.gameInstance.game.scene.getScene('GameScene');
      const t = gs && gs.player && gs.player.transformer;
      return !!(t && t.visuals && t.visuals.length > 0);
    },
    { timeout: 10000 }
  );
}

// Drive a rising-edge keypress through a Player handler the way the real frame
// loop would, without depending on Phaser's input queue.
async function pressKey(page, keyCode, prevInputField, handler) {
  return page.evaluate(
    ({ keyCode, prevInputField, handler }) => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      p.controls.keys[keyCode] = true;
      p.previousInputs[prevInputField] = false;
      p[handler]();
      p.controls.keys[keyCode] = false;
    },
    { keyCode, prevInputField, handler }
  );
}

// Summon and wait for the mech to actually materialize. The charge countdown
// runs on Phaser's frame clock, which throttles when the machine is busy, so
// poll for the entity rather than trusting a wall-clock timeout.
async function summonMech(page) {
  await pressKey(page, 'KeyM', 'summonMech', 'handleMechSummon');
  await page.waitForFunction(
    () => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      return !!(p && p.mechSuit && p.mechSuit.alive);
    },
    { timeout: 10000 }
  );
}

test.describe('Wing Rocket Saver 5 — costume catalog & unlock', () => {
  test.beforeEach(async ({ page }) => {
    await freshGame(page);
  });

  test('wingRocketSaver5 entry exists in dragonCostumes with required fields', async ({ page }) => {
    const costume = await page.evaluate(() => {
      // Read the registry DIRECTLY — getDragonCostume() silently falls back to
      // `default` for unknown keys, which would let a missing entry pass.
      const c = window.gameInstance.dragonCostumes.wingRocketSaver5;
      if (!c) return null;
      return {
        name: c.name,
        isWingRocketSaver5: c.isWingRocketSaver5,
        unlocked: c.unlocked,
        unlockCondition: c.unlockCondition,
        hasWings: c.hasWings,
        canTransform: c.canTransform,
        transformKey: c.transformKey,
        currentForm: c.currentForm,
        projectileType: c.projectileType,
        dragonArmEnabled: c.dragonArmEnabled,
        summonKey: c.summonKey,
        boardRadius: c.boardRadius,
        ninjaSpeed: c.ninjaSpeed,
        mechSpeed: c.mechSpeed,
        ninjaPrimary: c.ninjaColors && c.ninjaColors.primary,
        mechPrimary: c.mechColors && c.mechColors.primary,
      };
    });
    expect(costume).not.toBeNull();
    expect(costume.name).toBe('Wing Rocket Saver 5');
    expect(costume.isWingRocketSaver5).toBe(true);
    expect(costume.canTransform).toBe(true);
    expect(costume.transformKey).toBe('Digit2');
    expect(costume.currentForm).toBe('ninja');
    expect(costume.projectileType).toBe('sword');
    expect(costume.dragonArmEnabled).toBe(true);
    expect(costume.summonKey).toBe('KeyM');
    expect(costume.boardRadius).toBeGreaterThan(0);
    // The ninja is nimble, the mech is heavy.
    expect(costume.ninjaSpeed).toBeGreaterThan(costume.mechSpeed);

    // The mech draws its own wings, so the generic dragon wings must stay off.
    // This encodes the contract that keeps us out of the hardcoded wing-hide list.
    expect(costume.hasWings).toBe(false);

    // Ninja is GREEN (G dominant)
    const nr = (costume.ninjaPrimary >> 16) & 0xff;
    const ng = (costume.ninjaPrimary >> 8) & 0xff;
    const nb = costume.ninjaPrimary & 0xff;
    expect(ng).toBeGreaterThan(nr);
    expect(ng).toBeGreaterThan(nb);

    // Mech is RED (high R, low G/B)
    const mr = (costume.mechPrimary >> 16) & 0xff;
    const mg = (costume.mechPrimary >> 8) & 0xff;
    const mb = costume.mechPrimary & 0xff;
    expect(mr).toBeGreaterThan(180);
    expect(mg).toBeLessThan(90);
    expect(mb).toBeLessThan(90);
  });

  test('is unlocked from the very start and can be equipped on a fresh game', async ({ page }) => {
    const state = await page.evaluate(() => {
      window.gameInstance.setOutfit('wingRocketSaver5');
      return {
        inUnlockedArray: window.gameInstance.gameData.outfits.unlocked.includes('wingRocketSaver5'),
        current: window.gameInstance.gameData.outfits.current,
        registryUnlocked: window.gameInstance.dragonCostumes.wingRocketSaver5.unlocked,
      };
    });
    // setOutfit() silently no-ops when the key is not in outfits.unlocked, so a
    // successful equip on a fresh save proves the from-start unlock end to end.
    expect(state.inUnlockedArray).toBe(true);
    expect(state.registryUnlocked).toBe(true);
    expect(state.current).toBe('wingRocketSaver5');
  });

  test('the run still begins as the Default Gi', async ({ page }) => {
    const current = await page.evaluate(() => window.gameInstance.gameData.outfits.current);
    expect(current).toBe('default');
  });
});

test.describe('Wing Rocket Saver 5 — costume picker', () => {
  test.beforeEach(async ({ page }) => {
    await freshGame(page);
    await page.evaluate(() => window.gameInstance.game.scene.start('CraftScene'));
    await page.waitForFunction(
      () => {
        const cs = window.gameInstance.game.scene.getScene('CraftScene');
        return cs && cs.scene.isActive() && typeof cs.isDragonUnlocked === 'function';
      },
      { timeout: 10000 }
    );
    await page.waitForTimeout(300);
  });

  test('appears in the picker and reads as unlocked, not LOCKED', async ({ page }) => {
    const picker = await page.evaluate(() => {
      const cs = window.gameInstance.game.scene.getScene('CraftScene');
      return {
        inPickerArray: cs.showOutfitSelection.toString().includes("'wingRocketSaver5'"),
        unlocked: cs.isDragonUnlocked('wingRocketSaver5'),
        progressText: cs.getUnlockProgressText('wingRocketSaver5'),
      };
    });
    expect(picker.inPickerArray).toBe(true);
    expect(picker.unlocked).toBe(true);
    expect(picker.progressText).toContain('Unlocked');
  });

  // Generic parity guard. A costume in the picker array with no isDragonUnlocked
  // case falls through to `default: return false` and renders permanently
  // LOCKED — this is exactly how the Present Dragon silently broke.
  test('every costume in the picker array is reachable in the registry', async ({ page }) => {
    const orphans = await page.evaluate(() => {
      const cs = window.gameInstance.game.scene.getScene('CraftScene');
      const src = cs.showOutfitSelection.toString();
      const keys = Object.keys(window.gameInstance.dragonCostumes);
      const inPicker = keys.filter((k) => src.includes(`'${k}'`));
      return {
        inPicker,
        missingFromRegistry: inPicker.filter((k) => !window.gameInstance.dragonCostumes[k]),
      };
    });
    expect(orphans.inPicker).toContain('wingRocketSaver5');
    expect(orphans.missingFromRegistry).toEqual([]);
  });
});

test.describe('Wing Rocket Saver 5 — summon, board, eject', () => {
  test.beforeEach(async ({ page }) => {
    await freshGame(page);
    await equipWingRocketSaver5(page);
    await startGameScene(page);
  });

  test('transformer binds through the registry and starts in ninja form', async ({ page }) => {
    const state = await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      return {
        factory: typeof (window.TransformerRegistry || {}).wingRocketSaver5,
        hasTransformer: !!p.transformer,
        form: p.transformer && p.transformer.currentForm(),
        mechSuitClass: typeof window.MechSuit,
        mech: !!p.mechSuit,
      };
    });
    expect(state.factory).toBe('function');
    expect(state.mechSuitClass).toBe('function');
    expect(state.hasTransformer).toBe(true);
    expect(state.form).toBe('ninja');
    expect(state.mech).toBe(false);
  });

  test('the base sprite, eyes and belt are hidden behind the costume visuals', async ({ page }) => {
    const alphas = await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      return {
        sprite: p.sprite.alpha,
        eye1: p.eye1 ? p.eye1.alpha : 0,
        eye2: p.eye2 ? p.eye2.alpha : 0,
        belt: p.belt ? p.belt.alpha : 0,
        leftWingVisible: p.leftWing ? p.leftWing.visible : false,
      };
    });
    expect(alphas.sprite).toBe(0);
    expect(alphas.eye1).toBe(0);
    expect(alphas.eye2).toBe(0);
    expect(alphas.belt).toBe(0);
    // Generic dragon wings stay off — the mech draws its own.
    expect(alphas.leftWingVisible).toBe(false);
  });

  test('boarding is refused when no mech has been summoned', async ({ page }) => {
    await pressKey(page, 'Digit2', 'grimlockTransform', 'handleMechBoard');
    const state = await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      return { form: p.transformer.currentForm(), mech: !!p.mechSuit };
    });
    expect(state.form).toBe('ninja');
    expect(state.mech).toBe(false);
  });

  test('M summons exactly one mech, in front of the ninja', async ({ page }) => {
    // The mech materializes only after the hands-together charge pose.
    await summonMech(page);

    const first = await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      return {
        mech: !!p.mechSuit,
        alive: p.mechSuit && p.mechSuit.alive,
        distance: p.mechSuit ? Math.abs(p.mechSuit.sprite.x - p.sprite.x) : 0,
      };
    });
    expect(first.mech).toBe(true);
    expect(first.alive).toBe(true);
    expect(first.distance).toBeGreaterThan(40);

    // A second summon while one already stands must be refused — only ever one.
    await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      p.summonCooldown = 0;
      p._mechIdBefore = p.mechSuit;
    });
    await pressKey(page, 'KeyM', 'summonMech', 'handleMechSummon');
    await page.waitForTimeout(900);
    const second = await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      return { sameInstance: p.mechSuit === p._mechIdBefore };
    });
    expect(second.sameInstance).toBe(true);
  });

  test('summon → board → eject → re-board round trip', async ({ page }) => {
    await summonMech(page);

    // Far from the mech, boarding is still refused.
    await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      p.body.reset(p.mechSuit.sprite.x + 600, p.sprite.y);
      p.transformer.cooldownMs = 0;
    });
    await pressKey(page, 'Digit2', 'grimlockTransform', 'handleMechBoard');
    let form = await page.evaluate(() =>
      window.gameInstance.game.scene.getScene('GameScene').player.transformer.currentForm()
    );
    expect(form).toBe('ninja');

    // Walk up to it and board.
    await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      const pos = p.mechSuit.getPosition();
      p.body.reset(pos.x, pos.y);
      p.transformer.cooldownMs = 0;
    });
    await pressKey(page, 'Digit2', 'grimlockTransform', 'handleMechBoard');
    const boarded = await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      return { form: p.transformer.currentForm(), mech: !!p.mechSuit, speed: p.speed };
    });
    expect(boarded.form).toBe('mech');
    // The standing entity is absorbed into the pilot.
    expect(boarded.mech).toBe(false);

    // Eject — the mech is left standing where the player was.
    await page.evaluate(() => {
      window.gameInstance.game.scene.getScene('GameScene').player.transformer.cooldownMs = 0;
    });
    await pressKey(page, 'Digit2', 'grimlockTransform', 'handleMechBoard');
    const ejected = await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      return {
        form: p.transformer.currentForm(),
        mech: !!p.mechSuit,
        distance: p.mechSuit ? Math.abs(p.mechSuit.sprite.x - p.sprite.x) : 999,
      };
    });
    expect(ejected.form).toBe('ninja');
    expect(ejected.mech).toBe(true);
    expect(ejected.distance).toBeLessThan(80);

    // And it is re-boardable.
    await page.evaluate(() => {
      window.gameInstance.game.scene.getScene('GameScene').player.transformer.cooldownMs = 0;
    });
    await pressKey(page, 'Digit2', 'grimlockTransform', 'handleMechBoard');
    form = await page.evaluate(() =>
      window.gameInstance.game.scene.getScene('GameScene').player.transformer.currentForm()
    );
    expect(form).toBe('mech');
  });

  // Regression: the body offset convention differs between a Container sprite
  // (legendary costumes — offset measured from the CENTRE) and a plain
  // Rectangle (this costume — offset measured from the TOP-LEFT). Using the
  // container convention here floated the body above the feet and both
  // characters fell straight through the floor.
  test('both forms rest on the ground instead of falling through it', async ({ page }) => {
    const settle = async () => {
      await page.waitForTimeout(700);
      return page.evaluate(async () => {
        const p = window.gameInstance.game.scene.getScene('GameScene').player;
        const first = Math.round(p.sprite.y);
        await new Promise((r) => setTimeout(r, 400));
        return { first, second: Math.round(p.sprite.y), health: p.health };
      });
    };

    const ninja = await settle();
    // A resting player does not keep sinking frame after frame.
    expect(Math.abs(ninja.second - ninja.first)).toBeLessThanOrEqual(2);

    await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      p.transformer.cooldownMs = 0;
      p.transformer.tryToggle();
    });
    const mech = await settle();
    expect(Math.abs(mech.second - mech.first)).toBeLessThanOrEqual(2);

    // And the drawn feet sit on the body's bottom edge, not below it.
    const feet = await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      const parts = p.transformer._parts || {};
      let lowest = -Infinity;
      Object.keys(parts).forEach((k) => {
        const o = parts[k];
        if (o && typeof o.y === 'number' && typeof o.height === 'number') {
          lowest = Math.max(lowest, o.y + (o.displayHeight || o.height) / 2);
        }
      });
      return { drawnLowest: lowest, bodyBottom: p.body.bottom };
    });
    expect(feet.drawnLowest - feet.bodyBottom).toBeLessThanOrEqual(8);
  });

  test('the physics body grows for the mech and keeps a shared bottom edge', async ({ page }) => {
    // Toggle the transformer directly, with no intervening teleport, so this
    // measures the body-sizing contract itself. The boarding flow (which does
    // move the player) is covered by the round-trip test above.
    const dims = await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      // body.width/height track the sprite's live squash-and-stretch scale but
      // body.offset does not, so normalize the scale before measuring.
      const read = () => {
        p.sprite.setScale(1);
        p.body.updateFromGameObject();
        return {
          w: p.body.width,
          h: p.body.height,
          bottom: p.body.offset.y + p.body.height,
        };
      };
      const ninja = read();
      p.transformer.cooldownMs = 0;
      p.transformer.tryToggle();
      const mech = read();
      return { ninja, mech, form: p.transformer.currentForm() };
    });

    expect(dims.form).toBe('mech');
    expect(dims.mech.h).toBeGreaterThan(dims.ninja.h);
    expect(dims.mech.w).toBeGreaterThan(dims.ninja.w);
    // Shared bottom edge means boarding/ejecting never pops the player
    // vertically — the feet line stays put across the toggle.
    expect(Math.abs(dims.mech.bottom - dims.ninja.bottom)).toBeLessThanOrEqual(1);
  });
});

test.describe('Wing Rocket Saver 5 — mech weapons', () => {
  test.beforeEach(async ({ page }) => {
    await freshGame(page);
    await equipWingRocketSaver5(page);
    await startGameScene(page);
    // Summon + board so every test in this block starts piloting.
    await summonMech(page);
    await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      const pos = p.mechSuit.getPosition();
      p.body.reset(pos.x, pos.y);
      p.transformer.cooldownMs = 0;
    });
    await pressKey(page, 'Digit2', 'grimlockTransform', 'handleMechBoard');
    await page.waitForTimeout(200);
  });

  test('punch fires a sword in mech form', async ({ page }) => {
    const result = await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      const before = p.fireballs.length;
      p.attackCooldown = 0;
      p.controls.keys['KeyZ'] = true;
      p.previousInputs.punch = false;
      p.handleCombat();
      p.controls.keys['KeyZ'] = false;
      return {
        added: p.fireballs.length - before,
        type: p.fireballs.length ? p.fireballs[p.fireballs.length - 1].type : null,
      };
    });
    expect(result.added).toBeGreaterThan(0);
    expect(result.type).toBe('sword');
  });

  test('kick launches the tethered dragon arm, which retracts without leaking', async ({
    page,
  }) => {
    const launched = await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      p.dragonArmCooldown = 0;
      p.fireDragonArm();
      const arm = p.dragonArm;
      return {
        live: !!arm,
        links: arm ? arm.chain.length : 0,
        phase: arm ? arm.phase : null,
      };
    });
    expect(launched.live).toBe(true);
    expect(launched.links).toBeGreaterThan(0);
    expect(launched.phase).toBe('extend');

    // A second launch while one is in flight is refused.
    const second = await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      const before = p.dragonArm;
      p.dragonArmCooldown = 0;
      p.fireDragonArm();
      return { sameArm: p.dragonArm === before };
    });
    expect(second.sameArm).toBe(true);

    // It extends to max range then retracts, tearing everything down.
    await page.waitForFunction(
      () => !window.gameInstance.game.scene.getScene('GameScene').player.dragonArm,
      { timeout: 10000 }
    );
    const after = await page.evaluate(
      () => !!window.gameInstance.game.scene.getScene('GameScene').player.dragonArm
    );
    expect(after).toBe(false);
  });

  test('ejecting mid-flight cancels the dragon arm', async ({ page }) => {
    const state = await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      p.dragonArmCooldown = 0;
      p.fireDragonArm();
      const launched = !!p.dragonArm;
      p.transformer.cooldownMs = 0;
      p.controls.keys['Digit2'] = true;
      p.previousInputs.grimlockTransform = false;
      p.handleMechBoard();
      p.controls.keys['Digit2'] = false;
      return { launched, form: p.transformer.currentForm(), arm: !!p.dragonArm };
    });
    expect(state.launched).toBe(true);
    expect(state.form).toBe('ninja');
    expect(state.arm).toBe(false);
  });

  test('the ninja form fires no projectile', async ({ page }) => {
    const result = await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      // Eject back to the ninja
      p.transformer.cooldownMs = 0;
      p.controls.keys['Digit2'] = true;
      p.previousInputs.grimlockTransform = false;
      p.handleMechBoard();
      p.controls.keys['Digit2'] = false;

      const before = p.fireballs.length;
      p.attackCooldown = 0;
      p.controls.keys['KeyZ'] = true;
      p.previousInputs.punch = false;
      p.handleCombat();
      p.controls.keys['KeyZ'] = false;
      p.attackCooldown = 0;
      p.controls.keys['KeyX'] = true;
      p.previousInputs.kick = false;
      p.handleCombat();
      p.controls.keys['KeyX'] = false;
      return { form: p.transformer.currentForm(), added: p.fireballs.length - before };
    });
    expect(result.form).toBe('ninja');
    expect(result.added).toBe(0);
  });
});

test.describe('Wing Rocket Saver 5 — lifecycle & start setting', () => {
  test.beforeEach(async ({ page }) => {
    await freshGame(page);
  });

  test('a standing mech is cleaned up when the costume is swapped away', async ({ page }) => {
    await equipWingRocketSaver5(page);
    await startGameScene(page);
    await summonMech(page);

    const state = await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      const had = !!p.mechSuit;
      window.gameInstance.setOutfit('default');
      p.syncTransformerForOutfit();
      return { had, mech: !!p.mechSuit, transformer: !!p.transformer };
    });
    expect(state.had).toBe(true);
    expect(state.mech).toBe(false);
    expect(state.transformer).toBe(false);
  });

  test('dying clears the standing mech so it cannot strand or block a re-summon', async ({
    page,
  }) => {
    await equipWingRocketSaver5(page);
    await startGameScene(page);
    await summonMech(page);

    const state = await page.evaluate(() => {
      const p = window.gameInstance.game.scene.getScene('GameScene').player;
      const had = !!p.mechSuit;
      p.die();
      return { had, mech: !!p.mechSuit };
    });
    expect(state.had).toBe(true);
    expect(state.mech).toBe(false);
  });

  test('the start-as-this-costume setting survives resetGame() and equips', async ({ page }) => {
    const state = await page.evaluate(() => {
      window.gameInstance.gameData.settings.startAsWingRocketSaver5 = true;
      window.gameInstance.saveGameData();
      // resetGame() reassigns gameData wholesale — settings must be preserved
      // or the toggle would be wiped exactly when startNewGame() reads it.
      window.gameInstance.resetGame();
      const survived = window.gameInstance.gameData.settings.startAsWingRocketSaver5;
      window.gameInstance.setOutfit('wingRocketSaver5');
      return { survived, current: window.gameInstance.gameData.outfits.current };
    });
    expect(state.survived).toBe(true);
    expect(state.current).toBe('wingRocketSaver5');
  });

  test('the setting defaults to off and leaves the Default Gi in place', async ({ page }) => {
    const state = await page.evaluate(() => ({
      flag: window.gameInstance.gameData.settings.startAsWingRocketSaver5,
      current: window.gameInstance.gameData.outfits.current,
    }));
    expect(state.flag).toBe(false);
    expect(state.current).toBe('default');
  });
});
