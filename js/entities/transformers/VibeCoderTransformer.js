// VibeCoder transformer — robot <-> computer form.
//
// Forms:
//   robot    — normal movement, normal taekwondo attacks.
//   computer — stationary: movement input is blocked (velocity X zeroed each
//              frame), body velocity X is forced to 0. A "Challenge accepted"
//              speech bubble appears on every robot->computer transition.
//
// Registers itself in TransformerRegistry under key 'vibeCoder'.
// Loaded as a global via <script> tag — no ES modules.
(function () {
    function buildRobotVisuals(scene, player) {
        const px = player.sprite.x;
        const py = player.sprite.y;
        const green  = 0x00ff88;
        const dark   = 0x003311;
        const accent = 0x00cc66;
        const v = {};
        // Torso
        v.chest = scene.add.rectangle(px, py, 22, 26, green);
        v.chest.setStrokeStyle(2, dark);
        v.chest.setDepth(51);
        // Circuit-board stripe details on torso
        v.stripeA = scene.add.rectangle(px - 5, py, 3, 26, dark);
        v.stripeA.setDepth(52);
        v.stripeB = scene.add.rectangle(px + 5, py, 3, 26, accent);
        v.stripeB.setDepth(52);
        // Head with visor
        v.head = scene.add.rectangle(px, py - 20, 16, 12, green);
        v.head.setStrokeStyle(2, dark);
        v.head.setDepth(52);
        v.visor = scene.add.rectangle(px, py - 20, 12, 4, dark);
        v.visor.setDepth(53);
        // Arms
        v.leftArm  = scene.add.rectangle(px - 14, py - 2, 7, 16, green);
        v.leftArm.setStrokeStyle(1, dark);
        v.leftArm.setDepth(50);
        v.rightArm = scene.add.rectangle(px + 14, py - 2, 7, 16, green);
        v.rightArm.setStrokeStyle(1, dark);
        v.rightArm.setDepth(50);
        // Legs
        v.leftLeg  = scene.add.rectangle(px - 6, py + 20, 9, 13, accent);
        v.leftLeg.setStrokeStyle(1, dark);
        v.leftLeg.setDepth(50);
        v.rightLeg = scene.add.rectangle(px + 6, py + 20, 9, 13, dark);
        v.rightLeg.setStrokeStyle(1, green);
        v.rightLeg.setDepth(50);
        if (player.sprite && player.sprite.setAlpha) player.sprite.setAlpha(0);
        return v;
    }

    function buildComputerVisuals(scene, player) {
        const px = player.sprite.x;
        const py = player.sprite.y;
        const screenColor  = 0x00ff88;
        const bezelColor   = 0x111111;
        const keyboardColor = 0x222222;
        const textGreen    = 0x00cc66;
        const v = {};
        // Monitor bezel (outer frame)
        v.bezel = scene.add.rectangle(px, py - 10, 48, 38, bezelColor);
        v.bezel.setStrokeStyle(3, screenColor);
        v.bezel.setDepth(51);
        // Screen (inner)
        v.screen = scene.add.rectangle(px, py - 10, 40, 28, 0x001a0a);
        v.screen.setDepth(52);
        // Blinking cursor / code lines on screen
        v.line1 = scene.add.rectangle(px - 14, py - 18, 18, 3, screenColor);
        v.line1.setDepth(53);
        v.line2 = scene.add.rectangle(px - 10, py - 13, 10, 3, textGreen);
        v.line2.setDepth(53);
        v.line3 = scene.add.rectangle(px - 12, py - 8, 14, 3, screenColor);
        v.line3.setDepth(53);
        v.cursor = scene.add.rectangle(px + 6, py - 8, 4, 3, screenColor);
        v.cursor.setDepth(54);
        // Monitor stand
        v.stand = scene.add.rectangle(px, py + 11, 8, 8, bezelColor);
        v.stand.setDepth(51);
        v.base  = scene.add.rectangle(px, py + 17, 22, 5, bezelColor);
        v.base.setStrokeStyle(1, screenColor);
        v.base.setDepth(51);
        // Keyboard
        v.keyboard = scene.add.rectangle(px, py + 28, 46, 12, keyboardColor);
        v.keyboard.setStrokeStyle(2, screenColor);
        v.keyboard.setDepth(51);
        // Key rows
        v.keyRow1 = scene.add.rectangle(px, py + 24, 40, 3, 0x333333);
        v.keyRow1.setDepth(52);
        v.keyRow2 = scene.add.rectangle(px, py + 30, 40, 3, 0x333333);
        v.keyRow2.setDepth(52);
        if (player.sprite && player.sprite.setAlpha) player.sprite.setAlpha(0);
        return v;
    }

    function positionRobot(parts, player) {
        const px = player.sprite.x;
        const py = player.sprite.y;
        if (parts.chest)    { parts.chest.x = px;      parts.chest.y = py; }
        if (parts.stripeA)  { parts.stripeA.x = px - 5;  parts.stripeA.y = py; }
        if (parts.stripeB)  { parts.stripeB.x = px + 5;  parts.stripeB.y = py; }
        if (parts.head)     { parts.head.x = px;       parts.head.y = py - 20; }
        if (parts.visor)    { parts.visor.x = px;      parts.visor.y = py - 20; }
        if (parts.leftArm)  { parts.leftArm.x = px - 14;  parts.leftArm.y = py - 2; }
        if (parts.rightArm) { parts.rightArm.x = px + 14; parts.rightArm.y = py - 2; }
        if (parts.leftLeg)  { parts.leftLeg.x = px - 6;   parts.leftLeg.y = py + 20; }
        if (parts.rightLeg) { parts.rightLeg.x = px + 6;  parts.rightLeg.y = py + 20; }
    }

    function positionComputer(parts, player) {
        const px = player.sprite.x;
        const py = player.sprite.y;
        if (parts.bezel)    { parts.bezel.x = px;     parts.bezel.y = py - 10; }
        if (parts.screen)   { parts.screen.x = px;    parts.screen.y = py - 10; }
        if (parts.line1)    { parts.line1.x = px - 14; parts.line1.y = py - 18; }
        if (parts.line2)    { parts.line2.x = px - 10; parts.line2.y = py - 13; }
        if (parts.line3)    { parts.line3.x = px - 12; parts.line3.y = py - 8; }
        if (parts.cursor)   { parts.cursor.x = px + 6;  parts.cursor.y = py - 8; }
        if (parts.stand)    { parts.stand.x = px;     parts.stand.y = py + 11; }
        if (parts.base)     { parts.base.x = px;      parts.base.y = py + 17; }
        if (parts.keyboard) { parts.keyboard.x = px;  parts.keyboard.y = py + 28; }
        if (parts.keyRow1)  { parts.keyRow1.x = px;   parts.keyRow1.y = py + 24; }
        if (parts.keyRow2)  { parts.keyRow2.x = px;   parts.keyRow2.y = py + 30; }
    }

    function showChallengeAcceptedBubble(scene, player) {
        const x = player.sprite.x;
        const y = player.sprite.y - 50;
        const bubble = scene.add.text(x, y, 'Challenge accepted', {
            fontSize: '14px',
            fill: '#00ff88',
            backgroundColor: '#001a0a',
            padding: { left: 6, right: 6, top: 3, bottom: 3 },
            stroke: '#003311',
            strokeThickness: 2,
            fontWeight: 'bold'
        }).setOrigin(0.5).setDepth(120);
        // Tween alpha to 0 within 1500ms
        scene.tweens.add({
            targets: bubble,
            alpha: 0,
            duration: 1500,
            onComplete: () => { try { bubble.destroy(); } catch (e) { /* noop */ } }
        });
    }

    function transformEffect(scene, player, toComputer) {
        const x = player.sprite.x;
        const y = player.sprite.y;
        const colors = [0x00ff88, 0x00cc66, 0x003311];
        for (let i = 0; i < 3; i++) {
            const ring = scene.add.circle(x, y, 16 + i * 4, colors[i], 0);
            ring.setStrokeStyle(2, colors[i]);
            ring.setDepth(100);
            scene.tweens.add({
                targets: ring,
                scaleX: 2.5, scaleY: 2.5, alpha: 0,
                duration: 450,
                delay: i * 50,
                onComplete: () => { try { ring.destroy(); } catch (e) { /* noop */ } }
            });
        }
        const label = scene.add.text(x, y - 50,
            toComputer ? '💻 COMPUTER MODE!' : '🤖 ROBOT MODE!',
            { fontSize: '16px', fill: '#00ff88', stroke: '#003311', strokeThickness: 3, fontWeight: 'bold' }
        ).setOrigin(0.5).setDepth(102);
        scene.tweens.add({
            targets: label,
            y: y - 80, alpha: 0,
            duration: 900,
            onComplete: () => { try { label.destroy(); } catch (e) { /* noop */ } }
        });
    }

    /**
     * Build a spiral graphic above an enemy to show it is charmed.
     * Returns the Graphics object so the caller can store and destroy it.
     */
    function buildCharmSpiral(scene, enemy) {
        const g = scene.add.graphics();
        g.setDepth(200);
        // Draw a simple 3-loop spiral polyline in magenta.
        g.lineStyle(2, 0xff00ff, 0.9);
        g.beginPath();
        const steps = 48;
        const maxR = 10;
        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * Math.PI * 6; // 3 full loops
            const r = (i / steps) * maxR;
            const x = Math.cos(t) * r;
            const y = Math.sin(t) * r;
            if (i === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
        }
        g.strokePath();
        // Spin it continuously
        scene.tweens.add({
            targets: g,
            angle: 360,
            repeat: -1,
            duration: 800,
            ease: 'Linear'
        });
        return g;
    }

    /**
     * Trigger the charm ability: charm all enemies within 250px of the player.
     * Attaches a spiral graphic to each charmed enemy.
     * Called from Player.handleVibeCoderCharm() via transformer.triggerCharm().
     */
    function triggerCharm(transformer, player) {
        const scene = player.scene;
        if (!scene || !scene.enemies) return;

        const now = scene.time ? scene.time.now : Date.now();
        const CHARM_RADIUS = 250;
        const CHARM_DURATION = 8000;

        scene.enemies.children.entries.forEach(enemySprite => {
            if (!enemySprite || !enemySprite.active) return;
            const enemy = (typeof enemySprite.getData === 'function')
                ? enemySprite.getData('enemy')
                : null;
            if (!enemy || enemy.health <= 0) return;

            const dist = Phaser.Math.Distance.Between(
                player.sprite.x, player.sprite.y,
                enemySprite.x, enemySprite.y
            );

            if (dist <= CHARM_RADIUS) {
                // Save prior state before overwriting (for expiry restoration).
                if (!enemy.charmed) {
                    enemy._preCharmState = enemy.state || 'patrol';
                }
                enemy.charmed = true;
                enemy.charmExpiresAt = now + CHARM_DURATION;

                // Destroy old spiral if re-charmed.
                if (enemy._charmSpiral && typeof enemy._charmSpiral.destroy === 'function') {
                    try { enemy._charmSpiral.destroy(); } catch (e) { /* noop */ }
                }
                enemy._charmSpiral = buildCharmSpiral(scene, enemy);
            }
        });

        transformer.charmCooldownMs = 4000;
    }

    const vibeCoderConfig = {
        key: 'vibeCoder',
        cooldownMs: 1000,
        forms: { primary: 'robot', secondary: 'computer' },
        stationaryInForm: 'computer',

        buildVisuals(form, facingRight, player, transformer) {
            const scene = player.scene;
            const parts = (form === 'computer')
                ? buildComputerVisuals(scene, player)
                : buildRobotVisuals(scene, player);
            transformer._parts = parts;
            return Object.values(parts);
        },

        onUpdate(form, player, transformer) {
            const parts = transformer._parts;
            if (!parts) return;
            if (form === 'computer') {
                // Block horizontal movement: zero velocity X each frame.
                if (player.body) {
                    player.body.setVelocityX(0);
                }
                positionComputer(parts, player);
            } else {
                positionRobot(parts, player);
            }
        },

        onDestroy(player) {
            if (player && player.sprite && player.sprite.setAlpha) {
                player.sprite.setAlpha(1);
            }
        },

        onToggle(newForm, previousForm, player, transformer) {
            const costume = (typeof player.getDragonCostume === 'function')
                ? player.getDragonCostume()
                : null;
            if (newForm === 'computer') {
                player.speed = (costume && costume.computerSpeed) || 0;
                player.jumpPower = (costume && typeof costume.computerJump === 'number' ? costume.computerJump : 0);
                player.damageMultiplier = (costume && costume.computerDamage) || 0.5;
                // Show "Challenge accepted" speech bubble on every robot->computer transition.
                showChallengeAcceptedBubble(player.scene, player);
            } else {
                player.speed = (costume && costume.robotSpeed) || 200;
                player.jumpPower = (costume && costume.robotJump) || 420;
                player.damageMultiplier = (costume && costume.robotDamage) || 1.0;
                // Clean up all ally spawns when leaving computer form.
                if (typeof player.cleanupVibeSpawns === 'function') {
                    player.cleanupVibeSpawns();
                }
            }
            transformEffect(player.scene, player, newForm === 'computer');
            if (player.scene && player.scene.cameras && player.scene.cameras.main) {
                player.scene.cameras.main.shake(200, 0.015);
            }
        }
    };

    function factory(player) {
        const Ctor = (typeof window !== 'undefined' && window.Transformer)
            || (typeof Transformer !== 'undefined' ? Transformer : null);
        if (!Ctor) {
            console.error('VibeCoderTransformer: Transformer base class is not loaded');
            return null;
        }
        const t = new Ctor(player, vibeCoderConfig);

        // Charm-ability state (R4.1)
        t.charmCooldownMs = 0;

        // Override update to also decrement charmCooldownMs.
        const _baseUpdate = t.update.bind(t);
        t.update = function(delta) {
            _baseUpdate(delta);
            if (this.charmCooldownMs > 0) {
                this.charmCooldownMs -= delta;
                if (this.charmCooldownMs < 0) this.charmCooldownMs = 0;
            }
        };

        // Expose the charm trigger so Player.handleVibeCoderCharm() can call it.
        t.triggerCharm = function() {
            triggerCharm(this, player);
        };

        return t;
    }

    if (typeof window !== 'undefined') {
        window.VibeCoderTransformerConfig = vibeCoderConfig;
        window.VibeCoderTransformerFactory = factory;
        if (window.TransformerRegistry) {
            window.TransformerRegistry.vibeCoder = factory;
        } else {
            // Defer registration until the registry is ready (script order).
            window.TransformerRegistry = { vibeCoder: factory };
        }
    }
})();
