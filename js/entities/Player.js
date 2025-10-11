// Player character with taekwondo abilities
class Player {
    constructor(scene, x, y) {
        try {
            console.log('Player constructor started at:', x, y);
            this.scene = scene;
            
            // Check if controls exist
            if (!window.gameInstance || !window.gameInstance.controls) {
                console.error('No controls found, creating fallback');
                this.controls = null;
            } else {
                this.controls = window.gameInstance.controls;
                console.log('✅ Controls assigned');
            }
        
        // Create player sprite with outfit colors
        const outfitColor = this.getOutfitColor();
        this.sprite = scene.add.rectangle(x, y, 32, 48, outfitColor);
        this.sprite.setStrokeStyle(2, 0x2c5f5d);
        
        // Physics body
        scene.physics.add.existing(this.sprite);
        this.body = this.sprite.body;
        this.body.setCollideWorldBounds(true);
        this.body.setSize(28, 44);
        
        // Player properties
        this.speed = 200;
        this.jumpPower = 600;
        this.health = 100;
        this.maxHealth = 100;
        
        // State tracking
        this.facingRight = true;
        this.isGrounded = false;
        this.canJump = true;
        this.jumpCooldown = 0;
        this.lastGroundTime = 0;
        this.coyoteTime = 150; // ms
        
        // Double jump system
        this.hasDoubleJumped = false;
        this.canDoubleJump = true;
        this.doubleJumpPower = 600; // Slightly less than regular jump
        
        // Combat properties
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.kickRange = 40;
        this.punchRange = 30;
        this.comboCooldown = 0;
        this.comboCount = 0;
        
        // Power-up states
        this.powerUps = {
            fireBreath: false,
            ultraBlast: false,
            flyMode: false,
            invincibility: false,
            speedBoost: false
        };
        
        // Power-up timers
        this.powerUpTimers = {};
        
        // Special abilities cooldowns
        this.specialAbilityCooldowns = {
            fireBreath: 0,
            ultraBlast: 0
        };
        
        // Visual effects
        this.attackEffect = null;
        this.footstepTimer = 0;
        
        // Create simple visual elements
        this.createVisualElements();
        
        // Input handling
        this.setupInputHandlers();
        
            console.log('✅ Player created successfully at:', x, y);
            
        } catch (error) {
            console.error('💥 ERROR in Player constructor:', error.message);
            console.error('Stack trace:', error.stack);
            
            // Create minimal fallback player
            this.scene = scene;
            this.controls = null;
            this.sprite = scene.add.rectangle(x, y, 32, 48, 0xff0000); // Red to indicate error
            scene.physics.add.existing(this.sprite);
            this.body = this.sprite.body;
        }
    }

    createVisualElements() {
        // Add simple face/details to the rectangle
        this.eye1 = this.scene.add.circle(this.sprite.x - 6, this.sprite.y - 8, 2, 0xffffff);
        this.eye2 = this.scene.add.circle(this.sprite.x + 6, this.sprite.y - 8, 2, 0xffffff);
        this.belt = this.scene.add.rectangle(this.sprite.x, this.sprite.y + 8, 32, 4, 0x8b4513);
        
        // Create dragon wings
        this.createDragonWings();
        
        // Group visual elements
        this.visualGroup = this.scene.add.group([this.eye1, this.eye2, this.belt]);
        
        // Wing animation state
        this.wingFlapTime = 0;
        this.wingFlapSpeed = 0.1;
    }

