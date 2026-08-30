// MechSuit — the standing, unboarded mech summoned by the Wing Rocket Saver 5 ninja.
//
// The ninja summons this into the world with M; it then stands where it landed
// until the ninja walks up and boards it (2). Boarding despawns this entity and
// flips the player's transformer to 'mech' form; ejecting spawns a fresh one at
// the player's feet. Only ever one at a time — Player owns that invariant.
//
// Entity composition pattern: wraps this.sprite + this.body; does NOT inherit from
// Phaser.GameObjects.Sprite (mirrors VibeSpawn.js / Enemy.js / Collectible.js).
//
// Loaded as a global via <script> tag — no ES modules.

class MechSuit {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {object} costume — the wingRocketSaver5 registry entry (for mechColors)
   */
  constructor(scene, x, y, costume) {
    this.scene = scene;
    this.costume = costume || {};
    this.alive = true;

    // Visual parts (for cleanup + per-frame positioning)
    this._visuals = [];
    // Drives the idle bob and the wing flutter
    this._ageMs = 0;

    this._buildVisuals(x, y);
  }

  _palette() {
    const mc = this.costume.mechColors || {};
    return {
      primary: mc.primary || 0xd62828,
      secondary: mc.secondary || 0xff4500,
      accent: mc.accent || 0xffd700,
      dark: 0x111111,
    };
  }

  // -----------------------------------------------------------------------
  // Visual construction
  // -----------------------------------------------------------------------

  _buildVisuals(x, y) {
    const scene = this.scene;
    const pal = this._palette();

    // The torso doubles as the physics sprite — everything else is glued to it.
    this.sprite = scene.add.rectangle(x, y, 40, 46, pal.primary);
    this.sprite.setStrokeStyle(2, pal.dark);
    this.sprite.setDepth(48);

    scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body;
    if (this.body) {
      this.body.setCollideWorldBounds(true);
      // The drawn mech spans roughly y-40 (helmet) to y+46 (feet), which is far
      // taller than the 40x46 torso rectangle. Size the body to that silhouette
      // and offset it (from the rectangle's TOP-LEFT) so the body's bottom edge
      // lands on the drawn feet — otherwise the legs sink through the floor.
      this.body.setSize(40, 86, false);
      this.body.setOffset(0, -17);
      // A parked mech must not slide when nudged.
      if (typeof this.body.setDragX === 'function') this.body.setDragX(2000);
      if (this.scene.platforms) {
        this.scene.physics.add.collider(this.sprite, this.scene.platforms);
      }
    }

    const v = this._visuals;
    const add = (obj) => {
      v.push(obj);
      return obj;
    };

    // Head + visor
    this.head = add(scene.add.rectangle(x, y - 36, 26, 20, pal.primary));
    this.head.setStrokeStyle(2, pal.dark);
    this.head.setDepth(49);
    this.visor = add(scene.add.rectangle(x, y - 37, 20, 6, pal.accent));
    this.visor.setDepth(50);
    this.crest = add(scene.add.triangle(x, y - 52, -6, 6, 6, 6, 0, -9, pal.secondary));
    this.crest.setStrokeStyle(2, pal.dark);
    this.crest.setDepth(50);

    // Chest badge
    this.badge = add(scene.add.star(x, y - 4, 5, 3, 7, pal.accent));
    this.badge.setStrokeStyle(1, pal.dark);
    this.badge.setDepth(50);

    // WINGS — the mech's signature. Two layered triangles per side.
    this.wingL1 = add(scene.add.triangle(x - 30, y - 12, 0, -16, 22, 4, 0, 14, pal.secondary));
    this.wingL1.setStrokeStyle(2, pal.dark);
    this.wingL1.setDepth(46);
    this.wingL2 = add(scene.add.triangle(x - 26, y - 2, 0, -11, 16, 3, 0, 10, pal.accent));
    this.wingL2.setDepth(47);
    this.wingR1 = add(scene.add.triangle(x + 30, y - 12, 0, -16, -22, 4, 0, 14, pal.secondary));
    this.wingR1.setStrokeStyle(2, pal.dark);
    this.wingR1.setDepth(46);
    this.wingR2 = add(scene.add.triangle(x + 26, y - 2, 0, -11, -16, 3, 0, 10, pal.accent));
    this.wingR2.setDepth(47);

    // Arms — the right one is the dragon arm, so give it a dragon head.
    this.armL = add(scene.add.rectangle(x - 26, y - 2, 12, 26, pal.secondary));
    this.armL.setStrokeStyle(2, pal.dark);
    this.armL.setDepth(49);
    this.armR = add(scene.add.rectangle(x + 26, y - 2, 12, 26, pal.secondary));
    this.armR.setStrokeStyle(2, pal.dark);
    this.armR.setDepth(49);
    this.dragonHead = add(scene.add.triangle(x + 26, y + 16, -8, -6, 8, -6, 0, 10, pal.accent));
    this.dragonHead.setStrokeStyle(2, pal.dark);
    this.dragonHead.setDepth(50);

    // Legs
    this.legL = add(scene.add.rectangle(x - 11, y + 34, 14, 24, pal.primary));
    this.legL.setStrokeStyle(2, pal.dark);
    this.legL.setDepth(48);
    this.legR = add(scene.add.rectangle(x + 11, y + 34, 14, 24, pal.primary));
    this.legR.setStrokeStyle(2, pal.dark);
    this.legR.setDepth(48);

    // "Board me" prompt hovering above the empty cockpit
    this.prompt = add(
      scene.add
        .text(x, y - 68, '↓ PRESS 2 TO BOARD', {
          fontSize: '11px',
          fill: '#ffd700',
          stroke: '#111111',
          strokeThickness: 3,
          fontWeight: 'bold',
        })
        .setOrigin(0.5)
    );
    this.prompt.setDepth(60);

    this._syncParts();
  }

