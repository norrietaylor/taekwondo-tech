// Main Game Configuration
class TaekwondoRobotBuilder {
    constructor() {
        // Dragon Costume Definitions
        this.dragonCostumes = {
            'default': {
                name: 'Default Gi',
                icon: '🥋',
                primaryColor: 0x4a9eff,
                secondaryColor: 0x3a7eff,
                beltColor: 0x8b4513,
                description: 'Traditional martial arts uniform',
                unlockCondition: 'Always available',
                effectColor: 0x87ceeb,
                unlocked: true,
                hasWings: false,
                wingColor: null,
                wingStyle: 'none'
            },
            'fire': {
                name: 'Fire Dragon',
                icon: '🔥',
                primaryColor: 0xff4500,
                secondaryColor: 0xff6347,
                beltColor: 0xff0000,
                description: 'Harness the power of flames',
                unlockCondition: 'Complete Level 1',
                effectColor: 0xff8c00,
                unlocked: false,
                hasWings: true,
                wingColor: 0xff6347,
                wingStyle: 'flame',
                wingTipColor: 0xff0000,
                // Fire Dragon Projectile - Fireballs
                projectileEnabled: true,
                projectileType: 'fireball',
                projectileColor: 0xff4500,
                projectileSecondaryColor: 0xff6347,
                projectileDamage: 20,
                projectileSpeed: 500,
                projectileSize: 18,
                projectileEffect: 'burn' // Leaves burning trail
            },
            'ice': {
                name: 'Ice Dragon',
                icon: '❄️',
                primaryColor: 0x87ceeb,
                secondaryColor: 0xb0e0e6,
                beltColor: 0x4682b4,
                description: 'Channel the cold of winter',
                unlockCondition: 'Collect 5 robot parts',
                effectColor: 0xadd8e6,
                unlocked: false,
                hasWings: true,
                wingColor: 0xb0e0e6,
                wingStyle: 'crystal',
                wingTipColor: 0xffffff,
                // Ice Dragon Projectile - Ice shards
                projectileEnabled: true,
                projectileType: 'ice',
                projectileColor: 0x87ceeb,
                projectileSecondaryColor: 0xffffff,
                projectileDamage: 15,
                projectileSpeed: 550,
                projectileSize: 15,
                projectileEffect: 'freeze' // Slows enemies
            },
            'lightning': {
                name: 'Lightning Dragon',
                icon: '⚡',
                primaryColor: 0xffd700,
                secondaryColor: 0x9370db,
                beltColor: 0x8b008b,
                description: 'Strike with electric fury',
                unlockCondition: 'Complete Level 2',
                effectColor: 0xffff00,
                unlocked: false,
                hasWings: true,
                wingColor: 0xffd700,
                wingStyle: 'electric',
                wingTipColor: 0x9370db,
                // Lightning Dragon Projectile - Lightning bolts
                projectileEnabled: true,
                projectileType: 'lightning',
                projectileColor: 0xffd700,
                projectileSecondaryColor: 0xffff00,
                projectileDamage: 22,
                projectileSpeed: 700,
                projectileSize: 20,
                projectileEffect: 'chain' // Can chain to nearby enemies
            },
            'shadow': {
                name: 'Shadow Dragon',
                icon: '🌙',
                primaryColor: 0x4b0082,
                secondaryColor: 0x2f1b3c,
                beltColor: 0x000000,
                description: 'Master of darkness and stealth',
                unlockCondition: 'Complete Level 4',
                effectColor: 0x9400d3,
                unlocked: false,
                hasWings: true,
                wingColor: 0x2f1b3c,
                wingStyle: 'shadow',
                wingTipColor: 0x000000,
                // Shadow Dragon Projectile - Smoke clouds
                projectileEnabled: true,
                projectileType: 'smoke',
                projectileColor: 0x2f1b3c,
                projectileSecondaryColor: 0x4b0082,
                projectileDamage: 18,
                projectileSpeed: 350,
                projectileSize: 25,
                projectileEffect: 'expand' // Smoke expands as it travels
            },
            'earth': {
                name: 'Earth Dragon',
                icon: '🌍',
                primaryColor: 0x8b4513,
                secondaryColor: 0x654321,
                beltColor: 0x228b22,
                description: 'Shake the very foundations',
                unlockCondition: 'Complete level 5',
                effectColor: 0xa0522d,
                unlocked: false,
                hasWings: true,
                wingColor: 0x654321,
                wingStyle: 'stone',
                wingTipColor: 0x228b22,
                // Earth Dragon Projectile - Earth quake/boulder
                projectileEnabled: true,
                projectileType: 'earthquake',
                projectileColor: 0x8b4513,
                projectileSecondaryColor: 0x654321,
                projectileDamage: 25,
                projectileSpeed: 400,
                projectileSize: 30,
                projectileEffect: 'shake' // Creates screen shake on hit
            },
            'legendary': {
                name: 'Legendary Mode',
                icon: '⚡🔥❄️🌙🌍🥋',
                primaryColor: 0xffd700, // Gold for main body
                secondaryColor: 0xff4500, // Red-orange
                beltColor: 0x8b4513, // Brown from default
                description: 'Ultimate fusion of all 6 dragon powers!',
                unlockCondition: 'Collect all robot parts',
                effectColor: 0xffffff, // White/rainbow
                unlocked: false,
                hasWings: true,
                wingColor: 0xffd700,
                wingStyle: 'legendary',
                wingTipColor: 0xff00ff,
                isLegendary: true,
                size: 2.5, // 2.5x normal size
                bodyPartMapping: {
                    leftLeg: 'ice',    // Ice Dragon
                    rightLeg: 'fire',   // Fire Dragon
                    leftArm: 'lightning', // Lightning Dragon
                    rightArm: 'shadow',  // Shadow Dragon
                    body: 'default',      // Default Gi
                    head: 'earth'        // Earth Dragon
                },
                fireballEnabled: true,
                fireballDamageMultiplier: 5,
                fireballColors: [0xff4500, 0x87ceeb, 0xffd700, 0x4b0082, 0x8b4513, 0x4a9eff], // All dragon colors including earth
                fireballCooldown: 3 // 3 shots before cooldown
            },
            'banana': {
                name: 'Banana Dragon',
                icon: '🍌🐉',
                primaryColor: 0xFFE135, // Bright banana yellow
                secondaryColor: 0xD4A017, // Darker banana gold
                beltColor: 0x8B4513, // Brown stem color
                description: 'The ultimate fruity dragon! Shoots bananas!',
                unlockCondition: 'Complete Level 1',
                effectColor: 0xFFE135, // Banana yellow particles
                unlocked: false,
                hasWings: true,
                wingColor: 0xFFE135, // Yellow wings
                wingStyle: 'banana', // Special banana-shaped wing style
                wingTipColor: 0x5C4033, // Brown tips like banana ends
                // Banana Dragon Projectile - BANANAS!
                projectileEnabled: true,
                projectileType: 'banana',
                projectileColor: 0xFFE135,
                projectileSecondaryColor: 0xD4A017,
                projectileDamage: 18,
                projectileSpeed: 450,
                projectileSize: 22,
                projectileEffect: 'slip', // Makes enemies slip and fall!
                // Special banana dragon traits
                isBananaDragon: true,
                bananaTrail: true, // Leaves banana peels behind when running
                bananaBreath: true, // Breathes banana-scented fire (yellow flames)
                fruitPower: 1.5 // 50% bonus damage to enemies weak to fruit
            },
            'present': {
                name: 'Present Dragon',
                icon: '🎁🐉',
                primaryColor: 0xff0000, // Festive red
                secondaryColor: 0x228b22, // Christmas green
                beltColor: 0xffd700, // Gold ribbon belt
                description: 'A festive dragon that throws presents that explode into dragon allies!',
                unlockCondition: 'Complete Level 3',
                effectColor: 0xff0000, // Red particles
                unlocked: false,
                hasWings: true,
                wingColor: 0x228b22, // Green wings
                wingStyle: 'festive', // Special festive wing style
                wingTipColor: 0xffd700, // Gold tips
                // Present Dragon Projectile - WRAPPED PRESENTS THAT BECOME BOMBS!
                projectileEnabled: true,
                projectileType: 'present', // Special present bomb type
                projectileColor: 0xff0000,
                projectileSecondaryColor: 0xffd700,
                projectileDamage: 60, // Explosion damage
                projectileSpeed: 400,
                projectileSize: 24,
                projectileEffect: 'summon', // Summons dragon ally!
                // Special present dragon traits
                isPresentDragon: true,
                festiveAura: true, // Has sparkly aura
                allyDuration: 8000, // Dragon ally lasts 8 seconds
                allyDamage: 25 // Dragon ally fireball damage
            },
            'stone': {
                name: 'Stone Dragon',
                icon: '🪨🐉',
                primaryColor: 0x696969, // Dim gray (stone color)
                secondaryColor: 0x808080, // Gray
                beltColor: 0x2f4f4f, // Dark slate gray
                description: 'Ancient stone power! Press T+S for laser-to-boulder blast!',
                unlockCondition: 'Complete Level 1',
                effectColor: 0x778899, // Light slate gray particles
                unlocked: false,
                hasWings: true,
                wingColor: 0x708090, // Slate gray wings
                wingStyle: 'stone', // Rocky wing style
                wingTipColor: 0x2f4f4f, // Dark tips
                // Stone Dragon Projectile - Stone shards (normal attack)
                projectileEnabled: true,
                projectileType: 'stone',
                projectileColor: 0x696969,
                projectileSecondaryColor: 0x808080,
                projectileDamage: 22,
                projectileSpeed: 450,
                projectileSize: 20,
                projectileEffect: 'shatter', // Breaks into smaller rocks on hit
                // Special Stone Dragon traits
                isStoneDragon: true,
                stoneBlastEnabled: true, // T+S special move
                stoneBlastCooldown: 3000, // 3 second cooldown
                laserDamage: 15, // Initial laser damage
                boulderDamage: 50, // Explosion damage
                boulderRadius: 80 // Explosion radius
            },
            'grimlock': {
                name: 'Dino Grimlock',
                icon: '🦖🤖',
                primaryColor: 0x808080, // Grey
                secondaryColor: 0xff0000, // Red
                beltColor: 0xffd700, // Yellow/Gold
                description: 'GRIMLOCK STRONGEST! Press 2 to transform! Breathes fire AND lightning!',
                unlockCondition: 'Complete Level 2',
                effectColor: 0xff4500, // Orange-red particles
                unlocked: false,
                hasWings: true,
                wingColor: 0x808080, // Grey wings
                wingStyle: 'mechanical', // Robot-style wings
                wingTipColor: 0xff0000, // Red tips
                // Grimlock Dual Projectile - Fire AND Lightning combined!
                projectileEnabled: true,
                projectileType: 'grimlockBreath',
                projectileColor: 0xff4500, // Fire orange
                projectileSecondaryColor: 0xffd700, // Lightning yellow
                projectileDamage: 28, // High damage - combination of fire + lightning
                projectileSpeed: 600,
                projectileSize: 24,
                projectileEffect: 'burnChain', // Burns AND chains to nearby enemies
                // Special Grimlock Dragon traits
                isGrimlockDragon: true,
                canTransform: true, // Press 2 to transform
                transformKey: 'Digit2', // The 2 key
                currentForm: 'robot', // Starts as robot, can become 'dinosaur'
                // Robot form stats
                robotSpeed: 200,
                robotJump: 400,
                robotDamage: 1.0,
                // Dinosaur form stats (stronger but slower)
                dinoSpeed: 150,
                dinoJump: 300,
                dinoDamage: 1.5, // 50% more damage in dino form
                dinoSize: 1.3, // 30% bigger in dino form
                // Duck Laser special - transforms bad titans into ducks!
                duckLaserEnabled: true,
                duckLaserCooldown: 5000, // 5 second cooldown
                duckLaserKey: 'KeyL', // L for laser
                duckDuration: 8000, // Ducks stay as ducks for 8 seconds
                // Form colors
                robotColors: {
                    primary: 0x808080, // Grey
                    secondary: 0xff0000, // Red
                    accent: 0xffd700 // Yellow
                },
                dinoColors: {
                    primary: 0x696969, // Darker grey
                    secondary: 0xcc0000, // Darker red
                    accent: 0xdaa520 // Goldenrod
                }
            },
            'bumblebee': {
                name: 'Bumblebee',
                icon: '🐝🚗',
                primaryColor: 0xffd700, // Yellow
                secondaryColor: 0x000000, // Black
                beltColor: 0x333333,
                description: 'Bumblebee! Press 2 to transform! L for dog laser!',
                unlockCondition: 'Complete Level 3',
                effectColor: 0xffcc00,
                unlocked: false,
                hasWings: true,
                wingColor: 0xffd700,
                wingStyle: 'mechanical',
                wingTipColor: 0x000000,
                projectileEnabled: true,
                projectileType: 'bumblebeeStinger',
                projectileColor: 0xffd700,
                projectileSecondaryColor: 0x000000,
                projectileDamage: 22,
                projectileSpeed: 580,
                projectileSize: 20,
                projectileEffect: 'sting',
                isBumblebeeDragon: true,
                canTransform: true,
                transformKey: 'Digit2',
                currentForm: 'robot',
                robotSpeed: 200,
                robotJump: 400,
                robotDamage: 1.0,
                carSpeed: 280,
                carJump: 350,
                carDamage: 0.8,
                carSize: 1.1,
                dogLaserEnabled: true,
                dogLaserCooldown: 5000,
                dogLaserKey: 'KeyL',
                dogDuration: 8000,
                robotColors: { primary: 0xffd700, secondary: 0x000000, accent: 0x333333 },
                carColors: { primary: 0xffcc00, secondary: 0x1a1a1a, accent: 0xffd700 }
            },
            'hotrod': {
                name: 'Hot Rod',
                icon: '🏎️🤖',
                primaryColor: 0xe63946,
                secondaryColor: 0xc0c0c0,
                beltColor: 0x333333,
                description: 'Hot Rod! Press 2 to transform! L = sonic laughter disables enemies!',
                unlockCondition: 'Complete Level 2',
                effectColor: 0xe63946,
                unlocked: false,
                hasWings: true,
                wingColor: 0xc0c0c0,
                wingStyle: 'mechanical',
                wingTipColor: 0xe63946,
                projectileEnabled: true,
                projectileType: 'fireball',
                projectileColor: 0xe63946,
                projectileSecondaryColor: 0xff6b6b,
                projectileDamage: 20,
                projectileSpeed: 520,
                projectileSize: 18,
                projectileEffect: 'burn',
                isHotrodDragon: true,
                canTransform: true,
                transformKey: 'Digit2',
                currentForm: 'robot',
                robotSpeed: 210,
                robotJump: 420,
                robotDamage: 1.0,
                carSpeed: 320,
                carJump: 380,
                carDamage: 0.9,
                carSize: 1.05,
                robotColors: { primary: 0xe63946, secondary: 0xc0c0c0, accent: 0x333333 },
                carColors: { primary: 0xcc3333, secondary: 0x2d2d2d, accent: 0xe63946 },
                laughterPowerEnabled: true,
                laughterCooldown: 6000,
                laughterStunDuration: 2500,
                laughterRange: 280
            },
            'elita': {
                name: 'Elita',
                icon: '🏍️🤖',
                primaryColor: 0xe91e8c,
                secondaryColor: 0xffffff,
                beltColor: 0x4a148c,
                description: 'Elita! Press 2 to transform! Guns shoot dog bullets—no lasers!',
                unlockCondition: 'Complete Level 4',
                effectColor: 0xe91e8c,
                unlocked: false,
                hasWings: true,
                wingColor: 0xf8bbd9,
                wingStyle: 'mechanical',
                wingTipColor: 0xe91e8c,
                projectileEnabled: true,
                projectileType: 'elitaDogBullet',
                projectileColor: 0x8d6e63,
                projectileSecondaryColor: 0x5d4037,
                projectileDamage: 24,
                projectileSpeed: 640,
                projectileSize: 14,
                projectileEffect: 'dogBullet',
                isElitaDragon: true,
                canTransform: true,
                transformKey: 'Digit2',
                currentForm: 'robot',
                robotSpeed: 205,
                robotJump: 430,
                robotDamage: 1.0,
                bikeSpeed: 300,
                bikeJump: 360,
                bikeDamage: 0.95,
                robotColors: { primary: 0xe91e8c, secondary: 0xffffff, accent: 0x4a148c },
                bikeColors: { primary: 0xc2185b, secondary: 0x2d2d2d, accent: 0xe91e8c }
            },
            'bmwBouncer': {
                name: 'BMW Bouncer',
                icon: '🏁🤖',
                primaryColor: 0xffffff, // White base
                secondaryColor: 0x0066b2, // BMW M blue
                beltColor: 0xe22400, // BMW M red
                description: 'BMW Bouncer! Press 2 for race car! L for bounce slam!',
                unlockCondition: 'Available from start',
                effectColor: 0x6e27c5, // BMW M violet particles
                unlocked: true,
                hasWings: true,
                wingColor: 0x0066b2,
                wingStyle: 'mechanical',
                wingTipColor: 0xe22400,
                // Robot mode: trampoline pad projectile (deployable)
                projectileEnabled: true,
                projectileType: 'trampolinePad',
                projectileColor: 0xe22400, // Red base
                projectileSecondaryColor: 0x0066b2, // Blue springs
                projectileDamage: 22,
                projectileSpeed: 480,
                projectileSize: 18,
                projectileEffect: 'bounce',
                // Transformer traits
                isBmwBouncer: true,
                canTransform: true,
                transformKey: 'Digit2',
                currentForm: 'robot',
                robotSpeed: 205,
                robotJump: 420,
                robotDamage: 1.0,
                carSpeed: 330, // Fast race car
                carJump: 370,
                carDamage: 0.9,
                carSize: 1.1,
                // Car mode uses capture net (area effect)
                carProjectileType: 'captureNet',
                carProjectileColor: 0xffffff,
                carProjectileSecondaryColor: 0x0066b2,
                carProjectileDamage: 20,
                carProjectileRadius: 70, // Area capture radius
                // Bounce slam special (L key) - robot leaps and slams, launches enemies
                bounceSlamEnabled: true,
                bounceSlamCooldown: 6000,
                bounceSlamDamage: 35,
                bounceSlamRange: 220,
                bounceSlamLaunchVelocity: 550,
                robotColors: { primary: 0xffffff, secondary: 0x0066b2, accent: 0xe22400 },
                carColors: { primary: 0xffffff, secondary: 0x0066b2, accent: 0x6e27c5 }
            },
            'portalbot': {
                name: 'Portal Bot',
                icon: '🌀🤖',
                primaryColor: 0x7b1fa2,
                secondaryColor: 0x00e5ff,
                beltColor: 0x6a1b9a,
                description: 'Portal Bot! Press 2 to transform into a dragon! Shoot portals to teleport!',
                unlockCondition: 'Complete Level 2',
                effectColor: 0x00e5ff,
                unlocked: false,
                hasWings: true,
                wingColor: 0x00e5ff,
                wingStyle: 'mechanical',
                wingTipColor: 0x7b1fa2,
                projectileEnabled: true,
                projectileType: 'portal',
                projectileColor: 0x7b1fa2,
                projectileSecondaryColor: 0x00e5ff,
                projectileDamage: 15,
                projectileSpeed: 400,
                projectileSize: 20,
                projectileEffect: 'teleport',
                isPortalBot: true,
                canTransform: true,
                transformKey: 'Digit2',
                currentForm: 'robot',
                robotSpeed: 200,
                robotJump: 420,
                robotDamage: 1.0,
                dragonSpeed: 170,
                dragonJump: 350,
                dragonDamage: 1.4,
                dragonSize: 1.25,
                robotColors: { primary: 0x7b1fa2, secondary: 0x00e5ff, accent: 0xb0bec5 },
                dragonColors: { primary: 0x7b1fa2, secondary: 0x00e5ff, accent: 0xe040fb }
            },
            'pacman': {
                name: 'Pac-Man Dragon',
                icon: '🟡',
                primaryColor: 0xFFFF00,
                secondaryColor: 0xFFD700,
                beltColor: 0x2121DE,
                description: 'Waka waka! The classic dot-chomper joins the fight',
                unlockCondition: 'Complete all 3 Pac-Man levels',
                effectColor: 0xFFFF00,
                unlocked: false,
                hasWings: true,
                wingColor: 0xFFFF00,
                wingStyle: 'round',
                wingTipColor: 0xFFD700,
                projectileEnabled: true,
                projectileType: 'pellet',
                projectileColor: 0xFFFF00,
                projectileSecondaryColor: 0xFFFFFF,
                projectileDamage: 22,
                projectileSpeed: 550,
                projectileSize: 14,
                projectileEffect: 'chomp'
            }
        };

        this.config = {
            type: Phaser.AUTO,
            width: 1024,
            height: 576,
            parent: document.body,
            backgroundColor: '#2c5f5d',
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                min: {
                    width: 320,
                    height: 180
                },
                max: {
                    width: 1920,
                    height: 1080
                },
                // Enable fullscreen scaling
                fullscreenTarget: document.body,
                expandParent: true
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 800 },
                    debug: false,
                    fps: 30
                }
            },
            render: {
                pixelArt: false,
                antialias: true
            },
            scene: (() => {
                console.log('🔍 Checking scene classes...');
                console.log('MenuScene:', typeof MenuScene);
                console.log('GameScene:', typeof GameScene);
                console.log('CraftScene:', typeof CraftScene);
                console.log('BananaSurvivalScene:', typeof BananaSurvivalScene);
                console.log('PacManScene:', typeof PacManScene);

                // Build scenes array, only include optional scenes if they exist
                const scenes = [MenuScene, GameScene, CraftScene];
                if (typeof BananaSurvivalScene !== 'undefined') {
                    scenes.push(BananaSurvivalScene);
                    console.log('🍌 BananaSurvivalScene added');
                }
                if (typeof PacManScene !== 'undefined') {
                    scenes.push(PacManScene);
                    console.log('🟡 PacManScene added');
                }
                return scenes;
            })()
        };

        // Game state
        this.gameData = {
            currentLevel: 1,
            score: 0,
            robotParts: {
                head: [],
                body: [],
                arms: [],
                legs: [],
                powerCore: []
            },
            outfits: {
                current: 'default',
                unlocked: ['default', 'bmwBouncer']
            },
            powerUps: {
                fireBreath: false,
                ultraBlast: false,
                flyMode: false
            },
            settings: {
                soundEnabled: true,
                musicEnabled: true
            }
        };

        this.game = null;
        this.controls = null;
        this.saveSystem = null;
    }

    init() {
        // Initialize save system
        this.saveSystem = new SaveSystem();
        this.loadGameData();

        // Initialize controls
        this.controls = new Controls();

        // Hide loading screen (if it exists)
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        // Create Phaser game instance
        this.game = new Phaser.Game(this.config);

        // Global game reference
        window.gameInstance = this;
        
        // Set up fullscreen event listeners for debugging
        this.setupFullscreenListeners();
        
        console.log('🥋 Taekwondo Robot Builder initialized!');
    }

    setupFullscreenListeners() {
        // Listen for fullscreen errors (silently handle - they're expected due to browser security)
        document.addEventListener('fullscreenerror', (e) => {
            // Fullscreen errors are expected when not triggered by user gesture
        });
        
        document.addEventListener('webkitfullscreenerror', (e) => {
            // Fullscreen errors are expected when not triggered by user gesture
        });
        
        document.addEventListener('mozfullscreenerror', (e) => {
            // Fullscreen errors are expected when not triggered by user gesture
        });
        
        // Listen for fullscreen change events
        document.addEventListener('fullscreenchange', () => {
            if (this.game && this.game.scale) {
                setTimeout(() => {
                    this.game.scale.refresh();
                    console.log('Fullscreen changed, scale refreshed');
                }, 100);
            }
        });
        
        document.addEventListener('webkitfullscreenchange', () => {
            if (this.game && this.game.scale) {
                setTimeout(() => {
                    this.game.scale.refresh();
                    console.log('Webkit fullscreen changed, scale refreshed');
                }, 100);
            }
        });
        
        // Listen for window resize (important for iOS)
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.game && this.game.scale) {
                    this.game.scale.refresh();
                    console.log('Window resized, scale refreshed');
                }
            }, 250);
        });
        
        // Listen for orientation changes (important for mobile)
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (this.game && this.game.scale) {
                    this.game.scale.refresh();
                    console.log('Orientation changed, scale refreshed');
                }
            }, 300);
        });
    }

    loadGameData() {
        const savedData = this.saveSystem.load();
        if (savedData) {
            this.gameData = { ...this.gameData, ...savedData };
            console.log('Game data loaded:', this.gameData);
        }
        // Ensure BMW Bouncer (from-start costume) is always in unlocked list
        if (this.gameData.outfits && Array.isArray(this.gameData.outfits.unlocked) &&
            !this.gameData.outfits.unlocked.includes('bmwBouncer')) {
            this.gameData.outfits.unlocked.push('bmwBouncer');
        }
    }

    saveGameData() {
        this.saveSystem.save(this.gameData);
        console.log('Game data saved');
    }

    // Game state management
    addScore(points) {
        this.gameData.score += points;
        this.saveGameData();
    }

    addRobotPart(type, rarity = 'common') {
        const part = {
            id: Date.now() + Math.random(),
            type: type,
            rarity: rarity,
            collected: new Date().toISOString()
        };
        
        this.gameData.robotParts[type].push(part);
        
        // Award points based on rarity
        const points = {
            'common': 50,
            'rare': 100,
            'epic': 200
        };
        
        this.addScore(points[rarity] || 50);
        console.log(`Collected ${rarity} ${type} part! +${points[rarity]} points`);
    }

    unlockOutfit(outfitName) {
        if (!this.gameData.outfits.unlocked.includes(outfitName)) {
            this.gameData.outfits.unlocked.push(outfitName);
            this.saveGameData();
            console.log(`🐉 Unlocked outfit: ${outfitName}`);
            return true; // Return true if newly unlocked
        }
        return false;
    }

    // Check and unlock dragon costumes based on current progress
    checkDragonUnlocks() {
        const newUnlocks = [];
        
        // Fire Dragon - Complete Level 1
        if (this.gameData.currentLevel >= 2 && !this.gameData.outfits.unlocked.includes('fire')) {
            if (this.unlockOutfit('fire')) {
                newUnlocks.push('fire');
            }
        }
        
        // Ice Dragon - Collect 5 robot parts
        const totalParts = this.getTotalPartsCollected();
        if (totalParts >= 5 && !this.gameData.outfits.unlocked.includes('ice')) {
            if (this.unlockOutfit('ice')) {
                newUnlocks.push('ice');
            }
        }
        
        // Lightning Dragon - Complete Level 2
        if (this.gameData.currentLevel >= 3 && !this.gameData.outfits.unlocked.includes('lightning')) {
            if (this.unlockOutfit('lightning')) {
                newUnlocks.push('lightning');
            }
        }
        
        // Shadow Dragon - Complete level 4
        if (this.gameData.currentLevel >= 5 && !this.gameData.outfits.unlocked.includes('shadow')) {
            if (this.unlockOutfit('shadow')) {
                newUnlocks.push('shadow');
            }
        }
        
        // Earth Dragon - Complete level 5
        if (this.gameData.currentLevel >= 6 && !this.gameData.outfits.unlocked.includes('earth')) {
            if (this.unlockOutfit('earth')) {
                newUnlocks.push('earth');
            }
        }
        
        // Banana Dragon - Complete Level 1
        if (this.gameData.currentLevel >= 2 && !this.gameData.outfits.unlocked.includes('banana')) {
            if (this.unlockOutfit('banana')) {
                newUnlocks.push('banana');
                console.log('🍌🐉 BANANA DRAGON UNLOCKED! Time to throw some bananas!');
            }
        }
        
        // Stone Dragon - Complete Level 1
        if (this.gameData.currentLevel >= 2 && !this.gameData.outfits.unlocked.includes('stone')) {
            if (this.unlockOutfit('stone')) {
                newUnlocks.push('stone');
                console.log('🪨🐉 STONE DRAGON UNLOCKED! Press T+S for laser-to-boulder blast!');
            }
        }
        
        // Present Dragon - Complete Level 3
        if (this.gameData.currentLevel >= 4 && !this.gameData.outfits.unlocked.includes('present')) {
            if (this.unlockOutfit('present')) {
                newUnlocks.push('present');
                console.log('🎁🐉 PRESENT DRAGON UNLOCKED! Throw presents that summon dragon allies!');
            }
        }
        
        // Dino Grimlock - Complete Level 2
        console.log('🦖 Checking Grimlock unlock - currentLevel:', this.gameData.currentLevel, 'need >= 3, already unlocked:', this.gameData.outfits.unlocked.includes('grimlock'));
        console.log('🦖 Current unlocked outfits:', this.gameData.outfits.unlocked);
        if (this.gameData.currentLevel >= 3 && !this.gameData.outfits.unlocked.includes('grimlock')) {
            console.log('🦖 Condition passed! Calling unlockOutfit...');
            const result = this.unlockOutfit('grimlock');
            console.log('🦖 unlockOutfit result:', result);
            if (result) {
                newUnlocks.push('grimlock');
                console.log('🦖🤖 DINO GRIMLOCK UNLOCKED! Press 2 to transform! L for duck laser!');
            }
        } else {
            console.log('🦖 Condition FAILED - level check:', this.gameData.currentLevel >= 3, 'not already unlocked:', !this.gameData.outfits.unlocked.includes('grimlock'));
        }
        
        // Bumblebee - Complete Level 3
        if (this.gameData.currentLevel >= 4 && !this.gameData.outfits.unlocked.includes('bumblebee')) {
            if (this.unlockOutfit('bumblebee')) {
                newUnlocks.push('bumblebee');
                console.log('🐝🚗 BUMBLEBEE UNLOCKED! Press 2 to transform! L for dog laser!');
            }
        }
        
        // Hot Rod - Complete Level 2
        if (this.gameData.currentLevel >= 3 && !this.gameData.outfits.unlocked.includes('hotrod')) {
            if (this.unlockOutfit('hotrod')) {
                newUnlocks.push('hotrod');
                console.log('🏎️🤖 HOT ROD UNLOCKED! Press 2 to transform between sports car and robot!');
            }
        }
        
        // Elita - Complete Level 4 (motorcycle transformer, guns = dog bullets)
        if (this.gameData.currentLevel >= 5 && !this.gameData.outfits.unlocked.includes('elita')) {
            if (this.unlockOutfit('elita')) {
                newUnlocks.push('elita');
                console.log('🏍️🤖 ELITA UNLOCKED! Press 2 to transform! Guns shoot dog bullets!');
            }
        }
        
        // Legendary Mode - Collect all robot parts (5 part types, need at least 1 of each)
        const partTypes = ['head', 'body', 'arms', 'legs', 'powerCore'];
        const allPartsCollected = partTypes.every(type => 
            this.gameData.robotParts[type] && this.gameData.robotParts[type].length > 0
        );
        
        if (allPartsCollected && !this.gameData.outfits.unlocked.includes('legendary')) {
            if (this.unlockOutfit('legendary')) {
                newUnlocks.push('legendary');
                console.log('🌟 LEGENDARY MODE UNLOCKED! All robot parts collected - assembled!');
            }
        }
        
        return newUnlocks;
    }

    getTotalPartsCollected() {
        let total = 0;
        Object.keys(this.gameData.robotParts).forEach(type => {
            total += this.gameData.robotParts[type].length;
        });
        return total;
    }

    getDragonCostume(costumeKey) {
        return this.dragonCostumes[costumeKey] || this.dragonCostumes['default'];
    }

    setOutfit(outfitName) {
        if (this.gameData.outfits.unlocked.includes(outfitName)) {
            const previousOutfit = this.gameData.outfits.current;
            const wasLegendary = this.dragonCostumes[previousOutfit]?.isLegendary || false;
            const isLegendary = this.dragonCostumes[outfitName]?.isLegendary || false;
            
            this.gameData.outfits.current = outfitName;
            this.saveGameData();
            console.log(`Outfit changed to: ${outfitName}`);
            
            // If switching to/from legendary mode, restart any active game scenes
            if (wasLegendary !== isLegendary) {
                console.log('🔄 Switching sprite mode - restarting active scenes');
                const activeScenes = this.game.scene.getScenes(true);
                activeScenes.forEach(scene => {
                    if (scene.scene.key === 'GameScene') {
                        console.log('🔄 Restarting GameScene for sprite recreation');
                        scene.scene.restart();
                    }
                });
            }
        }
    }

    activatePowerUp(powerType, duration = 10000) {
        this.gameData.powerUps[powerType] = true;
        
        // Auto-deactivate after duration
        setTimeout(() => {
            this.gameData.powerUps[powerType] = false;
            console.log(`Power-up ${powerType} expired`);
        }, duration);
        
        console.log(`Power-up activated: ${powerType}`);
    }

    nextLevel() {
        console.log('🚀 nextLevel() called!');
        console.log('Current level before increment:', this.gameData.currentLevel);

        const previousLevel = this.gameData.currentLevel;
        this.gameData.currentLevel++;
        console.log('Current level after increment:', this.gameData.currentLevel);

        this.saveGameData();
        console.log('Game data saved');

        if (this.gameData.currentLevel > 6) {
            console.log('🎊 Game completed! All levels finished');
            this.completeGame();
        } else {
            console.log('🎨 Starting CraftScene for level', this.gameData.currentLevel);
            this.game.scene.start('CraftScene');
        }
    }

    completeGame() {
        console.log('🎉 Game completed! Super robot built!');
        // Could show victory screen or credits
        this.game.scene.start('MenuScene');
    }

    resetGame() {
        this.gameData = {
            currentLevel: 1,
            score: 0,
            robotParts: {
                head: [],
                body: [],
                arms: [],
                legs: [],
                powerCore: []
            },
            outfits: {
                current: 'default',
                unlocked: ['default', 'bmwBouncer']
            },
            powerUps: {
                fireBreath: false,
                ultraBlast: false,
                flyMode: false
            },
            settings: {
                soundEnabled: true,
                musicEnabled: true
            }
        };
        this.saveGameData();
        console.log('Game reset');
    }

    // Utility functions
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    getGameWidth() {
        return this.game ? this.game.config.width : 1024;
    }

    getGameHeight() {
        return this.game ? this.game.config.height : 576;
    }

    // Fullscreen functionality
    requestFullscreen() {
        // Check if we're on iOS/iPad
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        if (isIOS) {
            // iOS doesn't support fullscreen API for canvas
            // Instead, use viewport manipulation for fullscreen-like experience
            this.enterIOSFullscreen();
            return;
        }

        // Try to get the canvas - check multiple ways
        let canvas = this.game ? this.game.canvas : null;
        
        // If canvas not found via game object, try to find it in DOM
        if (!canvas) {
            canvas = document.querySelector('canvas');
        }
        
        if (!canvas) {
            console.warn('Canvas not found, cannot enter fullscreen');
            return;
        }

        // Try to request fullscreen on the canvas element
        const requestFS = canvas.requestFullscreen || 
                         canvas.webkitRequestFullscreen || 
                         canvas.mozRequestFullScreen || 
                         canvas.msRequestFullscreen;
        
        if (requestFS) {
            try {
                requestFS.call(canvas).catch(err => {
                    // Silently fallback to iOS method - fullscreen API restrictions are expected
                    this.enterIOSFullscreen();
                });
            } catch (err) {
                // Silently fallback to iOS method
                this.enterIOSFullscreen();
            }
        } else {
            // Fullscreen API not supported, use iOS fallback
            this.enterIOSFullscreen();
        }
    }

    enterIOSFullscreen() {
        // iOS fullscreen-like experience using viewport and CSS
        console.log('Entering iOS fullscreen mode');
        
        // Hide address bar by scrolling
        window.scrollTo(0, 1);
        
        // Update body and canvas styles for fullscreen-like appearance
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.top = '0';
        document.body.style.left = '0';
        
        // Store that we're in iOS fullscreen mode BEFORE modifying canvas
        this._iosFullscreenActive = true;
        
        // Instead of manually styling the canvas, let Phaser handle it
        // Just trigger a resize event which Phaser will respond to
        if (this.game && this.game.scale) {
            // Use Phaser's scale manager to handle fullscreen-like mode
            this.game.scale.refresh();
            
            // Small delay to ensure resize is complete
            setTimeout(() => {
                this.game.scale.refresh();
                console.log('Phaser scale refreshed for iOS fullscreen');
            }, 100);
        }
        
        // Request orientation lock if available
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(err => {
                // Orientation lock not supported on this device - this is normal
            });
        }
        
        // Notify user
        console.log('iOS fullscreen mode activated. Rotate to landscape for best experience.');
    }

    exitIOSFullscreen() {
        console.log('Exiting iOS fullscreen mode');
        
        // Reset body styles
        document.body.style.margin = '';
        document.body.style.padding = '';
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.top = '';
        document.body.style.left = '';
        
        this._iosFullscreenActive = false;
        
        // Refresh Phaser scale after exiting
        if (this.game && this.game.scale) {
            this.game.scale.refresh();
            
            setTimeout(() => {
                this.game.scale.refresh();
                console.log('Phaser scale refreshed after exiting iOS fullscreen');
            }, 100);
        }
        
        // Unlock orientation if available
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
    }

    exitFullscreen() {
        // Check if we're in iOS fullscreen mode
        if (this._iosFullscreenActive) {
            this.exitIOSFullscreen();
            return;
        }

        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }

    isFullscreen() {
        // Check iOS fullscreen mode first
        if (this._iosFullscreenActive) {
            return true;
        }
        
        return !!(document.fullscreenElement || 
                  document.webkitFullscreenElement || 
                  document.mozFullScreenElement ||
                  document.msFullscreenElement);
    }

    toggleFullscreen() {
        if (this.isFullscreen()) {
            this.exitFullscreen();
        } else {
            this.requestFullscreen();
        }
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    // Add a small delay to ensure all scripts are fully loaded
    setTimeout(() => {
        try {
            console.log('Initializing TaekwondoRobotBuilder...');
            console.log('MenuScene available:', typeof MenuScene);
            console.log('GameScene available:', typeof GameScene);  
            console.log('CraftScene available:', typeof CraftScene);
            
            const game = new TaekwondoRobotBuilder();
            game.init();
            
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            console.error('Stack trace:', error.stack);
            
            // Show error to user
            document.body.innerHTML += `
                <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                           background: #ff4444; color: white; padding: 20px; border-radius: 8px; 
                           font-family: Arial, sans-serif; z-index: 10000;">
                    <h3>❌ Game Initialization Error</h3>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p>Please refresh the page and try again.</p>
                    <details>
                        <summary>Technical Details</summary>
                        <pre style="font-size: 12px; margin-top: 10px;">${error.stack}</pre>
                    </details>
                </div>
            `;
        }
    }, 100);
});

