// VibeSpawn — ally entities spawned by the VibeCoder costume while in computer form.
//
// Types:
//   chicken   — small white rect with yellow beak; waddles toward nearest enemy, damages on contact.
//   duck      — small yellow rect with orange beak; same AI as chicken.
//   dog       — small brown rect; same AI as chicken/duck.
//   doghouse  — stationary red/brown structure; emits a dog every 3000ms, despawns after 12000ms.
//
// Entity composition pattern: wraps this.sprite + this.body; does NOT inherit from
// Phaser.GameObjects.Sprite (mirrors Enemy.js / Collectible.js).
//
// Loaded as a global via <script> tag — no ES modules.

class VibeSpawn {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x
     * @param {number} y
     * @param {'chicken'|'duck'|'dog'|'doghouse'} type
     */
    constructor(scene, x, y, type) {
        this.scene = scene;
        this.type = type;
        this.alive = true;

        // Movement speed for waddling types (px/s)
        this.waddleSpeed = 60;

        // Damage dealt on contact with an enemy
        this.contactDamage = 5;

        // Visual parts (for cleanup)
        this._visuals = [];

        // Build sprite + physics body based on type
        this._buildSprite(x, y);

        // Doghouse lifecycle state
        this._dogEmitTimer = 0;
        this._dogEmitIntervalMs = 3000;
        this._lifetimeMs = (type === 'doghouse') ? 12000 : null; // null = lives until despawned
        this._ageMs = 0;

        // Overlap check accumulator (only check periodically to avoid per-frame overhead)
        this._overlapCheckTimer = 0;
        this._overlapIntervalMs = 100; // check every 100ms
    }

    // -----------------------------------------------------------------------
    // Visual construction
    // -----------------------------------------------------------------------

    _buildSprite(x, y) {
        switch (this.type) {
            case 'chicken':  this._buildChicken(x, y);  break;
            case 'duck':     this._buildDuck(x, y);     break;
            case 'dog':      this._buildDog(x, y);      break;
            case 'doghouse': this._buildDoghouse(x, y); break;
            default:
                // Fallback generic
                this.sprite = this.scene.add.rectangle(x, y, 14, 14, 0xffffff);
        }

        // Add physics to the primary sprite if not already done
        if (this.sprite && !this.sprite.body) {
            this.scene.physics.add.existing(this.sprite);
        }
        if (this.sprite && this.sprite.body) {
            this.body = this.sprite.body;
            this.body.setCollideWorldBounds(true);
            // Spawns don't jump or fall — they slide along the ground.
            // Allow gravity so they land on platforms.
            this.body.setSize(this.sprite.width, this.sprite.height);
        }
    }

    _buildChicken(x, y) {
        // Body: small white rect (14x12)
        this.sprite = this.scene.add.rectangle(x, y, 14, 12, 0xffffff);
        this.sprite.setStrokeStyle(1, 0xdddddd);
        this.sprite.setDepth(60);

        // Beak: small yellow rect offset to the right
        const beak = this.scene.add.rectangle(x + 8, y, 5, 4, 0xffdd00);
        beak.setDepth(61);
        this._visuals.push(beak);

        // Eye: tiny black dot
        const eye = this.scene.add.circle(x + 4, y - 3, 2, 0x111111);
        eye.setDepth(62);
        this._visuals.push(eye);

        this._beak = beak;
        this._eye  = eye;
    }

    _buildDuck(x, y) {
        // Body: small yellow rect (16x11)
        this.sprite = this.scene.add.rectangle(x, y, 16, 11, 0xffee55);
        this.sprite.setStrokeStyle(1, 0xddaa00);
        this.sprite.setDepth(60);

        // Beak: small orange rect
        const beak = this.scene.add.rectangle(x + 9, y, 5, 4, 0xff8800);
        beak.setDepth(61);
        this._visuals.push(beak);

        // Eye: tiny black dot
        const eye = this.scene.add.circle(x + 5, y - 2, 2, 0x111111);
        eye.setDepth(62);
        this._visuals.push(eye);

        this._beak = beak;
        this._eye  = eye;
    }

