// Collectible items: robot parts, coins, and power-ups
class Collectible {
    constructor(scene, x, y, type, rarity = 'common') {
        this.scene = scene;
        this.type = type; // 'robotPart', 'coin', 'powerUp'
        this.rarity = rarity;
        this.collected = false;
        
        // For robot parts, store the specific part type (head, body, arms, legs, powerCore)
        this.partType = null;
        if (type === 'robotPart' && typeof rarity === 'string') {
            // Check if rarity is actually a part type
            const partTypes = ['head', 'body', 'arms', 'legs', 'powerCore'];
            if (partTypes.includes(rarity)) {
                this.partType = rarity;
                this.rarity = 'common'; // Default rarity if not specified
            }
        }
        
        // Create sprite based on type
        this.sprite = this.createSprite(x, y);
        
        // Store collectible data BEFORE adding physics
        this.sprite.setData('collectible', this);
        
        // Let the scene handle physics - DON'T create physics body manually
        
        // Animation properties
        this.floatOffset = Math.random() * Math.PI * 2;
        this.rotationSpeed = 0.02;
        this.pulseSpeed = 0.005;
        
        // Re-enable animations but ONLY safe ones (no position changes)
        this.startAnimations();
        
        console.log(`Collectible created: ${type} (${rarity}) at`, x, y);
    }

    createSprite(x, y) {
        let sprite;
        
        switch (this.type) {
            case 'robotPart':
                sprite = this.createRobotPartSprite(x, y);
                break;
            case 'coin':
                sprite = this.createCoinSprite(x, y);
                break;
            case 'powerUp':
                sprite = this.createPowerUpSprite(x, y);
                break;
            default:
                sprite = this.scene.add.circle(x, y, 8, 0xffffff);
        }
        
        return sprite;
    }

    createRobotPartSprite(x, y) {
        const colors = {
            'common': 0x888888,
            'rare': 0x4169e1,
            'epic': 0x9932cc
        };
        
        // Create star shape for robot parts
        const sprite = this.scene.add.star(
            x, y, 
            5,           // points
            8,           // inner radius
            16,          // outer radius
            colors[this.rarity] || colors.common
        );
        
        // Add glow effect for rare items
        if (this.rarity === 'rare') {
            sprite.setStrokeStyle(2, 0x6495ed, 0.8);
        } else if (this.rarity === 'epic') {
            sprite.setStrokeStyle(3, 0xba55d3, 1.0);
        }
        
        return sprite;
    }

    createCoinSprite(x, y) {
        // Create coin as golden circle with inner detail
        const sprite = this.scene.add.circle(x, y, 10, 0xffd700);
        sprite.setStrokeStyle(2, 0xffff00, 0.9);
        
        // Add inner circle for detail
        const innerCircle = this.scene.add.circle(x, y, 6, 0xffa500, 0.8);
        
        // Group them together
        const container = this.scene.add.container(x, y, [sprite, innerCircle]);
        
        return container;
    }

    createPowerUpSprite(x, y) {
        const powerUpColors = {
            'fireBreath': 0xff4500,
            'ultraBlast': 0x00ffff,
            'flyMode': 0x98fb98,
            'invincibility': 0xffd700,
            'speedBoost': 0xff69b4
        };
        
        const color = powerUpColors[this.rarity] || powerUpColors.fireBreath;
        
        // Create diamond shape for power-ups
        const sprite = this.scene.add.polygon(
            x, y,
            [
                [0, -12],
                [12, 0],
                [0, 12],
                [-12, 0]
            ],
            color
        );
        
        sprite.setStrokeStyle(2, 0xffffff, 0.8);
        
        return sprite;
    }

