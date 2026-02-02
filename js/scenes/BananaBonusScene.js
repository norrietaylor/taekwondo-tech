// 🍌 Banana Bonus Stage - Quick challenge between levels
// Survive 30 seconds of banana chaos for bonus rewards!

console.log('🍌 BananaBonusScene.js loading...');

class BananaBonusScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BananaBonusScene' });
        
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
        this.bonusComplete = false;
        this.bananaMode = true;
        
        // Bonus stage settings
        this.bonusDuration = 30; // 30 seconds
        this.timeRemaining = 30;
        this.bananasDeflected = 0;
        this.timesSlipped = 0;
        this.maxSlips = 3; // Only 3 slips allowed in bonus stage
        
        // Rewards
        this.bonusCoins = 0;
        this.bonusParts = 0;
    }

    // Reset all game state for a fresh start
    resetGameState() {
        console.log('🍌 Resetting Banana Bonus state...');
        
        // Reset game flags
        this.gameStarted = false;
        this.bonusComplete = false;
        this.bananaMode = true;
        
        // Reset bonus stage settings
        this.bonusDuration = 30;
        this.timeRemaining = 30;
        this.bananasDeflected = 0;
        this.timesSlipped = 0;
        this.maxSlips = 3;
        
        // Reset rewards
        this.bonusCoins = 0;
        this.bonusParts = 0;
        
        // Clear game timer if exists
        if (this.gameTimer) {
            this.gameTimer.destroy();
            this.gameTimer = null;
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
        
        console.log('🍌 Bonus state reset complete');
    }

    init(data) {
        // Data passed from previous scene
        this.previousLevel = data.previousLevel || 1;
        this.nextLevel = data.nextLevel || 2;
        
        console.log(`🍌 Bonus stage between level ${this.previousLevel} and ${this.nextLevel}`);
    }

    create() {
        try {
            console.log('🍌 BananaBonusScene create() started');
            
            // Reset all stats and state for fresh start
            this.resetGameState();
            
            // Set up world
            this.physics.world.setBounds(0, 0, this.levelWidth, this.levelHeight);
            
            // Create background
            this.createBackground();
            
            // Create platforms
            this.createPlatforms();
            
            // Create player
            this.createPlayer();
            
            // Create monkey titans (based on level difficulty)
            this.createMonkeyTitans();
            
            // Initialize banana manager with fast difficulty ramp
            this.bananaManager = new window.BananaManager(this);
            this.bananaManager.baseSpawnRate = 2000; // Start faster
            this.bananaManager.difficultyRamp = 100; // Ramp up fast
            this.bananaManager.start();
            
            // Set up camera
            this.cameras.main.setBounds(0, 0, this.levelWidth, this.levelHeight);
            
            // Create UI
            this.createUI();
            
            // Set up collisions
            this.setupCollisions();
            
            // Show intro
            this.showIntro();
            
            // Keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            console.log('🍌 BananaBonusScene created successfully!');
            
        } catch (error) {
            console.error('💥 ERROR in BananaBonusScene.create():', error.message);
            console.error('Stack trace:', error.stack);
        }
    }

    createBackground() {
        // Colorful bonus stage background
        this.add.rectangle(
            this.levelWidth / 2,
            this.levelHeight / 2,
            this.levelWidth,
            this.levelHeight,
            0x4B0082 // Indigo
        );
        
        // Animated stars/sparkles
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * this.levelWidth;
            const y = Math.random() * this.levelHeight;
            
            const star = this.add.star(x, y, 5, 3, 6, 0xFFE135, 0.7);
            
            this.tweens.add({
                targets: star,
                alpha: 0.3,
                scaleX: 0.5,
                scaleY: 0.5,
                duration: 500 + Math.random() * 1000,
                yoyo: true,
                repeat: -1
            });
        }
        
        // Floating bananas in background
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * this.levelWidth;
            const y = Math.random() * this.levelHeight;
            
            const banana = this.add.ellipse(x, y, 30, 12, 0xFFE135, 0.3);
            banana.setRotation(-0.4 + Math.random() * 0.8);
            
            this.tweens.add({
                targets: banana,
                y: banana.y + 50,
                rotation: banana.rotation + 0.5,
                duration: 3000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createPlatforms() {
        this.platforms = this.physics.add.staticGroup();
        
        const platformColor = 0x9932CC; // Purple platforms
        
        // Ground
        for (let x = 0; x < this.levelWidth; x += 128) {
            const ground = this.add.rectangle(x + 64, this.levelHeight - 32, 128, 64, platformColor);
            ground.setStrokeStyle(3, 0x6B238E);
            this.physics.add.existing(ground, true);
            this.platforms.add(ground);
        }
        
        // Simple platform layout for bonus stage
        const platformConfigs = [
            { x: 200, y: 400, w: 150, h: 20 },
            { x: 512, y: 320, w: 180, h: 20 }, // Center platform
            { x: 824, y: 400, w: 150, h: 20 },
            { x: 350, y: 220, w: 100, h: 20 },
            { x: 674, y: 220, w: 100, h: 20 },
        ];
        
        platformConfigs.forEach(p => {
            const platform = this.add.rectangle(p.x, p.y, p.w, p.h, platformColor);
            platform.setStrokeStyle(2, 0x8B008B);
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
        
        // Override attack methods
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
    }

    createMonkeyTitans() {
        this.enemies = this.physics.add.group();
        
        // Number of monkeys based on level
        const numMonkeys = Math.min(2 + Math.floor(this.previousLevel / 2), 4);
        
        for (let i = 0; i < numMonkeys; i++) {
            const x = 100 + (i * (this.levelWidth - 200) / (numMonkeys - 1 || 1));
            const y = this.levelHeight - 150;
            
            const monkey = window.EnemyFactory.createMonkeyTitan(this, x, y);
            monkey.sprite.setData('enemy', monkey);
            this.enemies.add(monkey.sprite);
        }
        
        console.log(`🐒 Spawned ${numMonkeys} Monkey Titans for bonus stage`);
    }

    setupCollisions() {
        // Player vs platforms
        this.physics.add.collider(this.player.sprite, this.platforms);
        
        // Enemies vs platforms
        this.physics.add.collider(this.enemies, this.platforms);
        
        // Player vs enemies
        this.physics.add.overlap(this.player.sprite, this.enemies, this.hitMonkey, null, this);
    }

    hitMonkey(playerSprite, monkeySprite) {
        const monkey = monkeySprite.getData('enemy');
        if (!monkey || monkey.health <= 0) return;
        
        const isAbove = this.player.sprite.y < monkey.sprite.y - 15;
        const isFalling = this.player.body.velocity.y > 50;
        
        if (isAbove && isFalling) {
            this.player.body.setVelocityY(-350);
            monkey.takeDamage(75, 'stomp');
            
            // Bonus coins for defeating monkey
            this.bonusCoins += 25;
            this.showFloatingText(monkey.sprite.x, monkey.sprite.y, '+25 coins!', 0xFFD700);
        } else {
            this.player.takeDamage(10);
        }
    }

    createUI() {
        // Big countdown timer
        this.timerText = this.add.text(this.levelWidth / 2, 80, '30', {
            fontSize: '72px',
            fill: '#FFE135',
            fontWeight: 'bold',
            stroke: '#8B4513',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(100);
        
        // Title
        this.add.text(this.levelWidth / 2, 30, '🍌 BONUS STAGE 🍌', {
            fontSize: '28px',
            fill: '#FFE135',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(100);
        
        // Slips remaining
        this.slipsText = this.add.text(20, 60, `Slips: 0/${this.maxSlips}`, {
            fontSize: '20px',
            fill: '#FFE135',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setDepth(100);
        
        // Deflected count
        this.deflectedText = this.add.text(20, 100, 'Deflected: 0', {
            fontSize: '18px',
            fill: '#00FF00',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setDepth(100);
        
        // Bonus coins earned
        this.coinsText = this.add.text(this.levelWidth - 20, 60, 'Bonus: 0', {
            fontSize: '20px',
            fill: '#FFD700',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(1, 0).setDepth(100);
        
        // Instructions
        this.add.text(this.levelWidth / 2, this.levelHeight - 20, 
            'Survive 30 seconds! Deflect bananas for bonus coins!', {
            fontSize: '14px',
            fill: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(100);
    }

    showIntro() {
        // Countdown before game starts
        const countdownText = this.add.text(this.levelWidth / 2, this.levelHeight / 2, '3', {
            fontSize: '96px',
            fill: '#FFE135',
            fontWeight: 'bold',
            stroke: '#8B4513',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(300);
        
        // Countdown sequence
        this.time.delayedCall(1000, () => { countdownText.setText('2'); });
        this.time.delayedCall(2000, () => { countdownText.setText('1'); });
        this.time.delayedCall(3000, () => { 
            countdownText.setText('GO!');
            this.tweens.add({
                targets: countdownText,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 500,
                onComplete: () => {
                    countdownText.destroy();
                    this.startGame();
                }
            });
        });
    }

    startGame() {
        this.gameStarted = true;
        
        // Start the main countdown timer
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timeRemaining--;
                
                // Warning when time is low
                if (this.timeRemaining <= 5) {
                    this.timerText.setColor('#FF0000');
                    this.cameras.main.shake(100, 0.005);
                }
                
                // Bonus complete!
                if (this.timeRemaining <= 0) {
                    this.completeBonus(true);
                }
            },
            repeat: this.bonusDuration - 1
        });
        
        console.log('🍌 Bonus stage started!');
    }

    // Called when player slips
    onPlayerSlip() {
        this.timesSlipped++;
        
        // Lose some bonus coins on slip
        this.bonusCoins = Math.max(0, this.bonusCoins - 10);
        
        if (this.timesSlipped >= this.maxSlips) {
            this.completeBonus(false);
        } else {
            this.showFloatingText(
                this.player.sprite.x, 
                this.player.sprite.y - 50, 
                `SLIP! (${this.timesSlipped}/${this.maxSlips})`, 
                0xFF0000
            );
        }
    }

    // Called when banana is deflected
    onBananaDeflected() {
        this.bananasDeflected++;
        this.bonusCoins += 5; // Bonus coins per deflect
    }

    // Called when food type changes (power-up collected)
    onFoodTypeChange(newFoodType) {
        console.log(`🍽️ Food type changed to: ${newFoodType}`);
        
        // Screen flash effect
        if (newFoodType !== 'banana') {
            const config = window.FOOD_TYPES[newFoodType];
            this.cameras.main.flash(300, 
                (config.primaryColor >> 16) & 0xFF,
                (config.primaryColor >> 8) & 0xFF,
                config.primaryColor & 0xFF,
                true
            );
            
            // Bonus score for collecting power-up
            this.bonusCoins += 10;
        }
    }

    showFloatingText(x, y, text, color) {
        const floatText = this.add.text(x, y, text, {
            fontSize: '20px',
            fill: `#${color.toString(16).padStart(6, '0')}`,
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(200);
        
        this.tweens.add({
            targets: floatText,
            y: y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => floatText.destroy()
        });
    }

    completeBonus(success) {
        if (this.bonusComplete) return;
        this.bonusComplete = true;
        
        // Stop everything
        if (this.gameTimer) this.gameTimer.destroy();
        if (this.bananaManager) this.bananaManager.stop();
        this.physics.pause();
        
        // Calculate final rewards
        if (success) {
            // Survived! Calculate bonus
            this.bonusCoins += 50; // Base survival bonus
            this.bonusCoins += this.bananasDeflected * 3; // Extra per deflect
            
            // Chance for bonus robot part based on performance
            if (this.bananasDeflected >= 10 && this.timesSlipped === 0) {
                this.bonusParts = 1;
            }
        }
        
        // Show results
        this.showResults(success);
    }

    showResults(success) {
        // Overlay
        const overlay = this.add.rectangle(
            this.levelWidth / 2,
            this.levelHeight / 2,
            450,
            350,
            0x000000,
            0.9
        ).setDepth(300);
        
        // Title
        const title = success ? '🍌 BONUS COMPLETE! 🍌' : '🍌 BONUS FAILED 🍌';
        const titleColor = success ? '#00FF00' : '#FF0000';
        
        this.add.text(this.levelWidth / 2, this.levelHeight / 2 - 130, title, {
            fontSize: '32px',
            fill: titleColor,
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(301);
        
        // Stats
        const stats = [
            `Time Survived: ${this.bonusDuration - this.timeRemaining}/${this.bonusDuration}s`,
            `Bananas Deflected: ${this.bananasDeflected}`,
            `Times Slipped: ${this.timesSlipped}/${this.maxSlips}`,
            `Bonus Coins: +${this.bonusCoins}`,
        ];
        
        if (this.bonusParts > 0) {
            stats.push(`🎁 BONUS ROBOT PART!`);
        }
        
        stats.forEach((stat, i) => {
            const color = i === 3 ? '#FFD700' : (i === 4 ? '#9932CC' : '#ffffff');
            this.add.text(this.levelWidth / 2, this.levelHeight / 2 - 60 + (i * 35), stat, {
                fontSize: '18px',
                fill: color
            }).setOrigin(0.5).setDepth(301);
        });
        
        // Apply rewards to game
        if (window.gameInstance) {
            window.gameInstance.addScore(this.bonusCoins);
            
            if (this.bonusParts > 0) {
                const partTypes = ['head', 'body', 'arms', 'legs', 'powerCore'];
                const randomPart = partTypes[Math.floor(Math.random() * partTypes.length)];
                window.gameInstance.addRobotPart(randomPart, 'rare');
            }
        }
        
        // Continue button
        const continueBtn = this.add.text(this.levelWidth / 2, this.levelHeight / 2 + 120, 'Continue to Next Level', {
            fontSize: '22px',
            fill: '#ffffff',
            backgroundColor: '#4169e1',
            padding: { x: 25, y: 12 }
        }).setOrigin(0.5).setDepth(301).setInteractive();
        
        continueBtn.on('pointerdown', () => {
            // Go to craft scene or next level
            if (window.gameInstance) {
                window.gameInstance.gameData.currentLevel = this.nextLevel;
            }
            this.scene.start('CraftScene');
        });
        
        continueBtn.on('pointerover', () => continueBtn.setScale(1.1));
        continueBtn.on('pointerout', () => continueBtn.setScale(1.0));
    }

    update(time, delta) {
        if (!this.gameStarted || this.bonusComplete) return;
        
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
            this.completeBonus(false);
        }
    }

    updateUI() {
        this.timerText.setText(Math.max(0, this.timeRemaining).toString());
        this.slipsText.setText(`Slips: ${this.timesSlipped}/${this.maxSlips}`);
        this.deflectedText.setText(`Deflected: ${this.bananasDeflected}`);
        this.coinsText.setText(`Bonus: ${this.bonusCoins}`);
        
        // Color coding for slips
        if (this.timesSlipped >= this.maxSlips - 1) {
            this.slipsText.setColor('#FF0000');
        } else if (this.timesSlipped >= 1) {
            this.slipsText.setColor('#FFA500');
        }
    }

    setupKeyboardShortcuts() {
        this.input.keyboard.on('keydown-F', () => {
            if (window.gameInstance) {
                window.gameInstance.toggleFullscreen();
            }
        });
    }
}

console.log('✅ BananaBonusScene class defined:', typeof BananaBonusScene);