    createDragonWings() {
        const costume = this.getDragonCostume();
        
        console.log('🦅 Creating wings for costume:', costume.name, 'hasWings:', costume.hasWings);
        
        // Create left wing
        this.leftWing = this.scene.add.container(this.sprite.x, this.sprite.y);
        this.leftWing.setDepth(50); // Higher depth to ensure visibility
        
        // Create right wing  
        this.rightWing = this.scene.add.container(this.sprite.x, this.sprite.y);
        this.rightWing.setDepth(50); // Higher depth to ensure visibility
        
        // Only create wing graphics if costume has wings
        if (costume.hasWings) {
            console.log('🦅 Adding wing segments with colors:', costume.wingColor.toString(16), costume.wingTipColor.toString(16));
            // Left wing segments (3 segments for depth)
            const leftWingSegments = [];
            for (let i = 0; i < 3; i++) {
                const segment = this.scene.add.triangle(
                    0, 0,
                    0, -10 - (i * 5),   // top point
                    -15 - (i * 5), 5,   // bottom left
                    -5 - (i * 3), 10,   // bottom right
                    i === 2 ? costume.wingTipColor : costume.wingColor,
                    1.0  // Full opacity for visibility
                );
                segment.setStrokeStyle(2, 0x000000, 1.0);  // Black border for visibility
                leftWingSegments.push(segment);
                this.leftWing.add(segment);
                console.log(`  Left wing segment ${i} created at depth`, segment.depth);
            }
            
            // Right wing segments (3 segments for depth)
            const rightWingSegments = [];
            for (let i = 0; i < 3; i++) {
                const segment = this.scene.add.triangle(
                    0, 0,
                    0, -10 - (i * 5),   // top point
                    15 + (i * 5), 5,    // bottom right
                    5 + (i * 3), 10,    // bottom left
                    i === 2 ? costume.wingTipColor : costume.wingColor,
                    1.0  // Full opacity for visibility
                );
                segment.setStrokeStyle(2, 0x000000, 1.0);  // Black border for visibility
                rightWingSegments.push(segment);
                this.rightWing.add(segment);
                console.log(`  Right wing segment ${i} created at depth`, segment.depth);
            }
            
            this.leftWing.setVisible(true);
            this.rightWing.setVisible(true);
            console.log('✅ Wings created and visible!');
        } else {
            this.leftWing.setVisible(false);
            this.rightWing.setVisible(false);
            console.log('❌ No wings for this costume');
        }
    }

    updateWings() {
        if (!this.leftWing || !this.rightWing) {
            console.warn('⚠️ Wings not created yet');
            return;
        }
        
        const costume = this.getDragonCostume();
        
        // Hide wings if costume doesn't have them
        if (!costume.hasWings) {
            this.leftWing.setVisible(false);
            this.rightWing.setVisible(false);
            return;
        }
        
        this.leftWing.setVisible(true);
        this.rightWing.setVisible(true);
        
        // Update wing positions
        const wingOffsetX = this.facingRight ? -5 : 5;
        const wingOffsetY = 0;
        
        this.leftWing.x = this.sprite.x + wingOffsetX;
        this.leftWing.y = this.sprite.y + wingOffsetY;
        this.rightWing.x = this.sprite.x + wingOffsetX;
        this.rightWing.y = this.sprite.y + wingOffsetY;
        
        // Update wing animation based on movement state
        this.wingFlapTime += this.wingFlapSpeed;
        
        let leftAngle = 0;
        let rightAngle = 0;
        
        if (!this.isGrounded) {
            // In air - flapping animation
            const flapIntensity = Math.sin(this.wingFlapTime * 10) * 0.3;
            
            if (this.body.velocity.y < 0) {
                // Jumping up - wings spread wide
                leftAngle = -0.6 + flapIntensity;
                rightAngle = 0.6 - flapIntensity;
            } else {
                // Falling - wings extended
                leftAngle = -0.4 + flapIntensity;
                rightAngle = 0.4 - flapIntensity;
            }
        } else if (Math.abs(this.body.velocity.x) > 50) {
            // Running - gentle flutter
            const flutter = Math.sin(this.wingFlapTime * 8) * 0.15;
            leftAngle = -0.2 + flutter;
            rightAngle = 0.2 - flutter;
        } else {
            // Idle - subtle breathing motion
            const breathe = Math.sin(this.wingFlapTime * 3) * 0.1;
            leftAngle = -0.15 + breathe;
            rightAngle = 0.15 - breathe;
        }
        
        // Apply angles
        this.leftWing.setRotation(leftAngle);
        this.rightWing.setRotation(rightAngle);
        
        // Flip wings based on facing direction
        if (!this.facingRight) {
            this.leftWing.setScale(-1, 1);
            this.rightWing.setScale(-1, 1);
        } else {
            this.leftWing.setScale(1, 1);
            this.rightWing.setScale(1, 1);
        }
    }