  // Glue every part to the torso sprite. Called on build and every frame.
  _syncParts() {
    if (!this.sprite) return;
    const x = this.sprite.x;
    const y = this.sprite.y;
    // Idle bob + wing flutter, both driven off _ageMs so they stay in phase.
    const bob = Math.sin(this._ageMs / 420) * 1.5;
    const flutter = Math.sin(this._ageMs / 260) * 0.18;

    if (this.head) {
      this.head.x = x;
      this.head.y = y - 36 + bob;
    }
    if (this.visor) {
      this.visor.x = x;
      this.visor.y = y - 37 + bob;
    }
    if (this.crest) {
      this.crest.x = x;
      this.crest.y = y - 52 + bob;
    }
    if (this.badge) {
      this.badge.x = x;
      this.badge.y = y - 4;
    }
    if (this.wingL1) {
      this.wingL1.x = x - 30;
      this.wingL1.y = y - 12 + bob;
      this.wingL1.setRotation(-flutter);
    }
    if (this.wingL2) {
      this.wingL2.x = x - 26;
      this.wingL2.y = y - 2 + bob;
      this.wingL2.setRotation(-flutter);
    }
    if (this.wingR1) {
      this.wingR1.x = x + 30;
      this.wingR1.y = y - 12 + bob;
      this.wingR1.setRotation(flutter);
    }
    if (this.wingR2) {
      this.wingR2.x = x + 26;
      this.wingR2.y = y - 2 + bob;
      this.wingR2.setRotation(flutter);
    }
    if (this.armL) {
      this.armL.x = x - 26;
      this.armL.y = y - 2;
    }
    if (this.armR) {
      this.armR.x = x + 26;
      this.armR.y = y - 2;
    }
    if (this.dragonHead) {
      this.dragonHead.x = x + 26;
      this.dragonHead.y = y + 16;
    }
    if (this.legL) {
      this.legL.x = x - 11;
      this.legL.y = y + 34;
    }
    if (this.legR) {
      this.legR.x = x + 11;
      this.legR.y = y + 34;
    }
    if (this.prompt) {
      this.prompt.x = x;
      this.prompt.y = y - 68 + bob * 2;
    }
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /** Per-frame tick. Keeps the parts glued to the physics torso. */
  update(delta) {
    if (!this.alive) return;
    this._ageMs += typeof delta === 'number' ? delta : 16;
    this._syncParts();
  }

  /**
   * Proximity test used to gate boarding.
   * @returns {boolean} true when (x, y) is within `radius` of the mech.
   */
  isNear(x, y, radius) {
    if (!this.alive || !this.sprite) return false;
    const r = typeof radius === 'number' ? radius : 90;
    const dx = this.sprite.x - x;
    const dy = this.sprite.y - y;
    return dx * dx + dy * dy <= r * r;
  }

  /** Position of the mech, used to place the player when boarding. */
  getPosition() {
    if (!this.sprite) return null;
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /** Destroy every GameObject this entity owns. Safe to call twice. */
  despawn() {
    this.alive = false;
    this._visuals.forEach((o) => {
      if (o && typeof o.destroy === 'function') o.destroy();
    });
    this._visuals = [];
    if (this.sprite && typeof this.sprite.destroy === 'function') {
      this.sprite.destroy();
    }
    this.sprite = null;
    this.body = null;
  }
}

// Expose as a global (matches the rest of the codebase's no-module convention).
if (typeof window !== 'undefined') {
  window.MechSuit = MechSuit;
}
