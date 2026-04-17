// Food projectile - thrown by Monkey Titans in Banana Mode
// Causes player to slip and fall on contact, can be kicked/punched away
// Supports multiple food types: banana, pancake, cherry, waffle, apple

// Food type definitions
const FOOD_TYPES = {
    banana: {
        name: 'Banana',
        emoji: '🍌',
        primaryColor: 0xFFE135,
        secondaryColor: 0xD4A017,
        tipColor: 0x8B4513,
        slipDuration: 800,
        slipVelocity: 300,
        points: 15
    },
    pancake: {
        name: 'Pancake',
        emoji: '🥞',
        primaryColor: 0xDEB887,
        secondaryColor: 0xCD853F,
        tipColor: 0xFFD700, // Butter color
        slipDuration: 1000, // Stickier - longer slip
        slipVelocity: 200,  // Slower slide
        points: 20
    },
    cherry: {
        name: 'Cherry',
        emoji: '🍒',
        primaryColor: 0xDC143C,
        secondaryColor: 0x8B0000,
        tipColor: 0x228B22, // Stem color
        slipDuration: 600,  // Quick slip
        slipVelocity: 400,  // Fast bounce
        points: 25
    },
    waffle: {
        name: 'Waffle',
        emoji: '🧇',
        primaryColor: 0xDAA520,
        secondaryColor: 0xB8860B,
        tipColor: 0xFFFFE0, // Cream color
        slipDuration: 900,
        slipVelocity: 250,
        points: 20
    },
    apple: {
        name: 'Apple',
        emoji: '🍎',
        primaryColor: 0xFF0000,
        secondaryColor: 0x8B0000,
        tipColor: 0x228B22, // Leaf color
        slipDuration: 700,
        slipVelocity: 350,
        points: 20
    }
};

class Banana {
    constructor(scene, x, y, velocityX = 0, velocityY = 200, foodType = 'banana') {
        this.scene = scene;
        this.destroyed = false;
        this.foodType = foodType;
        this.foodConfig = FOOD_TYPES[foodType] || FOOD_TYPES.banana;
        
        // Create food sprite based on type
        this.sprite = this.createFoodSprite(x, y);
        
        // Add physics
        scene.physics.add.existing(this.sprite);
        this.body = this.sprite.body;
        
        // Set initial velocity
        this.body.setVelocity(velocityX, velocityY);
        this.body.setBounce(0.6, 0.4);
        this.body.setAngularVelocity(200 + Math.random() * 200); // Spin while flying
        this.body.setDrag(20, 0);
        this.body.setMaxVelocity(500, 600);
        
        // Collision settings
        this.body.setSize(20, 12);
        
        // Store reference to this object on sprite for collision handling
        this.sprite.setData('banana', this);
        this.sprite.setData('isBanana', true);
        
        // Food properties (from config)
        this.slipDuration = this.foodConfig.slipDuration;
        this.slipVelocity = this.foodConfig.slipVelocity;
        this.deflectPoints = this.foodConfig.points;
        this.isDeflected = false; // Track if already hit by player
        this.lifespan = 10000; // Auto-destroy after 10 seconds
        this.spawnTime = Date.now();
        
        // Visual effects
        this.createTrailEffect();
        
        console.log('🍌 Banana spawned at:', x, y);
    }

    createFoodSprite(x, y) {
        const container = this.scene.add.container(x, y);
        
        switch (this.foodType) {
            case 'pancake':
                this.createPancakeVisual(container);
                break;
            case 'cherry':
                this.createCherryVisual(container);
                break;
            case 'waffle':
                this.createWaffleVisual(container);
                break;
            case 'apple':
                this.createAppleVisual(container);
                break;
            case 'banana':
            default:
                this.createBananaVisual(container);
                break;
        }
        
        container.setDepth(60);
        return container;
    }