    recreateWings() {
        // Destroy old wings
        if (this.leftWing) {
            this.leftWing.destroy();
        }
        if (this.rightWing) {
            this.rightWing.destroy();
        }
        
        // Create new wings with current costume
        this.createDragonWings();
    }

    setupInputHandlers() {
        // Store previous frame input states for edge detection
        this.previousInputs = {
            jump: false,
            kick: false,
            punch: false
        };
    }

    update(time, delta) {
        // Update cooldowns
        this.updateCooldowns(delta);
        
        // Handle movement
        this.handleMovement();
        
        // Handle combat
        this.handleCombat();
        
        // Update visual elements
        this.updateVisuals();
        
        // Update dragon wings
        this.updateWings();
        
        // Update grounded state
        this.updateGroundedState();
        
        // Store previous inputs
        this.storePreviousInputs();
    }

    updateCooldowns(delta) {
        if (this.jumpCooldown > 0) this.jumpCooldown -= delta;
        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        if (this.comboCooldown > 0) {
            this.comboCooldown -= delta;
            if (this.comboCooldown <= 0) {
                this.comboCount = 0;
            }
        }
        
        // Update special ability cooldowns
        Object.keys(this.specialAbilityCooldowns).forEach(ability => {
            if (this.specialAbilityCooldowns[ability] > 0) {
                this.specialAbilityCooldowns[ability] -= delta;
            }
        });
    }

    handleMovement() {
        const horizontal = this.controls.getHorizontal();
        const vertical = this.controls.getVertical();
        
        // Horizontal movement
        if (Math.abs(horizontal) > 0.1) {
            const currentSpeed = this.speed * (this.powerUps.speedBoost ? 1 : 1);
            this.body.setVelocityX(horizontal * currentSpeed);
            this.facingRight = horizontal > 0;
            
            // Footstep effects (simple)
            this.footstepTimer += 16; // Assuming ~60fps
            if (this.footstepTimer > 300 && this.isGrounded) {
                this.createFootstepEffect();
                this.footstepTimer = 0;
            }
        } else {
            // Apply friction
            this.body.setVelocityX(this.body.velocity.x * 0.8);
        }
        
        // Flight mode handling
        if (this.powerUps.flyMode) {
            // Can move vertically when flying
            if (Math.abs(vertical) > 0.1) {
                this.body.setVelocityY(-vertical * this.speed * 0.8);
            } else {
                // Hover in place
                this.body.setVelocityY(this.body.velocity.y * 0.9);
            }
            
            // Reduce gravity effect while flying
            this.body.setGravityY(-600); // Counteract world gravity partially
        } else {
            // Normal gravity
            this.body.setGravityY(0);
            
            // Normal jumping
            if (this.controls.isJump() && !this.previousInputs.jump) {
                this.tryJump();
            }
        }
    }

    handleCombat() {
        if (this.attackCooldown > 0) return;
        
        // Kick attack
        if (this.controls.isKick() && !this.previousInputs.kick) {
            this.performKick();
        }
        
        // Punch attack
        if (this.controls.isPunch() && !this.previousInputs.punch) {
            this.performPunch();
        }
        
        // Special abilities (using different keys or combinations)
        this.handleSpecialAbilities();
    }

    handleSpecialAbilities() {
        // Fire breath (Hold kick + punch together)
        if (this.controls.isKick() && this.controls.isPunch() && 
            this.powerUps.fireBreath && this.specialAbilityCooldowns.fireBreath <= 0) {
            this.performFireBreath();
        }
        
        // Ultra blast (double-tap punch)
        if (this.powerUps.ultraBlast && this.specialAbilityCooldowns.ultraBlast <= 0) {
            // Simple implementation - check for quick double punch
            if (this.controls.isPunch() && !this.previousInputs.punch && this.comboCount >= 2) {
                this.performUltraBlast();
            }
        }
    }

