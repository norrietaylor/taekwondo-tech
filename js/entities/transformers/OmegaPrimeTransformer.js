// Omega Prime transformer — robot <-> red snake form.
//
// The Omega Prime costume is built on top of the legendary fusion sprite
// (six-dragon body part mapping). This transformer overlays a robot/snake
// visual swap on top of that base, with the snake form being a long, bright
// RED segmented serpent that follows the player at high speed.
//
// Registers itself in TransformerRegistry under key 'omegaPrime'.
// Loaded as a global via <script> tag — no ES modules.
(function () {
    // Palette resolves dynamically from the active costume so a runtime
    // theme-swap (e.g. K-key Cyberpunk ↔ Solar Forge) is reflected the next
    // time visuals rebuild.
    const BLACK = 0x111111;
    // Robot form uses the costume's main palette (theme-swappable).
    function getPalette(player) {
        const costume = (player && typeof player.getDragonCostume === 'function')
            ? player.getDragonCostume() : null;
        const c = costume || {};
        return {
            primary:   c.primaryColor   || 0xff2db4,
            dark:      c.beltColor      || 0x6e27c5,
            highlight: c.secondaryColor || 0x00e5ff,
            white:     0xffffff
        };
    }
    // Snake form is intentionally locked to RED — pulled from snakeColors so
    // the costume controls the exact reds, but it ignores robot theme swaps.
    function getSnakePalette(player) {
        const costume = (player && typeof player.getDragonCostume === 'function')
            ? player.getDragonCostume() : null;
        const sc = (costume && costume.snakeColors) || {};
        return {
            primary:   sc.primary   || 0xff0033,
            dark:      sc.secondary || 0xcc0022,
            highlight: sc.accent    || 0xffd700,
            belly:     0xffb3bf // soft pink-red underside
        };
    }

    function toHex(n) { return '#' + n.toString(16).padStart(6, '0'); }

    // Resize the shared physics body to match the active form. The legendary
    // robot body is tall (helmet→boots); the serpent is a low, thin creature,
    // so snake form uses a much shorter, narrower body that slips through gaps
    // the robot can't — fixing the "snake gets stuck" wedging. Both forms
    // share the same body BOTTOM (the feet/belly line) so toggling never
    // teleports the player vertically.
    function applyBodyForForm(player, form) {
        const body = player && player.body;
        if (!body || typeof body.setSize !== 'function') return;
        const costume = (player && typeof player.getDragonCostume === 'function')
            ? player.getDragonCostume() : null;
        const size = (costume && costume.size) || 4.0;
        const baseW = 32 * size;
        const baseH = 48 * size;
        // Robot body mirrors the Player constructor's legendary setup.
        const robotW = baseW * 0.65;
        const robotH = baseH * 0.85;
        const bottom = robotH / 2; // body-bottom offset from the sprite centre
        let w, h, offY;
        if (form === 'snake') {
            w = baseW * 0.45;
            h = baseH * 0.45;
            offY = bottom - h; // shared bottom — no vertical pop on toggle
        } else {
            w = robotW;
            h = robotH;
            offY = -h / 2;
        }
        body.setSize(w, h, false);
        body.setOffset(-w / 2, offY);
    }

    // Power Ranger / Megazord-style armor overlay. Every dimension scales by
    // S = costume.size / 2.5 so the armor grows with the legendary sprite.
    function buildRobotVisuals(scene, player) {
        const px = player.sprite.x;
        const py = player.sprite.y;
        const pal = getPalette(player);
        const costume = (typeof player.getDragonCostume === 'function')
            ? player.getDragonCostume() : null;
        const S = (costume && costume.size ? costume.size : 2.5) / 2.5;
        const v = {};

        // === HELMET ===
        // Wide rectangular helmet covering the head with a horizontal visor.
        v.helmet = scene.add.rectangle(px, py - 38 * S, 36 * S, 28 * S, pal.primary);
        v.helmet.setStrokeStyle(2 * S, BLACK);
        v.helmet.setDepth(55);
        // Tapered chin guard below the visor
        v.chinGuard = scene.add.rectangle(px, py - 28 * S, 28 * S, 8 * S, pal.dark);
        v.chinGuard.setStrokeStyle(1, BLACK);
        v.chinGuard.setDepth(55);
        // Mouth-grill mouthguard (classic Power Ranger silver bar)
        v.mouthGuard = scene.add.rectangle(px, py - 28 * S, 18 * S, 3 * S, 0xc0c0c0);
        v.mouthGuard.setDepth(56);
        // Horizontal visor across the eyes
        v.visor = scene.add.rectangle(px, py - 40 * S, 30 * S, 8 * S, pal.highlight);
        v.visor.setStrokeStyle(2 * S, BLACK);
        v.visor.setDepth(56);
        // Inner visor sheen
        v.visorSheen = scene.add.rectangle(px - 6 * S, py - 41 * S, 6 * S, 3 * S, 0xffffff, 0.7);
        v.visorSheen.setDepth(57);
        // Single solid crest fin sitting flush on top of the helmet — no
        // floating tip ball.
        v.crestFin = scene.add.triangle(px, py - 60 * S,
            -10 * S, 8 * S, 10 * S, 8 * S, 0, -12 * S,
            pal.highlight);
        v.crestFin.setStrokeStyle(2 * S, BLACK);
        v.crestFin.setDepth(57);
        v.crestGem = scene.add.circle(px, py - 58 * S, 3 * S, pal.dark);
        v.crestGem.setStrokeStyle(1, BLACK);
        v.crestGem.setDepth(58);
        // Earpiece nubs on either side of the helmet
        v.earL = scene.add.rectangle(px - 19 * S, py - 38 * S, 4 * S, 10 * S, pal.dark);
        v.earL.setDepth(54);
        v.earR = scene.add.rectangle(px + 19 * S, py - 38 * S, 4 * S, 10 * S, pal.dark);
        v.earR.setDepth(54);

        // Arm/leg X offsets matching the legendary sprite:
        //   arm center = ±width*0.35 of 32*2.5 = ±28 (at S=1, scales with S)
        //   leg center = ±width*0.15 of 32*2.5 = ±12
        const armX = 28 * S;
        const legX = 12 * S;

        // === SHOULDERS / PAULDRONS — sit on top of upper arms ===
        v.leftPauldron = scene.add.rectangle(px - armX, py - 18 * S, 20 * S, 16 * S, pal.primary);
        v.leftPauldron.setStrokeStyle(2 * S, BLACK);
        v.leftPauldron.setDepth(53);
        v.leftPauldronStripe = scene.add.rectangle(px - armX, py - 22 * S, 20 * S, 3 * S, pal.highlight);
        v.leftPauldronStripe.setDepth(54);
        v.rightPauldron = scene.add.rectangle(px + armX, py - 18 * S, 20 * S, 16 * S, pal.primary);
        v.rightPauldron.setStrokeStyle(2 * S, BLACK);
        v.rightPauldron.setDepth(53);
        v.rightPauldronStripe = scene.add.rectangle(px + armX, py - 22 * S, 20 * S, 3 * S, pal.highlight);
        v.rightPauldronStripe.setDepth(54);

        // === CHEST — wider plate that fully covers the torso ===
        v.chestPlate = scene.add.rectangle(px, py - 2 * S, 30 * S, 28 * S, pal.primary);
        v.chestPlate.setStrokeStyle(2 * S, 0xffffff);
        v.chestPlate.setDepth(53);
        // V-chevron: two thick diagonal rectangles meeting at the bottom-center.
        v.chevronL = scene.add.rectangle(px - 6 * S, py - 4 * S, 4 * S, 18 * S, pal.highlight);
        v.chevronL.setRotation(-Math.PI / 6);
        v.chevronL.setDepth(54);
        v.chevronR = scene.add.rectangle(px + 6 * S, py - 4 * S, 4 * S, 18 * S, pal.highlight);
        v.chevronR.setRotation(Math.PI / 6);
        v.chevronR.setDepth(54);
        // Central star badge, sits below the chevron point
        v.badge = scene.add.star(px, py + 4 * S, 5, 4 * S, 8 * S, pal.highlight);
        v.badge.setStrokeStyle(1, BLACK);
        v.badge.setDepth(55);

        // === ARMS — gauntlet covers forearm, fist at wrist ===
        v.leftGauntlet = scene.add.rectangle(px - armX, py + 4 * S, 14 * S, 14 * S, pal.dark);
        v.leftGauntlet.setStrokeStyle(2 * S, BLACK);
        v.leftGauntlet.setDepth(52);
        v.leftFist = scene.add.rectangle(px - armX, py + 16 * S, 14 * S, 10 * S, pal.primary);
        v.leftFist.setStrokeStyle(2 * S, BLACK);
        v.leftFist.setDepth(53);
        v.rightGauntlet = scene.add.rectangle(px + armX, py + 4 * S, 14 * S, 14 * S, pal.dark);
        v.rightGauntlet.setStrokeStyle(2 * S, BLACK);
        v.rightGauntlet.setDepth(52);
        v.rightFist = scene.add.rectangle(px + armX, py + 16 * S, 14 * S, 10 * S, pal.primary);
        v.rightFist.setStrokeStyle(2 * S, BLACK);
        v.rightFist.setDepth(53);

        // === BELT ===
        v.belt = scene.add.rectangle(px, py + 14 * S, 32 * S, 7 * S, BLACK);
        v.belt.setStrokeStyle(1, pal.highlight);
        v.belt.setDepth(54);
        v.buckle = scene.add.rectangle(px, py + 14 * S, 12 * S, 10 * S, pal.highlight);
        v.buckle.setStrokeStyle(1, BLACK);
        v.buckle.setDepth(55);
        v.buckleOmega = scene.add.text(px, py + 14 * S, 'Ω', {
            fontSize: Math.round(10 * S) + 'px',
            fill: '#111111', fontWeight: 'bold'
        }).setOrigin(0.5).setDepth(56);

        // === LEGS — knee armor + boots aligned with legendary leg sprites ===
        v.leftKnee = scene.add.rectangle(px - legX, py + 26 * S, 14 * S, 7 * S, pal.dark);
        v.leftKnee.setStrokeStyle(1, BLACK);
        v.leftKnee.setDepth(52);
        v.rightKnee = scene.add.rectangle(px + legX, py + 26 * S, 14 * S, 7 * S, pal.dark);
        v.rightKnee.setStrokeStyle(1, BLACK);
        v.rightKnee.setDepth(52);
        v.leftBoot = scene.add.rectangle(px - legX, py + 44 * S, 16 * S, 12 * S, pal.primary);
        v.leftBoot.setStrokeStyle(2 * S, BLACK);
        v.leftBoot.setDepth(53);
        v.leftBootStripe = scene.add.rectangle(px - legX, py + 40 * S, 16 * S, 2 * S, pal.highlight);
        v.leftBootStripe.setDepth(54);
        v.rightBoot = scene.add.rectangle(px + legX, py + 44 * S, 16 * S, 12 * S, pal.primary);
        v.rightBoot.setStrokeStyle(2 * S, BLACK);
        v.rightBoot.setDepth(53);
        v.rightBootStripe = scene.add.rectangle(px + legX, py + 40 * S, 16 * S, 2 * S, pal.highlight);
        v.rightBootStripe.setDepth(54);

        v._scale = S;
        // The Power Ranger armor is the complete robot visual. Hide the
        // underlying legendary fusion sprite — its body bobs <1px every
        // physics step and that jitter shows through/around the armor.
        if (player.sprite && player.sprite.setAlpha) player.sprite.setAlpha(0);
        return v;
    }

    function buildSnakeVisuals(scene, player) {
        const px = player.sprite.x;
        const py = player.sprite.y;
        const dir = player.facingRight ? 1 : -1;
        const pal = getSnakePalette(player); // always red regardless of robot theme
        const v = {};
        const BELLY = pal.belly;
        // Scale everything by the costume's display size so the snake matches
        // the legendary 4x robot scale (was tiny when hardcoded at 1x).
        const costume = (typeof player.getDragonCostume === 'function')
            ? player.getDragonCostume() : null;
        const S = (costume && costume.size ? costume.size : 2.5) / 2.5;
        v._scale = S;
        const segmentCount = 14;
        v.segments = [];
        v.bellies = [];
        v.scales = [];
        for (let i = 0; i < segmentCount; i++) {
            const t = i / (segmentCount - 1);
            const segW = (26 - t * 14) * S;
            const segH = (18 - t * 12) * S;
            const offsetX = -dir * (i * 18 * S);
            const color = (i % 2 === 0) ? pal.primary : pal.dark;
            const seg = scene.add.ellipse(px + offsetX, py + 6 * S, segW, segH, color);
            seg.setStrokeStyle(2, BLACK);
            seg.setDepth(51 - i * 0.05);
            v.segments.push(seg);
            if (i < segmentCount - 2) {
                const belly = scene.add.ellipse(px + offsetX, py + 9 * S, segW * 0.7, segH * 0.4, BELLY);
                belly.setDepth(52 - i * 0.05);
                v.bellies.push(belly);
            }
            if (i > 0 && i < segmentCount - 1 && i % 2 === 1) {
                const sc = scene.add.rectangle(px + offsetX, py + 5 * S, 5 * S, 5 * S, pal.highlight);
                sc.setRotation(Math.PI / 4);
                sc.setStrokeStyle(1, BLACK);
                sc.setDepth(53 - i * 0.05);
                v.scales.push(sc);
            }
        }
        v.hood = scene.add.ellipse(px + dir * 6 * S, py + 4 * S, 38 * S, 26 * S, pal.primary);
        v.hood.setStrokeStyle(3, BLACK);
        v.hood.setDepth(57);
        v.hoodMark = scene.add.ellipse(px + dir * 4 * S, py - 2 * S, 14 * S, 8 * S, pal.highlight);
        v.hoodMark.setDepth(58);
        v.snout = scene.add.triangle(
            px + dir * 22 * S, py + 6 * S,
            0, -6 * S,
            dir * 14 * S, 0,
            0, 6 * S,
            pal.dark
        );
        v.snout.setStrokeStyle(2, BLACK);
        v.snout.setDepth(58);
        v.leftEyeWhite = scene.add.ellipse(px + dir * 10 * S, py - 1 * S, 6 * S, 7 * S, 0xffffff);
        v.leftEyeWhite.setDepth(59);
        v.leftPupil = scene.add.rectangle(px + dir * 10 * S, py - 1 * S, 2 * S, 6 * S, BLACK);
        v.leftPupil.setDepth(60);
        v.rightEyeWhite = scene.add.ellipse(px + dir * 14 * S, py + 4 * S, 6 * S, 7 * S, 0xffffff);
        v.rightEyeWhite.setDepth(59);
        v.rightPupil = scene.add.rectangle(px + dir * 14 * S, py + 4 * S, 2 * S, 6 * S, BLACK);
        v.rightPupil.setDepth(60);
        v.fang1 = scene.add.triangle(px + dir * 22 * S, py + 9 * S, 0, 0, dir * 3 * S, 8 * S, -dir * 2 * S, 8 * S, 0xffffff);
        v.fang1.setStrokeStyle(1, BLACK);
        v.fang1.setDepth(60);
        v.fang2 = scene.add.triangle(px + dir * 26 * S, py + 9 * S, 0, 0, dir * 3 * S, 8 * S, -dir * 2 * S, 8 * S, 0xffffff);
        v.fang2.setStrokeStyle(1, BLACK);
        v.fang2.setDepth(60);
        v.tongueBase = scene.add.rectangle(px + dir * 32 * S, py + 7 * S, 12 * S, 3 * S, pal.primary);
        v.tongueBase.setDepth(58);
        v.tongueFork1 = scene.add.rectangle(px + dir * 40 * S, py + 4 * S, 6 * S, 2 * S, pal.primary);
        v.tongueFork1.setDepth(58);
        v.tongueFork2 = scene.add.rectangle(px + dir * 40 * S, py + 10 * S, 6 * S, 2 * S, pal.primary);
        v.tongueFork2.setDepth(58);
        // Hide the underlying legendary sprite while in snake form
        if (player.sprite && player.sprite.setAlpha) player.sprite.setAlpha(0);
        return v;
    }

    function positionRobot(parts, player) {
        // Keep the base sprite hidden every frame — see buildRobotVisuals.
        // Re-asserted here so the damage flash / death flash (which set the
        // sprite's alpha back to 1) can't reveal it behind the armor.
        if (player.sprite && player.sprite.setAlpha) player.sprite.setAlpha(0);
        // DEADZONE: only reposition the armor once the player has moved more
        // than ~1.25px from the last committed position. The arcade body
        // bobs <1px every physics step while resting on the ground; rounding
        // that bob to integers still flips 1px each frame. Rounding alone
        // (the previous approach) therefore still jittered — the deadzone
        // absorbs the resting oscillation entirely while staying tight
        // enough that real movement (>=12px/frame) repositions every frame.
        const rawX = player.sprite.x;
        const rawY = player.sprite.y;
        if (parts._lastRawX !== undefined
            && Math.abs(rawX - parts._lastRawX) < 1.25
            && Math.abs(rawY - parts._lastRawY) < 1.25) {
            return;
        }
        parts._lastRawX = rawX;
        parts._lastRawY = rawY;
        const px = Math.round(rawX);
        const py = Math.round(rawY);
        const S = parts._scale || 1;
        const armX = Math.round(28 * S);
        const legX = Math.round(12 * S);
        const R = Math.round;
        // Helmet
        if (parts.helmet)      { parts.helmet.x = px;            parts.helmet.y = R(py - 38 * S); }
        if (parts.chinGuard)   { parts.chinGuard.x = px;         parts.chinGuard.y = R(py - 28 * S); }
        if (parts.mouthGuard)  { parts.mouthGuard.x = px;        parts.mouthGuard.y = R(py - 28 * S); }
        if (parts.visor)       { parts.visor.x = px;             parts.visor.y = R(py - 40 * S); }
        if (parts.visorSheen)  { parts.visorSheen.x = R(px - 6 * S); parts.visorSheen.y = R(py - 41 * S); }
        if (parts.crestFin)    { parts.crestFin.x = px;          parts.crestFin.y = Math.round(py - 60 * S); }
        if (parts.crestGem)    { parts.crestGem.x = px;          parts.crestGem.y = Math.round(py - 58 * S); }
        if (parts.earL)        { parts.earL.x = R(px - 19 * S);     parts.earL.y = R(py - 38 * S); }
        if (parts.earR)        { parts.earR.x = R(px + 19 * S);     parts.earR.y = R(py - 38 * S); }
        // Shoulders
        if (parts.leftPauldron) { parts.leftPauldron.x = px - armX; parts.leftPauldron.y = R(py - 18 * S); }
        if (parts.leftPauldronStripe) { parts.leftPauldronStripe.x = px - armX; parts.leftPauldronStripe.y = R(py - 22 * S); }
        if (parts.rightPauldron) { parts.rightPauldron.x = px + armX; parts.rightPauldron.y = R(py - 18 * S); }
        if (parts.rightPauldronStripe) { parts.rightPauldronStripe.x = px + armX; parts.rightPauldronStripe.y = R(py - 22 * S); }
        // Chest
        if (parts.chestPlate)  { parts.chestPlate.x = px;        parts.chestPlate.y = R(py - 2 * S); }
        if (parts.chevronL)    { parts.chevronL.x = R(px - 6 * S);  parts.chevronL.y = R(py - 4 * S); }
        if (parts.chevronR)    { parts.chevronR.x = R(px + 6 * S);  parts.chevronR.y = R(py - 4 * S); }
        if (parts.badge)       { parts.badge.x = px;             parts.badge.y = R(py + 4 * S); }
        // Arms / fists
        if (parts.leftGauntlet) { parts.leftGauntlet.x = px - armX; parts.leftGauntlet.y = R(py + 4 * S); }
        if (parts.leftFist)     { parts.leftFist.x = px - armX;     parts.leftFist.y = R(py + 16 * S); }
        if (parts.rightGauntlet){ parts.rightGauntlet.x = px + armX; parts.rightGauntlet.y = R(py + 4 * S); }
        if (parts.rightFist)    { parts.rightFist.x = px + armX;     parts.rightFist.y = R(py + 16 * S); }
        // Belt
        if (parts.belt)         { parts.belt.x = px;            parts.belt.y = R(py + 14 * S); }
        if (parts.buckle)       { parts.buckle.x = px;          parts.buckle.y = R(py + 14 * S); }
        if (parts.buckleOmega)  { parts.buckleOmega.x = px;     parts.buckleOmega.y = R(py + 14 * S); }
        // Legs / boots
        if (parts.leftKnee)     { parts.leftKnee.x = px - legX;  parts.leftKnee.y = R(py + 26 * S); }
        if (parts.rightKnee)    { parts.rightKnee.x = px + legX; parts.rightKnee.y = R(py + 26 * S); }
        if (parts.leftBoot)     { parts.leftBoot.x = px - legX;  parts.leftBoot.y = R(py + 44 * S); }
        if (parts.leftBootStripe) { parts.leftBootStripe.x = px - legX; parts.leftBootStripe.y = R(py + 40 * S); }
        if (parts.rightBoot)    { parts.rightBoot.x = px + legX; parts.rightBoot.y = R(py + 44 * S); }
        if (parts.rightBootStripe) { parts.rightBootStripe.x = px + legX; parts.rightBootStripe.y = R(py + 40 * S); }
    }

    function positionSnake(parts, player) {
        // Keep the legendary sprite hidden every frame. buildSnakeVisuals
        // hides it once, but the damage flash and die() both reset the
        // sprite's alpha to 1 — without this re-assert the boxy robot sprite
        // reappears behind the serpent (the "comes back like this" bug).
        if (player.sprite && player.sprite.setAlpha) player.sprite.setAlpha(0);
        const px = player.sprite.x;
        const py = player.sprite.y;
        const dir = player.facingRight ? 1 : -1;
        const now = Date.now();
        const S = parts._scale || 1;
        if (parts.segments) {
            for (let i = 0; i < parts.segments.length; i++) {
                const seg = parts.segments[i];
                if (!seg) continue;
                const sway = Math.sin((now / 140) + i * 0.55) * (3 + i * 0.4) * S;
                seg.x = px - dir * i * 18 * S;
                seg.y = py + 6 * S + sway;
            }
        }
        if (parts.bellies) {
            for (let i = 0; i < parts.bellies.length; i++) {
                const b = parts.bellies[i];
                const sway = Math.sin((now / 140) + i * 0.55) * (3 + i * 0.4) * S;
                b.x = px - dir * i * 18 * S;
                b.y = py + 9 * S + sway;
            }
        }
        if (parts.scales) {
            let scaleIdx = 0;
            for (let i = 1; i < parts.segments.length - 1; i += 2) {
                const s = parts.scales[scaleIdx++];
                if (!s) continue;
                const sway = Math.sin((now / 140) + i * 0.55) * (3 + i * 0.4) * S;
                s.x = px - dir * i * 18 * S;
                s.y = py + 5 * S + sway;
            }
        }
        if (parts.hood) { parts.hood.x = px + dir * 6 * S; parts.hood.y = py + 4 * S; }
        if (parts.hoodMark) { parts.hoodMark.x = px + dir * 4 * S; parts.hoodMark.y = py - 2 * S; }
        if (parts.snout) { parts.snout.x = px + dir * 22 * S; parts.snout.y = py + 6 * S; }
        if (parts.leftEyeWhite) { parts.leftEyeWhite.x = px + dir * 10 * S; parts.leftEyeWhite.y = py - 1 * S; }
        if (parts.leftPupil) { parts.leftPupil.x = px + dir * 10 * S; parts.leftPupil.y = py - 1 * S; }
        if (parts.rightEyeWhite) { parts.rightEyeWhite.x = px + dir * 14 * S; parts.rightEyeWhite.y = py + 4 * S; }
        if (parts.rightPupil) { parts.rightPupil.x = px + dir * 14 * S; parts.rightPupil.y = py + 4 * S; }
        if (parts.fang1) { parts.fang1.x = px + dir * 22 * S; parts.fang1.y = py + 9 * S; }
        if (parts.fang2) { parts.fang2.x = px + dir * 26 * S; parts.fang2.y = py + 9 * S; }
        if (parts.tongueBase) { parts.tongueBase.x = px + dir * 32 * S; parts.tongueBase.y = py + 7 * S; }
        const flick = (Math.sin(now / 90) > 0) ? 1.0 : 0.5;
        if (parts.tongueFork1) {
            parts.tongueFork1.x = px + dir * (32 + 8 * flick) * S;
            parts.tongueFork1.y = py + 4 * S;
            parts.tongueFork1.setScale(flick, 1);
        }
        if (parts.tongueFork2) {
            parts.tongueFork2.x = px + dir * (32 + 8 * flick) * S;
            parts.tongueFork2.y = py + 10 * S;
            parts.tongueFork2.setScale(flick, 1);
        }
    }

    function transformEffect(scene, player, towardsSnake) {
        const x = player.sprite.x;
        const y = player.sprite.y;
        // Effect rings use whichever palette the destination form will wear.
        const fxPal = towardsSnake ? getSnakePalette(player) : getPalette(player);
        const colors = [fxPal.primary, fxPal.highlight, fxPal.dark];
        for (let i = 0; i < 3; i++) {
            const ring = scene.add.circle(x, y, 22 + i * 5, colors[i], 0);
            ring.setStrokeStyle(4, colors[i]);
            ring.setDepth(100);
            scene.tweens.add({
                targets: ring,
                scaleX: 4, scaleY: 4, alpha: 0,
                duration: 600,
                delay: i * 60,
                onComplete: () => ring.destroy()
            });
        }
        const text = scene.add.text(x, y - 60,
            towardsSnake ? '🐍 SERPENT MODE!' : '🤖 OMEGA PRIME!',
            { fontSize: '20px', fill: '#00e5ff', stroke: '#6e27c5', strokeThickness: 5, fontWeight: 'bold' }
        ).setOrigin(0.5).setDepth(102);
        scene.tweens.add({
            targets: text,
            y: y - 100, alpha: 0,
            duration: 1200,
            onComplete: () => text.destroy()
        });
    }

    const omegaPrimeConfig = {
        key: 'omegaPrime',
        cooldownMs: 400, // shorter than the 900ms default — toggles feel snappier
        forms: { primary: 'robot', secondary: 'snake' },

        buildVisuals(form, facingRight, player, transformer) {
            const scene = player.scene;
            const parts = (form === 'snake')
                ? buildSnakeVisuals(scene, player)
                : buildRobotVisuals(scene, player);
            transformer._parts = parts;
            // Snake form returns an array of segment circles + head parts.
            const out = [];
            Object.keys(parts).forEach(k => {
                const val = parts[k];
                if (Array.isArray(val)) {
                    val.forEach(o => o && out.push(o));
                } else if (val) {
                    out.push(val);
                }
            });
            return out;
        },

        onUpdate(form, player, transformer) {
            const parts = transformer._parts;
            if (!parts) return;
            if (form === 'snake') {
                positionSnake(parts, player);
            } else {
                positionRobot(parts, player);
            }
        },

        onDestroy(player) {
            // Leaving Omega Prime entirely — restore the base sprite and the
            // full-size robot body for whatever costume comes next.
            if (player && player.sprite && player.sprite.setAlpha) {
                player.sprite.setAlpha(1);
            }
            applyBodyForForm(player, 'robot');
        },

        onToggle(newForm, previousForm, player, transformer) {
            const costume = (typeof player.getDragonCostume === 'function')
                ? player.getDragonCostume()
                : null;
            if (newForm === 'snake') {
                player.speed = (costume && costume.snakeSpeed) || 360;
                player.jumpPower = (costume && costume.snakeJump) || 320;
                player.damageMultiplier = (costume && costume.snakeDamage) || 1.3;
            } else {
                player.speed = (costume && costume.robotSpeed) || 240;
                player.jumpPower = (costume && costume.robotJump) || 480;
                player.damageMultiplier = (costume && costume.robotDamage) || 1.5;
                // Note: the base sprite stays hidden in robot form — the armor
                // is the full visual. buildRobotVisuals + positionRobot manage
                // its alpha; onDestroy restores it when the costume changes.
            }
            // Resize the physics body to match the new form.
            applyBodyForForm(player, newForm);
            transformEffect(player.scene, player, newForm === 'snake');
            if (player.scene && player.scene.cameras && player.scene.cameras.main) {
                player.scene.cameras.main.shake(400, 0.03);
            }
        }
    };

    function factory(player) {
        const Ctor = (typeof window !== 'undefined' && window.Transformer)
            || (typeof Transformer !== 'undefined' ? Transformer : null);
        if (!Ctor) {
            console.error('OmegaPrimeTransformer: Transformer base class is not loaded');
            return null;
        }
        return new Ctor(player, omegaPrimeConfig);
    }

    if (typeof window !== 'undefined') {
        window.OmegaPrimeTransformerConfig = omegaPrimeConfig;
        window.OmegaPrimeTransformerFactory = factory;
        if (window.TransformerRegistry) {
            window.TransformerRegistry.omegaPrime = factory;
        } else {
            window.TransformerRegistry = { omegaPrime: factory };
        }
    }
})();
