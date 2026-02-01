// 🍌 Banana Survival Mode - Endless dodging challenge
// Dodge bananas thrown by Monkey Titans, survive as long as possible!

console.log('🍌 BananaSurvivalScene.js loading...');

class BananaSurvivalScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BananaSurvivalScene' });
        
        // Scene properties
        this.player = null;
        this.platforms = null;
        this.enemies = null;
        this.bananaManager = null;
        
        // Level properties
        this.levelWidth = 1024;
        this.levelHeight = 576;
        
        // Game state
        this.gameStarted = false;
        this.gameOver = false;
        this.bananaMode = true; // Flag for banana mode mechanics
        
        // Survival stats
        this.survivalTime = 0;
        this.bananasDeflected = 0;
        this.bananasDodged = 0;
        this.timesSlipped = 0;
        this.maxSlips = 5; // Game over after 5 slips
        
        // Difficulty
        this.wave = 1;
        this.monkeySpawnTimer = null;
        this.monkeySpawnDelay = 8000; // Add new monkey every 8 seconds
    }

    // Reset all game state for a fresh start
    resetGameState() {
        console.log('🍌 Resetting Banana Survival state...');
        
        // Reset game flags
        this.gameStarted = false;
        this.gameOver = false;
        this.bananaMode = true;
        
        // Reset survival stats
        this.survivalTime = 0;
        this.bananasDeflected = 0;
        this.bananasDodged = 0;
        this.timesSlipped = 0;
        this.maxSlips = 5;
        
        // Reset difficulty
        this.wave = 1;
        this.monkeySpawnDelay = 8000;
        
        // Clear any existing timers
        if (this.monkeySpawnTimer) {
            this.monkeySpawnTimer.destroy();
            this.monkeySpawnTimer = null;
        }
        
        // Clear banana manager if it exists
        if (this.bananaManager) {
            this.bananaManager.stop();
            this.bananaManager = null;
        }
        
        // Clear references
        this.player = null;
        this.platforms = null;
        this.enemies = null;
        
        console.log('🍌 State reset complete');
    }

    create() {
        try {
            console.log('🍌 BananaSurvivalScene create() started');
            
            // Reset all stats and state for fresh start
            this.resetGameState();
            
            // Set up world
            this.physics.world.setBounds(0, 0, this.levelWidth, this.levelHeight);
            
            // Create background (jungle themed)
            this.createBackground();
            
            // Create platforms
            this.createPlatforms();
            
            // Create player
            this.createPlayer();
            
            // Create initial monkey titans
            this.createMonkeyTitans();
            
            // Initialize banana manager
            this.bananaManager = new window.BananaManager(this);
            this.bananaManager.start();
            
            // Set up camera
            this.cameras.main.setBounds(0, 0, this.levelWidth, this.levelHeight);
            this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
            
            // Create UI
            this.createUI();
            
            // Set up collisions
            this.setupCollisions();
            
            // Start the game
            this.startGame();
            
            // Schedule monkey spawning
            this.scheduleMonkeySpawn();
            
            // Keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            console.log('🍌 BananaSurvivalScene created successfully!');
            
        } catch (error) {
            console.error('💥 ERROR in BananaSurvivalScene.create():', error.message);
            console.error('Stack trace:', error.stack);
        }
    }

    createBackground() {
        // Jungle-themed background
        this.add.rectangle(
            this.levelWidth / 2,
            this.levelHeight / 2,
            this.levelWidth,
            this.levelHeight,
            0x228B22 // Forest green
        );
        
        // Add jungle elements
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * this.levelWidth;
            const y = Math.random() * this.levelHeight * 0.6;
            const size = 20 + Math.random() * 40;
            
            // Tree tops / leaves
            const leaf = this.add.ellipse(x, y, size, size * 0.7, 0x006400, 0.6);
            
            // Animate leaves swaying
            this.tweens.add({
                targets: leaf,
                x: leaf.x + 10,
                duration: 2000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        // Add some banana decorations
        for (let i = 0; i < 5; i++) {
            const x = 50 + Math.random() * (this.levelWidth - 100);
            const y = 50 + Math.random() * 150;
            
            const banana = this.add.ellipse(x, y, 20, 8, 0xFFE135, 0.4);
            banana.setRotation(-0.4);
        }
        
        // Title banner
        this.add.text(this.levelWidth / 2, 30, '🍌 BANANA SURVIVAL MODE 🍌', {
            fontSize: '28px',
            fill: '#FFE135',
            fontWeight: 'bold',
            stroke: '#8B4513',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    }

    createPlatforms() {
        this.platforms = this.physics.add.staticGroup();
        
        const platformColor = 0x8B4513; // Brown wood color
        
        // Ground
        for (let x = 0; x < this.levelWidth; x += 128) {
            const ground = this.add.rectangle(x + 64, this.levelHeight - 32, 128, 64, platformColor);
            ground.setStrokeStyle(3, 0x5C4033);
            this.physics.add.existing(ground, true);
            this.platforms.add(ground);
        }
        
        // Elevated platforms (good for dodging)
        const platformConfigs = [
            { x: 150, y: 420, w: 120, h: 20 },
            { x: 400, y: 350, w: 100, h: 20 },
            { x: 650, y: 380, w: 120, h: 20 },
            { x: 850, y: 300, w: 100, h: 20 },
            { x: 512, y: 220, w: 150, h: 20 }, // Center high platform
        ];
        
        platformConfigs.forEach(p => {
            const platform = this.add.rectangle(p.x, p.y, p.w, p.h, platformColor);
            platform.setStrokeStyle(2, 0x654321);
            this.physics.add.existing(platform, true);
            this.platforms.add(platform);
        });
    }

    createPlayer() {
        const spawnX = this.levelWidth / 2;
        const spawnY = this.levelHeight - 150;
        
        this.player = new Player(this, spawnX, spawnY);
        
        // Track attack state for banana deflection
        this.player.lastAttackType = 'punch';
        
        // Override attack methods to track attack type
        const originalPerformKick = this.player.performKick.bind(this.player);
        this.player.performKick = () => {
            this.player.lastAttackType = 'kick';
            originalPerformKick();
        };
        
        const originalPerformPunch = this.player.performPunch.bind(this.player);
        this.player.performPunch = () => {
            this.player.lastAttackType = 'punch';
            originalPerformPunch();
        };
        
        console.log('🍌 Player spawned for banana survival');
    }

    createMonkeyTitans() {
        this.enemies = this.physics.add.group();
        
        // Start with 2 monkey titans
        const positions = [
            { x: 100, y: this.levelHeight - 150 },
            { x: this.levelWidth - 100, y: this.levelHeight - 150 }
        ];
        
        positions.forEach(pos => {
            this.spawnMonkeyTitan(pos.x, pos.y);
        });
    }

    spawnMonkeyTitan(x, y) {
        const monkey = window.EnemyFactory.createMonkeyTitan(this, x, y);
        monkey.sprite.setData('enemy', monkey);
        this.enemies.add(monkey.sprite);
        
        console.log(`🐒 Monkey Titan spawned at ${x}, ${y}`);
    }

    scheduleMonkeySpawn() {
        this.monkeySpawnTimer = this.time.addEvent({
            delay: this.monkeySpawnDelay,
            callback: () => {
                if (!this.gameOver) {
                    this.wave++;
                    
                    // Spawn new monkey on random side
                    const side = Math.random() > 0.5 ? 100 : this.levelWidth - 100;
                    this.spawnMonkeyTitan(side, this.levelHeight - 150);
                    
                    // Show wave indicator
                    this.showWaveIndicator();
                    
                    // Increase banana difficulty
                    this.bananaManager.difficultyRamp += 10;
                    
                    // Reduce spawn delay (minimum 4 seconds)
                    this.monkeySpawnDelay = Math.max(4000, this.monkeySpawnDelay - 500);
                }
            },
            repeat: -1
        });
    }

    showWaveIndicator() {
        const waveText = this.add.text(
            this.levelWidth / 2,
            this.levelHeight / 2 - 50,
            `WAVE ${this.wave}`,
            {
                fontSize: '48px',
                fill: '#FFE135',
                fontWeight: 'bold',
                stroke: '#8B4513',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(200);
        
        this.tweens.add({
            targets: waveText,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => waveText.destroy()
        });
    }

    setupCollisions() {
        // Player vs platforms
        this.physics.add.collider(this.player.sprite, this.platforms);
        
        // Enemies vs platforms
        this.physics.add.collider(this.enemies, this.platforms);
        
        // Player vs enemies (touching monkey = damage)
        this.physics.add.overlap(this.player.sprite, this.enemies, this.hitMonkey, null, this);
    }

    hitMonkey(playerSprite, monkeySprite) {
        const monkey = monkeySprite.getData('enemy');
        if (!monkey || monkey.health <= 0) return;
        
        // Check for head stomp
        const isAbove = this.player.sprite.y < monkey.sprite.y - 15;
        const isFalling = this.player.body.velocity.y > 50;
        
        if (isAbove && isFalling) {
            // Stomp the monkey!
            this.player.body.setVelocityY(-350);
            monkey.takeDamage(75, 'stomp');
            
            // Bonus: defeating monkey clears some slips
            if (this.timesSlipped > 0) {
                this.timesSlipped = Math.max(0, this.timesSlipped - 1);
                this.showMessage('Slip recovered!', 0x00FF00);
            }
        } else {
            // Monkey bites - small damage
            this.player.takeDamage(10);
        }
    }

    createUI() {
        // Survival time
        this.survivalText = this.add.text(20, 60, 'Time: 0s', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(100);
        
        // Slips remaining
        this.slipsText = this.add.text(20, 100, `Slips: 0/${this.maxSlips}`, {
            fontSize: '20px',
            fill: '#FFE135',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(100);
        
        // Bananas deflected
        this.deflectedText = this.add.text(20, 140, 'Deflected: 0', {
            fontSize: '18px',
            fill: '#00FF00',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(100);
        
        // Wave indicator
        this.waveText = this.add.text(this.levelWidth - 20, 60, 'Wave: 1', {
            fontSize: '20px',
            fill: '#FF6B35',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(100);
        
        // Health bar
        this.createHealthBar();
        
        // Instructions
        this.add.text(this.levelWidth / 2, this.levelHeight - 20, 
            'WASD/Arrows: Move | Space: Jump | X: Kick | Z: Punch bananas!', {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    }

    createHealthBar() {
        const barWidth = 200;
        const barHeight = 20;
        const x = this.levelWidth - barWidth - 20;
        const y = 100;
        
        this.healthBarBg = this.add.rectangle(x, y, barWidth, barHeight, 0x000000)
            .setScrollFactor(0).setDepth(100).setOrigin(0, 0);
            
        this.healthBarFill = this.add.rectangle(x + 2, y + 2, barWidth - 4, barHeight - 4, 0x00ff00)
            .setScrollFactor(0).setDepth(101).setOrigin(0, 0);
            
        this.healthText = this.add.text(x + barWidth/2, y + barHeight/2, '100/100', {
            fontSize: '14px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(102).setOrigin(0.5);
    }

    startGame() {
        this.gameStarted = true;
        this.survivalTime = 0;
        this.gameOver = false;
        
        console.log('🍌 Banana Survival started!');
    }

    // Called when player slips on banana
    onPlayerSlip() {
        this.timesSlipped++;
        
        // Check game over
        if (this.timesSlipped >= this.maxSlips) {
            this.endGame();
        } else {
            this.showMessage(`SLIP! (${this.timesSlipped}/${this.maxSlips})`, 0xFF0000);
        }
    }

    // Called when player deflects banana
    onBananaDeflected() {
        this.bananasDeflected++;
    }

    // Called when food type changes (power-up collected)
    onFoodTypeChange(newFoodType) {
        console.log(`🍽️ Food type changed to: ${newFoodType}`);
        
        // The BananaManager handles the UI indicator
        // We can add additional effects here if needed
        
        // Screen flash effect
        if (newFoodType !== 'banana') {
            const config = window.FOOD_TYPES[newFoodType];
            this.cameras.main.flash(300, 
                (config.primaryColor >> 16) & 0xFF,
                (config.primaryColor >> 8) & 0xFF,
                config.primaryColor & 0xFF,
                true
            );
        }
    }

    showMessage(text, color = 0xFFFFFF) {
        const message = this.add.text(
            this.levelWidth / 2,
            this.levelHeight / 2,
            text,
            {
                fontSize: '32px',
                fill: `#${color.toString(16).padStart(6, '0')}`,
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setDepth(200);
        
        this.tweens.add({
            targets: message,
            y: message.y - 50,
            alpha: 0,
            duration: 1000,
            onComplete: () => message.destroy()
        });
    }

    endGame() {
        this.gameOver = true;
        
        // Stop banana manager
        if (this.bananaManager) {
            this.bananaManager.stop();
        }
        
        // Stop monkey spawning
        if (this.monkeySpawnTimer) {
            this.monkeySpawnTimer.destroy();
        }
        
        // Pause physics
        this.physics.pause();
        
        // Show game over screen
        this.showGameOverScreen();
    }

    showGameOverScreen() {
        // Overlay
        const overlay = this.add.rectangle(
            this.levelWidth / 2,
            this.levelHeight / 2,
            400,
            350,
            0x000000,
            0.9
        ).setDepth(300);
        
        // Title
        this.add.text(this.levelWidth / 2, this.levelHeight / 2 - 120, '🍌 GAME OVER 🍌', {
            fontSize: '36px',
            fill: '#FFE135',
            fontWeight: 'bold',
            stroke: '#8B4513',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(301);
        
        // Stats
        const stats = [
            `Survival Time: ${Math.floor(this.survivalTime)}s`,
            `Waves Survived: ${this.wave}`,
            `Bananas Deflected: ${this.bananasDeflected}`,
            `Times Slipped: ${this.timesSlipped}`
        ];
        
        stats.forEach((stat, i) => {
            this.add.text(this.levelWidth / 2, this.levelHeight / 2 - 50 + (i * 30), stat, {
                fontSize: '18px',
                fill: '#ffffff'
            }).setOrigin(0.5).setDepth(301);
        });
        
        // Calculate score
        const finalScore = Math.floor(this.survivalTime) * 10 + this.bananasDeflected * 15 + this.wave * 100;
        
        this.add.text(this.levelWidth / 2, this.levelHeight / 2 + 80, `Final Score: ${finalScore}`, {
            fontSize: '24px',
            fill: '#00FF00',
            fontWeight: 'bold'
        }).setOrigin(0.5).setDepth(301);
        
        // Buttons
        const retryButton = this.add.text(this.levelWidth / 2 - 80, this.levelHeight / 2 + 130, 'Retry', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#4169e1',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(301).setInteractive();
        
        const menuButton = this.add.text(this.levelWidth / 2 + 80, this.levelHeight / 2 + 130, 'Menu', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#228b22',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setDepth(301).setInteractive();
        
        retryButton.on('pointerdown', () => {
            this.scene.restart();
        });
        
        menuButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
        
        // Hover effects
        [retryButton, menuButton].forEach(btn => {
            btn.on('pointerover', () => btn.setScale(1.1));
            btn.on('pointerout', () => btn.setScale(1.0));
        });
    }

    update(time, delta) {
        if (!this.gameStarted || this.gameOver) return;
        
        // Update survival time
        this.survivalTime += delta / 1000;
        
        // Update player
        if (this.player) {
            this.player.update(time, delta);
        }
        
        // Update enemies
        if (this.enemies) {
            this.enemies.children.entries.forEach(monkeySprite => {
                const monkey = monkeySprite.getData('enemy');
                if (monkey && monkey.health > 0) {
                    monkey.update(time, delta);
                }
            });
        }
        
        // Update banana manager
        if (this.bananaManager) {
            this.bananaManager.update(time, delta);
        }
        
        // Update UI
        this.updateUI();
        
        // Check player death
        if (this.player && this.player.health <= 0) {
            this.endGame();
        }
    }

    updateUI() {
        this.survivalText.setText(`Time: ${Math.floor(this.survivalTime)}s`);
        this.slipsText.setText(`Slips: ${this.timesSlipped}/${this.maxSlips}`);
        this.deflectedText.setText(`Deflected: ${this.bananasDeflected}`);
        this.waveText.setText(`Wave: ${this.wave}`);
        
        // Update health bar
        if (this.player) {
            const healthPercent = this.player.health / this.player.maxHealth;
            this.healthBarFill.scaleX = healthPercent;
            
            if (healthPercent > 0.6) {
                this.healthBarFill.setFillStyle(0x00ff00);
            } else if (healthPercent > 0.3) {
                this.healthBarFill.setFillStyle(0xffff00);
            } else {
                this.healthBarFill.setFillStyle(0xff0000);
            }
            
            this.healthText.setText(`${this.player.health}/${this.player.maxHealth}`);
        }
        
        // Update slip text color based on danger
        if (this.timesSlipped >= this.maxSlips - 1) {
            this.slipsText.setColor('#FF0000');
        } else if (this.timesSlipped >= this.maxSlips - 2) {
            this.slipsText.setColor('#FFA500');
        } else {
            this.slipsText.setColor('#FFE135');
        }
    }

    setupKeyboardShortcuts() {
        // Fullscreen toggle
        this.input.keyboard.on('keydown-F', () => {
            if (window.gameInstance) {
                window.gameInstance.toggleFullscreen();
            }
        });
        
        // Escape to menu
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }
}

console.log('✅ BananaSurvivalScene class defined:', typeof BananaSurvivalScene);