    tryJump() {
        const canCoyoteJump = (Date.now() - this.lastGroundTime) < this.coyoteTime;
        
        // Regular jump (when grounded or within coyote time)
        if ((this.isGrounded || canCoyoteJump) && this.jumpCooldown <= 0) {
            this.body.setVelocityY(-this.jumpPower);
            this.isGrounded = false;
            this.jumpCooldown = 100; // Prevent multi-jumping
            this.hasDoubleJumped = false; // Reset double jump when doing regular jump
            this.createJumpEffect();
            
            console.log('Player jumped!');
        }
        // Double jump (when in air and haven't used double jump yet)
        else if (!this.isGrounded && !this.hasDoubleJumped && this.canDoubleJump && this.jumpCooldown <= 0) {
            this.body.setVelocityY(-this.doubleJumpPower);
            this.hasDoubleJumped = true;
            this.jumpCooldown = 100; // Prevent multi-jumping
            this.createDoubleJumpEffect();
            
            console.log('Player double jumped!');
        }
    }

    performKick() {
        this.isAttacking = true;
        this.attackCooldown = 400; // ms
        this.comboCount++;
        this.comboCooldown = 1000; // Reset combo timer
        
        // Create kick effect
        this.createKickEffect();
        
        // Check for enemies in kick range
        this.checkAttackHit('kick');
        
        console.log(`Kick attack! Combo: ${this.comboCount}`);
    }

    performPunch() {
        this.isAttacking = true;
        this.attackCooldown = 300; // ms (faster than kick)
        this.comboCount++;
        this.comboCooldown = 1000;
        
        // Create punch effect
        this.createPunchEffect();
        
        // Check for enemies in punch range
        this.checkAttackHit('punch');
        
        console.log(`Punch attack! Combo: ${this.comboCount}`);
    }

    checkAttackHit(attackType) {
        const range = attackType === 'kick' ? this.kickRange : this.punchRange;
        const damage = attackType === 'kick' ? 30 : 20;
        
        // Get attack position
        const attackX = this.sprite.x + (this.facingRight ? range : -range);
        const attackY = this.sprite.y;
        
        // Check for enemies in range
        let hitEnemy = false;
        if (this.scene.enemies) {
            this.scene.enemies.children.entries.forEach(enemy => {
                if (enemy.active) {
                    const distance = Phaser.Math.Distance.Between(
                        attackX, attackY,
                        enemy.x, enemy.y
                    );
                    
                    if (distance < range) {
                        // Hit enemy
                        if (enemy.getData && enemy.getData('enemy')) {
                            enemy.getData('enemy').onPlayerAttack(attackType);
                            hitEnemy = true;
                        }
                    }
                }
            });
        }
        
        // Create visual feedback
        const effectColor = hitEnemy ? (attackType === 'kick' ? 0xff4444 : 0x44ff44) : 0x666666;
        this.scene.add.circle(attackX, attackY, 8, effectColor, 0.7)
            .setDepth(10)
            .setScale(0.5);
        
        // Animate the hit effect
        this.scene.tweens.add({
            targets: this.scene.children.list[this.scene.children.list.length - 1],
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: (tween) => {
                tween.targets[0].destroy();
            }
        });
        
        return hitEnemy;
    }

    createJumpEffect() {
        const costume = this.getDragonCostume();
        const effect = this.scene.add.circle(this.sprite.x, this.sprite.y + 24, 16, costume.effectColor, 0.6);
        this.scene.tweens.add({
            targets: effect,
            scaleX: 2,
            scaleY: 0.5,
            alpha: 0,
            duration: 300,
            onComplete: () => effect.destroy()
        });
    }

    createDoubleJumpEffect() {
        // Create a more distinctive effect for double jump with dragon colors
        const costume = this.getDragonCostume();
        const effect1 = this.scene.add.circle(this.sprite.x, this.sprite.y, 12, costume.effectColor, 0.8);
        const effect2 = this.scene.add.circle(this.sprite.x, this.sprite.y, 8, 0xffffff, 0.9);
        
        this.scene.tweens.add({
            targets: [effect1, effect2],
            scaleX: 2.5,
            scaleY: 2.5,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                effect1.destroy();
                effect2.destroy();
            }
        });
        