    _buildDog(x, y) {
        // Body: small brown rect (16x12)
        this.sprite = this.scene.add.rectangle(x, y, 16, 12, 0x8b5c2a);
        this.sprite.setStrokeStyle(1, 0x5c3b1a);
        this.sprite.setDepth(60);

        // Ears: two small darker rects at top
        const earL = this.scene.add.rectangle(x - 5, y - 8, 5, 7, 0x6b4010);
        earL.setDepth(59);
        this._visuals.push(earL);
        const earR = this.scene.add.rectangle(x + 5, y - 8, 5, 7, 0x6b4010);
        earR.setDepth(59);
        this._visuals.push(earR);

        // Eye: tiny dot
        const eye = this.scene.add.circle(x + 4, y - 2, 2, 0x111111);
        eye.setDepth(61);
        this._visuals.push(eye);

        this._earL = earL;
        this._earR = earR;
        this._eye  = eye;
    }

    _buildDoghouse(x, y) {
        // House body: brown rect (40x30)
        this.sprite = this.scene.add.rectangle(x, y + 5, 40, 30, 0x8b5c2a);
        this.sprite.setStrokeStyle(2, 0x5c3b1a);
        this.sprite.setDepth(60);

        // Roof: red triangle drawn via graphics (triangle shape: scene.add.triangle)
        // Phaser triangle: x,y is the base-center; args are 6 vertex coordinates
        // We position it above the house body.
        const roofX = x;
        const roofY = y - 12; // above the body
        // scene.add.triangle(x, y, x1,y1, x2,y2, x3,y3, fillColor)
        // Tip: (0,-14), Bottom-left: (-22,0), Bottom-right: (22,0)
        const roof = this.scene.add.triangle(
            roofX, roofY,
            0, -14,    // tip
            -22, 0,    // bottom left
            22, 0,     // bottom right
            0xcc2222
        );
        roof.setDepth(61);
        this._visuals.push(roof);
        this._roof = roof;

        // Door: small dark rect centered on house front
        const door = this.scene.add.rectangle(x, y + 12, 12, 16, 0x222222);
        door.setDepth(62);
        this._visuals.push(door);
        this._door = door;

        // Doghouses are stationary — no gravity, no movement needed.
        // We still add physics so we can detect overlaps (optional; we do manual dist checks).
        // Override: make body static after physics is added.
        this._isStationary = true;
    }

    // -----------------------------------------------------------------------
    // Position helpers for satellite visuals
    // -----------------------------------------------------------------------

    _updateSatellitePositions() {
        if (!this.sprite || !this.alive) return;
        const x = this.sprite.x;
        const y = this.sprite.y;

        switch (this.type) {
            case 'chicken':
            case 'duck':
                if (this._beak) { this._beak.x = x + 8; this._beak.y = y; }
                if (this._eye)  { this._eye.x  = x + 4; this._eye.y  = y - 3; }
                break;
            case 'dog':
                if (this._earL) { this._earL.x = x - 5; this._earL.y = y - 8; }
                if (this._earR) { this._earR.x = x + 5; this._earR.y = y - 8; }
                if (this._eye)  { this._eye.x  = x + 4; this._eye.y  = y - 2; }
                break;
            case 'doghouse':
                if (this._roof) { this._roof.x = x; this._roof.y = y - 12; }
                if (this._door) { this._door.x = x; this._door.y = y + 12; }
                break;
        }
    }

    // -----------------------------------------------------------------------
    // Per-frame update
    // -----------------------------------------------------------------------

