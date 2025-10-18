// Main menu scene
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
        
        // Menu state
        this.selectedOption = 0;
        this.menuOptions = ['Start Game', 'Continue', 'Settings', 'Credits'];
        this.menuItems = [];
        
        // Animation properties
        this.backgroundElements = [];
        this.titleTween = null;
    }

    create() {
        console.log('MenuScene created');
        console.log('window.gameInstance exists:', !!window.gameInstance);
        
        // Create animated background
        this.createBackground();
        
        // Create title
        this.createTitle();
        
        // Create menu options
        this.createMenu();
        
        // Create credits/info
        this.createFooter();
        
        // Set up input handlers
        this.setupInput();
        
        // Start background animations
        this.startAnimations();
        
        console.log('MenuScene setup complete');
    }

    createBackground() {
        // Create gradient background
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.background = this.add.rectangle(width/2, height/2, width, height, 0x2c5f5d);
        
        // Create floating geometric elements
        this.createBackgroundElements();
    }

    createBackgroundElements() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create various geometric shapes floating in background
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 20 + Math.random() * 40;
            const alpha = 0.1 + Math.random() * 0.3;
            
            let element;
            
            switch (Math.floor(Math.random() * 4)) {
                case 0:
                    element = this.add.rectangle(x, y, size, size, 0x3e8084, alpha);
                    break;
                case 1:
                    element = this.add.circle(x, y, size/2, 0x4a9eff, alpha);
                    break;
                case 2:
                    element = this.add.triangle(x, y, 0, size, size, 0, size/2, size, 0x87ceeb, alpha);
                    break;
                case 3:
                    element = this.add.star(x, y, 6, size/3, size/2, 0xa8d5d1, alpha);
                    break;
            }
            
            element.setRotation(Math.random() * Math.PI * 2);
            this.backgroundElements.push(element);
        }
    }

    createTitle() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        // Main title
        this.titleText = this.add.text(centerX, centerY - 180, '🥋 TAEKWONDO', {
            fontSize: '48px',
            fill: '#ffffff',
            fontWeight: 'bold',
            stroke: '#2c5f5d',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.subtitleText = this.add.text(centerX, centerY - 130, 'ROBOT BUILDER', {
            fontSize: '36px',
            fill: '#a8d5d1',
            fontWeight: 'bold',
            stroke: '#2c5f5d',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // Add martial arts icon/decoration
        this.createTitleDecorations();
    }

    createTitleDecorations() {
        const centerX = this.cameras.main.centerX;
        const titleY = this.cameras.main.centerY - 155;
        
        // Create simple martial arts pose silhouettes
        const leftFigure = this.add.rectangle(centerX - 200, titleY, 8, 30, 0x4a9eff);
        const rightFigure = this.add.rectangle(centerX + 200, titleY, 8, 30, 0x4a9eff);
        
        // Add "kicking" pose elements
        const leftKick = this.add.rectangle(centerX - 185, titleY + 5, 15, 6, 0x4a9eff);
        const rightKick = this.add.rectangle(centerX + 185, titleY + 5, 15, 6, 0x4a9eff);
        
        leftKick.setRotation(-0.3);
        rightKick.setRotation(0.3);
        
        this.decorations = [leftFigure, rightFigure, leftKick, rightKick];
    }

    createMenu() {
        const centerX = this.cameras.main.centerX;
        const startY = this.cameras.main.centerY - 50;
        
        // Check if save data exists
        const hasSaveData = window.gameInstance ? window.gameInstance.saveSystem.exists() : false;
        console.log('Save data exists:', hasSaveData);
        
        let displayIndex = 0;
        this.menuOptions.forEach((option, index) => {
            // Skip continue option if no save data
            if (option === 'Continue' && !hasSaveData) {
                console.log('Skipping Continue option - no save data');
                return;
            }
            
            const y = startY + (displayIndex * 60);
            displayIndex++;
            
            const menuItem = this.add.text(centerX, y, option, {
                fontSize: '28px',
                fill: '#ffffff',
                backgroundColor: '#3e8084',
                padding: { x: 20, y: 10 },
                borderRadius: 8
            }).setOrigin(0.5);
            
            // Make interactive
            menuItem.setInteractive({ useHandCursor: true });
            
            // Hover effects
            menuItem.on('pointerover', () => {
                menuItem.setTint(0xcccccc);
                this.selectedOption = index;
                this.updateMenuSelection();
            });
            
            menuItem.on('pointerout', () => {
                menuItem.clearTint();
            });
            
            // Click handler
            menuItem.on('pointerdown', () => {
                this.selectMenuItem(option);
            });
            
            this.menuItems.push(menuItem);
        });
        
        this.updateMenuSelection();
    }

    createFooter() {
        const centerX = this.cameras.main.centerX;
        const bottomY = this.cameras.main.height - 40;
        
        // Detect if iOS/iPad
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        // Game version and controls info
        this.add.text(centerX, bottomY - 80, 'Use WASD/Arrow Keys to move, X to kick, Z to punch', {
            fontSize: '16px',
            fill: '#a8d5d1',
            align: 'center'
        }).setOrigin(0.5);
        
        this.add.text(centerX, bottomY - 60, 'Collect robot parts to build the ultimate robot!', {
            fontSize: '16px',
            fill: '#a8d5d1',
            align: 'center'
        }).setOrigin(0.5);
        
        // Different instructions for iOS vs desktop
        if (isIOS) {
            this.add.text(centerX, bottomY - 40, 'Tap fullscreen button for immersive mode 🎮', {
                fontSize: '14px',
                fill: '#87ceeb',
                align: 'center'
            }).setOrigin(0.5);
        } else {
            this.add.text(centerX, bottomY - 40, 'Press F for fullscreen | ESC to exit fullscreen', {
                fontSize: '14px',
                fill: '#87ceeb',
                align: 'center'
            }).setOrigin(0.5);
        }
        
        this.add.text(centerX, bottomY, 'v1.0.0 - Made with ❤️ and Phaser.js', {
            fontSize: '12px',
            fill: '#666666',
            align: 'center'
        }).setOrigin(0.5);
        
        // Add fullscreen toggle button in corner
        this.createFullscreenButton();
    }

    setupInput() {
        // Keyboard navigation
        this.input.keyboard.on('keydown-UP', () => {
            this.selectedOption = Math.max(0, this.selectedOption - 1);
            this.updateMenuSelection();
        });
        
        this.input.keyboard.on('keydown-DOWN', () => {
            this.selectedOption = Math.min(this.menuItems.length - 1, this.selectedOption + 1);
            this.updateMenuSelection();
        });
        
        this.input.keyboard.on('keydown-ENTER', () => {
            this.selectMenuItem(this.menuOptions[this.selectedOption]);
        });
        
        this.input.keyboard.on('keydown-SPACE', () => {
            this.selectMenuItem('Start Game');
        });
        
        // Fullscreen toggle with F key
        this.input.keyboard.on('keydown-F', () => {
            if (window.gameInstance) {
                window.gameInstance.toggleFullscreen();
            }
        });
    }

    updateMenuSelection() {
        this.menuItems.forEach((item, index) => {
            if (index === this.selectedOption) {
                item.setTint(0xffff99);
                item.setScale(1.1);
            } else {
                item.clearTint();
                item.setScale(1.0);
            }
        });
    }

    selectMenuItem(option) {
        console.log('Selected menu option:', option);
        console.log('window.gameInstance available:', !!window.gameInstance);
        
        switch (option) {
            case 'Start Game':
                console.log('Starting new game...');
                this.startNewGame();
                break;
                
            case 'Continue':
                this.continueGame();
                break;
                
            case 'Settings':
                this.showSettings();
                break;
                
            case 'Credits':
                this.showCredits();
                break;
        }
    }

    startNewGame() {
        try {
            console.log('startNewGame() called');
            
            // Check if game instance exists
            if (!window.gameInstance) {
                console.error('window.gameInstance not found!');
                return;
            }
            
            // Reset game data for new game
            console.log('Resetting game data...');
            window.gameInstance.resetGame();
            
            // Request fullscreen
            if (window.gameInstance.requestFullscreen) {
                window.gameInstance.requestFullscreen();
            }
            
            // Add transition effect
            console.log('Starting camera fade out...');
            this.cameras.main.fadeOut(500, 0, 0, 0);
            
            this.cameras.main.once('camerafadeoutcomplete', () => {
                console.log('Camera fade complete, starting GameScene...');
                try {
                    this.scene.start('GameScene');
                    console.log('GameScene started successfully');
                } catch (error) {
                    console.error('Failed to start GameScene:', error);
                }
            });
            
            console.log('New game initialization complete');
        } catch (error) {
            console.error('Error in startNewGame():', error);
            console.error('Stack trace:', error.stack);
        }
    }

    continueGame() {
        // Load existing save data
        window.gameInstance.loadGameData();
        
        // Request fullscreen
        if (window.gameInstance.requestFullscreen) {
            window.gameInstance.requestFullscreen();
        }
        
        // Add transition effect
        this.cameras.main.fadeOut(500, 0, 0, 0);
        
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Check current level and go to appropriate scene
            if (window.gameInstance.gameData.currentLevel > 5) {
                // Game completed, show craft scene
                this.scene.start('CraftScene');
            } else {
                this.scene.start('GameScene');
            }
        });
        
        console.log('Continuing game...');
    }

    showSettings() {
        // Simple settings overlay
        const overlay = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            400,
            300,
            0x000000,
            0.8
        );
        
        const settingsText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 100,
            'Settings',
            {
                fontSize: '32px',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
        
        const soundToggle = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 30,
            `Sound: ${window.gameInstance.gameData.settings.soundEnabled ? 'ON' : 'OFF'}`,
            {
                fontSize: '20px',
                fill: '#ffffff',
                backgroundColor: '#3e8084',
                padding: { x: 15, y: 8 }
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        soundToggle.on('pointerdown', () => {
            window.gameInstance.gameData.settings.soundEnabled = 
                !window.gameInstance.gameData.settings.soundEnabled;
            window.gameInstance.saveGameData();
            soundToggle.setText(`Sound: ${window.gameInstance.gameData.settings.soundEnabled ? 'ON' : 'OFF'}`);
        });
        
        const closeButton = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 80,
            'Close',
            {
                fontSize: '20px',
                fill: '#ffffff',
                backgroundColor: '#ff6b6b',
                padding: { x: 15, y: 8 }
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        closeButton.on('pointerdown', () => {
            overlay.destroy();
            settingsText.destroy();
            soundToggle.destroy();
            closeButton.destroy();
        });
    }

    showCredits() {
        // Simple credits overlay
        const overlay = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            500,
            400,
            0x000000,
            0.8
        );
        
        const creditsText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            `Credits

🥋 Taekwondo Robot Builder

Game Design & Programming:
Your Name Here

Built with:
• Phaser.js 3.70.0
• HTML5 Canvas
• Pure JavaScript

Special Thanks:
• Phaser.js Community
• Open Source Contributors

Made with ❤️ in 2025`,
            {
                fontSize: '18px',
                fill: '#ffffff',
                align: 'center',
                lineSpacing: 5
            }
        ).setOrigin(0.5);
        
        const closeButton = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 160,
            'Close',
            {
                fontSize: '20px',
                fill: '#ffffff',
                backgroundColor: '#ff6b6b',
                padding: { x: 15, y: 8 }
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        closeButton.on('pointerdown', () => {
            overlay.destroy();
            creditsText.destroy();
            closeButton.destroy();
        });
    }

    createFullscreenButton() {
        // Create a fullscreen button in top-right corner
        const buttonX = this.cameras.main.width - 50;
        const buttonY = 30;
        
        // Detect if iOS/iPad
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        
        this.fullscreenButton = this.add.text(buttonX, buttonY, '⛶', {
            fontSize: '28px',
            fill: '#ffffff',
            backgroundColor: '#3e8084',
            padding: { x: 15, y: 10 }
        }).setOrigin(0.5)
          .setDepth(1000) // High depth to ensure it's clickable
          .setInteractive({ 
              useHandCursor: true,
              // Larger hit area for better touch targeting on mobile
              hitArea: new Phaser.Geom.Rectangle(-25, -20, 50, 40),
              hitAreaCallback: Phaser.Geom.Rectangle.Contains
          });
        
        // iOS needs special handling for touch events
        const handleFullscreenToggle = () => {
            console.log('Fullscreen button clicked/tapped');
            if (window.gameInstance) {
                console.log('Toggling fullscreen...');
                window.gameInstance.toggleFullscreen();
                
                // Visual feedback on iOS
                if (isIOS) {
                    this.cameras.main.flash(200, 255, 255, 255, false, (camera, progress) => {
                        if (progress === 1) {
                            console.log('iOS fullscreen mode toggled');
                        }
                    });
                }
            } else {
                console.error('window.gameInstance not available!');
            }
        };
        
        // Add visual press effect
        this.fullscreenButton.on('pointerdown', function() {
            console.log('Fullscreen button pointerdown detected');
            this.setScale(0.9);
            this.setTint(0xaaaaaa);
        });
        
        // Use pointerup for the actual action (better iOS compatibility)
        this.fullscreenButton.on('pointerup', function() {
            this.setScale(1.0);
            this.clearTint();
            handleFullscreenToggle();
        });
        
        this.fullscreenButton.on('pointerover', function() {
            this.setTint(0xcccccc);
        });
        
        this.fullscreenButton.on('pointerout', function() {
            this.clearTint();
            this.setScale(1.0);
        });
        
        // Add tooltip with iOS-specific text
        const tooltipText = isIOS ? 'Immersive' : 'Fullscreen';
        this.add.text(buttonX, buttonY + 35, tooltipText, {
            fontSize: '10px',
            fill: '#a8d5d1',
            align: 'center'
        }).setOrigin(0.5).setDepth(1000);
    }

    startAnimations() {
        // Animate background elements
        this.backgroundElements.forEach((element, index) => {
            this.tweens.add({
                targets: element,
                rotation: element.rotation + Math.PI * 2,
                duration: 10000 + (index * 1000),
                repeat: -1,
                ease: 'Linear'
            });
            
            this.tweens.add({
                targets: element,
                y: element.y + (50 + Math.random() * 100),
                duration: 8000 + (index * 500),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
        
        // Animate title
        this.titleTween = this.tweens.add({
            targets: [this.titleText, this.subtitleText],
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Animate decorations
        this.decorations.forEach((decoration, index) => {
            this.tweens.add({
                targets: decoration,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 1500 + (index * 200),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });
    }

    update() {
        // Update any menu animations or effects
    }
}
