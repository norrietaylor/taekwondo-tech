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
                wingTipColor: 0xff0000
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
                wingTipColor: 0xffffff
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
                wingTipColor: 0x9370db
            },
            'shadow': {
                name: 'Shadow Dragon',
                icon: '🌙',
                primaryColor: 0x4b0082,
                secondaryColor: 0x2f1b3c,
                beltColor: 0x000000,
                description: 'Master of darkness and stealth',
                unlockCondition: 'Complete the game',
                effectColor: 0x9400d3,
                unlocked: false,
                hasWings: true,
                wingColor: 0x2f1b3c,
                wingStyle: 'shadow',
                wingTipColor: 0x000000
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
                }
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
                return [MenuScene, GameScene, CraftScene];
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
                unlocked: ['default']
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
        
        console.log('🥋 Taekwondo Robot Builder initialized!');
    }

    loadGameData() {
        const savedData = this.saveSystem.load();
        if (savedData) {
            this.gameData = { ...this.gameData, ...savedData };
            console.log('Game data loaded:', this.gameData);
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
        
        // Shadow Dragon - Complete the game (level 6 means all 5 levels done)
        if (this.gameData.currentLevel >= 6 && !this.gameData.outfits.unlocked.includes('shadow')) {
            if (this.unlockOutfit('shadow')) {
                newUnlocks.push('shadow');
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
            this.gameData.outfits.current = outfitName;
            this.saveGameData();
            console.log(`Outfit changed to: ${outfitName}`);
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
        
        this.gameData.currentLevel++;
        console.log('Current level after increment:', this.gameData.currentLevel);
        
        this.saveGameData();
        console.log('Game data saved');
        
        if (this.gameData.currentLevel > 5) {
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
                unlocked: ['default']
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
