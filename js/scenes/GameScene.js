// Main gameplay scene
console.log('🎮 GameScene.js loading...');
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
        this.finishLine = null;
        this.finishLineZone = null;
        
        // Game state
        this.gameStarted = false;
        this.gamePaused = false;
        this.levelComplete = false;
        
        // Collections
        this.robotPartsCollected = 0;
        this.coinsCollected = 0;
        this.totalRobotParts = 0;
        this.totalCoins = 0;
        this.enemiesDefeated = 0;
        this.totalEnemies = 0;
        
        // Star rating system
        this.levelStartTime = 0;
        this.damageTaken = 0;
        this.starsEarned = 0;
    }

    create() {
        try {
            console.log('GameScene create() started');
            
            // Reset level completion state for new level
            this.levelComplete = false;
            
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
            
            // Create finish line
            console.log('Creating finish line...');
            this.createFinishLine();
            console.log('✅ Finish line created');
            
            // Set up collision detection
            console.log('Setting up collisions...');
            this.setupCollisions();
            console.log('✅ Collisions setup complete');
            
            // Start the game
            console.log('Starting game...');
            this.startGame();
            
            // Set up keyboard shortcuts (like fullscreen)
            this.setupKeyboardShortcuts();
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
            3: { primary: 0x9370db, secondary: 0xba55d3, accent: 0x8a2be2 }, // Power Bomb
            4: { primary: 0x1e3a8a, secondary: 0x3b82f6, accent: 0xfbbf24 }, // Lightning
            5: { primary: 0x1a1a2e, secondary: 0x16213e, accent: 0x4a5568 }  // Shadow
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
                    
                case 4: // Lightning level - electric sparks
                    element = this.add.star(x, y, 4, size/3, size, theme.accent, 0.9);
                    break;
                    
                case 5: // Shadow level - dark wisps
                    element = this.add.ellipse(x, y, size, size * 1.5, theme.accent, 0.5);
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
            case 4:
                this.createLightningLevelPlatforms(platformColor);
                break;
            case 5:
                this.createShadowLevelPlatforms(platformColor);
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

    createLightningLevelPlatforms(color) {
        // Lightning level - electrified platforms with wide gaps
        const platforms = [
            { x: 280, y: 460, w: 100, h: 18 },
            { x: 520, y: 390, w: 70, h: 18 },
            { x: 780, y: 310, w: 90, h: 18 },
            { x: 1040, y: 250, w: 65, h: 18 },
            { x: 1320, y: 200, w: 100, h: 18 },
            { x: 1580, y: 280, w: 80, h: 18 },
            { x: 1820, y: 380, w: 110, h: 18 }
        ];
        
        platforms.forEach(p => {
            const platform = this.add.rectangle(p.x, p.y, p.w, p.h, color);
            platform.setStrokeStyle(2, 0xfbbf24);
            this.physics.add.existing(platform, true);
            this.platforms.add(platform);
            
            // Add electric glow effect
            const glow = this.add.circle(p.x, p.y, p.w/2 + 10, 0xfbbf24, 0.2);
            glow.setDepth(-1);
            
            // Pulse animation for lightning effect
            this.tweens.add({
                targets: glow,
                alpha: 0.4,
                duration: 800 + Math.random() * 400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    createShadowLevelPlatforms(color) {
        // Shadow level - dark, mysterious platforms with tricky spacing
        const platforms = [
            { x: 220, y: 480, w: 90, h: 16 },
            { x: 420, y: 430, w: 75, h: 16 },
            { x: 630, y: 370, w: 85, h: 16 },
            { x: 850, y: 300, w: 70, h: 16 },
            { x: 1080, y: 230, w: 90, h: 16 },
            { x: 1310, y: 170, w: 65, h: 16 },
            { x: 1530, y: 250, w: 95, h: 16 },
            { x: 1750, y: 340, w: 85, h: 16 },
            { x: 1900, y: 420, w: 100, h: 16 }
        ];
        
        platforms.forEach(p => {
            const platform = this.add.rectangle(p.x, p.y, p.w, p.h, color);
            platform.setStrokeStyle(2, 0x4a5568);
            this.physics.add.existing(platform, true);
            this.platforms.add(platform);
            
            // Add shadow aura effect
            const shadow = this.add.ellipse(p.x, p.y + 5, p.w + 20, p.h + 10, 0x000000, 0.4);
            shadow.setDepth(-1);
            
            // Subtle fade animation
            this.tweens.add({
                targets: shadow,
                alpha: 0.6,
                duration: 1500 + Math.random() * 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    getLevelPlatformColor() {
        const colors = {
            1: 0xb0e0e6, // Light blue for ice
            2: 0x8b4513, // Brown for fire/rock
            3: 0x4b0082, // Indigo for power bomb
            4: 0x1e40af, // Deep blue for lightning
            5: 0x0f172a  // Very dark blue for shadow
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
        try {
            console.log('🔧 Creating robot parts...');
            // Generate robot parts based on level
            const partLocations = this.getRobotPartLocations();
            console.log('Part locations:', partLocations);
            
            if (!Array.isArray(partLocations)) {
                console.error('❌ partLocations is not an array:', partLocations);
                return;
            }
            
            partLocations.forEach((location, index) => {
                console.log(`Creating part ${index}:`, location);
                const collectible = this.createRobotPart(location.x, location.y, location.type, location.rarity);
                // Note: Don't add to physics group again - collectible constructor already handles physics
                this.totalRobotParts++;
                console.log(`✅ Created robot part: ${location.type} at (${location.x}, ${location.y})`);
            });
            console.log(`🎯 Total robot parts created: ${this.totalRobotParts}`);
        } catch (error) {
            console.error('❌ Error in createRobotParts:', error);
        }
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
        // Create collectible with part type as rarity parameter (will be processed in constructor)
        const collectible = new Collectible(this, x, y, 'robotPart', type);
        // Set the actual rarity if provided
        if (rarity && rarity !== type) {
            collectible.rarity = rarity;
        }
        
        // Add to collectibles group and let it handle physics
        this.collectibles.add(collectible.sprite);
        
        // Force physics body creation if it doesn't exist
        if (!collectible.sprite.body) {
            console.log('🔧 No physics body found, creating manually...');
            this.physics.add.existing(collectible.sprite);
        }
        
        // Configure physics after ensuring body exists
        if (collectible.sprite.body) {
            collectible.sprite.body.setImmovable(true);
            // Try multiple ways to disable gravity
            collectible.sprite.body.setGravityY(0);
            if (collectible.sprite.body.setIgnoreGravity) {
                collectible.sprite.body.setIgnoreGravity(true);
            }
            collectible.sprite.body.setVelocity(0, 0);
            collectible.sprite.body.setSize(16, 16); // Set collision size
            
            // Force disable all physics movement
            collectible.sprite.body.setMaxVelocity(0, 0);
            collectible.sprite.body.setDrag(1000, 1000); // High drag to stop movement
            
            console.log(`⚙️ Configured physics for robot part at (${collectible.sprite.x}, ${collectible.sprite.y})`);
            console.log(`   - Gravity Y: ${collectible.sprite.body.gravity.y}`);
            console.log(`   - Immovable: ${collectible.sprite.body.immovable}`);
        } else {
            console.error('❌ Still no physics body found for robot part!');
        }
        
        return collectible;
    }

    createCoins() {
        try {
            console.log('🪙 Creating coins...');
            // Create coins throughout the level
            const coinLocations = this.getCoinLocations();
            console.log('Coin locations:', coinLocations);
            
            if (!Array.isArray(coinLocations)) {
                console.error('❌ coinLocations is not an array:', coinLocations);
                return;
            }
            
            coinLocations.forEach((location, index) => {
                console.log(`Creating coin ${index}:`, location);
                const collectible = this.createCoin(location.x, location.y);
                // Note: Don't add to physics group again - collectible constructor already handles physics
                this.totalCoins++;
                console.log(`✅ Created coin at (${location.x}, ${location.y})`);
            });
            console.log(`🎯 Total coins created: ${this.totalCoins}`);
        } catch (error) {
            console.error('❌ Error in createCoins:', error);
        }
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
        
        // Add to collectibles group and let it handle physics
        this.collectibles.add(collectible.sprite);
        
        // Force physics body creation if it doesn't exist
        if (!collectible.sprite.body) {
            console.log('🔧 No physics body found, creating manually...');
            this.physics.add.existing(collectible.sprite);
        }
        
        // Configure physics after ensuring body exists
        if (collectible.sprite.body) {
            collectible.sprite.body.setImmovable(true);
            // Try multiple ways to disable gravity
            collectible.sprite.body.setGravityY(0);
            if (collectible.sprite.body.setIgnoreGravity) {
                collectible.sprite.body.setIgnoreGravity(true);
            }
            collectible.sprite.body.setVelocity(0, 0);
            collectible.sprite.body.setSize(16, 16); // Set collision size
            
            // Force disable all physics movement
            collectible.sprite.body.setMaxVelocity(0, 0);
            collectible.sprite.body.setDrag(1000, 1000); // High drag to stop movement
            
            console.log(`⚙️ Configured physics for coin at (${collectible.sprite.x}, ${collectible.sprite.y})`);
        } else {
            console.error('❌ Still no physics body found for coin!');
        }
        
        return collectible;
    }

    createPowerUps() {
        try {
            console.log('⚡ Creating power-ups...');
            // Create power-ups based on level
            const powerUpLocations = this.getPowerUpLocations();
            console.log('Power-up locations:', powerUpLocations);
            
            if (!Array.isArray(powerUpLocations)) {
                console.error('❌ powerUpLocations is not an array:', powerUpLocations);
                return;
            }
            
            powerUpLocations.forEach((location, index) => {
                console.log(`Creating power-up ${index}:`, location);
                const collectible = this.createPowerUp(location.x, location.y, location.type);
                // Note: Don't add to physics group again - collectible constructor already handles physics
                console.log(`✅ Created power-up: ${location.type} at (${location.x}, ${location.y})`);
            });
        } catch (error) {
            console.error('❌ Error in createPowerUps:', error);
        }
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
            case 4: // Lightning level
                locations.push({ x: 780, y: 280, type: 'speedBoost' });
                locations.push({ x: 1320, y: 170, type: 'ultraBlast' });
                locations.push({ x: 1580, y: 250, type: 'invincibility' });
                break;
            case 5: // Shadow level
                locations.push({ x: 630, y: 340, type: 'flyMode' });
                locations.push({ x: 1080, y: 200, type: 'fireBreath' });
                locations.push({ x: 1530, y: 220, type: 'ultraBlast' });
                locations.push({ x: 1750, y: 310, type: 'invincibility' });
                break;
        }
        
        return locations;
    }

    createPowerUp(x, y, powerType) {
        const collectible = new Collectible(this, x, y, 'powerUp', powerType);
        
        // Add to collectibles group and let it handle physics
        this.collectibles.add(collectible.sprite);
        
        // Force physics body creation if it doesn't exist
        if (!collectible.sprite.body) {
            console.log('🔧 No physics body found, creating manually...');
            this.physics.add.existing(collectible.sprite);
        }
        
        // Configure physics after ensuring body exists
        if (collectible.sprite.body) {
            collectible.sprite.body.setImmovable(true);
            // Try multiple ways to disable gravity
            collectible.sprite.body.setGravityY(0);
            if (collectible.sprite.body.setIgnoreGravity) {
                collectible.sprite.body.setIgnoreGravity(true);
            }
            collectible.sprite.body.setVelocity(0, 0);
            collectible.sprite.body.setSize(16, 16); // Set collision size
            
            // Force disable all physics movement
            collectible.sprite.body.setMaxVelocity(0, 0);
            collectible.sprite.body.setDrag(1000, 1000); // High drag to stop movement
            
            console.log(`⚙️ Configured physics for power-up at (${collectible.sprite.x}, ${collectible.sprite.y})`);
        } else {
            console.error('❌ Still no physics body found for power-up!');
        }
        
        return collectible;
    }

    createEnemies() {
        this.enemies = this.physics.add.group();
        
        // Create level-specific enemies
        const enemyPositions = this.getEnemyPositions();
        this.totalEnemies = enemyPositions.length;
        
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
                case 4:
                    enemy = window.EnemyFactory.createLightningTitan(this, pos.x, pos.y);
                    break;
                case 5:
                    enemy = window.EnemyFactory.createShadowTitan(this, pos.x, pos.y);
                    break;
                default:
                    enemy = window.EnemyFactory.createTitan(this, pos.x, pos.y);
            }
            
            enemy.sprite.setData('enemy', enemy);
            this.enemies.add(enemy.sprite);
        });
        
        console.log(`Created ${this.totalEnemies} enemies for level ${this.currentLevel}`);
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
            case 4: // Lightning level
                basePositions.push({ x: 520, y: 360 });
                basePositions.push({ x: 1040, y: 220 });
                basePositions.push({ x: 1320, y: 170 });
                basePositions.push({ x: 1820, y: 350 });
                break;
            case 5: // Shadow level
                basePositions.push({ x: 420, y: 400 });
                basePositions.push({ x: 850, y: 270 });
                basePositions.push({ x: 1080, y: 200 });
                basePositions.push({ x: 1530, y: 220 });
                basePositions.push({ x: 1900, y: 390 });
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
        
        // Finish line indicator
        this.finishLineIndicator = this.add.text(20, 180, '🏁 Reach the finish line!', {
            fontSize: '16px',
            fill: '#FFD700',
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
        
        // Player vs finish line
        this.physics.add.overlap(this.player.sprite, this.finishLineZone, this.reachFinishLine, null, this);
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
        console.log('💫 Collection triggered!', itemSprite);
        // Get the collectible object
        const collectible = itemSprite.getData('collectible');
        if (collectible) {
            console.log('✅ Found collectible object, calling collect...');
            collectible.collect(this.player);
        } else {
            console.log('⚠️ No collectible object found, using fallback...');
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
        this.levelStartTime = Date.now();
        this.damageTaken = 0;
        this.enemiesDefeated = 0;
        console.log(`Level ${this.currentLevel} started!`);
    }

    createFinishLine() {
        // Position finish line on the last platform for accessibility
        let finishX, platformY;
        switch (this.currentLevel) {
            case 1: // Ice level - last platform at x: 1800, y: 350
                finishX = 1800;
                platformY = 350;
                break;
            case 2: // Fire level - last platform at x: 1850, y: 400
                finishX = 1850;
                platformY = 400;
                break;
            case 3: // Power bomb level - last platform at x: 1850, y: 450
                finishX = 1850;
                platformY = 450;
                break;
            case 4: // Lightning level - last platform at x: 1820, y: 380
                finishX = 1820;
                platformY = 380;
                break;
            case 5: // Shadow level - last platform at x: 1900, y: 420
                finishX = 1900;
                platformY = 420;
                break;
            default:
                finishX = this.levelWidth - 200; // Fallback
                platformY = this.levelHeight - 100;
        }
        const finishY = this.levelHeight / 2;
        
        // Create visual finish line with animated flag
        this.finishLine = this.add.container(finishX, finishY);
        
        // Flag pole
        const pole = this.add.rectangle(0, 0, 8, 200, 0x8B4513);
        pole.setOrigin(0.5, 1);
        
        // Animated flag
        const flag = this.add.rectangle(4, -150, 60, 40, 0xFF6B35);
        flag.setOrigin(0, 0.5);
        
        // Flag pattern (checkered)
        const pattern = this.add.rectangle(34, -150, 30, 40, 0xFFFFFF);
        pattern.setOrigin(0, 0.5);
        
        // "FINISH" text
        const finishText = this.add.text(0, -200, 'FINISH', {
            fontSize: '20px',
            fill: '#FFD700',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        this.finishLine.add([pole, flag, pattern, finishText]);
        this.finishLine.setDepth(50);
        
        // Create invisible collision zone for finish line positioned relative to the platform
        // Position it slightly above the platform to ensure proper collision detection
        const collisionZoneY = platformY - 50; // 50 pixels above the platform
        const collisionZoneHeight = this.levelHeight - platformY + 100; // From above platform to bottom of level
        this.finishLineZone = this.add.rectangle(finishX, collisionZoneY, 80, collisionZoneHeight, 0x00FF00, 0); // Invisible collision zone
        this.physics.add.existing(this.finishLineZone, true);
        
        
        // Animate flag waving
        this.tweens.add({
            targets: flag,
            scaleX: 0.9,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        console.log(`🏁 Finish line created at x: ${finishX}`);
    }

    reachFinishLine(playerSprite, finishZone) {
        if (!this.levelComplete) {
            console.log('🏁 Player reached finish line!');
            this.levelComplete = true;
            this.calculateStarRating();
            this.completeLevel();
        }
    }

    checkLevelComplete() {
        // Level completion is now handled by reaching the finish line
        // This method can be used for other completion checks if needed
        console.log(`📊 Progress: Parts ${this.robotPartsCollected}/${this.totalRobotParts}, Coins ${this.coinsCollected}/${this.totalCoins}`);
    }

    showCompletionChoice() {
        // Create completion choice UI
        if (this.completionChoiceShown) return; // Don't show multiple times
        this.completionChoiceShown = true;
        
        const overlay = this.add.rectangle(
            this.cameras.main.centerX, 
            this.cameras.main.centerY, 
            400, 
            200, 
            0x000000, 
            0.8
        ).setOrigin(0.5).setScrollFactor(0).setDepth(300);
        
        const titleText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 40,
            'Minimum Requirements Met!',
            {
                fontSize: '24px',
                fill: '#ffffff',
                fontWeight: 'bold'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(301);
        
        const instructionText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            `Parts: ${this.robotPartsCollected}/${this.totalRobotParts}\nCollect more for better rating?`,
            {
                fontSize: '16px',
                fill: '#cccccc',
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(301);
        
        // Complete Now button
        const completeButton = this.add.text(
            this.cameras.main.centerX - 80,
            this.cameras.main.centerY + 50,
            'Complete Now',
            {
                fontSize: '18px',
                fill: '#ffffff',
                backgroundColor: '#4169e1',
                padding: { x: 15, y: 8 }
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(301).setInteractive();
        
        // Continue button
        const continueButton = this.add.text(
            this.cameras.main.centerX + 80,
            this.cameras.main.centerY + 50,
            'Keep Playing',
            {
                fontSize: '18px',
                fill: '#ffffff',
                backgroundColor: '#228b22',
                padding: { x: 15, y: 8 }
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(301).setInteractive();
        
        // Button handlers
        completeButton.on('pointerdown', () => {
            this.levelComplete = true;
            this.calculateStarRating();
            this.completeLevel();
            // Clean up UI
            [overlay, titleText, instructionText, completeButton, continueButton].forEach(obj => obj.destroy());
        });
        
        continueButton.on('pointerdown', () => {
            // Clean up UI and continue playing
            [overlay, titleText, instructionText, completeButton, continueButton].forEach(obj => obj.destroy());
            this.completionChoiceShown = false; // Allow showing again if they collect more
        });
        
        // Store UI elements for cleanup
        this.completionUI = [overlay, titleText, instructionText, completeButton, continueButton];
    }

    calculateStarRating() {
        const levelDuration = (Date.now() - this.levelStartTime) / 1000; // seconds
        const partsPercent = this.robotPartsCollected / this.totalRobotParts;
        const coinsPercent = this.coinsCollected / this.totalCoins;
        const enemiesPercent = this.enemiesDefeated / this.totalEnemies;
        
        let stars = 1; // Default: basic completion
        
        // 2 Star criteria (Good Performance) - achievable without 100% collection
        if (partsPercent >= 0.6 && // 60% of parts (minimum for meaningful progress)
            coinsPercent >= 0.5 && // 50% of coins  
            levelDuration <= 180 && // Under 3 minutes
            this.damageTaken < 50) { // Less than 50 damage
            stars = 2;
        }
        
        // 3 Star criteria (Perfect Performance) - still challenging but achievable
        if (partsPercent >= 0.8 && // 80% of parts (high but not impossible)
            coinsPercent >= 0.8 && // 80% of coins
            enemiesPercent >= 0.7 && // 70% enemies defeated
            levelDuration <= 120 && // Under 2 minutes
            this.damageTaken < 25) { // Less than 25 damage
            stars = 3;
        }
        
        this.starsEarned = stars;
        
        // Save star rating to game data
        this.saveLevelStars(stars);
        
        console.log(`Level ${this.currentLevel} completed with ${stars} stars!`);
        console.log(`Stats - Parts: ${Math.round(partsPercent*100)}%, Coins: ${Math.round(coinsPercent*100)}%, Enemies: ${Math.round(enemiesPercent*100)}%, Time: ${Math.round(levelDuration)}s, Damage: ${this.damageTaken}`);
    }

    saveLevelStars(stars) {
        if (!window.gameInstance.gameData.levelStars) {
            window.gameInstance.gameData.levelStars = {};
        }
        
        // Only save if this is better than previous attempt
        const previousStars = window.gameInstance.gameData.levelStars[this.currentLevel] || 0;
        if (stars > previousStars) {
            window.gameInstance.gameData.levelStars[this.currentLevel] = stars;
            window.gameInstance.saveGameData();
        }
    }

    completeLevel() {
        console.log(`Level ${this.currentLevel} completed with ${this.starsEarned} stars!`);
        
        // Create star display
        this.createStarDisplay();
        
        // Transition to craft scene after delay
        this.time.delayedCall(4000, () => {
            window.gameInstance.nextLevel();
        });
    }

    createStarDisplay() {
        // Create completion overlay
        const overlay = this.add.rectangle(
            this.cameras.main.centerX, 
            this.cameras.main.centerY, 
            400, 
            300, 
            0x000000, 
            0.8
        ).setOrigin(0.5).setScrollFactor(0).setDepth(200);
        
        // Level completed text
        const titleText = this.add.text(
            this.cameras.main.centerX, 
            this.cameras.main.centerY - 80,
            'Level Complete!', 
            {
                fontSize: '32px',
                fill: '#ffffff',
                fontWeight: 'bold'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(201);
        
        // Star display
        const starY = this.cameras.main.centerY - 20;
        for (let i = 0; i < 3; i++) {
            const starX = this.cameras.main.centerX - 40 + (i * 40);
            const earned = i < this.starsEarned;
            const star = this.add.star(
                starX, starY, 5, 10, 20, 
                earned ? 0xffd700 : 0x444444
            ).setOrigin(0.5).setScrollFactor(0).setDepth(201);
            
            // Animate stars being earned
            if (earned) {
                star.setScale(0);
                this.tweens.add({
                    targets: star,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 300,
                    delay: i * 200,
                    ease: 'Back.easeOut'
                });
            }
        }
        
        // Performance stats
        const statsText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 40,
            this.getPerformanceText(),
            {
                fontSize: '14px',
                fill: '#cccccc',
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(201);
        
        // Continue text
        const continueText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 100,
            'Going to Craft Mode...',
            {
                fontSize: '18px',
                fill: '#ffffff'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    }

    getPerformanceText() {
        const levelDuration = (Date.now() - this.levelStartTime) / 1000;
        const partsPercent = Math.round((this.robotPartsCollected / this.totalRobotParts) * 100);
        const coinsPercent = Math.round((this.coinsCollected / this.totalCoins) * 100);
        const enemiesPercent = Math.round((this.enemiesDefeated / this.totalEnemies) * 100);
        
        return `Parts: ${partsPercent}% • Coins: ${coinsPercent}% • Enemies: ${enemiesPercent}%\nTime: ${Math.round(levelDuration)}s • Damage Taken: ${this.damageTaken}`;
    }

    checkEnemyDefeats() {
        // Count defeated enemies
        let currentDefeated = 0;
        this.enemies.children.entries.forEach(enemySprite => {
            const enemy = enemySprite.getData('enemy');
            if (enemy && enemy.health <= 0) {
                currentDefeated++;
            }
        });
        
        // Update count if increased
        if (currentDefeated > this.enemiesDefeated) {
            this.enemiesDefeated = currentDefeated;
        }
    }

    // Called by Player when taking damage (for star rating tracking)
    onPlayerDamage(amount) {
        this.damageTaken += amount;
        console.log(`Player took ${amount} damage. Total damage: ${this.damageTaken}`);
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
        
        // Check for enemy defeats
        this.checkEnemyDefeats();
        
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

    // Keyboard shortcuts setup
    setupKeyboardShortcuts() {
        // Fullscreen toggle with F key
        this.input.keyboard.on('keydown-F', () => {
            if (window.gameInstance) {
                window.gameInstance.toggleFullscreen();
            }
        });
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
console.log('✅ GameScene class defined:', typeof GameScene);