        // Add some dragon-colored sparkle particles
        for (let i = 0; i < 6; i++) {
            const sparkle = this.scene.add.circle(
                this.sprite.x + (Math.random() - 0.5) * 30,
                this.sprite.y + (Math.random() - 0.5) * 30,
                2,
                costume.effectColor,
                0.8
            );
            
            this.scene.tweens.add({
                targets: sparkle,
                y: sparkle.y - 20,
                alpha: 0,
                duration: 600 + i * 50,
                delay: i * 30,
                onComplete: () => sparkle.destroy()
            });
        }
    }

    createKickEffect() {
        const effectX = this.sprite.x + (this.facingRight ? 20 : -20);
        const effect = this.scene.add.rectangle(effectX, this.sprite.y, 8, 20, 0xff6b6b, 0.8);
        
        this.scene.tweens.add({
            targets: effect,
            scaleX: this.facingRight ? 2 : -2,
            alpha: 0,
            duration: 200,
            onComplete: () => effect.destroy()
        });
    }

    createPunchEffect() {
        const effectX = this.sprite.x + (this.facingRight ? 16 : -16);
        const effect = this.scene.add.circle(effectX, this.sprite.y - 5, 6, 0x44ff44, 0.8);
        
        this.scene.tweens.add({
            targets: effect,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 150,
            onComplete: () => effect.destroy()
        });
    }

    createFootstepEffect() {
        const costume = this.getDragonCostume();
        const effect = this.scene.add.circle(
            this.sprite.x + (Math.random() - 0.5) * 10, 
            this.sprite.y + 24, 
            3, 
            costume.effectColor, 
            0.3
        );
        
        this.scene.tweens.add({
            targets: effect,
            y: effect.y + 5,
            alpha: 0,
            duration: 500,
            onComplete: () => effect.destroy()
        });
    }

    updateVisuals() {
        // Get dragon costume colors
        const costume = this.getDragonCostume();
        
        // Update facing direction with dragon colors
        if (this.facingRight) {
            this.sprite.setFillStyle(costume.primaryColor);
        } else {
            this.sprite.setFillStyle(costume.secondaryColor);
        }
        
        // Update visual elements positions
        this.eye1.x = this.sprite.x + (this.facingRight ? -6 : 6);
        this.eye1.y = this.sprite.y - 8;
        this.eye2.x = this.sprite.x + (this.facingRight ? 6 : -6);
        this.eye2.y = this.sprite.y - 8;
        this.belt.x = this.sprite.x;
        this.belt.y = this.sprite.y + 8;
        
        // Squash and stretch for movement
        if (Math.abs(this.body.velocity.x) > 50) {
            this.sprite.setScale(1.1, 0.9);
        } else {
            this.sprite.setScale(1.0, 1.0);
        }
        
        // Jump/fall animation
        if (!this.isGrounded) {
            if (this.body.velocity.y < 0) {
                // Jumping up - stretch
                this.sprite.setScale(0.9, 1.1);
            } else {
                // Falling down - squash
                this.sprite.setScale(1.1, 0.9);
            }
        }
    }

    updateGroundedState() {
        const wasGrounded = this.isGrounded;
        this.isGrounded = this.body.blocked.down || this.body.touching.down;
        
        if (!wasGrounded && this.isGrounded) {
            // Just landed
            this.lastGroundTime = Date.now();
            this.hasDoubleJumped = false; // Reset double jump when landing
            this.createLandingEffect();
        }
    }

    createLandingEffect() {
        const effect = this.scene.add.rectangle(this.sprite.x, this.sprite.y + 24, 24, 4, 0xcccccc, 0.6);
        this.scene.tweens.add({
            targets: effect,
            scaleX: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => effect.destroy()
        });
    }

    storePreviousInputs() {
        this.previousInputs.jump = this.controls.isJump();
        this.previousInputs.kick = this.controls.isKick();
        this.previousInputs.punch = this.controls.isPunch();
    }

    // Power-up methods
    activatePowerUp(powerType, duration = 10000) {
        this.powerUps[powerType] = true;
        
        // Store timer reference for cleanup
        if (this.powerUpTimers[powerType]) {
            clearTimeout(this.powerUpTimers[powerType]);
        }
        
        // Apply power-up specific effects
        this.applyPowerUpEffects(powerType, true);
        
        // Set timer to deactivate
        this.powerUpTimers[powerType] = setTimeout(() => {
            this.powerUps[powerType] = false;
            this.applyPowerUpEffects(powerType, false);
            delete this.powerUpTimers[powerType];
            console.log(`Power-up ${powerType} expired`);
        }, duration);
        
        console.log(`Power-up activated: ${powerType} for ${duration}ms`);
    }

    applyPowerUpEffects(powerType, activate) {
        switch (powerType) {
            case 'speedBoost':
                if (activate) {
                    this.speed *= 1.5;
                    this.sprite.setFillStyle(0xff69b4);
                } else {
                    this.speed /= 1.5;
                    this.updateOutfitColor(); // Reset to original outfit color
                }
                break;
                
            case 'invincibility':
                if (activate) {
                    this.sprite.setFillStyle(0xffd700);
                    // Add flickering effect
                    this.scene.tweens.add({
                        targets: this.sprite,
                        alpha: 0.5,
                        duration: 200,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Power1'
                    });
                } else {
                    this.updateOutfitColor(); // Reset to original outfit color
                    this.sprite.setAlpha(1);
                    this.scene.tweens.killTweensOf(this.sprite);
                }
                break;
                
            case 'flyMode':
                if (activate) {
                    this.sprite.setFillStyle(0x98fb98);
                } else {
                    this.updateOutfitColor(); // Reset to original outfit color
                }
                break;
                
            case 'fireBreath':
            case 'ultraBlast':
                if (activate) {
                    this.sprite.setFillStyle(0xff4500);
                } else {
                    this.updateOutfitColor(); // Reset to original outfit color
                }
                break;
        }
    }

    performFireBreath() {
        if (this.specialAbilityCooldowns.fireBreath > 0) return;
        
        console.log('🔥 Fire Breath Attack!');
        
        // Set cooldown
        this.specialAbilityCooldowns.fireBreath = 3000; // 3 seconds
        
        // Create fire breath effect
        const fireRange = 80;
        const fireWidth = 60;
        
        for (let i = 0; i < 5; i++) {
            const offsetX = (i * fireRange / 5) * (this.facingRight ? 1 : -1);
            const offsetY = Math.random() * fireWidth - fireWidth / 2;
            
            const flame = this.scene.add.circle(
                this.sprite.x + offsetX,
                this.sprite.y + offsetY,
                8 + Math.random() * 6,
                0xff4500,
                0.8
            );
            
            this.scene.tweens.add({
                targets: flame,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 800 + i * 100,
                delay: i * 50,
                onComplete: () => flame.destroy()
            });
        }
        
        // Check for enemies in fire breath range
        this.checkFireBreathHit();
    }

    checkFireBreathHit() {
        if (!this.scene.enemies) return;
        
        const fireRange = 80;
        
        this.scene.enemies.children.entries.forEach(enemy => {
            if (enemy.active) {
                const distance = Phaser.Math.Distance.Between(
                    this.sprite.x, this.sprite.y,
                    enemy.x, enemy.y
                );
                
                // Check if enemy is in front of player and within range
                const enemyDirection = enemy.x > this.sprite.x ? 1 : -1;
                const playerDirection = this.facingRight ? 1 : -1;
                
                if (distance < fireRange && enemyDirection === playerDirection) {
                    if (enemy.getData && enemy.getData('enemy')) {
                        enemy.getData('enemy').takeDamage(40); // High damage for special ability
                    }
                }
            }
        });
    }

    performUltraBlast() {
        if (this.specialAbilityCooldowns.ultraBlast > 0) return;
        
        console.log('💥 Ultra Blast Attack!');
        
        // Set cooldown
        this.specialAbilityCooldowns.ultraBlast = 5000; // 5 seconds
        
        // Create ultra blast effect (360-degree attack)
        const blastRadius = 100;
        
        // Create expanding circle effect
        const blast = this.scene.add.circle(this.sprite.x, this.sprite.y, 20, 0x00ffff, 0.6);
        
        this.scene.tweens.add({
            targets: blast,
            scaleX: 5,
            scaleY: 5,
            alpha: 0,
            duration: 600,
            onComplete: () => blast.destroy()
        });
        
        // Check for all enemies in blast radius
        this.checkUltraBlastHit(blastRadius);
    }

    checkUltraBlastHit(radius) {
        if (!this.scene.enemies) return;
        
        this.scene.enemies.children.entries.forEach(enemy => {
            if (enemy.active) {
                const distance = Phaser.Math.Distance.Between(
                    this.sprite.x, this.sprite.y,
                    enemy.x, enemy.y
                );
                
                if (distance < radius) {
                    if (enemy.getData && enemy.getData('enemy')) {
                        enemy.getData('enemy').takeDamage(50); // Very high damage
                        // Add knockback effect
                        const knockbackAngle = Phaser.Math.Angle.Between(
                            this.sprite.x, this.sprite.y,
                            enemy.x, enemy.y
                        );
                        enemy.body.setVelocity(
                            Math.cos(knockbackAngle) * 300,
                            Math.sin(knockbackAngle) * 200
                        );
                    }
                }
            }
        });
    }

    // Damage and health
    takeDamage(amount) {
        // Check invincibility
        if (this.powerUps.invincibility) {
            console.log('Damage blocked by invincibility!');
            return;
        }
        
        this.health = Math.max(0, this.health - amount);
        
        // Track damage for star rating system
        if (this.scene && this.scene.onPlayerDamage) {
            this.scene.onPlayerDamage(amount);
        }
        
        // Flash red when taking damage
        this.sprite.setFillStyle(0xff0000);
        setTimeout(() => {
            if (!this.powerUps.invincibility) {
                this.updateOutfitColor(); // Reset to original outfit color
            }
        }, 100);
        
        console.log(`Player took ${amount} damage. Health: ${this.health}/${this.maxHealth}`);
        
        if (this.health <= 0) {
            this.die();
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        
        // Flash green when healing
        this.sprite.setFillStyle(0x00ff00);
        setTimeout(() => {
            this.updateOutfitColor(); // Reset to original outfit color
        }, 100);
        
        console.log(`Player healed ${amount}. Health: ${this.health}/${this.maxHealth}`);
    }

    die() {
        console.log('Player died!');
        // Reset player health and position instead of restarting entire scene
        this.health = this.maxHealth;
        this.sprite.setPosition(100, this.scene.levelHeight - 200); // Reset to start position
        
        // Change color to red to show damage (since it's a rectangle, not a sprite)
        const originalColor = this.sprite.fillColor;
        this.sprite.setFillStyle(0xff0000); // Red color to show damage
        
        // Restore original color after a moment
        this.scene.time.delayedCall(1000, () => {
            this.sprite.setFillStyle(originalColor);
        });
        
        // Add damage to scene counter for star rating
        if (this.scene.damageTaken !== undefined) {
            this.scene.damageTaken += 50; // Death penalty
        }
        
        console.log('Player respawned at start position');
    }

    // Utility methods
    getPosition() {
        return { x: this.sprite.x, y: this.sprite.y };
    }

    setPosition(x, y) {
        this.sprite.x = x;
        this.sprite.y = y;
    }

    getOutfitColor() {
        const currentOutfit = window.gameInstance.gameData.outfits.current;
        const costume = window.gameInstance.getDragonCostume(currentOutfit);
        return costume.primaryColor;
    }

    getDragonCostume() {
        const currentOutfit = window.gameInstance.gameData.outfits.current;
        return window.gameInstance.getDragonCostume(currentOutfit);
    }

    updateOutfitColor() {
        // Update sprite color based on current dragon costume
        const costume = this.getDragonCostume();
        this.sprite.setFillStyle(costume.primaryColor);
        
        // Update belt color to match dragon costume
        if (this.belt) {
            this.belt.setFillStyle(costume.beltColor);
        }
        
        // Recreate wings with new costume colors
        this.recreateWings();
    }

    createDragonAura() {
        // Create dragon-specific aura effect
        const costume = this.getDragonCostume();
        
        const aura = this.scene.add.circle(
            this.sprite.x,
            this.sprite.y,
            40,
            costume.effectColor,
            0.2
        );
        
        aura.setDepth(5);
        
        this.scene.tweens.add({
            targets: aura,
            scaleX: 1.3,
            scaleY: 1.3,
            alpha: 0,
            duration: 600,
            onComplete: () => aura.destroy()
        });
    }

    destroy() {
        if (this.visualGroup) {
            this.visualGroup.destroy();
        }
        if (this.leftWing) {
            this.leftWing.destroy();
        }
        if (this.rightWing) {
            this.rightWing.destroy();
        }
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}