    startAnimations() {
        // REMOVED: Floating animation (conflicts with physics position control)
        // this.scene.tweens.add({
        //     targets: this.sprite,
        //     y: this.sprite.y - 15,
        //     duration: 2000 + Math.random() * 1000,
        //     yoyo: true,
        //     repeat: -1,
        //     ease: 'Sine.easeInOut'
        // });
        
        // Rotation animation (safe - doesn't affect physics)
        this.scene.tweens.add({
            targets: this.sprite,
            rotation: Math.PI * 2,
            duration: 4000 + Math.random() * 2000,
            repeat: -1,
            ease: 'Linear'
        });
        
        // Pulse animation for special items (safe - doesn't affect physics)
        if (this.rarity === 'epic' || this.type === 'powerUp') {
            this.scene.tweens.add({
                targets: this.sprite,
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        // Sparkle effect for rare items
        if (this.rarity === 'rare' || this.rarity === 'epic') {
            this.createSparkleEffect();
        }
    }

    createSparkleEffect() {
        // Create periodic sparkles around the item
        this.sparkleTimer = this.scene.time.addEvent({
            delay: 800 + Math.random() * 400,
            callback: () => {
                if (!this.collected) {
                    this.createSparkle();
                }
            },
            repeat: -1
        });
    }

    createSparkle() {
        const sparkleCount = this.rarity === 'epic' ? 3 : 1;
        
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (i / sparkleCount) * Math.PI * 2 + Math.random() * 0.5;
            const distance = 20 + Math.random() * 10;
            
            const sparkleX = this.sprite.x + Math.cos(angle) * distance;
            const sparkleY = this.sprite.y + Math.sin(angle) * distance;
            
            const sparkle = this.scene.add.circle(sparkleX, sparkleY, 2, 0xffffff, 0.9);
            
            this.scene.tweens.add({
                targets: sparkle,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 600,
                onComplete: () => sparkle.destroy()
            });
        }
    }

    collect(player) {
        if (this.collected) return;
        
        this.collected = true;
        
        // Handle collection based on type
        switch (this.type) {
            case 'robotPart':
                this.collectRobotPart();
                break;
            case 'coin':
                this.collectCoin();
                break;
            case 'powerUp':
                this.collectPowerUp(player);
                break;
        }
        
        // Create collection effect
        this.createCollectionEffect();
        
        // Play collection sound (if audio is enabled)
        this.playCollectionSound();
        
        // Remove from scene
        this.destroy();
    }

    collectRobotPart() {
        // Use stored part type or determine randomly if not specified
        let partType = this.partType;
        if (!partType) {
            const partTypes = ['head', 'body', 'arms', 'legs', 'powerCore'];
            partType = partTypes[Math.floor(Math.random() * partTypes.length)];
        }
        
        // Add to game data with inventory animation
        window.gameInstance.addRobotPart(partType, this.rarity);
        
        // Increment the GameScene counter
        if (this.scene && this.scene.robotPartsCollected !== undefined) {
            this.scene.robotPartsCollected++;
            console.log(`Robot parts collected: ${this.scene.robotPartsCollected}/${this.scene.totalRobotParts}`);
            
            // Update progress (no longer auto-completes level)
            this.scene.checkLevelComplete();
        }
        
        // Create special "stowing" animation for robot parts
        this.createInventoryStowAnimation();
        
        console.log(`Collected ${this.rarity} ${partType} part!`);
    }

    collectCoin() {
        // Award coins and score
        const coinValue = 10;
        window.gameInstance.addScore(coinValue);
        
        // Increment the GameScene counter
        if (this.scene && this.scene.coinsCollected !== undefined) {
            this.scene.coinsCollected++;
            console.log(`Coins collected: ${this.scene.coinsCollected}/${this.scene.totalCoins}`);
        }
        
        console.log(`Collected coin! +${coinValue} points`);
    }

    collectPowerUp(player) {
        // Activate power-up based on rarity (which stores the power-up type)
        const powerUpType = this.rarity;
        const duration = 10000; // 10 seconds
        
        switch (powerUpType) {
            case 'fireBreath':
                player.activatePowerUp('fireBreath', duration);
                break;
            case 'ultraBlast':
                player.activatePowerUp('ultraBlast', duration);
                break;
            case 'flyMode':
                player.activatePowerUp('flyMode', duration);
                break;
            case 'invincibility':
                player.activatePowerUp('invincibility', duration);
                break;
            case 'speedBoost':
                player.activatePowerUp('speedBoost', duration);
                break;
        }
        
        // Award score for collecting power-up
        window.gameInstance.addScore(25);
        
        console.log(`Power-up activated: ${powerUpType}`);
    }

    createCollectionEffect() {
        const effectColors = {
            'robotPart': this.rarity === 'epic' ? 0x9932cc : (this.rarity === 'rare' ? 0x4169e1 : 0x888888),
            'coin': 0xffd700,
            'powerUp': 0x00ffff
        };
        
        const color = effectColors[this.type] || 0xffffff;
        
        // Expanding circle effect
        const effect = this.scene.add.circle(this.sprite.x, this.sprite.y, 10, color, 0.8);
        
        this.scene.tweens.add({
            targets: effect,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => effect.destroy()
        });
        
        // Particle burst effect
        this.createParticleBurst(color);
        
        // Collection text popup
        this.createCollectionText();
    }

    createParticleBurst(color) {
        const particleCount = this.type === 'powerUp' ? 8 : 4;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 50 + Math.random() * 30;
            
            const particle = this.scene.add.circle(this.sprite.x, this.sprite.y, 3, color, 0.9);
            
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * speed,
                y: particle.y + Math.sin(angle) * speed - 20,
                alpha: 0,
                duration: 600 + Math.random() * 200,
                ease: 'Cubic.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }

    createCollectionText() {
        let text = '+Points!';
        let color = '#ffffff';
        
        if (this.type === 'robotPart') {
            text = `${this.rarity.toUpperCase()} PART!`;
            color = this.rarity === 'epic' ? '#9932cc' : (this.rarity === 'rare' ? '#4169e1' : '#888888');
        } else if (this.type === 'coin') {
            text = '+10!';
            color = '#ffd700';
        } else if (this.type === 'powerUp') {
            text = `${this.rarity.toUpperCase()}!`;
            color = '#00ffff';
        }
        
        const textObj = this.scene.add.text(this.sprite.x, this.sprite.y - 30, text, {
            fontSize: '16px',
            fill: color,
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: textObj,
            y: textObj.y - 40,
            alpha: 0,
            duration: 1000,
            ease: 'Cubic.easeOut',
            onComplete: () => textObj.destroy()
        });
    }

    playCollectionSound() {
        // Placeholder for sound effects
        if (window.gameInstance.gameData.settings.soundEnabled) {
            // Different sounds for different types could be implemented here
            console.log(`Playing ${this.type} collection sound`);
        }
    }

    update(time, delta) {
        if (this.collected) return;
        
        // Additional update logic if needed
        // For example, magnetic attraction to player when close
        this.checkPlayerProximity();
    }

    checkPlayerProximity() {
        const player = this.scene.player;
        if (!player) return;
        
        const distance = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );
        
        // Magnetic effect when player is very close
        if (distance < 40 && !this.collected) {
            const attraction = 0.05;
            const dx = player.sprite.x - this.sprite.x;
            const dy = player.sprite.y - this.sprite.y;
            
            this.sprite.x += dx * attraction;
            this.sprite.y += dy * attraction;
        }
    }

    createInventoryStowAnimation() {
        // Create a visual representation of the part being "stowed" in inventory
        const stowSprite = this.scene.add.star(
            this.sprite.x, 
            this.sprite.y, 
            5, 
            8, 
            16, 
            this.rarity === 'epic' ? 0x9932cc : (this.rarity === 'rare' ? 0x4169e1 : 0x888888)
        );
        stowSprite.setDepth(100);
        
        // Get player position for targeting
        const player = this.scene.player;
        const targetX = player ? player.sprite.x : this.sprite.x;
        const targetY = player ? player.sprite.y - 40 : this.sprite.y - 40; // Above player head
        
        // Animated "sucking into inventory" effect
        this.scene.tweens.add({
            targets: stowSprite,
            x: targetX,
            y: targetY,
            scaleX: 0.3,
            scaleY: 0.3,
            alpha: 0.8,
            duration: 600,
            ease: 'Cubic.easeIn',
            onComplete: () => {
                // Final flash effect at player location
                const flash = this.scene.add.circle(targetX, targetY, 15, 0xffffff, 0.8);
                flash.setDepth(100);
                
                this.scene.tweens.add({
                    targets: flash,
                    scaleX: 2,
                    scaleY: 2,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => {
                        flash.destroy();
                        stowSprite.destroy();
                    }
                });
            }
        });
        
        // Add text showing what was collected
        const partText = this.partType ? this.partType.toUpperCase() : 'PART';
        const collectionText = this.scene.add.text(
            this.sprite.x, 
            this.sprite.y - 30, 
            `${partText} COLLECTED!`, 
            {
                fontSize: '16px',
                fill: '#ffff00',
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5).setDepth(100);
        
        this.scene.tweens.add({
            targets: collectionText,
            y: collectionText.y - 40,
            alpha: 0,
            duration: 1500,
            ease: 'Cubic.easeOut',
            onComplete: () => collectionText.destroy()
        });
    }

    destroy() {
        // Clean up timers
        if (this.sparkleTimer) {
            this.sparkleTimer.destroy();
        }
        
        // Destroy sprite
        if (this.sprite) {
            this.sprite.destroy();
        }
    }

    // Static methods for creating specific collectibles
    static createRobotPart(scene, x, y, rarity = 'common') {
        return new Collectible(scene, x, y, 'robotPart', rarity);
    }

    static createCoin(scene, x, y) {
        return new Collectible(scene, x, y, 'coin');
    }

    static createPowerUp(scene, x, y, powerType = 'fireBreath') {
        return new Collectible(scene, x, y, 'powerUp', powerType);
    }
}

// Export for global use
window.Collectible = Collectible;