    createBananaVisual(container) {
        // Main banana body (curved ellipse)
        const bananaBody = this.scene.add.ellipse(0, 0, 28, 10, 0xFFE135);
        bananaBody.setStrokeStyle(2, 0xD4A017);
        
        // Banana tips
        const tipLeft = this.scene.add.ellipse(-12, 0, 6, 5, 0x8B4513);
        const tipRight = this.scene.add.ellipse(12, 0, 6, 5, 0x5C4033);
        
        // Highlight
        const highlight = this.scene.add.ellipse(0, -2, 16, 3, 0xFFFF88, 0.6);
        
        container.add([bananaBody, tipLeft, tipRight, highlight]);
        container.setRotation(-0.3);
    }

    createPancakeVisual(container) {
        // Stack of pancakes
        const pancake1 = this.scene.add.ellipse(0, 4, 26, 8, 0xDEB887);
        pancake1.setStrokeStyle(2, 0xCD853F);
        
        const pancake2 = this.scene.add.ellipse(0, 0, 24, 7, 0xD2B48C);
        pancake2.setStrokeStyle(2, 0xCD853F);
        
        const pancake3 = this.scene.add.ellipse(0, -4, 22, 6, 0xDEB887);
        pancake3.setStrokeStyle(2, 0xCD853F);
        
        // Butter pat on top
        const butter = this.scene.add.rectangle(0, -8, 8, 4, 0xFFD700);
        
        // Syrup drip
        const syrup = this.scene.add.ellipse(8, 0, 4, 10, 0x8B4513, 0.7);
        
        container.add([pancake1, pancake2, pancake3, butter, syrup]);
    }

    createCherryVisual(container) {
        // Two cherries
        const cherry1 = this.scene.add.circle(-6, 2, 8, 0xDC143C);
        cherry1.setStrokeStyle(2, 0x8B0000);
        
        const cherry2 = this.scene.add.circle(6, 2, 8, 0xDC143C);
        cherry2.setStrokeStyle(2, 0x8B0000);
        
        // Stems
        const stem1 = this.scene.add.rectangle(-3, -8, 2, 12, 0x228B22);
        stem1.setRotation(-0.3);
        
        const stem2 = this.scene.add.rectangle(3, -8, 2, 12, 0x228B22);
        stem2.setRotation(0.3);
        
        // Highlights
        const highlight1 = this.scene.add.circle(-8, 0, 2, 0xFFFFFF, 0.5);
        const highlight2 = this.scene.add.circle(4, 0, 2, 0xFFFFFF, 0.5);
        
        container.add([stem1, stem2, cherry1, cherry2, highlight1, highlight2]);
    }

    createWaffleVisual(container) {
        // Square waffle
        const waffle = this.scene.add.rectangle(0, 0, 24, 24, 0xDAA520);
        waffle.setStrokeStyle(2, 0xB8860B);
        
        // Waffle grid pattern
        for (let i = -1; i <= 1; i++) {
            const hLine = this.scene.add.rectangle(0, i * 6, 20, 1, 0x8B4513, 0.5);
            const vLine = this.scene.add.rectangle(i * 6, 0, 1, 20, 0x8B4513, 0.5);
            container.add([hLine, vLine]);
        }
        
        // Butter/cream on top
        const cream = this.scene.add.ellipse(0, -2, 12, 6, 0xFFFFE0, 0.8);
        
        container.add([waffle, cream]);
        container.setRotation(0.2);
    }

    createAppleVisual(container) {
        // Apple body
        const apple = this.scene.add.circle(0, 2, 12, 0xFF0000);
        apple.setStrokeStyle(2, 0x8B0000);
        
        // Leaf
        const leaf = this.scene.add.ellipse(4, -12, 8, 5, 0x228B22);
        leaf.setRotation(0.5);
        
        // Stem
        const stem = this.scene.add.rectangle(0, -10, 3, 6, 0x8B4513);
        
        // Highlight
        const highlight = this.scene.add.circle(-4, -2, 3, 0xFFFFFF, 0.4);
        
        container.add([apple, stem, leaf, highlight]);
    }

