// BMW Bouncer transformer — migration of the legacy bmwBouncer* code path on
// Player.js onto the shared Transformer base. Forms: 'robot' <-> 'car'.
//
// This file is responsible for:
//   - registering the costume in TransformerRegistry under key 'bmwBouncer'
//   - building the per-form visuals (createBmwBouncerRobotVisuals / Car visuals)
//   - positioning visuals each frame (mirrors updateBmwBouncerVisualsIfNeeded)
//   - applying the speed/jump/damage stat changes on toggle
//   - emitting the transform-effect particles + label
//
// The bounceSlam ability stays on Player.js (per spec: per-costume specials
// continue to live on Player for now). This file owns only the transform
// pipeline — i.e. R1.4–R1.6 in 01-spec-vibecoder-mode.md.
(function () {
    function buildRobotVisuals(scene, player) {
        const px = player.sprite.x;
        const py = player.sprite.y;
        const white = 0xffffff;
        const blue = 0x0066b2;
        const violet = 0x6e27c5;
        const red = 0xe22400;
        const v = {};
        v.chest = scene.add.rectangle(px, py, 24, 28, white);
        v.chest.setStrokeStyle(2, blue);
        v.chest.setDepth(51);
        v.stripeBlue = scene.add.rectangle(px - 6, py, 4, 28, blue);
        v.stripeBlue.setDepth(52);
        v.stripeViolet = scene.add.rectangle(px, py, 4, 28, violet);
        v.stripeViolet.setDepth(52);
        v.stripeRed = scene.add.rectangle(px + 6, py, 4, 28, red);
        v.stripeRed.setDepth(52);
        v.head = scene.add.rectangle(px, py - 20, 18, 14, white);
        v.head.setStrokeStyle(2, blue);
        v.head.setDepth(52);
        v.visor = scene.add.rectangle(px, py - 20, 14, 4, blue);
        v.visor.setDepth(53);
        v.leftArm = scene.add.rectangle(px - 16, py - 2, 8, 18, white);
        v.leftArm.setStrokeStyle(1, blue);
        v.leftArm.setDepth(50);
        v.rightArm = scene.add.rectangle(px + 16, py - 2, 8, 18, white);
        v.rightArm.setStrokeStyle(1, blue);
        v.rightArm.setDepth(50);
        v.leftLeg = scene.add.rectangle(px - 7, py + 20, 10, 14, blue);
        v.leftLeg.setStrokeStyle(1, white);
        v.leftLeg.setDepth(50);
        v.rightLeg = scene.add.rectangle(px + 7, py + 20, 10, 14, red);
        v.rightLeg.setStrokeStyle(1, white);
        v.rightLeg.setDepth(50);
        v.leftFoot = scene.add.rectangle(px - 7, py + 30, 12, 6, 0x222222);
        v.leftFoot.setStrokeStyle(1, blue);
        v.leftFoot.setDepth(50);
        v.rightFoot = scene.add.rectangle(px + 7, py + 30, 12, 6, 0x222222);
        v.rightFoot.setStrokeStyle(1, red);
        v.rightFoot.setDepth(50);
        if (player.sprite && player.sprite.setAlpha) player.sprite.setAlpha(0);
        return v;
    }

    function buildCarVisuals(scene, player, facingRight) {
        const px = player.sprite.x;
        const py = player.sprite.y;
        const dir = facingRight ? 1 : -1;
        const white = 0xffffff;
        const blue = 0x0066b2;
        const violet = 0x6e27c5;
        const red = 0xe22400;
        const v = {};
        v.body = scene.add.ellipse(px, py, 52, 20, white);
        v.body.setStrokeStyle(2, 0x111111);
        v.body.setDepth(51);
        v.hood = scene.add.ellipse(px + dir * 22, py - 2, 18, 10, white);
        v.hood.setStrokeStyle(2, 0x111111);
        v.hood.setDepth(52);
        v.roof = scene.add.ellipse(px - dir * 4, py - 10, 22, 10, white);
        v.roof.setStrokeStyle(2, 0x111111);
        v.roof.setDepth(52);
        v.spoiler = scene.add.rectangle(px - dir * 24, py - 6, 6, 8, 0x111111);
        v.spoiler.setDepth(52);
        v.wheel1 = scene.add.circle(px - dir * 20, py + 10, 8, 0x111111);
        v.wheel1.setStrokeStyle(2, 0x444444);
        v.wheel1.setDepth(50);
        v.wheel2 = scene.add.circle(px + dir * 20, py + 10, 8, 0x111111);
        v.wheel2.setStrokeStyle(2, 0x444444);
        v.wheel2.setDepth(50);
        v.liveryBlue = scene.add.rectangle(px - 10, py - 4, 14, 3, blue);
        v.liveryBlue.setDepth(53);
        v.liveryViolet = scene.add.rectangle(px + 4, py - 4, 14, 3, violet);
        v.liveryViolet.setDepth(53);
        v.liveryRed = scene.add.rectangle(px + 18, py - 4, 14, 3, red);
        v.liveryRed.setDepth(53);
        if (player.sprite && player.sprite.setAlpha) player.sprite.setAlpha(0);
        return v;
    }

    function positionRobot(parts, player) {
        const px = player.sprite.x;
        const py = player.sprite.y;
        if (parts.chest) { parts.chest.x = px; parts.chest.y = py; }
        if (parts.stripeBlue) { parts.stripeBlue.x = px - 6; parts.stripeBlue.y = py; }
        if (parts.stripeViolet) { parts.stripeViolet.x = px; parts.stripeViolet.y = py; }
        if (parts.stripeRed) { parts.stripeRed.x = px + 6; parts.stripeRed.y = py; }
        if (parts.head) { parts.head.x = px; parts.head.y = py - 20; }
        if (parts.visor) { parts.visor.x = px; parts.visor.y = py - 20; }
        if (parts.leftArm) { parts.leftArm.x = px - 16; parts.leftArm.y = py - 2; }
        if (parts.rightArm) { parts.rightArm.x = px + 16; parts.rightArm.y = py - 2; }
        if (parts.leftLeg) { parts.leftLeg.x = px - 7; parts.leftLeg.y = py + 20; }
        if (parts.rightLeg) { parts.rightLeg.x = px + 7; parts.rightLeg.y = py + 20; }
        if (parts.leftFoot) { parts.leftFoot.x = px - 7; parts.leftFoot.y = py + 30; }
        if (parts.rightFoot) { parts.rightFoot.x = px + 7; parts.rightFoot.y = py + 30; }
    }

    function positionCar(parts, player) {
        const px = player.sprite.x;
        const py = player.sprite.y;
        const dir = player.facingRight ? 1 : -1;
        if (parts.body) { parts.body.x = px; parts.body.y = py; }
        if (parts.hood) { parts.hood.x = px + dir * 22; parts.hood.y = py - 2; }
        if (parts.roof) { parts.roof.x = px - dir * 4; parts.roof.y = py - 10; }
        if (parts.spoiler) { parts.spoiler.x = px - dir * 24; parts.spoiler.y = py - 6; }
        if (parts.wheel1) { parts.wheel1.x = px - dir * 20; parts.wheel1.y = py + 10; }
        if (parts.wheel2) { parts.wheel2.x = px + dir * 20; parts.wheel2.y = py + 10; }
        if (parts.liveryBlue) { parts.liveryBlue.x = px - 10; parts.liveryBlue.y = py - 4; }
        if (parts.liveryViolet) { parts.liveryViolet.x = px + 4; parts.liveryViolet.y = py - 4; }
        if (parts.liveryRed) { parts.liveryRed.x = px + 18; parts.liveryRed.y = py - 4; }
    }

    function transformEffect(scene, player, towardsCar) {
        const x = player.sprite.x;
        const y = player.sprite.y;
        const colors = [0x0066b2, 0x6e27c5, 0xe22400];
        for (let i = 0; i < 3; i++) {
            const ring = scene.add.circle(x, y, 18 + i * 4, colors[i], 0);
            ring.setStrokeStyle(3, colors[i]);
            ring.setDepth(100);
            scene.tweens.add({
                targets: ring,
                scaleX: 3, scaleY: 3, alpha: 0,
                duration: 500,
                delay: i * 50,
                onComplete: () => ring.destroy()
            });
        }
        const transformText = scene.add.text(x, y - 50,
            towardsCar ? '🏁 CSL 3.0 M MODE!' : '🤖 ROBOT MODE!',
            { fontSize: '18px', fill: '#ffffff', stroke: '#0066b2', strokeThickness: 4, fontWeight: 'bold' }
        ).setOrigin(0.5).setDepth(102);
        scene.tweens.add({
            targets: transformText,
            y: y - 80, alpha: 0,
            duration: 1000,
            onComplete: () => transformText.destroy()
        });
    }

    const bmwBouncerConfig = {
        key: 'bmwBouncer',
        cooldownMs: 1000,
        forms: { primary: 'robot', secondary: 'car' },

        // Build the procedural sprite parts for the active form. Returns an array
        // of scene objects so the base can destroy them later. We also stash the
        // labelled `parts` map on the transformer so the per-frame positioner can
        // reach them by name.
        buildVisuals(form, facingRight, player, transformer) {
            const scene = player.scene;
            const parts = (form === 'car')
                ? buildCarVisuals(scene, player, facingRight)
                : buildRobotVisuals(scene, player);
            transformer._parts = parts;
            return Object.values(parts);
        },

        // Each frame, follow the player. We delegate to the form-specific
        // positioner so the math stays close to the visual definition.
        onUpdate(form, player, transformer) {
            const parts = transformer._parts;
            if (!parts) return;
            if (form === 'car') {
                positionCar(parts, player);
            } else {
                positionRobot(parts, player);
            }
        },

        // Restore the underlying player sprite alpha when this transformer is
        // discarded (e.g. costume swapped away from BMW Bouncer).
        onDestroy(player) {
            if (player && player.sprite && player.sprite.setAlpha) {
                player.sprite.setAlpha(1);
            }
        },

        // Apply the stat changes + transform-effect particles on each toggle.
        // Mirrors performBmwBouncerTransform in the legacy code.
        onToggle(newForm, previousForm, player, transformer) {
            const costume = (typeof player.getDragonCostume === 'function')
                ? player.getDragonCostume()
                : null;
            if (newForm === 'car') {
                player.speed = (costume && costume.carSpeed) || 330;
                player.jumpPower = (costume && costume.carJump) || 370;
                player.damageMultiplier = (costume && costume.carDamage) || 0.9;
            } else {
                player.speed = (costume && costume.robotSpeed) || 205;
                player.jumpPower = (costume && costume.robotJump) || 420;
                player.damageMultiplier = (costume && costume.robotDamage) || 1.0;
            }
            transformEffect(player.scene, player, newForm === 'car');
            if (player.scene && player.scene.cameras && player.scene.cameras.main) {
                player.scene.cameras.main.shake(300, 0.02);
            }
        }
    };

    function factory(player) {
        const Ctor = (typeof window !== 'undefined' && window.Transformer) || (typeof Transformer !== 'undefined' ? Transformer : null);
        if (!Ctor) {
            console.error('BMWBouncerTransformer: Transformer base class is not loaded');
            return null;
        }
        return new Ctor(player, bmwBouncerConfig);
    }

    if (typeof window !== 'undefined') {
        window.BMWBouncerTransformerConfig = bmwBouncerConfig;
        window.BMWBouncerTransformerFactory = factory;
        if (window.TransformerRegistry) {
            window.TransformerRegistry.bmwBouncer = factory;
        } else {
            // Defer registration if the registry hasn't loaded yet (script order).
            window.TransformerRegistry = { bmwBouncer: factory };
        }
    }
})();
