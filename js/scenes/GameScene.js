// Main gameplay scene
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // Scene properties
        this.player = null;
        this.platforms = null;
        this.collectibles = null;
        this.enemies = null;
        this.background = null;
        this.foreground = null;
        
        // UI elements
        this.scoreText = null;
        this.healthBar = null;
        this.powerUpIcons = null;
        
        // Level properties
        this.levelWidth = 2048;
        this.levelHeight = 576;
        this.currentLevel = 1;
        
        // Game state
        this.gameStarted = false;
        this.gamePaused = false;
        this.levelComplete = false;
        
        // Collections
        this.robotPartsCollected = 0;
        this.coinsCollected = 0;
        this.totalRobotParts = 0;
        this.totalCoins = 0;
    }

    create() {
        try {
            console.log('GameScene create() started');
            
            // Get current level from game instance
            console.log('Getting current level...');
            this.currentLevel = window.gameInstance ? window.gameInstance.gameData.currentLevel : 1;
            console.log('Current level:', this.currentLevel);
            
            // Create world bounds
            console.log('Setting world bounds...');
            this.physics.world.setBounds(0, 0, this.levelWidth, this.levelHeight);
            console.log('✅ World bounds set');
            
            // Create background
            console.log('Creating background...');
            this.createBackground();
            console.log('✅ Background created');
            
            // Create platforms and level geometry
            console.log('Creating level geometry...');
            this.createLevel();
            console.log('✅ Level created');
            
            // Create player
            console.log('Creating player...');
            this.createPlayer();
            console.log('✅ Player created');
            
            // Create collectibles
            console.log('Creating collectibles...');
            this.createCollectibles();
            console.log('✅ Collectibles created');
            
            // Create enemies
            console.log('Creating enemies...');
            this.createEnemies();
            console.log('✅ Enemies created');
            
            // Set up camera
            console.log('Setting up camera...');
            this.setupCamera();
            console.log('✅ Camera setup complete');
            
            // Create UI
            console.log('Creating UI...');
            this.createUI();
            console.log('✅ UI created');
            
            // Set up collision detection
            console.log('Setting up collisions...');
            this.setupCollisions();
            console.log('✅ Collisions setup complete');
            
            // Start the game
            console.log('Starting game...');
            this.startGame();
            console.log('🎮 GameScene created successfully!');
            
        } catch (error) {
            console.error('💥 ERROR in GameScene.create():', error.message);
            console.error('Stack trace:', error.stack);
            
            // Show error on screen
            this.add.text(512, 288, 'Game Error: ' + error.message, {
                fontSize: '24px',
                fill: '#ff0000',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 }
            }).setOrigin(0.5);
            
            // Add simple background so user can see the error
            this.add.rectangle(512, 288, 1024, 576, 0x330000);
        }
    }

    createBackground() {
        // Create layered background based on current level theme
        const levelThemes = {
            1: { primary: 0x87ceeb, secondary: 0xb0e0e6, accent: 0x4682b4 }, // Ice
            2: { primary: 0xff6347, secondary: 0xff7f50, accent: 0xdc143c }, // Fire
            3: { primary: 0x9370db, secondary: 0xba55d3, accent: 0x8a2be2 }  // Power Bomb
        };
        
        const theme = levelThemes[this.currentLevel] || levelThemes[1];
        
        // Sky gradient
        this.background = this.add.rectangle(
            this.levelWidth / 2, 
            this.levelHeight / 2, 
            this.levelWidth, 
            this.levelHeight, 
            theme.primary
        );
        
        // Add some background elements
        this.createBackgroundElements(theme);
    }

    createBackgroundElements(theme) {
        // Create atmospheric elements based on level
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * this.levelWidth;
            const y = Math.random() * this.levelHeight * 0.7;
            const size = 10 + Math.random() * 20;
            
            let element;
            
            switch (this.currentLevel) {
                case 1: // Ice level - snowflakes
                    element = this.add.star(x, y, 6, size/2, size, theme.accent, 0.6);
                    break;
                    
                case 2: // Fire level - embers
                    element = this.add.circle(x, y, size/2, theme.accent, 0.7);
                    break;
                    
                case 3: // Power bomb level - energy particles
                    element = this.add.triangle(x, y, 0, size, size, 0, size, size, theme.accent, 0.8);
                    break;
                    
                default:
                    element = this.add.circle(x, y, size/2, theme.secondary, 0.5);
            }
            
            // Animate background elements
            this.tweens.add({
                targets: element,
                y: element.y + 100,
                alpha: 0,
                duration: 5000 + Math.random() * 10000,
                repeat: -1,
                yoyo: true
            });
        }
    }

    createLevel() {
        // Create platform group
        this.platforms = this.physics.add.staticGroup();
        
        // Create level-specific platforms
        this.createLevelPlatforms();
        
        // Create world boundaries
        this.createWorldBoundaries();
    }

    createLevelPlatforms() {
        const platformColor = this.getLevelPlatformColor();
        
        // Ground platforms
        for (let x = 0; x < this.levelWidth; x += 128) {
            const ground = this.add.rectangle(x + 64, this.levelHeight - 32, 128, 64, platformColor);
            this.physics.add.existing(ground, true);
            this.platforms.add(ground);
        }
        
        // Level-specific platform layouts
        switch (this.currentLevel) {
            case 1:
                this.createIceLevelPlatforms(platformColor);
                break;
            case 2:
                this.createFireLevelPlatforms(platformColor);
                break;
            case 3:
                this.createPowerBombLevelPlatforms(platformColor);
                break;
        }
    }

    createIceLevelPlatforms(color) {
        // Ice level - slippery platforms at various heights
        const platforms = [
            { x: 200, y: 400, w: 150, h: 20 },
            { x: 450, y: 350, w: 100, h: 20 },
            { x: 700, y: 300, w: 120, h: 20 },
            { x: 950, y: 250, w: 100, h: 20 },
            { x: 1200, y: 200, w: 150, h: 20 },
            { x: 1500, y: 300, w: 100, h: 20 },
            { x: 1800, y: 350, w: 120, h: 20 }
        ];
        
        platforms.forEach(p => {
            const platform = this.add.rectangle(p.x, p.y, p.w, p.h, color);
            platform.setStrokeStyle(2, 0x87ceeb);
            this.physics.add.existing(platform, true);
            this.platforms.add(platform);
        });
    }

    createFireLevelPlatforms(color) {
        // Fire level - platforms with gaps and hazards
        const platforms = [
            { x: 300, y: 450, w: 100, h: 20 },
            { x: 500, y: 380, w: 80, h: 20 },
            { x: 750, y: 320, w: 100, h: 20 },
            { x: 1000, y: 280, w: 60, h: 20 },
            { x: 1300, y: 240, w: 120, h: 20 },
            { x: 1600, y: 320, w: 100, h: 20 },
            { x: 1850, y: 400, w: 150, h: 20 }
        ];
        
        platforms.forEach(p => {
            const platform = this.add.rectangle(p.x, p.y, p.w, p.h, color);
            platform.setStrokeStyle(2, 0xff6347);
            this.physics.add.existing(platform, true);
            this.platforms.add(platform);
        });
    }

    createPowerBombLevelPlatforms(color) {
        // Power bomb level - complex platform layout
        const platforms = [
            { x: 250, y: 480, w: 80, h: 15 },
            { x: 450, y: 420, w: 60, h: 15 },
            { x: 650, y: 360, w: 80, h: 15 },
            { x: 850, y: 300, w: 60, h: 15 },
            { x: 1050, y: 240, w: 80, h: 15 },
            { x: 1250, y: 180, w: 60, h: 15 },
            { x: 1450, y: 240, w: 80, h: 15 },
            { x: 1650, y: 360, w: 100, h: 15 },
            { x: 1850, y: 450, w: 120, h: 15 }
        ];
        
        platforms.forEach(p => {
            const platform = this.add.rectangle(p.x, p.y, p.w, p.h, color);
            platform.setStrokeStyle(2, 0x9370db);
            this.physics.add.existing(platform, true);
            this.platforms.add(platform);
        });
    }

    getLevelPlatformColor() {
        const colors = {
            1: 0xb0e0e6, // Light blue for ice
            2: 0x8b4513, // Brown for fire/rock
            3: 0x4b0082  // Indigo for power bomb
        };
        return colors[this.currentLevel] || colors[1];
    }

    createWorldBoundaries() {
        // Left boundary
        const leftWall = this.add.rectangle(-10, this.levelHeight/2, 20, this.levelHeight, 0x000000, 0);
        this.physics.add.existing(leftWall, true);
        this.platforms.add(leftWall);
        
        // Right boundary
        const rightWall = this.add.rectangle(this.levelWidth + 10, this.levelHeight/2, 20, this.levelHeight, 0x000000, 0);
        this.physics.add.existing(rightWall, true);
        this.platforms.add(rightWall);
    }

    createPlayer() {
        // Spawn player at level start
        const spawnX = 100;
        const spawnY = this.levelHeight - 150;
        
        this.player = new Player(this, spawnX, spawnY);
        console.log('Player spawned at:', spawnX, spawnY);
    }

    createCollectibles() {
        this.collectibles = this.physics.add.group();
        
        // Create robot parts, coins, and power-ups throughout the level
        this.createRobotParts();
        this.createCoins();
        this.createPowerUps();
    }

    createRobotParts() {
        // Generate robot parts based on level
        const partLocations = this.getRobotPartLocations();
        
        partLocations.forEach(location => {
            const part = this.createRobotPart(location.x, location.y, location.type, location.rarity);
            this.collectibles.add(part);
            this.totalRobotParts++;
        });
    }

    getRobotPartLocations() {
        // Level-specific robot part placements
        const baseLocations = [
            { x: 300, y: 360, type: 'head', rarity: 'common' },
            { x: 700, y: 260, type: 'body', rarity: 'rare' },
            { x: 1200, y: 160, type: 'arms', rarity: 'common' },
            { x: 1500, y: 260, type: 'legs', rarity: 'common' },
            { x: 1800, y: 310, type: 'powerCore', rarity: 'epic' }
        ];
        
        return baseLocations;
    }

    createRobotPart(x, y, type, rarity) {
        const collectible = new Collectible(this, x, y, 'robotPart', rarity);
        return collectible.sprite;
    }

    createCoins() {
        // Create coins throughout the level
        const coinLocations = this.getCoinLocations();
        
        coinLocations.forEach(location => {
            const coin = this.createCoin(location.x, location.y);
            this.collectibles.add(coin);
            this.totalCoins++;
        });
    }

    getCoinLocations() {
        const locations = [];
        
        // Generate coins along platform paths
        for (let x = 150; x < this.levelWidth - 150; x += 200) {
            locations.push({ x: x, y: this.levelHeight - 200 });
            
            // Add some elevated coins
            if (Math.random() > 0.6) {
                locations.push({ x: x + 50, y: this.levelHeight - 300 });
            }
        }
        
        return locations;
    }

    createCoin(x, y) {
        const collectible = new Collectible(this, x, y, 'coin');
        return collectible.sprite;
    }

    createPowerUps() {
        // Create power-ups based on level
        const powerUpLocations = this.getPowerUpLocations();
        
        powerUpLocations.forEach(location => {
            const powerUp = this.createPowerUp(location.x, location.y, location.type);
            this.collectibles.add(powerUp);
        });
    }

    getPowerUpLocations() {
        const locations = [];
        
        // Level-specific power-ups
        switch (this.currentLevel) {
            case 1: // Ice level
                locations.push({ x: 500, y: 320, type: 'speedBoost' });
                locations.push({ x: 1300, y: 170, type: 'fireBreath' });
                break;
            case 2: // Fire level
                locations.push({ x: 750, y: 290, type: 'invincibility' });
                locations.push({ x: 1500, y: 290, type: 'ultraBlast' });
                break;
            case 3: // Power bomb level
                locations.push({ x: 650, y: 330, type: 'flyMode' });
                locations.push({ x: 1050, y: 210, type: 'fireBreath' });
                locations.push({ x: 1450, y: 210, type: 'ultraBlast' });
                break;
        }
        
        return locations;
    }

    createPowerUp(x, y, powerType) {
        const collectible = new Collectible(this, x, y, 'powerUp', powerType);
        return collectible.sprite;
    }

    createEnemies() {
        this.enemies = this.physics.add.group();
        
        // Create level-specific enemies
        const enemyPositions = this.getEnemyPositions();
        
        enemyPositions.forEach(pos => {
            let enemy;
            switch (this.currentLevel) {
                case 1:
                    enemy = window.EnemyFactory.createIceTitan(this, pos.x, pos.y);
                    break;
                case 2:
                    enemy = window.EnemyFactory.createFireTitan(this, pos.x, pos.y);
                    break;
                case 3:
                    enemy = window.EnemyFactory.createPowerTitan(this, pos.x, pos.y);
                    break;
                default:
                    enemy = window.EnemyFactory.createTitan(this, pos.x, pos.y);
            }
            
            enemy.sprite.setData('enemy', enemy);
            this.enemies.add(enemy.sprite);
        });
        
        console.log(`Created ${enemyPositions.length} enemies for level ${this.currentLevel}`);
    }

    getEnemyPositions() {
        // Level-specific enemy placement
        const basePositions = [
            { x: 400, y: this.levelHeight - 150 },
            { x: 800, y: this.levelHeight - 150 },
            { x: 1200, y: this.levelHeight - 150 },
            { x: 1600, y: this.levelHeight - 150 }
        ];
        
        // Add level-specific enemy positions
        switch (this.currentLevel) {
            case 1: // Ice level
                basePositions.push({ x: 600, y: 350 });
                break;
            case 2: // Fire level
                basePositions.push({ x: 1000, y: 250 });
                basePositions.push({ x: 1400, y: 290 });
                break;
            case 3: // Power bomb level
                basePositions.push({ x: 500, y: 400 });
                basePositions.push({ x: 900, y: 280 });
                basePositions.push({ x: 1300, y: 160 });
                break;
        }
        
        return basePositions;
    }

    setupCamera() {
        // Camera follows player
        this.cameras.main.startFollow(this.player.sprite);
        this.cameras.main.setBounds(0, 0, this.levelWidth, this.levelHeight);
        
        // Camera smoothing
        this.cameras.main.setLerp(0.1, 0.1);
        
        // Camera zoom based on level
        this.cameras.main.setZoom(1.0);
    }

    createUI() {
        // UI elements that stay fixed to camera
        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(100);
        
        this.robotPartsText = this.add.text(20, 60, 'Parts: 0/5', {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(100);
        
        this.coinsText = this.add.text(20, 100, 'Coins: 0', {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(100);
        
        // Health bar
        this.createHealthBar();
        
        // Level indicator
        this.levelText = this.add.text(20, 140, `Level ${this.currentLevel}`, {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setDepth(100);
    }

    createHealthBar() {
        const barWidth = 200;
        const barHeight = 20;
        const x = this.cameras.main.width - barWidth - 20;
        const y = 20;
        
        // Health bar background
        this.healthBarBg = this.add.rectangle(x, y, barWidth, barHeight, 0x000000)
            .setScrollFactor(0)
            .setDepth(100)
            .setOrigin(0, 0);
            
        // Health bar fill
        this.healthBarFill = this.add.rectangle(x + 2, y + 2, barWidth - 4, barHeight - 4, 0x00ff00)
            .setScrollFactor(0)
            .setDepth(101)
            .setOrigin(0, 0);
            
        // Health text
        this.healthText = this.add.text(x + barWidth/2, y + barHeight/2, '100/100', {
            fontSize: '14px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(102).setOrigin(0.5);
    }

    setupCollisions() {
        // Player vs platforms
        this.physics.add.collider(this.player.sprite, this.platforms);
        
        // Enemies vs platforms
        this.physics.add.collider(this.enemies, this.platforms);
        
        // Player vs collectibles
        this.physics.add.overlap(this.player.sprite, this.collectibles, this.collectItem, null, this);
        
        // Player vs enemies
        this.physics.add.overlap(this.player.sprite, this.enemies, this.hitEnemy, null, this);
    }

    hitEnemy(playerSprite, enemySprite) {
        // Get the enemy object
        const enemy = enemySprite.getData('enemy');
        if (!enemy || enemy.health <= 0) return;
        
        // Enhanced collision detection for Mario-style head stomping
        const player = this.player;
        const isPlayerAbove = player.sprite.y < enemy.sprite.y - 15; // Player above enemy
        const isPlayerFalling = player.body.velocity.y > 50; // Player falling downward
        const withinHorizontalRange = Math.abs(player.sprite.x - enemy.sprite.x) < 35; // Within stomp range
        
        // Check for head stomp vs normal collision
        if (isPlayerAbove && isPlayerFalling && withinHorizontalRange) {
            // Mario-style head stomp!
            this.executeHeadStomp(player, enemy);
        } else {
            // Normal enemy attack (existing behavior)
            enemy.performAttack(this.player);
        }
    }

    executeHeadStomp(player, enemy) {
        console.log('🦶 Head stomp executed!');
        
        // Player bounce effect (Mario-style)
        player.body.setVelocityY(-350); // Strong upward bounce
        
        // Deal massive damage to enemy (usually instant kill)
        const stompDamage = 75; // More than most enemy health
        enemy.takeDamage(stompDamage, 'stomp');
        
        // Create satisfying stomp visual effects
        this.createStompEffects(enemy.sprite.x, enemy.sprite.y);
        
        // Add enemy squash animation
        this.createEnemySquashEffect(enemy);
        
        // Scoring and combo system
        this.handleStompScoring();
        
        // Screen shake for impact feedback
        this.cameras.main.shake(150, 0.01);
        
        // Prevent immediate re-collision during bounce
        this.time.delayedCall(200, () => {
            // Re-enable collision after bounce
        });
    }

    createStompEffects(x, y) {
        // Main stomp impact effect
        const stompImpact = this.add.circle(x, y - 10, 25, 0xffd700, 0.8);
        stompImpact.setDepth(50);
        
        this.tweens.add({
            targets: stompImpact,
            scaleX: 2.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => stompImpact.destroy()
        });
        
        // Particle burst effect
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            const particle = this.add.circle(
                x + Math.cos(angle) * 15,
                y - 5 + Math.sin(angle) * 10,
                4 + Math.random() * 4,
                0xffff00,
                0.9
            );
            particle.setDepth(45);
            
            this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y - 5 + Math.sin(angle) * distance,
                alpha: 0,
                duration: 400 + Math.random() * 200,
                ease: 'Power1',
                onComplete: () => particle.destroy()
            });
        }
        
        // Dust clouds on impact
        for (let i = 0; i < 4; i++) {
            const dust = this.add.circle(
                x + (Math.random() - 0.5) * 40,
                y + 20,
                8 + Math.random() * 6,
                0xcccccc,
                0.6
            );
            dust.setDepth(40);
            
            this.tweens.add({
                targets: dust,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 600,
                ease: 'Power1',
                onComplete: () => dust.destroy()
            });
        }
    }

    createEnemySquashEffect(enemy) {
        // Temporarily squash the enemy sprite for visual impact
        const originalScale = { x: enemy.sprite.scaleX, y: enemy.sprite.scaleY };
        
        // Squash down effect
        this.tweens.add({
            targets: enemy.sprite,
            scaleX: 1.3,
            scaleY: 0.3,
            duration: 100,
            ease: 'Power2',
            yoyo: true,
            onComplete: () => {
                // Restore original scale
                enemy.sprite.setScale(originalScale.x, originalScale.y);
            }
        });
    }

    handleStompScoring() {
        // Initialize stomp combo if it doesn't exist
        if (!this.stompCombo) {
            this.stompCombo = 0;
        }
        
        this.stompCombo++;
        
        // Calculate bonus points based on combo
        const basePoints = 100;
        const comboMultiplier = Math.min(this.stompCombo, 5); // Cap at 5x
        const totalPoints = basePoints * comboMultiplier;
        
        // Add score
        window.gameInstance.addScore(totalPoints);
        
        // Create score popup
        const comboText = this.stompCombo > 1 ? ` (${this.stompCombo}x Combo!)` : '';
        this.createScorePopup(
            this.player.sprite.x, 
            this.player.sprite.y - 30, 
            `+${totalPoints}${comboText}`
        );
        
        // Reset combo after delay
        this.time.delayedCall(2000, () => {
            if (this.stompCombo > 0) {
                this.stompCombo = 0;
                console.log('Stomp combo reset');
            }
        });
        
        console.log(`Stomp! +${totalPoints} points (${this.stompCombo}x combo)`);
    }

    createScorePopup(x, y, text) {
        const scoreText = this.add.text(x, y, text, {
            fontSize: '20px',
            fill: '#ffff00',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(100);
        
        this.tweens.add({
            targets: scoreText,
            y: y - 50,
            alpha: 0,
            duration: 1200,
            ease: 'Power1',
            onComplete: () => scoreText.destroy()
        });
    }

    collectItem(playerSprite, itemSprite) {
        // Get the collectible object
        const collectible = itemSprite.getData('collectible');
        if (collectible) {
            collectible.collect(this.player);
        } else {
            // Fallback for old collectibles
            if (itemSprite.getData('isRobotPart')) {
                this.collectRobotPart(itemSprite);
            } else if (itemSprite.getData('isCoin')) {
                this.collectCoin(itemSprite);
            }
            itemSprite.destroy();
        }
    }

    collectRobotPart(part) {
        const type = part.getData('type');
        const rarity = part.getData('rarity');
        
        // Add to game data
        window.gameInstance.addRobotPart(type, rarity);
        
        this.robotPartsCollected++;
        
        // Create collection effect
        this.createCollectionEffect(part.x, part.y, 0x9932cc);
        
        console.log(`Collected ${rarity} ${type} part!`);
        
        // Check if level complete
        this.checkLevelComplete();
    }

    collectCoin(coin) {
        // Add score
        window.gameInstance.addScore(10);
        
        this.coinsCollected++;
        
        // Create collection effect
        this.createCollectionEffect(coin.x, coin.y, 0xffd700);
        
        console.log('Collected coin! +10 points');
    }

    createCollectionEffect(x, y, color) {
        const effect = this.add.circle(x, y, 20, color, 0.8);
        
        this.tweens.add({
            targets: effect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => effect.destroy()
        });
        
        // Add text popup
        const text = this.add.text(x, y - 30, '+Points!', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: text,
            y: y - 60,
            alpha: 0,
            duration: 800,
            onComplete: () => text.destroy()
        });
    }

    startGame() {
        this.gameStarted = true;
        console.log(`Level ${this.currentLevel} started!`);
    }

    checkLevelComplete() {
        if (this.robotPartsCollected >= this.totalRobotParts) {
            this.levelComplete = true;
            this.completeLevel();
        }
    }

    completeLevel() {
        console.log(`Level ${this.currentLevel} completed!`);
        
        // Show completion message
        const completionText = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY,
            'Level Complete!\nGoing to Craft Mode...', 
            {
                fontSize: '32px',
                fill: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 },
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(200);
        
        // Transition to craft scene after delay
        this.time.delayedCall(2000, () => {
            window.gameInstance.nextLevel();
        });
    }

    update(time, delta) {
        if (!this.gameStarted || this.gamePaused) return;
        
        // Update player
        if (this.player) {
            this.player.update(time, delta);
        }
        
        // Update enemies
        if (this.enemies) {
            this.enemies.children.entries.forEach(enemySprite => {
                const enemy = enemySprite.getData('enemy');
                if (enemy && enemy.health > 0) {
                    enemy.update(time, delta);
                }
            });
        }
        
        // Update collectibles
        if (this.collectibles) {
            this.collectibles.children.entries.forEach(itemSprite => {
                const collectible = itemSprite.getData('collectible');
                if (collectible) {
                    collectible.update(time, delta);
                }
            });
        }
        
        // Update UI
        this.updateUI();
        
        // Check for game over conditions
        this.checkGameOver();
    }

    updateUI() {
        // Update score
        this.scoreText.setText(`Score: ${window.GameUtils.formatScore(window.gameInstance.gameData.score)}`);
        
        // Update robot parts
        this.robotPartsText.setText(`Parts: ${this.robotPartsCollected}/${this.totalRobotParts}`);
        
        // Update coins
        this.coinsText.setText(`Coins: ${this.coinsCollected}`);
        
        // Update health bar
        if (this.player) {
            const healthPercent = this.player.health / this.player.maxHealth;
            this.healthBarFill.scaleX = healthPercent;
            
            // Change color based on health
            if (healthPercent > 0.6) {
                this.healthBarFill.setFillStyle(0x00ff00);
            } else if (healthPercent > 0.3) {
                this.healthBarFill.setFillStyle(0xffff00);
            } else {
                this.healthBarFill.setFillStyle(0xff0000);
            }
            
            this.healthText.setText(`${this.player.health}/${this.player.maxHealth}`);
        }
    }

    checkGameOver() {
        if (this.player && this.player.health <= 0) {
            this.gameOver();
        }
        
        // Check if player fell off the world
        if (this.player && this.player.sprite.y > this.levelHeight + 100) {
            this.player.takeDamage(25);
            this.player.setPosition(100, this.levelHeight - 150); // Respawn
        }
    }

    gameOver() {
        console.log('Game Over!');
        this.scene.restart();
    }

    // Scene management
    pause() {
        this.gamePaused = true;
        this.physics.pause();
    }

    resume() {
        this.gamePaused = false;
        this.physics.resume();
    }
}
