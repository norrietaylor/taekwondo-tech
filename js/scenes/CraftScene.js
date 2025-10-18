// Robot crafting scene
class CraftScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CraftScene' });
        
        // Craft scene properties
        this.robotParts = {};
        this.selectedParts = {
            head: null,
            body: null,
            arms: null,
            legs: null,
            powerCore: null
        };
        
        // UI elements
        this.partsInventory = [];
        this.robotPreview = null;
        this.craftButton = null;
        
        // Layout - will be set in create() when cameras are available
        this.inventoryArea = null;
        this.craftArea = null;
    }

    create() {
        console.log('CraftScene created');
        
        // Set up responsive layout now that cameras are available
        this.setupLayout();
        
        // Get robot parts from game data
        this.robotParts = window.gameInstance.gameData.robotParts;
        
        // Create background
        this.createBackground();
        
        // Create UI layout
        this.createLayout();
        
        // Create parts inventory
        this.createInventory();
        
        // Create robot assembly area
        this.createCraftArea();
        
        // Create navigation
        this.createNavigation();
        
        // Set up input
        this.setupInput();
    }

    createBackground() {
        // Workshop-style background
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.background = this.add.rectangle(width/2, height/2, width, height, 0x1a3d3b);
        
        // Add workshop elements
        this.createWorkshopElements();
    }

    createWorkshopElements() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create tool silhouettes and workshop atmosphere
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * width;
            const y = height - 50 - Math.random() * 100;
            const tool = this.add.rectangle(x, y, 20, 4, 0x4a5568, 0.3);
            tool.setRotation(Math.random() * Math.PI);
        }
        
        // Add some "sparks" or energy effects
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const spark = this.add.circle(x, y, 2, 0xffd700, 0.6);
            
            this.tweens.add({
                targets: spark,
                alpha: 0.2,
                duration: 1000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1
            });
        }
    }

    createLayout() {
        // Title
        this.add.text(this.cameras.main.centerX, 50, '🔧 ROBOT CRAFT WORKSHOP', {
            fontSize: '32px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Inventory section
        this.add.text(this.inventoryArea.x, 100, 'Parts Inventory', {
            fontSize: '24px',
            fill: '#a8d5d1'
        });
        
        this.inventoryBg = this.add.rectangle(
            this.inventoryArea.x + this.inventoryArea.width/2,
            this.inventoryArea.y + this.inventoryArea.height/2,
            this.inventoryArea.width,
            this.inventoryArea.height,
            0x2c5f5d,
            0.8
        ).setStrokeStyle(2, 0x4a9eff);
        
        // Craft section
        this.add.text(this.craftArea.x, 100, 'Robot Assembly', {
            fontSize: '24px',
            fill: '#a8d5d1'
        });
        
        this.craftBg = this.add.rectangle(
            this.craftArea.x + this.craftArea.width/2,
            this.craftArea.y + this.craftArea.height/2,
            this.craftArea.width,
            this.craftArea.height,
            0x2c5f5d,
            0.8
        ).setStrokeStyle(2, 0x4a9eff);
    }

    setupLayout() {
        // Set up responsive layout now that cameras are available
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        this.inventoryArea = { 
            x: 50, 
            y: 120, 
            width: Math.max(400, screenWidth * 0.4), // At least 400px or 40% of screen
            height: screenHeight - 200 // Use most of screen height
        };
        this.craftArea = { 
            x: this.inventoryArea.x + this.inventoryArea.width + 50, 
            y: 120, 
            width: Math.max(350, screenWidth * 0.35), 
            height: screenHeight - 200 
        };
        
        console.log(`📐 Layout setup: Screen ${screenWidth}x${screenHeight}, Inventory ${this.inventoryArea.width}x${this.inventoryArea.height}`);
    }

    createInventory() {
        let yOffset = 0;
        const partTypes = ['head', 'body', 'arms', 'legs', 'powerCore'];
        
        console.log(`📦 Creating inventory with area: ${this.inventoryArea.width}x${this.inventoryArea.height}`);
        
        partTypes.forEach(partType => {
            const parts = this.robotParts[partType] || [];
            
            if (parts.length > 0) {
                // Compact section header
                const header = this.add.text(
                    this.inventoryArea.x + 10,
                    this.inventoryArea.y + 10 + yOffset,
                    `${partType.toUpperCase().slice(0,4)} (${parts.length})`,
                    {
                        fontSize: '12px',
                        fill: '#ffff00',
                        fontWeight: 'bold'
                    }
                );
                
                yOffset += 18;
                
                // Ultra compact grid - very small parts, minimal padding
                const partSize = 35; // Further reduced to 35 to fit more parts
                const padding = 3; // Minimal padding
                const availableWidth = this.inventoryArea.width - 40; // Leave smaller margins
                const partsPerRow = Math.floor(availableWidth / (partSize + padding));
                
                parts.forEach((part, index) => {
                    const row = Math.floor(index / partsPerRow);
                    const col = index % partsPerRow;
                    
                    const partItem = this.createPartItem(
                        this.inventoryArea.x + 20 + col * (partSize + padding),
                        this.inventoryArea.y + 20 + yOffset + row * (partSize + padding),
                        part,
                        partType
                    );
                    
                    this.partsInventory.push(partItem);
                });
                
                const rowsUsed = Math.ceil(parts.length / partsPerRow);
                yOffset += rowsUsed * (partSize + padding) + 10; // Reduced spacing between sections
            }
        });
        
        // If no parts, show message
        if (this.partsInventory.length === 0) {
            this.add.text(
                this.inventoryArea.x + this.inventoryArea.width/2,
                this.inventoryArea.y + this.inventoryArea.height/2,
                'No robot parts collected yet!\nPlay levels to find parts.',
                {
                    fontSize: '18px',
                    fill: '#888888',
                    align: 'center'
                }
            ).setOrigin(0.5);
        } else {
            console.log(`✅ Created inventory with ${this.partsInventory.length} parts`);
        }
        
        // Add scroll hint if inventory is tall
        if (yOffset > this.inventoryArea.height - 50) {
            this.add.text(
                this.inventoryArea.x + this.inventoryArea.width - 20,
                this.inventoryArea.y + this.inventoryArea.height - 30,
                '↕ Scroll to see more',
                {
                    fontSize: '14px',
                    fill: '#888888'
                }
            ).setOrigin(1, 0.5);
        }
    }

    createPartItem(x, y, part, partType) {
        const colors = {
            'common': 0x888888,
            'rare': 0x4169e1,
            'epic': 0x9932cc
        };
        
        // Part container
        const container = this.add.container(x, y);
        
        // Part icon background (rectangle instead of star to avoid setTint issues)
        const icon = this.add.rectangle(0, 0, 24, 24, colors[part.rarity]);
        
        // Part label (part type initial)
        const label = this.add.text(0, 0, partType.charAt(0).toUpperCase(), {
            fontSize: '12px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // Part type indicator (small text below)
        const typeLabel = this.add.text(0, 14, partType.slice(0,4), {
            fontSize: '7px',
            fill: '#cccccc'
        }).setOrigin(0.5);
        
        container.add([icon, label, typeLabel]);
        
        // Make interactive
        container.setSize(30, 30);
        container.setInteractive({ useHandCursor: true });
        
        container.on('pointerover', () => {
            icon.setFillStyle(0xffffff);
            label.setColor('#000000');
            container.setScale(1.1);
        });
        
        container.on('pointerout', () => {
            icon.setFillStyle(colors[part.rarity]);
            label.setColor('#ffffff');
            container.setScale(1.0);
        });
        
        container.on('pointerdown', () => {
            this.selectPart(part, partType);
        });
        
        container.setData('part', part);
        container.setData('partType', partType);
        
        return container;
    }

    selectPart(part, partType) {
        // Add part to selected robot build
        this.selectedParts[partType] = part;
        
        console.log(`Selected ${part.rarity} ${partType} part`);
        
        // Update robot preview
        this.updateRobotPreview();
        
        // Create selection effect
        this.createSelectionEffect();
    }

    createCraftArea() {
        // Robot assembly slots
        const slotPositions = {
            head: { x: this.craftArea.x + 200, y: this.craftArea.y + 80 },
            body: { x: this.craftArea.x + 200, y: this.craftArea.y + 150 },
            arms: { x: this.craftArea.x + 120, y: this.craftArea.y + 150 },
            legs: { x: this.craftArea.x + 200, y: this.craftArea.y + 220 },
            powerCore: { x: this.craftArea.x + 280, y: this.craftArea.y + 150 }
        };
        
        this.assemblySlots = {};
        
        Object.entries(slotPositions).forEach(([partType, pos]) => {
            // Slot background
            const slot = this.add.circle(pos.x, pos.y, 25, 0x000000, 0.5);
            slot.setStrokeStyle(2, 0x666666);
            
            // Slot label
            const label = this.add.text(pos.x, pos.y + 40, partType, {
                fontSize: '14px',
                fill: '#888888'
            }).setOrigin(0.5);
            
            this.assemblySlots[partType] = { slot, label, part: null };
        });
        
        // Craft button
        this.craftButton = this.add.text(
            this.craftArea.x + this.craftArea.width/2,
            this.craftArea.y + this.craftArea.height - 60,
            'BUILD ROBOT',
            {
                fontSize: '24px',
                fill: '#ffffff',
                backgroundColor: '#ff6b6b',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        this.craftButton.on('pointerdown', () => {
            this.buildRobot();
        });
        
        this.updateCraftButton();
    }

    updateRobotPreview() {
        // Clear existing preview
        if (this.robotPreview) {
            this.robotPreview.destroy();
        }
        
        // Create new preview based on selected parts
        this.robotPreview = this.add.container(
            this.craftArea.x + 200,
            this.craftArea.y + 150
        );
        
        const colors = {
            'common': 0x888888,
            'rare': 0x4169e1,
            'epic': 0x9932cc
        };
        
        // Update assembly slots
        Object.entries(this.selectedParts).forEach(([partType, part]) => {
            const slot = this.assemblySlots[partType];
            
            if (part) {
                // Create part visual in slot
                const partVisual = this.add.star(
                    slot.slot.x, 
                    slot.slot.y, 
                    5, 8, 16, 
                    colors[part.rarity], 
                    1
                );
                
                slot.part = partVisual;
            } else if (slot.part) {
                slot.part.destroy();
                slot.part = null;
            }
        });
        
        this.updateCraftButton();
    }

    updateCraftButton() {
        // Check if all parts are selected
        const allPartsSelected = Object.values(this.selectedParts).every(part => part !== null);
        
        if (allPartsSelected) {
            this.craftButton.setStyle({
                fontSize: '24px',
                fill: '#ffffff',
                backgroundColor: '#00ff00',
                padding: { x: 20, y: 10 }
            });
            this.craftButton.setText('BUILD SUPER ROBOT!');
        } else {
            this.craftButton.setStyle({
                fontSize: '24px',
                fill: '#ffffff',
                backgroundColor: '#666666',
                padding: { x: 20, y: 10 }
            });
            this.craftButton.setText('SELECT ALL PARTS');
        }
    }

    createSelectionEffect() {
        // Simple flash effect
        const flash = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            this.cameras.main.width,
            this.cameras.main.height,
            0xffffff,
            0.3
        );
        
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });
    }

    buildRobot() {
        const allPartsSelected = Object.values(this.selectedParts).every(part => part !== null);
        
        if (!allPartsSelected) {
            console.log('Cannot build robot - missing parts');
            return;
        }
        
        console.log('Building super robot!');
        
        // Create completion effect
        this.createCompletionEffect();
        
        // Show completion message
        const completionText = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            '🤖 SUPER ROBOT COMPLETE! 🤖\n\nYou have mastered the art of\nTaekwondo Robot Building!\n\nCongratulations!',
            {
                fontSize: '28px',
                fill: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 30, y: 20 },
                align: 'center'
            }
        ).setOrigin(0.5).setDepth(200);
        
        // Complete the game
        this.time.delayedCall(5000, () => {
            window.gameInstance.completeGame();
        });
    }

    createCompletionEffect() {
        // Spectacular completion effect
        for (let i = 0; i < 50; i++) {
            const x = this.cameras.main.centerX + (Math.random() - 0.5) * 400;
            const y = this.cameras.main.centerY + (Math.random() - 0.5) * 300;
            
            const particle = this.add.star(x, y, 6, 10, 20, 0xffd700, 1);
            
            this.tweens.add({
                targets: particle,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                rotation: Math.PI * 2,
                duration: 2000,
                delay: i * 50,
                onComplete: () => particle.destroy()
            });
        }
    }

    createNavigation() {
        // Back to menu button
        const backButton = this.add.text(50, 50, '← Back to Menu', {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#3e8084',
            padding: { x: 15, y: 8 }
        }).setInteractive({ useHandCursor: true });
        
        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
        
        // Outfit selection button
        const outfitButton = this.add.text(50, 100, '👕 Change Outfit', {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#9370db',
            padding: { x: 15, y: 8 }
        }).setInteractive({ useHandCursor: true });
        
        outfitButton.on('pointerdown', () => {
            this.showOutfitSelection();
        });
        
        // Continue to next level (if applicable)
        if (window.gameInstance.gameData.currentLevel <= 5) {
            const continueButton = this.add.text(
                this.cameras.main.width - 50, 
                50, 
                'Continue to Next Level →', 
                {
                    fontSize: '18px',
                    fill: '#ffffff',
                    backgroundColor: '#4a9eff',
                    padding: { x: 15, y: 8 }
                }
            ).setOrigin(1, 0).setInteractive({ useHandCursor: true });
            
            continueButton.on('pointerdown', () => {
                this.scene.start('GameScene');
            });
        }
    }

    showOutfitSelection() {
        // Check for new unlocks before showing UI
        const newUnlocks = window.gameInstance.checkDragonUnlocks();
        
        // Create dragon costume selection overlay
        const overlay = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            700,
            500,
            0x0a0a0a,
            0.95
        ).setDepth(100);
        
        overlay.setStrokeStyle(3, 0x8b4513);
        
        const title = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 210,
            '🐉 DRAGON COSTUME SELECTION 🐉',
            {
                fontSize: '32px',
                fill: '#ffd700',
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5).setDepth(101);
        
        // Available dragon costumes
        const dragonCostumes = ['default', 'fire', 'ice', 'lightning', 'shadow'];
        
        const outfitElements = [overlay, title];
        
        dragonCostumes.forEach((costumeKey, index) => {
            const costume = window.gameInstance.getDragonCostume(costumeKey);
            const isUnlocked = this.isDragonUnlocked(costumeKey);
            const isCurrent = window.gameInstance.gameData.outfits.current === costumeKey;
            const isNewlyUnlocked = newUnlocks.includes(costumeKey);
            
            const y = this.cameras.main.centerY - 150 + (index * 80);
            
            // Dragon costume preview (larger, with both colors)
            const previewBg = this.add.rectangle(
                this.cameras.main.centerX - 250,
                y,
                60,
                70,
                isUnlocked ? costume.primaryColor : 0x333333,
                isUnlocked ? 1 : 0.3
            ).setDepth(101);
            
            previewBg.setStrokeStyle(2, isUnlocked ? costume.beltColor : 0x666666);
            
            // Secondary color accent
            const accentRect = this.add.rectangle(
                this.cameras.main.centerX - 240,
                y,
                20,
                70,
                isUnlocked ? costume.secondaryColor : 0x222222,
                isUnlocked ? 0.8 : 0.3
            ).setDepth(102);
            
            // Dragon icon
            const icon = this.add.text(
                this.cameras.main.centerX - 250,
                y - 25,
                costume.icon,
                {
                    fontSize: '24px'
                }
            ).setOrigin(0.5).setDepth(103).setAlpha(isUnlocked ? 1 : 0.3);
            
            // "NEW!" badge for newly unlocked costumes
            if (isNewlyUnlocked) {
                const newBadge = this.add.text(
                    this.cameras.main.centerX - 220,
                    y - 35,
                    'NEW!',
                    {
                        fontSize: '14px',
                        fill: '#ffff00',
                        backgroundColor: '#ff0000',
                        padding: { x: 5, y: 2 },
                        fontWeight: 'bold'
                    }
                ).setOrigin(0.5).setDepth(104);
                
                // Pulse animation for NEW badge
                this.tweens.add({
                    targets: newBadge,
                    scale: 1.2,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
                
                outfitElements.push(newBadge);
            }
            
            // Dragon costume name
            const nameText = this.add.text(
                this.cameras.main.centerX - 170,
                y - 20,
                costume.name,
                {
                    fontSize: '22px',
                    fill: isUnlocked ? '#ffffff' : '#666666',
                    fontWeight: 'bold'
                }
            ).setOrigin(0, 0.5).setDepth(101);
            
            // Description
            const descText = this.add.text(
                this.cameras.main.centerX - 170,
                y + 5,
                costume.description,
                {
                    fontSize: '14px',
                    fill: isUnlocked ? '#aaaaaa' : '#444444',
                    fontStyle: 'italic'
                }
            ).setOrigin(0, 0.5).setDepth(101);
            
            // Unlock condition / progress
            const conditionText = this.add.text(
                this.cameras.main.centerX - 170,
                y + 25,
                this.getUnlockProgressText(costumeKey),
                {
                    fontSize: '12px',
                    fill: isUnlocked ? '#00ff00' : '#ff8800'
                }
            ).setOrigin(0, 0.5).setDepth(101);
            
            // Status/Select button
            let button;
            if (!isUnlocked) {
                button = this.add.text(
                    this.cameras.main.centerX + 220,
                    y,
                    '🔒 LOCKED',
                    {
                        fontSize: '16px',
                        fill: '#666666',
                        backgroundColor: '#333333',
                        padding: { x: 12, y: 8 }
                    }
                ).setOrigin(0.5).setDepth(101);
            } else if (isCurrent) {
                button = this.add.text(
                    this.cameras.main.centerX + 220,
                    y,
                    '✓ EQUIPPED',
                    {
                        fontSize: '16px',
                        fill: '#ffffff',
                        backgroundColor: '#4a9eff',
                        padding: { x: 12, y: 8 }
                    }
                ).setOrigin(0.5).setDepth(101);
            } else {
                button = this.add.text(
                    this.cameras.main.centerX + 220,
                    y,
                    'EQUIP',
                    {
                        fontSize: '16px',
                        fill: '#ffffff',
                        backgroundColor: '#00aa00',
                        padding: { x: 12, y: 8 }
                    }
                ).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(101);
                
                button.on('pointerover', () => {
                    button.setStyle({ backgroundColor: '#00dd00' });
                });
                
                button.on('pointerout', () => {
                    button.setStyle({ backgroundColor: '#00aa00' });
                });
                
                button.on('pointerdown', () => {
                    window.gameInstance.setOutfit(costumeKey);
                    this.closeOutfitSelection(outfitElements);
                    
                    // Show equipped notification
                    this.showDragonEquippedNotification(costume);
                });
            }
            
            outfitElements.push(previewBg, accentRect, icon, nameText, descText, conditionText, button);
        });
        
        // Close button
        const closeButton = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 210,
            'Close',
            {
                fontSize: '20px',
                fill: '#ffffff',
                backgroundColor: '#ff6b6b',
                padding: { x: 20, y: 10 }
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(101);
        
        closeButton.on('pointerover', () => {
            closeButton.setScale(1.1);
        });
        
        closeButton.on('pointerout', () => {
            closeButton.setScale(1.0);
        });
        
        closeButton.on('pointerdown', () => {
            this.closeOutfitSelection(outfitElements);
        });
        
        outfitElements.push(closeButton);
        
        // Show unlock notifications for newly unlocked costumes
        if (newUnlocks.length > 0) {
            this.time.delayedCall(500, () => {
                newUnlocks.forEach((costumeKey, index) => {
                    this.time.delayedCall(index * 800, () => {
                        this.showDragonUnlockNotification(costumeKey);
                    });
                });
            });
        }
    }

    isDragonUnlocked(costumeKey) {
        const gameData = window.gameInstance.gameData;
        
        switch (costumeKey) {
            case 'default':
                return true;
            case 'fire':
                // Unlock after completing level 1
                return gameData.currentLevel >= 2;
            case 'ice':
                // Unlock after collecting 5 robot parts
                return window.gameInstance.getTotalPartsCollected() >= 5;
            case 'lightning':
                // Unlock after completing level 2
                return gameData.currentLevel >= 3;
            case 'shadow':
                // Unlock after completing all 5 levels
                return gameData.currentLevel >= 6;
            default:
                return false;
        }
    }

    getUnlockProgressText(costumeKey) {
        const gameData = window.gameInstance.gameData;
        const costume = window.gameInstance.getDragonCostume(costumeKey);
        
        if (this.isDragonUnlocked(costumeKey)) {
            return '✓ Unlocked';
        }
        
        switch (costumeKey) {
            case 'fire':
                return `🔒 Complete Level 1 (Current: Level ${gameData.currentLevel})`;
            case 'ice':
                const parts = window.gameInstance.getTotalPartsCollected();
                return `🔒 Collect 5 parts (${parts}/5)`;
            case 'lightning':
                return `🔒 Complete Level 2 (Current: Level ${gameData.currentLevel})`;
            case 'shadow':
                return `🔒 Complete the game`;
            default:
                return costume.unlockCondition;
        }
    }

    getTotalPartsCollected() {
        return window.gameInstance.getTotalPartsCollected();
    }

    showDragonUnlockNotification(costumeKey) {
        const costume = window.gameInstance.getDragonCostume(costumeKey);
        
        // Create unlock notification
        const notification = this.add.container(this.cameras.main.centerX, -200);
        notification.setDepth(200);
        
        // Background
        const bg = this.add.rectangle(0, 0, 500, 150, 0x000000, 0.9);
        bg.setStrokeStyle(4, costume.primaryColor);
        
        // Dragon icon (large)
        const icon = this.add.text(0, -30, costume.icon, {
            fontSize: '48px'
        }).setOrigin(0.5);
        
        // Title
        const title = this.add.text(0, 20, '🐉 DRAGON UNLOCKED! 🐉', {
            fontSize: '24px',
            fill: '#ffd700',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // Dragon name
        const name = this.add.text(0, 50, costume.name, {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        notification.add([bg, icon, title, name]);
        
        // Slide down animation
        this.tweens.add({
            targets: notification,
            y: 150,
            duration: 800,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Hold for a moment
                this.time.delayedCall(2500, () => {
                    // Slide up
                    this.tweens.add({
                        targets: notification,
                        y: -200,
                        duration: 600,
                        ease: 'Back.easeIn',
                        onComplete: () => notification.destroy()
                    });
                });
            }
        });
        
        // Add particle effect
        for (let i = 0; i < 30; i++) {
            this.time.delayedCall(i * 50, () => {
                const x = this.cameras.main.centerX + (Math.random() - 0.5) * 400;
                const y = 150 + (Math.random() - 0.5) * 100;
                
                const particle = this.add.circle(x, y, 4, costume.effectColor, 1);
                particle.setDepth(199);
                
                this.tweens.add({
                    targets: particle,
                    y: y + 50,
                    alpha: 0,
                    scale: 0,
                    duration: 1000,
                    onComplete: () => particle.destroy()
                });
            });
        }
    }

    showDragonEquippedNotification(costume) {
        // Create equipped notification (simpler, shorter)
        const notification = this.add.container(this.cameras.main.centerX, this.cameras.main.centerY);
        notification.setDepth(200);
        notification.setAlpha(0);
        
        // Background
        const bg = this.add.rectangle(0, 0, 400, 100, costume.primaryColor, 0.95);
        bg.setStrokeStyle(3, costume.beltColor);
        
        // Icon
        const icon = this.add.text(-100, 0, costume.icon, {
            fontSize: '36px'
        }).setOrigin(0.5);
        
        // Text
        const text = this.add.text(20, 0, `${costume.name} Equipped!`, {
            fontSize: '22px',
            fill: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0, 0.5);
        
        notification.add([bg, icon, text]);
        
        // Fade in, hold, fade out
        this.tweens.add({
            targets: notification,
            alpha: 1,
            duration: 300,
            onComplete: () => {
                this.time.delayedCall(1500, () => {
                    this.tweens.add({
                        targets: notification,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => notification.destroy()
                    });
                });
            }
        });
    }

    closeOutfitSelection(elements) {
        elements.forEach(element => {
            if (element) element.destroy();
        });
    }

    setupInput() {
        // Escape key to go back to menu
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    update() {
        // Update any craft scene animations
    }
}