    /**
     * Called from Player.update() each frame.
     * @param {number} delta - frame delta in ms
     */
    update(delta) {
        if (!this.alive) return;

        this._ageMs += delta;

        // Doghouse logic
        if (this.type === 'doghouse') {
            this._updateDoghouse(delta);
        } else {
            // Waddling ally logic
            this._updateWaddler(delta);
        }

        // Keep satellite visuals in sync with sprite position
        this._updateSatellitePositions();
    }

    _updateWaddler(delta) {
        // Find nearest alive enemy
        const enemy = this._findNearestEnemy();

        if (enemy) {
            const dx = enemy.sprite.x - this.sprite.x;
            const dir = dx >= 0 ? 1 : -1;

            if (this.body) {
                this.body.setVelocityX(dir * this.waddleSpeed);
            }

            // Contact check — every overlapIntervalMs for perf
            this._overlapCheckTimer += delta;
            if (this._overlapCheckTimer >= this._overlapIntervalMs) {
                this._overlapCheckTimer = 0;
                const dist = Math.abs(dx);
                const dy   = Math.abs(enemy.sprite.y - this.sprite.y);
                // Contact if within combined half-widths + some tolerance
                const contactThreshold = (this.sprite.width / 2) + 28;
                if (dist < contactThreshold && dy < 32) {
                    this._contactWithEnemy(enemy);
                }
            }
        } else {
            // No enemy found — stand still
            if (this.body) {
                this.body.setVelocityX(0);
            }
        }
    }

    _updateDoghouse(delta) {
        // Stationary — make sure it stays put
        if (this.body) {
            this.body.setVelocityX(0);
            this.body.setVelocityY(0);
            this.body.setAllowGravity(false);
        }

        // Periodic dog emission
        this._dogEmitTimer += delta;
        if (this._dogEmitTimer >= this._dogEmitIntervalMs) {
            this._dogEmitTimer = 0;
            this._emitDog();
        }

        // Lifetime check
        if (this._ageMs >= this._lifetimeMs) {
            this.despawn();
        }
    }

    _emitDog() {
        // Emit a dog via the player's spawnVibeAlly helper so the cap is respected.
        const scene = this.scene;
        const player = scene && scene.player;
        if (!player || typeof player.spawnVibeAlly !== 'function') return;
        player.spawnVibeAlly('dog', this.sprite.x, this.sprite.y);
    }

    // -----------------------------------------------------------------------
    // Enemy interaction
    // -----------------------------------------------------------------------

    _findNearestEnemy() {
        const scene = this.scene;
        if (!scene || !scene.enemies) return null;

        let nearest = null;
        let nearestDist = Infinity;

        scene.enemies.children.entries.forEach(enemySprite => {
            const enemy = enemySprite.getData('enemy');
            // Skip dead enemies and charmed enemies (they're on our side)
            if (!enemy || enemy.health <= 0 || enemy.charmed) return;
            const dx = enemySprite.x - this.sprite.x;
            const dy = enemySprite.y - this.sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        });

        return nearest;
    }

    _contactWithEnemy(enemy) {
        if (!this.alive) return;
        // Deal damage
        if (typeof enemy.takeDamage === 'function') {
            enemy.takeDamage(this.contactDamage);
        }
        // Self-despawn after landing the hit
        this.despawn();
    }

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    despawn() {
        if (!this.alive) return;
        this.alive = false;
        this._destroyVisuals();
    }

    _destroyVisuals() {
        // Destroy satellite visuals
        this._visuals.forEach(v => {
            if (v && typeof v.destroy === 'function') {
                try { v.destroy(); } catch (e) { /* noop */ }
            }
        });
        this._visuals = [];

        // Destroy primary sprite
        if (this.sprite && typeof this.sprite.destroy === 'function') {
            try { this.sprite.destroy(); } catch (e) { /* noop */ }
        }
        this.sprite = null;
        this.body   = null;
    }
}

// Expose global (matches the rest of the codebase's no-module convention).
if (typeof window !== 'undefined') {
    window.VibeSpawn = VibeSpawn;
}