// Handle page visibility changes (pause/resume)
document.addEventListener('visibilitychange', () => {
    if (window.gameInstance && window.gameInstance.game) {
        if (document.hidden) {
            window.gameInstance.game.scene.pause();
        } else {
            window.gameInstance.game.scene.resume();
        }
    }
});

// Global utility functions
window.GameUtils = {
    createButton: function(scene, x, y, text, callback, style = {}) {
        const defaultStyle = {
            fontSize: '24px',
            fill: '#ffffff',
            backgroundColor: '#3e8084',
            padding: { x: 20, y: 10 },
            borderRadius: 8
        };
        
        const button = scene.add.text(x, y, text, { ...defaultStyle, ...style })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', callback)
            .on('pointerover', function() {
                this.setTint(0xcccccc);
            })
            .on('pointerout', function() {
                this.clearTint();
            });
            
        return button;
    },

    formatScore: function(score) {
        return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    generateRobotPart: function() {
        const types = ['head', 'body', 'arms', 'legs', 'powerCore'];
        const rarities = ['common', 'rare', 'epic'];
        const rarityWeights = [70, 25, 5]; // Percentages
        
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        // Weighted random rarity
        const rand = Math.random() * 100;
        let rarity = 'common';
        if (rand > 95) rarity = 'epic';
        else if (rand > 70) rarity = 'rare';
        
        return { type: randomType, rarity: rarity };
    }
};