    createTrailEffect() {
        // Periodic yellow trail particles
        this.trailTimer = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.destroyed && this.sprite && this.sprite.active) {
                    this.createTrailParticle();
                }
            },
            repeat: -1
        });
    }

    createTrailParticle() {
        const particle = this.scene.add.ellipse(
            this.sprite.x + (Math.random() - 0.5) * 10,
            this.sprite.y + (Math.random() - 0.5) * 5,
            8, 4,
            0xFFE135,
            0.5
        );
        particle.setDepth(55);
        
        this.scene.tweens.add({
            targets: particle,
            alpha: 0,
            scaleX: 0.3,
            scaleY: 0.3,
            duration: 300,
            onComplete: () => particle.destroy()
        });
    }

    update(time, delta) {
        if (this.destroyed) return;
        
        // Check lifespan
        if (Date.now() - this.spawnTime > this.lifespan) {
            this.destroy();
            return;
        }
        
        // Check if fell off the world
        if (this.sprite.y > this.scene.levelHeight + 100) {
            this.destroy();
            return;
        }
        
        // Update rotation based on velocity
        if (this.body && this.body.velocity) {
            const speed = Math.sqrt(
                this.body.velocity.x * this.body.velocity.x + 
                this.body.velocity.y * this.body.velocity.y
            );
            this.sprite.rotation += (speed * 0.0001) * delta;
        }
    }

    // Called when player touches banana
    onPlayerContact(player) {
        if (this.destroyed || this.isDeflected) return;
        
        console.log('🍌 Player slipped on banana!');
        
        // Make player slip
        this.applySlipEffect(player);
        
        // Create splat effect
        this.createSplatEffect();
        
        // Destroy banana
        this.destroy();
    }

    applySlipEffect(player) {
        // Determine slip direction based on player's movement
        const slipDirection = player.facingRight ? 1 : -1;
        
        // Apply slip velocity
        player.body.setVelocityX(slipDirection * this.slipVelocity);
        player.body.setVelocityY(-100); // Small upward pop
        
        // Set player slipping state
        player.isSlipping = true;
        player.canJump = false;
        
        // Create slip visual effect on player
        this.createPlayerSlipEffect(player);
        
        // Show "SLIP!" text
        this.createSlipText(player.sprite.x, player.sprite.y - 40);
        
        // Track slip for scoring (if in banana mode)
        if (this.scene.bananaMode && this.scene.onPlayerSlip) {
            this.scene.onPlayerSlip();
        }
        
        // Reset player after slip duration
        this.scene.time.delayedCall(this.slipDuration, () => {
            if (player && !player.destroyed) {
                player.isSlipping = false;
                player.canJump = true;
                console.log('🍌 Player recovered from slip');
            }
        });
    }

    createPlayerSlipEffect(player) {
        // Squash effect during slip
        if (player.sprite.setScale) {
            const originalScaleX = player.sprite.scaleX;
            const originalScaleY = player.sprite.scaleY;
            
            // Squash down
            this.scene.tweens.add({
                targets: player.sprite,
                scaleX: 1.3,
                scaleY: 0.7,
                duration: 150,
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    player.sprite.setScale(originalScaleX, originalScaleY);
                }
            });
        }
        
        // Yellow stars around player
        for (let i = 0; i < 4; i++) {
            const star = this.scene.add.star(
                player.sprite.x + (Math.random() - 0.5) * 40,
                player.sprite.y - 20 + (Math.random() - 0.5) * 20,
                5, 4, 8,
                0xFFE135,
                0.9
            );
            star.setDepth(100);
            
            this.scene.tweens.add({
                targets: star,
                y: star.y - 30,
                rotation: Math.PI * 2,
                alpha: 0,
                duration: 600,
                delay: i * 100,
                onComplete: () => star.destroy()
            });
        }
    }

    createSlipText(x, y) {
        const slipText = this.scene.add.text(x, y, 'SLIP!', {
            fontSize: '24px',
            fill: '#FFE135',
            fontWeight: 'bold',
            stroke: '#8B4513',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);
        
        this.scene.tweens.add({
            targets: slipText,
            y: y - 50,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 800,
            ease: 'Power2',
            onComplete: () => slipText.destroy()
        });
    }

    // Called when player kicks/punches the banana
    onDeflect(player, attackType) {
        if (this.destroyed || this.isDeflected) return;
        
        this.isDeflected = true;
        
        console.log(`🍌 Banana deflected by ${attackType}!`);
        
        // Reverse direction with power
        const deflectPower = attackType === 'kick' ? 400 : 300;
        const directionX = player.facingRight ? 1 : -1;
        
        this.body.setVelocityX(directionX * deflectPower);
        this.body.setVelocityY(-200); // Pop up
        this.body.setAngularVelocity(500); // Fast spin
        
        // Change banana color to show it's deflected
        this.sprite.list[0].setFillStyle(0xFFA500); // Orange tint
        
        // Create deflect effect
        this.createDeflectEffect();
        
        // Award points for deflecting
        if (window.gameInstance) {
            window.gameInstance.addScore(15);
        }
        
        // Track deflection for scoring
        if (this.scene.bananaMode && this.scene.onBananaDeflected) {
            this.scene.onBananaDeflected();
        }
        
        // Show deflect text
        this.createDeflectText(this.sprite.x, this.sprite.y - 20);
        
        // Auto-destroy after short time
        this.scene.time.delayedCall(2000, () => {
            if (!this.destroyed) {
                this.destroy();
            }
        });
    }

    createDeflectEffect() {
        // Impact burst
        const burst = this.scene.add.circle(this.sprite.x, this.sprite.y, 15, 0xFFFF00, 0.8);
        burst.setDepth(59);
        
        this.scene.tweens.add({
            targets: burst,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 300,
            onComplete: () => burst.destroy()
        });
        
        // Particle spray
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const particle = this.scene.add.ellipse(
                this.sprite.x + Math.cos(angle) * 10,
                this.sprite.y + Math.sin(angle) * 10,
                6, 3,
                0xFFE135,
                0.9
            );
            particle.setDepth(58);
            
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * 40,
                y: particle.y + Math.sin(angle) * 40,
                alpha: 0,
                duration: 400,
                onComplete: () => particle.destroy()
            });
        }
    }

    createDeflectText(x, y) {
        const text = this.scene.add.text(x, y, 'DEFLECT! +15', {
            fontSize: '16px',
            fill: '#00FF00',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(100);
        
        this.scene.tweens.add({
            targets: text,
            y: y - 40,
            alpha: 0,
            duration: 600,
            onComplete: () => text.destroy()
        });
    }

    createSplatEffect() {
        const x = this.sprite.x;
        const y = this.sprite.y;
        
        // Main splat
        const splat = this.scene.add.ellipse(x, y, 40, 15, 0xFFE135, 0.8);
        splat.setDepth(30);
        
        this.scene.tweens.add({
            targets: splat,
            scaleX: 1.5,
            scaleY: 0.5,
            alpha: 0,
            duration: 500,
            onComplete: () => splat.destroy()
        });
        
        // Splatter particles
        for (let i = 0; i < 8; i++) {
            const angle = (Math.random() - 0.5) * Math.PI; // Mostly horizontal
            const distance = 20 + Math.random() * 30;
            
            const splatter = this.scene.add.ellipse(
                x + Math.cos(angle) * 5,
                y + Math.sin(angle) * 5,
                8 + Math.random() * 6,
                4 + Math.random() * 3,
                0xFFE135,
                0.7
            );
            splatter.setDepth(29);
            
            this.scene.tweens.add({
                targets: splatter,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance * 0.5 + 10, // Mostly flat spread
                alpha: 0,
                duration: 400 + Math.random() * 200,
                onComplete: () => splatter.destroy()
            });
        }
    }

    // Check if banana can hit deflected enemies (bonus feature)
    checkEnemyCollision() {
        if (!this.isDeflected || this.destroyed) return;
        
        // Deflected bananas can hit enemies!
        if (this.scene.enemies) {
            this.scene.enemies.children.entries.forEach(enemySprite => {
                if (enemySprite.active) {
                    const distance = Phaser.Math.Distance.Between(
                        this.sprite.x, this.sprite.y,
                        enemySprite.x, enemySprite.y
                    );
                    
                    if (distance < 30) {
                        const enemy = enemySprite.getData('enemy');
                        if (enemy && enemy.health > 0) {
                            enemy.takeDamage(20, 'banana');
                            this.createSplatEffect();
                            this.destroy();
                            
                            // Bonus points for hitting enemy with banana
                            if (window.gameInstance) {
                                window.gameInstance.addScore(50);
                            }
                            
                            console.log('🍌 Banana hit enemy!');
                        }
                    }
                }
            });
        }
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        
        // Clean up trail timer
        if (this.trailTimer) {
            this.trailTimer.destroy();
        }
        
        // Destroy sprite
        if (this.sprite) {
            this.sprite.destroy();
        }
        
        console.log('🍌 Banana destroyed');
    }
}

// FoodPowerUp - collectible that changes the food type
class FoodPowerUp {
    constructor(scene, x, y, foodType) {
        this.scene = scene;
        this.foodType = foodType;
        this.destroyed = false;
        this.config = FOOD_TYPES[foodType];
        
        // Create power-up visual
        this.container = scene.add.container(x, y);
        
        // Glowing background circle
        this.glow = scene.add.circle(0, 0, 28, this.config.primaryColor, 0.3);
        this.border = scene.add.circle(0, 0, 25, 0x000000, 0);
        this.border.setStrokeStyle(3, this.config.primaryColor);
        
        // Food emoji text
        this.emoji = scene.add.text(0, 0, this.config.emoji, {
            fontSize: '28px'
        }).setOrigin(0.5);
        
        // "POWER" label
        this.label = scene.add.text(0, 22, 'POWER!', {
            fontSize: '10px',
            fill: '#ffffff',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.container.add([this.glow, this.border, this.emoji, this.label]);
        this.container.setDepth(55);
        
        // Add physics
        scene.physics.add.existing(this.container);
        this.container.body.setCircle(25);
        this.container.body.setOffset(-25, -25);
        
        // Floating animation
        scene.tweens.add({
            targets: this.container,
            y: y - 10,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Pulsing glow
        scene.tweens.add({
            targets: this.glow,
            scale: 1.2,
            alpha: 0.6,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        // Auto-destroy after 10 seconds
        this.destroyTimer = scene.time.delayedCall(10000, () => {
            this.fadeOut();
        });
        
        // Store reference
        this.container.setData('powerUp', this);
    }
    
    fadeOut() {
        if (this.destroyed) return;
        
        // Fade out effect before destroying
        this.scene.tweens.add({
            targets: this.container,
            alpha: 0,
            scale: 0.5,
            duration: 500,
            onComplete: () => this.destroy()
        });
    }
    
    collect() {
        if (this.destroyed) return null;
        
        // Cancel auto-destroy timer
        if (this.destroyTimer) {
            this.destroyTimer.destroy();
        }
        
        // Collect effect
        this.scene.tweens.add({
            targets: this.container,
            scale: 1.5,
            alpha: 0,
            duration: 300,
            onComplete: () => this.destroy()
        });
        
        // Show collected message
        const msg = this.scene.add.text(
            this.container.x,
            this.container.y - 30,
            `${this.config.emoji} ${this.config.name} Mode!`,
            {
                fontSize: '18px',
                fill: '#ffffff',
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setDepth(100);
        
        this.scene.tweens.add({
            targets: msg,
            y: msg.y - 40,
            alpha: 0,
            duration: 1000,
            onComplete: () => msg.destroy()
        });
        
        return this.foodType;
    }
    
    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        
        if (this.destroyTimer) {
            this.destroyTimer.destroy();
        }
        
        if (this.container) {
            this.container.destroy();
        }
    }
}

// Banana Manager - handles spawning and managing multiple bananas
class BananaManager {
    constructor(scene) {
        this.scene = scene;
        this.bananas = [];
        this.powerUps = [];
        this.spawnTimer = null;
        this.powerUpTimer = null;
        this.isActive = false;
        
        // Current food type (changes with power-ups)
        this.currentFoodType = 'banana';
        this.foodTypeTimer = null;
        this.foodTypeDuration = 15000; // 15 seconds of power-up effect
        
        // Difficulty settings
        this.baseSpawnRate = 3000; // ms between spawns
        this.minSpawnRate = 500;   // fastest spawn rate
        this.difficultyRamp = 50;  // ms reduction per banana spawned
        this.currentSpawnRate = this.baseSpawnRate;
        this.bananasSpawned = 0;
        
        // Power-up settings
        this.powerUpSpawnRate = 10000; // Spawn power-up every 10 seconds
        this.availableFoodTypes = ['pancake', 'cherry', 'waffle', 'apple'];
        
        // Stats
        this.bananasDeflected = 0;
        this.bananasDodged = 0;
        this.timesSlipped = 0;
    }

    start() {
        if (this.isActive) return;
        
        // Reset all stats for fresh start
        this.reset();
        
        this.isActive = true;
        this.scheduleNextSpawn();
        this.scheduleNextPowerUp();
        
        console.log('🍌 Banana Manager started!');
    }

    // Schedule next power-up spawn
    scheduleNextPowerUp() {
        if (!this.isActive) return;
        
        // Random delay between 8-15 seconds
        const delay = this.powerUpSpawnRate + Math.random() * 5000;
        
        this.powerUpTimer = this.scene.time.delayedCall(delay, () => {
            this.spawnPowerUp();
            this.scheduleNextPowerUp();
        });
    }

    // Spawn a random food power-up
    spawnPowerUp() {
        if (!this.isActive) return;
        
        // Random position in the level
        const x = 100 + Math.random() * (this.scene.levelWidth - 200);
        const y = 100 + Math.random() * (this.scene.levelHeight - 300);
        
        // Pick a random food type (not the current one)
        const availableTypes = this.availableFoodTypes.filter(t => t !== this.currentFoodType);
        const foodType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        
        const powerUp = new FoodPowerUp(this.scene, x, y, foodType);
        this.powerUps.push(powerUp);
        
        // Set up collision with player
        if (this.scene.player && this.scene.player.sprite) {
            this.scene.physics.add.overlap(
                this.scene.player.sprite,
                powerUp.container,
                () => this.collectPowerUp(powerUp),
                null,
                this
            );
        }
        
        console.log(`🎁 Power-up spawned: ${foodType}`);
    }

    // Player collected a power-up
    collectPowerUp(powerUp) {
        if (powerUp.destroyed) return;
        
        const newFoodType = powerUp.collect();
        if (newFoodType) {
            this.changeFoodType(newFoodType);
        }
        
        // Remove from array
        const index = this.powerUps.indexOf(powerUp);
        if (index > -1) {
            this.powerUps.splice(index, 1);
        }
    }

    // Change the current food type
    changeFoodType(newType) {
        console.log(`🍌➡️${FOOD_TYPES[newType].emoji} Food type changed to: ${newType}`);
        
        // Clear existing timer
        if (this.foodTypeTimer) {
            this.foodTypeTimer.destroy();
        }
        
        this.currentFoodType = newType;
        
        // Show indicator on screen
        this.showFoodTypeIndicator(newType);
        
        // Notify scene
        if (this.scene.onFoodTypeChange) {
            this.scene.onFoodTypeChange(newType);
        }
        
        // Set timer to revert to banana
        this.foodTypeTimer = this.scene.time.delayedCall(this.foodTypeDuration, () => {
            this.revertTobanana();
        });
    }

    // Show food type indicator
    showFoodTypeIndicator(foodType) {
        const config = FOOD_TYPES[foodType];
        
        // Create indicator in top-right
        if (this.foodIndicator) {
            this.foodIndicator.destroy();
        }
        
        this.foodIndicator = this.scene.add.container(
            this.scene.cameras.main.width - 80,
            100
        ).setScrollFactor(0).setDepth(150);
        
        // Background
        const bg = this.scene.add.rectangle(0, 0, 120, 50, config.primaryColor, 0.8);
        bg.setStrokeStyle(3, config.secondaryColor);
        
        // Emoji and text
        const text = this.scene.add.text(0, 0, `${config.emoji} ${config.name}`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Timer bar
        const timerBg = this.scene.add.rectangle(0, 20, 100, 6, 0x000000, 0.5);
        const timerBar = this.scene.add.rectangle(-50, 20, 100, 6, 0xffffff);
        timerBar.setOrigin(0, 0.5);
        
        this.foodIndicator.add([bg, text, timerBg, timerBar]);
        
        // Animate timer bar
        this.scene.tweens.add({
            targets: timerBar,
            scaleX: 0,
            duration: this.foodTypeDuration,
            ease: 'Linear',
            onComplete: () => {
                if (this.foodIndicator) {
                    this.foodIndicator.destroy();
                    this.foodIndicator = null;
                }
            }
        });
    }

    // Revert to banana after power-up expires
    revertTobanana() {
        console.log('🍌 Reverted to banana mode');
        this.currentFoodType = 'banana';
        
        if (this.foodIndicator) {
            this.foodIndicator.destroy();
            this.foodIndicator = null;
        }
        
        // Show revert message
        const msg = this.scene.add.text(
            this.scene.cameras.main.centerX,
            100,
            '🍌 Back to Bananas!',
            {
                fontSize: '24px',
                fill: '#FFE135',
                fontWeight: 'bold',
                stroke: '#8B4513',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(100);
        
        this.scene.tweens.add({
            targets: msg,
            y: 50,
            alpha: 0,
            duration: 1500,
            onComplete: () => msg.destroy()
        });
        
        // Notify scene
        if (this.scene.onFoodTypeChange) {
            this.scene.onFoodTypeChange('banana');
        }
    }

    // Reset all manager stats
    reset() {
        console.log('🍌 Resetting Banana Manager stats...');
        
        // Reset spawn settings
        this.currentSpawnRate = this.baseSpawnRate;
        this.bananasSpawned = 0;
        
        // Reset food type to banana
        this.currentFoodType = 'banana';
        
        // Reset tracking stats
        this.bananasDeflected = 0;
        this.bananasDodged = 0;
        this.timesSlipped = 0;
        
        // Clean up any existing bananas
        if (this.bananas) {
            this.bananas.forEach(banana => {
                if (!banana.destroyed) {
                    banana.destroy();
                }
            });
        }
        this.bananas = [];
        
        // Clean up any existing power-ups
        if (this.powerUps) {
            this.powerUps.forEach(powerUp => {
                if (!powerUp.destroyed) {
                    powerUp.destroy();
                }
            });
        }
        this.powerUps = [];
        
        // Clear spawn timer
        if (this.spawnTimer) {
            this.spawnTimer.destroy();
            this.spawnTimer = null;
        }
        
        // Clear power-up timer
        if (this.powerUpTimer) {
            this.powerUpTimer.destroy();
            this.powerUpTimer = null;
        }
        
        // Clear food type timer
        if (this.foodTypeTimer) {
            this.foodTypeTimer.destroy();
            this.foodTypeTimer = null;
        }
    }

    stop() {
        this.isActive = false;
        
        if (this.spawnTimer) {
            this.spawnTimer.destroy();
            this.spawnTimer = null;
        }
        
        if (this.powerUpTimer) {
            this.powerUpTimer.destroy();
            this.powerUpTimer = null;
        }
        
        if (this.foodTypeTimer) {
            this.foodTypeTimer.destroy();
            this.foodTypeTimer = null;
        }
        
        // Destroy food type indicator
        if (this.foodIndicator) {
            this.foodIndicator.destroy();
            this.foodIndicator = null;
        }
        
        // Destroy all active bananas/foods
        this.bananas.forEach(banana => {
            if (!banana.destroyed) {
                banana.destroy();
            }
        });
        this.bananas = [];
        
        // Destroy all active power-ups
        this.powerUps.forEach(powerUp => {
            if (!powerUp.destroyed) {
                powerUp.destroy();
            }
        });
        this.powerUps = [];
        
        // Reset food type
        this.currentFoodType = 'banana';
        
        console.log('🍌 Banana Manager stopped');
    }

    scheduleNextSpawn() {
        if (!this.isActive) return;
        
        this.spawnTimer = this.scene.time.delayedCall(this.currentSpawnRate, () => {
            this.spawnBanana();
            this.scheduleNextSpawn();
        });
    }

    spawnBanana() {
        if (!this.isActive) return;
        
        // Random spawn position at top of visible area
        const camera = this.scene.cameras.main;
        const spawnX = camera.scrollX + 50 + Math.random() * (camera.width - 100);
        const spawnY = camera.scrollY - 50;
        
        // Random velocity
        const velocityX = (Math.random() - 0.5) * 200;
        const velocityY = 150 + Math.random() * 100;
        
        // Use current food type (changes with power-ups!)
        const food = new Banana(this.scene, spawnX, spawnY, velocityX, velocityY, this.currentFoodType);
        this.bananas.push(food);
        
        // Set up collisions
        this.setupBananaCollisions(food);
        
        // Increase difficulty
        this.bananasSpawned++;
        this.currentSpawnRate = Math.max(
            this.minSpawnRate,
            this.baseSpawnRate - (this.bananasSpawned * this.difficultyRamp)
        );
        
        const foodConfig = FOOD_TYPES[this.currentFoodType];
        console.log(`${foodConfig.emoji} Spawned ${foodConfig.name} #${this.bananasSpawned} (next in ${this.currentSpawnRate}ms)`);
    }

    // Spawn banana from a specific position (for Monkey Titan throws)
    spawnBananaFrom(x, y, targetX, targetY) {
        if (!this.isActive) return;
        
        // Calculate velocity to reach target
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = 300;
        
        const velocityX = (dx / distance) * speed;
        const velocityY = (dy / distance) * speed - 100; // Arc upward
        
        // Use current food type (changes with power-ups!)
        const food = new Banana(this.scene, x, y, velocityX, velocityY, this.currentFoodType);
        this.bananas.push(food);
        
        this.setupBananaCollisions(food);
        this.bananasSpawned++;
        
        return food;
    }

    setupBananaCollisions(banana) {
        // Collision with platforms
        if (this.scene.platforms) {
            this.scene.physics.add.collider(banana.sprite, this.scene.platforms);
        }
        
        // Overlap with player (for slip detection)
        if (this.scene.player) {
            this.scene.physics.add.overlap(
                this.scene.player.sprite,
                banana.sprite,
                (playerSprite, bananaSprite) => {
                    const bananaObj = bananaSprite.getData('banana');
                    if (bananaObj && !bananaObj.destroyed && !bananaObj.isDeflected) {
                        // Check if player is attacking (can deflect)
                        if (this.scene.player.isAttacking) {
                            const attackType = this.scene.player.lastAttackType || 'punch';
                            bananaObj.onDeflect(this.scene.player, attackType);
                            this.bananasDeflected++;
                        } else {
                            // Player slips
                            bananaObj.onPlayerContact(this.scene.player);
                            this.timesSlipped++;
                        }
                    }
                },
                null,
                this
            );
        }
    }

    update(time, delta) {
        // Update all bananas
        for (let i = this.bananas.length - 1; i >= 0; i--) {
            const banana = this.bananas[i];
            
            if (banana.destroyed) {
                this.bananas.splice(i, 1);
                continue;
            }
            
            banana.update(time, delta);
            
            // Check if deflected banana can hit enemies
            banana.checkEnemyCollision();
        }
    }

    getStats() {
        return {
            spawned: this.bananasSpawned,
            deflected: this.bananasDeflected,
            dodged: this.bananasDodged,
            slipped: this.timesSlipped
        };
    }
}

// Export for global use
window.Banana = Banana;
window.BananaManager = BananaManager;
window.FoodPowerUp = FoodPowerUp;
window.FOOD_TYPES = FOOD_TYPES;
