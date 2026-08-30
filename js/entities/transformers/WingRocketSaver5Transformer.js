// Wing Rocket Saver 5 transformer — green ninja <-> red winged mech.
//
// Unlike every other transformer costume, this one is only HALF of the
// transformation. The ninja must first summon a MechSuit into the world (M),
// walk up to it, and board it (2). This module owns the two forms and their
// visuals; the Player owns the standing-mech entity and gates the toggle on
// proximity. See Player.handleMechSummon / handleMechBoard.
//
// Registers itself in TransformerRegistry under key 'wingRocketSaver5'.
// Loaded as a global via <script> tag — no ES modules.
(function () {
  const BLACK = 0x111111;

  function getCostume(player) {
    return player && typeof player.getDragonCostume === 'function'
      ? player.getDragonCostume() || {}
      : {};
  }

  // The non-legendary player sprite is a plain rectangle with SEPARATE eye1 /
  // eye2 / belt objects at depth 51, repositioned every frame by
  // Player.updateVisuals(). Hiding only `sprite` leaves two white eyes and a
  // brown belt floating over the ninja/mech, so hide all four together.
  function setBaseVisibility(player, alpha) {
    if (!player) return;
    ['sprite', 'eye1', 'eye2', 'belt'].forEach((k) => {
      const obj = player[k];
      if (obj && typeof obj.setAlpha === 'function') obj.setAlpha(alpha);
    });
  }

  function getNinjaPalette(player) {
    const c = getCostume(player);
    const nc = c.ninjaColors || {};
    return {
      primary: nc.primary || 0x2e8b57,
      highlight: nc.secondary || 0x7cfc00,
      dark: nc.accent || 0x14532d,
      skin: 0xf1c27d,
    };
  }

  function getMechPalette(player) {
    const c = getCostume(player);
    const mc = c.mechColors || {};
    return {
      primary: mc.primary || 0xd62828,
      highlight: mc.secondary || 0xff4500,
      accent: mc.accent || 0xffd700,
      steel: 0xb0b8c1,
    };
  }

  // Resize the shared physics body to match the active form.
  //
  // IMPORTANT: this costume is NOT legendary, so `player.sprite` is a plain
  // Rectangle, and an arcade body's offset on a Rectangle is measured from the
  // sprite's TOP-LEFT corner. (The legendary costumes — Omega Prime included —
  // use a Container, whose offset is measured from its CENTRE, which is why
  // they pass negative half-extents. Copying that convention here floats the
  // body above the feet and the player falls straight through the floor.)
  //
  // Both forms are bottom-aligned to the same feet line, matching the stock
  // Player body (setSize(28, 44) auto-centred => bottom edge at 46), so
  // boarding and ejecting never move the player vertically.
  function applyBodyForForm(player, form) {
    const body = player && player.body;
    const sprite = player && player.sprite;
    if (!body || !sprite || typeof body.setSize !== 'function') return;
    const spriteW = sprite.width || 32;
    const spriteH = sprite.height || 48;
    let w, h;
    if (form === 'mech') {
      w = spriteW * 1.15;
      h = spriteH * 1.2;
    } else {
      w = spriteW * 0.875;
      h = spriteH * 0.917;
    }
    body.setSize(w, h, false);
    // Bottom-align to the sprite's own bottom edge so both forms stand on the
    // same feet line and toggling never moves the player vertically.
    body.setOffset((spriteW - w) / 2, spriteH - h);
  }

  // Both forms are authored around the sprite centre, but their drawn feet sit
  // below the physics body's bottom edge. Shift each form as a whole so the
  // feet land exactly on the shared feet line (the sprite's bottom edge) —
  // without this the characters appear to sink through the floor.
  const NINJA_Y_SHIFT = -7;
  const MECH_Y_SHIFT = -24;

  // === NINJA FORM ==========================================================
  // Slim green shinobi: hood, masked face, scarf, wrapped arms.
  function buildNinjaVisuals(scene, player) {
    const px = player.sprite.x;
    const py = player.sprite.y + NINJA_Y_SHIFT;
    const dir = player.facingRight ? 1 : -1;
    const pal = getNinjaPalette(player);
    const v = {};

    // Torso + belt
    v.torso = scene.add.rectangle(px, py, 22, 28, pal.primary);
    v.torso.setStrokeStyle(2, BLACK);
    v.torso.setDepth(53);
    v.belt = scene.add.rectangle(px, py + 10, 24, 5, pal.dark);
    v.belt.setDepth(54);
    v.beltKnot = scene.add.rectangle(px + dir * 4, py + 10, 5, 8, pal.highlight);
    v.beltKnot.setDepth(55);

    // Hood + masked face (only the eye band shows)
    v.hood = scene.add.ellipse(px, py - 24, 24, 22, pal.primary);
    v.hood.setStrokeStyle(2, BLACK);
    v.hood.setDepth(55);
    v.faceBand = scene.add.rectangle(px + dir * 2, py - 24, 18, 7, pal.skin);
    v.faceBand.setDepth(56);
    v.eye = scene.add.rectangle(px + dir * 5, py - 24, 4, 4, BLACK);
    v.eye.setDepth(57);
    v.headband = scene.add.rectangle(px, py - 31, 26, 4, pal.highlight);
    v.headband.setDepth(57);
    // Trailing headband tails, opposite the facing direction
    v.tail1 = scene.add.rectangle(px - dir * 16, py - 30, 14, 3, pal.highlight);
    v.tail1.setDepth(52);
    v.tail2 = scene.add.rectangle(px - dir * 17, py - 25, 12, 3, pal.highlight);
    v.tail2.setDepth(52);

    // Arms — these are the ones that come together for the summon pose.
    v.armL = scene.add.rectangle(px - 14, py + 1, 8, 20, pal.dark);
    v.armL.setStrokeStyle(1, BLACK);
    v.armL.setDepth(54);
    v.armR = scene.add.rectangle(px + 14, py + 1, 8, 20, pal.dark);
    v.armR.setStrokeStyle(1, BLACK);
    v.armR.setDepth(54);

    // Legs
    v.legL = scene.add.rectangle(px - 6, py + 22, 9, 18, pal.primary);
    v.legL.setStrokeStyle(1, BLACK);
    v.legL.setDepth(53);
    v.legR = scene.add.rectangle(px + 6, py + 22, 9, 18, pal.primary);
    v.legR.setStrokeStyle(1, BLACK);
    v.legR.setDepth(53);

    setBaseVisibility(player, 0);
    return v;
  }

  // === MECH FORM ===========================================================
  // Red winged war machine with a shoulder-mounted dragon arm.
  function buildMechVisuals(scene, player) {
    const px = player.sprite.x;
    const py = player.sprite.y + MECH_Y_SHIFT;
    const dir = player.facingRight ? 1 : -1;
    const pal = getMechPalette(player);
    const v = {};

    // WINGS — drawn behind the body so they read as a silhouette.
    v.wingLOuter = scene.add.triangle(px - 34, py - 14, 0, -22, 26, 6, 0, 20, pal.highlight);
    v.wingLOuter.setStrokeStyle(2, BLACK);
    v.wingLOuter.setDepth(46);
    v.wingLInner = scene.add.triangle(px - 29, py - 2, 0, -14, 18, 4, 0, 13, pal.accent);
    v.wingLInner.setDepth(47);
    v.wingROuter = scene.add.triangle(px + 34, py - 14, 0, -22, -26, 6, 0, 20, pal.highlight);
    v.wingROuter.setStrokeStyle(2, BLACK);
    v.wingROuter.setDepth(46);
    v.wingRInner = scene.add.triangle(px + 29, py - 2, 0, -14, -18, 4, 0, 13, pal.accent);
    v.wingRInner.setDepth(47);

    // Head + visor + crest
    v.helmet = scene.add.rectangle(px, py - 34, 30, 24, pal.primary);
    v.helmet.setStrokeStyle(2, BLACK);
    v.helmet.setDepth(55);
    v.visor = scene.add.rectangle(px + dir * 2, py - 36, 24, 7, pal.accent);
    v.visor.setStrokeStyle(2, BLACK);
    v.visor.setDepth(56);
    v.mouthGuard = scene.add.rectangle(px, py - 26, 16, 3, pal.steel);
    v.mouthGuard.setDepth(56);
    v.crest = scene.add.triangle(px, py - 52, -8, 8, 8, 8, 0, -11, pal.accent);
    v.crest.setStrokeStyle(2, BLACK);
    v.crest.setDepth(57);

    // Torso + chest badge
    v.chest = scene.add.rectangle(px, py - 2, 36, 32, pal.primary);
    v.chest.setStrokeStyle(2, 0xffffff);
    v.chest.setDepth(53);
    v.chevronL = scene.add.rectangle(px - 7, py - 4, 4, 18, pal.accent);
    v.chevronL.setRotation(-Math.PI / 6);
    v.chevronL.setDepth(54);
    v.chevronR = scene.add.rectangle(px + 7, py - 4, 4, 18, pal.accent);
    v.chevronR.setRotation(Math.PI / 6);
    v.chevronR.setDepth(54);
    v.badge = scene.add.star(px, py + 6, 5, 4, 8, pal.accent);
    v.badge.setStrokeStyle(1, BLACK);
    v.badge.setDepth(55);

    // Shoulders
    v.pauldronL = scene.add.rectangle(px - 24, py - 16, 18, 14, pal.primary);
    v.pauldronL.setStrokeStyle(2, BLACK);
    v.pauldronL.setDepth(53);
    v.pauldronR = scene.add.rectangle(px + 24, py - 16, 18, 14, pal.primary);
    v.pauldronR.setStrokeStyle(2, BLACK);
    v.pauldronR.setDepth(53);

    // Arms. The sword hands are the fists; the dragon arm is the forward one
    // and gets a dragon head that the rocket punch launches from.
    v.armL = scene.add.rectangle(px - 24, py + 2, 13, 22, pal.highlight);
    v.armL.setStrokeStyle(2, BLACK);
    v.armL.setDepth(52);
    v.fistL = scene.add.rectangle(px - 24, py + 16, 14, 10, pal.primary);
    v.fistL.setStrokeStyle(2, BLACK);
    v.fistL.setDepth(53);
    v.armR = scene.add.rectangle(px + 24, py + 2, 13, 22, pal.highlight);
    v.armR.setStrokeStyle(2, BLACK);
    v.armR.setDepth(52);
    v.fistR = scene.add.rectangle(px + 24, py + 16, 14, 10, pal.primary);
    v.fistR.setStrokeStyle(2, BLACK);
    v.fistR.setDepth(53);
    // Dragon head sits on the forward shoulder — the rocket punch emit point.
    v.dragonHead = scene.add.triangle(px + dir * 24, py - 16, -9, -7, 9, -7, 0, 11, pal.accent);
    v.dragonHead.setStrokeStyle(2, BLACK);
    v.dragonHead.setDepth(56);
    v.dragonEye = scene.add.circle(px + dir * 24, py - 18, 2, BLACK);
    v.dragonEye.setDepth(57);

    // Belt + legs
    v.belt = scene.add.rectangle(px, py + 16, 34, 7, BLACK);
    v.belt.setStrokeStyle(1, pal.accent);
    v.belt.setDepth(54);
    v.legL = scene.add.rectangle(px - 10, py + 32, 15, 22, pal.primary);
    v.legL.setStrokeStyle(2, BLACK);
    v.legL.setDepth(53);
    v.legR = scene.add.rectangle(px + 10, py + 32, 15, 22, pal.primary);
    v.legR.setStrokeStyle(2, BLACK);
    v.legR.setDepth(53);
    v.bootL = scene.add.rectangle(px - 10, py + 44, 17, 9, pal.highlight);
    v.bootL.setStrokeStyle(2, BLACK);
    v.bootL.setDepth(54);
    v.bootR = scene.add.rectangle(px + 10, py + 44, 17, 9, pal.highlight);
    v.bootR.setStrokeStyle(2, BLACK);
    v.bootR.setDepth(54);

    setBaseVisibility(player, 0);
    return v;
  }

  // === PER-FRAME POSITIONING ==============================================

  // Shared anti-jitter deadzone: the arcade body bobs <1px every physics step
  // while resting, and rounding that bob still flips 1px per frame. Skip the
  // reposition entirely until the player has actually moved.
  // (Same technique as OmegaPrimeTransformer.positionRobot.)
  function movedEnough(parts, player) {
    const rawX = player.sprite.x;
    const rawY = player.sprite.y;
    if (
      parts._lastRawX !== undefined &&
      Math.abs(rawX - parts._lastRawX) < 1.25 &&
      Math.abs(rawY - parts._lastRawY) < 1.25 &&
      parts._lastPose === player.summonPoseMs > 0
    ) {
      return false;
    }
    parts._lastRawX = rawX;
    parts._lastRawY = rawY;
    parts._lastPose = player.summonPoseMs > 0;
    return true;
  }

  function positionNinja(parts, player) {
    setBaseVisibility(player, 0);
    if (!movedEnough(parts, player)) return;
    const R = Math.round;
    const px = R(player.sprite.x);
    const py = R(player.sprite.y + NINJA_Y_SHIFT);
    const dir = player.facingRight ? 1 : -1;
    // While charging the summon, both arms come together in front of the chest
    // — the Street-Fighter hands-together pose.
    const posing = player.summonPoseMs > 0;
    const armOffset = posing ? 5 : 14;
    const armY = posing ? py + 4 : py + 1;

    const set = (o, x, y) => {
      if (!o) return;
      o.x = x;
      o.y = y;
    };
    set(parts.torso, px, py);
    set(parts.belt, px, py + 10);
    set(parts.beltKnot, px + dir * 4, py + 10);
    set(parts.hood, px, py - 24);
    set(parts.faceBand, px + dir * 2, py - 24);
    set(parts.eye, px + dir * 5, py - 24);
    set(parts.headband, px, py - 31);
    set(parts.tail1, px - dir * 16, py - 30);
    set(parts.tail2, px - dir * 17, py - 25);
    set(parts.armL, px - armOffset, armY);
    set(parts.armR, px + armOffset, armY);
    set(parts.legL, px - 6, py + 22);
    set(parts.legR, px + 6, py + 22);
  }

  function positionMech(parts, player) {
    setBaseVisibility(player, 0);
    if (!movedEnough(parts, player)) return;
    const R = Math.round;
    const px = R(player.sprite.x);
    const py = R(player.sprite.y + MECH_Y_SHIFT);
    const dir = player.facingRight ? 1 : -1;

    const set = (o, x, y) => {
      if (!o) return;
      o.x = x;
      o.y = y;
    };
    set(parts.wingLOuter, px - 34, py - 14);
    set(parts.wingLInner, px - 29, py - 2);
    set(parts.wingROuter, px + 34, py - 14);
    set(parts.wingRInner, px + 29, py - 2);
    set(parts.helmet, px, py - 34);
    set(parts.visor, px + dir * 2, py - 36);
    set(parts.mouthGuard, px, py - 26);
    set(parts.crest, px, py - 52);
    set(parts.chest, px, py - 2);
    set(parts.chevronL, px - 7, py - 4);
    set(parts.chevronR, px + 7, py - 4);
    set(parts.badge, px, py + 6);
    set(parts.pauldronL, px - 24, py - 16);
    set(parts.pauldronR, px + 24, py - 16);
    set(parts.armL, px - 24, py + 2);
    set(parts.fistL, px - 24, py + 16);
    set(parts.armR, px + 24, py + 2);
    set(parts.fistR, px + 24, py + 16);
    set(parts.dragonHead, px + dir * 24, py - 16);
    set(parts.dragonEye, px + dir * 24, py - 18);
    set(parts.belt, px, py + 16);
    set(parts.legL, px - 10, py + 32);
    set(parts.legR, px + 10, py + 32);
    set(parts.bootL, px - 10, py + 44);
    set(parts.bootR, px + 10, py + 44);
  }

  function transformEffect(scene, player, towardsMech) {
    const x = player.sprite.x;
    const y = player.sprite.y;
    const pal = towardsMech ? getMechPalette(player) : getNinjaPalette(player);
    const colors = [pal.primary, pal.highlight, pal.accent || pal.dark];
    for (let i = 0; i < 3; i++) {
      const ring = scene.add.circle(x, y, 20 + i * 5, colors[i], 0);
      ring.setStrokeStyle(4, colors[i]);
      ring.setDepth(100);
      scene.tweens.add({
        targets: ring,
        scaleX: 3.5,
        scaleY: 3.5,
        alpha: 0,
        duration: 550,
        delay: i * 60,
        onComplete: () => ring.destroy(),
      });
    }
    const text = scene.add
      .text(x, y - 60, towardsMech ? '🤖 MECH ONLINE!' : '🥷 EJECT!', {
        fontSize: '20px',
        fill: towardsMech ? '#ffd700' : '#7cfc00',
        stroke: '#111111',
        strokeThickness: 5,
        fontWeight: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(102);
    scene.tweens.add({
      targets: text,
      y: y - 100,
      alpha: 0,
      duration: 1100,
      onComplete: () => text.destroy(),
    });
  }

  const wingRocketSaver5Config = {
    key: 'wingRocketSaver5',
    cooldownMs: 400,
    forms: { primary: 'ninja', secondary: 'mech' },

    buildVisuals(form, facingRight, player, transformer) {
      const scene = player.scene;
      // Size the physics body for this form on every build, not just on toggle
      // — otherwise the ninja keeps the stock Player body until the first
      // transformation, breaking the shared-bottom invariant.
      applyBodyForForm(player, form);
      const parts =
        form === 'mech' ? buildMechVisuals(scene, player) : buildNinjaVisuals(scene, player);
      transformer._parts = parts;
      const out = [];
      Object.keys(parts).forEach((k) => {
        const val = parts[k];
        if (Array.isArray(val)) {
          val.forEach((o) => o && out.push(o));
        } else if (val && typeof val.destroy === 'function') {
          out.push(val);
        }
      });
      return out;
    },

    onUpdate(form, player, transformer) {
      const parts = transformer._parts;
      if (!parts) return;
      if (form === 'mech') {
        positionMech(parts, player);
      } else {
        positionNinja(parts, player);
      }
    },

    onDestroy(player) {
      // Leaving the costume entirely — restore the base sprite and body, and
      // make sure no summoned mech is left stranded in the world.
      setBaseVisibility(player, 1);
      if (player && typeof player.cleanupMechSuit === 'function') {
        player.cleanupMechSuit();
      }
      if (player && typeof player.cleanupDragonArm === 'function') {
        player.cleanupDragonArm();
      }
      applyBodyForForm(player, 'ninja');
    },

    onToggle(newForm, previousForm, player) {
      const costume = getCostume(player);
      if (newForm === 'mech') {
        player.speed = costume.mechSpeed || 200;
        player.jumpPower = costume.mechJump || 400;
        player.damageMultiplier = costume.mechDamage || 1.6;
        // The player just climbed in — the standing entity is absorbed.
        if (typeof player.consumeStandingMech === 'function') {
          player.consumeStandingMech();
        }
      } else {
        player.speed = costume.ninjaSpeed || 290;
        player.jumpPower = costume.ninjaJump || 520;
        player.damageMultiplier = costume.ninjaDamage || 1.0;
        // The player just ejected — leave the mech standing right here.
        if (typeof player.dropStandingMech === 'function') {
          player.dropStandingMech();
        }
        // A rocket punch in flight is cancelled by ejecting.
        if (typeof player.cleanupDragonArm === 'function') {
          player.cleanupDragonArm();
        }
      }
      applyBodyForForm(player, newForm);
      transformEffect(player.scene, player, newForm === 'mech');
      if (player.scene && player.scene.cameras && player.scene.cameras.main) {
        player.scene.cameras.main.shake(300, newForm === 'mech' ? 0.025 : 0.012);
      }
    },
  };

  function factory(player) {
    const Ctor =
      (typeof window !== 'undefined' && window.Transformer) ||
      (typeof Transformer !== 'undefined' ? Transformer : null);
    if (!Ctor) {
      console.error('WingRocketSaver5Transformer: Transformer base class is not loaded');
      return null;
    }
    return new Ctor(player, wingRocketSaver5Config);
  }

  if (typeof window !== 'undefined') {
    window.WingRocketSaver5TransformerConfig = wingRocketSaver5Config;
    window.WingRocketSaver5TransformerFactory = factory;
    if (window.TransformerRegistry) {
      window.TransformerRegistry.wingRocketSaver5 = factory;
    } else {
      window.TransformerRegistry = { wingRocketSaver5: factory };
    }
  }
})();
