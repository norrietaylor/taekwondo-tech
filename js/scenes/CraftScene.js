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
        
        // Layout
        this.inventoryArea = { x: 100, y: 150, width: 300, height: 400 };
        this.craftArea = { x: 500, y: 150, width: 400, height: 400 };
    }

    create() {
        console.log('CraftScene created');
        
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

    createInventory() {
        let yOffset = 0;
        const partTypes = ['head', 'body', 'arms', 'legs', 'powerCore'];
        
        partTypes.forEach(partType => {
            const parts = this.robotParts[partType] || [];
            
            if (parts.length > 0) {
                // Section header
                const header = this.add.text(
                    this.inventoryArea.x + 20,
                    this.inventoryArea.y + 20 + yOffset,
                    `${partType.toUpperCase()} (${parts.length})`,
                    {
                        fontSize: '18px',
                        fill: '#ffffff',
                        fontWeight: 'bold'
                    }
                );
                
                yOffset += 30;
                
                // Display parts
                parts.forEach((part, index) => {
                    const partItem = this.createPartItem(
                        this.inventoryArea.x + 30 + (index % 3) * 80,
                        this.inventoryArea.y + 20 + yOffset + Math.floor(index / 3) * 60,
                        part,
                        partType
                    );
                    
                    this.partsInventory.push(partItem);
                });
                
                yOffset += Math.ceil(parts.length / 3) * 60 + 10;
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
        
        // Part icon (simplified representation)
        const icon = this.add.star(0, 0, 5, 8, 16, colors[part.rarity], 1);
        
        // Part label
        const label = this.add.text(0, 20, partType.charAt(0).toUpperCase(), {
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        container.add([icon, label]);
        
        // Make interactive
        icon.setInteractive({ useHandCursor: true });
        
        icon.on('pointerover', () => {
            icon.setTint(0xcccccc);
            container.setScale(1.1);
        });
        
        icon.on('pointerout', () => {
            icon.clearTint();
            container.setScale(1.0);
        });
        
        icon.on('pointerdown', () => {
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
        if (window.gameInstance.gameData.currentLevel <= 3) {
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
        // Create outfit selection overlay
        const overlay = this.add.rectangle(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            500,
            400,
            0x000000,
            0.8
        );
        
        const title = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY - 150,
            '👕 OUTFIT SELECTION',
            {
                fontSize: '28px',
                fill: '#ffffff',
                fontWeight: 'bold'
            }
        ).setOrigin(0.5);
        
        // Available outfits
        const outfits = [
            { name: 'default', label: 'Default Gi', color: 0x4a9eff, unlocked: true },
            { name: 'halloween', label: '🎃 Halloween', color: 0xff4500, unlocked: this.isOutfitUnlocked('halloween') },
            { name: 'christmas', label: '🎄 Christmas', color: 0x228b22, unlocked: this.isOutfitUnlocked('christmas') },
            { name: 'master', label: '🥇 Master', color: 0xffd700, unlocked: this.isOutfitUnlocked('master') }
        ];
        
        const outfitElements = [];
        
        outfits.forEach((outfit, index) => {
            const y = this.cameras.main.centerY - 80 + (index * 50);
            
            // Outfit preview
            const preview = this.add.rectangle(
                this.cameras.main.centerX - 150,
                y,
                30,
                40,
                outfit.color,
                outfit.unlocked ? 1 : 0.3
            );
            
            // Outfit name
            const nameText = this.add.text(
                this.cameras.main.centerX - 100,
                y,
                outfit.label,
                {
                    fontSize: '20px',
                    fill: outfit.unlocked ? '#ffffff' : '#666666'
                }
            ).setOrigin(0, 0.5);
            
            // Status/Select button
            let button;
            if (!outfit.unlocked) {
                button = this.add.text(
                    this.cameras.main.centerX + 100,
                    y,
                    'LOCKED',
                    {
                        fontSize: '16px',
                        fill: '#666666',
                        backgroundColor: '#333333',
                        padding: { x: 10, y: 5 }
                    }
                ).setOrigin(0.5);
            } else if (window.gameInstance.gameData.outfits.current === outfit.name) {
                button = this.add.text(
                    this.cameras.main.centerX + 100,
                    y,
                    'CURRENT',
                    {
                        fontSize: '16px',
                        fill: '#ffffff',
                        backgroundColor: '#4a9eff',
                        padding: { x: 10, y: 5 }
                    }
                ).setOrigin(0.5);
            } else {
                button = this.add.text(
                    this.cameras.main.centerX + 100,
                    y,
                    'SELECT',
                    {
                        fontSize: '16px',
                        fill: '#ffffff',
                        backgroundColor: '#00aa00',
                        padding: { x: 10, y: 5 }
                    }
                ).setOrigin(0.5).setInteractive({ useHandCursor: true });
                
                button.on('pointerdown', () => {
                    window.gameInstance.setOutfit(outfit.name);
                    this.closeOutfitSelection(outfitElements);
                });
            }
            
            outfitElements.push(preview, nameText, button);
        });
        
        // Close button
        const closeButton = this.add.text(
            this.cameras.main.centerX,
            this.cameras.main.centerY + 130,
            'Close',
            {
                fontSize: '20px',
                fill: '#ffffff',
                backgroundColor: '#ff6b6b',
                padding: { x: 15, y: 8 }
            }
        ).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        closeButton.on('pointerdown', () => {
            this.closeOutfitSelection([overlay, title, closeButton, ...outfitElements]);
        });
        
        outfitElements.push(overlay, title, closeButton);
    }

    isOutfitUnlocked(outfitName) {
        const gameData = window.gameInstance.gameData;
        
        switch (outfitName) {
            case 'halloween':
                // Unlock after completing level 2
                return gameData.currentLevel > 2;
            case 'christmas':
                // Unlock after collecting 10 robot parts
                return this.getTotalPartsCollected() >= 10;
            case 'master':
                // Unlock after completing the game
                return gameData.currentLevel > 3;
            default:
                return false;
        }
    }

    getTotalPartsCollected() {
        const parts = window.gameInstance.gameData.robotParts;
        let total = 0;
        Object.keys(parts).forEach(type => {
            total += parts[type].length;
        });
        return total;
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
