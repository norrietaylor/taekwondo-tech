// Player character with taekwondo abilities
class Player {
    constructor(scene, x, y) {
        try {
            console.log('Player constructor started at:', x, y);
            this.scene = scene;
            
            // Check if controls exist - wait a moment for them to initialize if needed
            if (!window.gameInstance || !window.gameInstance.controls) {
                console.warn('⚠️ Controls not ready yet, will retry...');
                this.controls = null;
                // Set up a timer to retry getting controls
                this.controlsRetryTimer = 0;
                this.controlsRetryAttempts = 0;
            } else {
                this.controls = window.gameInstance.controls;
                console.log('✅ Controls assigned');
            }
        
        // Create player sprite with outfit colors
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        const costume = window.gameInstance?.getDragonCostume(currentOutfit);
        const isLegendary = costume?.isLegendary || false;
        const spriteSize = isLegendary ? { width: 80, height: 120 } : { width: 32, height: 48 }; // 2.5x instead of 5x
        
        console.log('🎨 Creating player sprite:', {
            currentOutfit,
            isLegendary,
            costumeName: costume?.name,
            spriteSize
        });
        
        // Create main sprite container if legendary, otherwise simple rectangle
        if (isLegendary) {
            console.log('🌟 Creating LEGENDARY MODE sprite (5x size with all dragon colors)!');
            this.sprite = scene.add.container(x, y);
            this.createLegendarySprite();
            scene.physics.add.existing(this.sprite);
            this.body = this.sprite.body;
            
            // Configure physics body for container
            this.body.setCollideWorldBounds(true);
            const bodyWidth = spriteSize.width * 0.65; // 52 pixels
            const bodyHeight = spriteSize.height * 0.85; // 102 pixels
            
            // For containers, the body offset needs to account for the fact that 
            // the body's top-left corner is positioned relative to the container's position
            // Since container is at (x, y) and we want body centered, we need negative offset
            this.body.setSize(bodyWidth, bodyHeight);
            this.body.setOffset(-bodyWidth/2, -bodyHeight/2); // Center the body on the container
            
            // Enable physics and set mass - prevent vibration
            this.body.setAllowGravity(true);
            this.body.setGravityY(0); // Use world gravity
            this.body.setMass(1);
            this.body.enable = true;
            this.body.setMaxVelocity(500, 1000); // Limit velocity to prevent jitter
            this.body.useDamping = true;
            this.body.setDrag(0.05); // Add tiny drag to stabilize
            
            // Set player depth higher than wings (wings will be at 49)
            this.sprite.setDepth(50);
            
            console.log('✅ Legendary sprite created! Size:', spriteSize.width, 'x', spriteSize.height);
            console.log('   Body size:', bodyWidth, 'x', bodyHeight, 'offset:', -bodyWidth/2, -bodyHeight/2);
            console.log('   Body enabled:', this.body.enable);
            console.log('   Body type:', this.sprite.body ? this.sprite.body.type : 'NO BODY');
            console.log('   Gravity enabled:', this.body.allowGravity);
        } else {
            const outfitColor = this.getOutfitColor();
            this.sprite = scene.add.rectangle(x, y, spriteSize.width, spriteSize.height, outfitColor);
            this.sprite.setStrokeStyle(2, 0x2c5f5d);
            
            // Physics body
            scene.physics.add.existing(this.sprite);
            this.body = this.sprite.body;
            this.body.setCollideWorldBounds(true);
            this.body.setSize(28, 44);
            
            // Set player depth higher than wings (wings will be at 49)
            this.sprite.setDepth(50);
            
            console.log('✅ Normal sprite created for costume:', costume?.name);
        }
        
        // Player properties
        this.speed = 200;
        this.jumpPower = 600;
        this.health = 100;
        this.maxHealth = 100;
        
        // Track legendary mode state (initialized based on current costume)
        const initialCostume = window.gameInstance?.getDragonCostume(currentOutfit);
        this.isLegendaryMode = initialCostume?.isLegendary || false;
        
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
        
        // Fireball properties (for legendary mode)
        this.fireballShotCount = 0;
        this.fireballCooldownTime = 0;
        this.fireballMaxShots = 3;
        this.fireballGlobalCooldown = 2000; // 2 seconds after 3 shots
        this.fireballs = [];
        
        // Power-up queue system (max 2 items)
        this.powerUpQueue = [];
        this.maxQueueSize = 2;
        
        // Currently active power-up
        this.activePowerUp = null;
        this.activePowerUpTimer = null;
        
        // Power-up states (for currently active power-up)
        this.powerUps = {
            fireBreath: false,
            ultraBlast: false,
            flyMode: false,
            invincibility: false,
            speedBoost: false,
            presentBomb: false
        };
        
        // Special abilities cooldowns
        this.specialAbilityCooldowns = {
            fireBreath: 0,
            ultraBlast: 0,
            presentBomb: 0
        };
        
        // Present bomb tracking (for active presents/bombs)
        this.activePresentBombs = [];
        
        // Earth Dragon teleport ability
        this.teleportCooldown = 0;
        this.teleportDistance = 200; // Pixels to teleport
        this.teleportCooldownTime = 1500; // 1.5 seconds between teleports
        
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
        const costume = this.getDragonCostume();
        const isLegendary = costume.isLegendary || false;
        
        if (isLegendary) {
            // For legendary mode, visual elements are part of the sprite container
            // Eyes and belt are already created in createLegendarySprite
            this.visualGroup = this.scene.add.group([]);
        } else {
            // Add simple face/details to the rectangle
            this.eye1 = this.scene.add.circle(this.sprite.x - 6, this.sprite.y - 8, 2, 0xffffff);
            this.eye2 = this.scene.add.circle(this.sprite.x + 6, this.sprite.y - 8, 2, 0xffffff);
            this.belt = this.scene.add.rectangle(this.sprite.x, this.sprite.y + 8, 32, 4, 0x8b4513);
            
            // Set depth for visual elements to be above player sprite
            this.eye1.setDepth(51);
            this.eye2.setDepth(51);
            this.belt.setDepth(51);
            
            // Group visual elements
            this.visualGroup = this.scene.add.group([this.eye1, this.eye2, this.belt]);
        }
        
        // Create dragon wings
        this.createDragonWings();
        
        // Wing animation state
        this.wingFlapTime = 0;
        this.wingFlapSpeed = isLegendary ? 0.05 : 0.1; // Legendary wings flap at half speed
    }

    createLegendarySprite() {
        // Get costume data for all 5 dragons
        const costume = this.getDragonCostume();
        const mapping = costume.bodyPartMapping;
        
        // Get colors for each body part from their respective costumes
        const defaultCostume = window.gameInstance.getDragonCostume(mapping.body);
        const fireCostume = window.gameInstance.getDragonCostume(mapping.rightLeg);
        const iceCostume = window.gameInstance.getDragonCostume(mapping.leftLeg);
        const lightningSostume = window.gameInstance.getDragonCostume(mapping.leftArm);
        const shadowCostume = window.gameInstance.getDragonCostume(mapping.rightArm);
        
        // Legendary sprite is 2.5x size: 80x120 (vs 32x48)
        const width = 80;
        const height = 120;
        
        // Head (body costume - default)
        this.legendaryHead = this.scene.add.rectangle(0, -height/2 + 30, width * 0.5, 60, defaultCostume.primaryColor);
        this.legendaryHead.setStrokeStyle(3, 0x000000);
        
        // Eyes
        this.legendaryEye1 = this.scene.add.circle(-15, -height/2 + 20, 5, 0xffffff);
        this.legendaryEye2 = this.scene.add.circle(15, -height/2 + 20, 5, 0xffffff);
        
        // Body/Torso (body costume - default)
        this.legendaryBody = this.scene.add.rectangle(0, 0, width * 0.6, height * 0.35, defaultCostume.primaryColor);
        this.legendaryBody.setStrokeStyle(3, 0x000000);
        
        // Belt
        this.legendaryBelt = this.scene.add.rectangle(0, height * 0.1, width * 0.6, 10, defaultCostume.beltColor);
        
        // Left Arm (lightning costume)
        this.legendaryLeftArm = this.scene.add.rectangle(
            -width * 0.35, 
            -10, 
            width * 0.15, 
            height * 0.4, 
            lightningSostume.primaryColor
        );
        this.legendaryLeftArm.setStrokeStyle(3, 0x000000);
        
        // Right Arm (shadow costume)
        this.legendaryRightArm = this.scene.add.rectangle(
            width * 0.35, 
            -10, 
            width * 0.15, 
            height * 0.4, 
            shadowCostume.primaryColor
        );
        this.legendaryRightArm.setStrokeStyle(3, 0x000000);
        
        // Left Leg (ice costume)
        this.legendaryLeftLeg = this.scene.add.rectangle(
            -width * 0.15, 
            height * 0.25, 
            width * 0.22, 
            height * 0.35, 
            iceCostume.primaryColor
        );
        this.legendaryLeftLeg.setStrokeStyle(3, 0x000000);
        
        // Right Leg (fire costume)
        this.legendaryRightLeg = this.scene.add.rectangle(
            width * 0.15, 
            height * 0.25, 
            width * 0.22, 
            height * 0.35, 
            fireCostume.primaryColor
        );
        this.legendaryRightLeg.setStrokeStyle(3, 0x000000);
        
        // Add all parts to the container in the right order (back to front)
        this.sprite.add([
            // Body parts
            this.legendaryBody,
            this.legendaryLeftArm,
            this.legendaryRightArm,
            this.legendaryLeftLeg,
            this.legendaryRightLeg,
            // Head and details on top
            this.legendaryHead,
            this.legendaryBelt,
            this.legendaryEye1,
            this.legendaryEye2
        ]);
        
        // Store references for updates
        this.eye1 = this.legendaryEye1;
        this.eye2 = this.legendaryEye2;
        this.belt = this.legendaryBelt;
        
        console.log('🌟 Legendary sprite created with all 5 dragon colors!');
    }

    createDragonWings() {
        const costume = this.getDragonCostume();
        const isLegendary = costume.isLegendary;
        
        console.log('🦅 Creating wings for costume:', costume.name, 'hasWings:', costume.hasWings, 'isLegendary:', isLegendary);
        
        // Wing size multiplier for legendary mode
        const sizeMultiplier = isLegendary ? 5 : 1;
        const segmentCount = isLegendary ? 5 : 3; // More segments for legendary
        
        // Create left wing - render at depth 49 (player is at 50)
        this.leftWing = this.scene.add.container(this.sprite.x, this.sprite.y);
        this.leftWing.setDepth(49); // Just below player depth
        
        // Create right wing - render at depth 49 (player is at 50)
        this.rightWing = this.scene.add.container(this.sprite.x, this.sprite.y);
        this.rightWing.setDepth(49); // Just below player depth
        
        // Only create wing graphics if costume has wings
        if (costume.hasWings) {
            console.log('🦅 Adding wing segments with colors:', costume.wingColor.toString(16), costume.wingTipColor.toString(16));
            
            // Left wing segments
            const leftWingSegments = [];
            for (let i = 0; i < segmentCount; i++) {
                // For legendary mode, use rainbow colors
                let segmentColor = costume.wingColor;
                if (isLegendary) {
                    const colors = [0xff4500, 0x87ceeb, 0xffd700, 0x4b0082, 0x4a9eff];
                    segmentColor = colors[i % colors.length];
                }
                
                const segment = this.scene.add.triangle(
                    0, 0,
                    0, (-10 - (i * 5)) * sizeMultiplier,   // top point
                    (-15 - (i * 5)) * sizeMultiplier, 5 * sizeMultiplier,   // bottom left
                    (-5 - (i * 3)) * sizeMultiplier, 10 * sizeMultiplier,   // bottom right
                    i === segmentCount - 1 ? costume.wingTipColor : segmentColor,
                    1.0  // Full opacity for visibility
                );
                segment.setStrokeStyle(2 * sizeMultiplier, 0x000000, 1.0);  // Black border for visibility
                leftWingSegments.push(segment);
                this.leftWing.add(segment);
            }
            
            // Right wing segments
            const rightWingSegments = [];
            for (let i = 0; i < segmentCount; i++) {
                // For legendary mode, use rainbow colors
                let segmentColor = costume.wingColor;
                if (isLegendary) {
                    const colors = [0xff4500, 0x87ceeb, 0xffd700, 0x4b0082, 0x4a9eff];
                    segmentColor = colors[i % colors.length];
                }
                
                const segment = this.scene.add.triangle(
                    0, 0,
                    0, (-10 - (i * 5)) * sizeMultiplier,   // top point
                    (15 + (i * 5)) * sizeMultiplier, 5 * sizeMultiplier,    // bottom right
                    (5 + (i * 3)) * sizeMultiplier, 10 * sizeMultiplier,    // bottom left
                    i === segmentCount - 1 ? costume.wingTipColor : segmentColor,
                    1.0  // Full opacity for visibility
                );
                segment.setStrokeStyle(2 * sizeMultiplier, 0x000000, 1.0);  // Black border for visibility
                rightWingSegments.push(segment);
                this.rightWing.add(segment);
            }
            
            this.leftWing.setVisible(true);
            this.rightWing.setVisible(true);
            console.log('✅ Wings created and visible!' + (isLegendary ? ' (LEGENDARY SIZE)' : ''));
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
            punch: false,
            activate: false,
            teleport: false
        };
    }

    update(time, delta) {
        // Retry getting controls if they weren't available during construction
        if (!this.controls && this.controlsRetryAttempts < 10) {
            this.controlsRetryTimer += delta;
            if (this.controlsRetryTimer > 100) { // Try every 100ms
                this.controlsRetryTimer = 0;
                this.controlsRetryAttempts++;
                if (window.gameInstance && window.gameInstance.controls) {
                    this.controls = window.gameInstance.controls;
                    console.log('✅ Controls assigned on retry', this.controlsRetryAttempts);
                }
            }
        }
        
        // Update cooldowns
        this.updateCooldowns(delta);
        
        // Handle movement
        this.handleMovement();
        
        // Handle combat
        this.handleCombat();
        
        // Handle power-up activation
        this.handlePowerUpActivation();
        
        // Handle Earth Dragon teleport
        this.handleTeleport();
        
        // Update visual elements
        this.updateVisuals();
        
        // Update dragon wings
        this.updateWings();
        
        // Update grounded state
        this.updateGroundedState();
        
        // Update fireballs
        this.updateFireballs(delta);
        
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
        
        // Update fireball cooldown
        if (this.fireballCooldownTime > 0) {
            this.fireballCooldownTime -= delta;
            if (this.fireballCooldownTime <= 0) {
                this.fireballShotCount = 0; // Reset shot count when cooldown expires
            }
        }
        
        // Update special ability cooldowns
        Object.keys(this.specialAbilityCooldowns).forEach(ability => {
            if (this.specialAbilityCooldowns[ability] > 0) {
                this.specialAbilityCooldowns[ability] -= delta;
            }
        });
        
        // Update teleport cooldown
        if (this.teleportCooldown > 0) {
            this.teleportCooldown -= delta;
        }
    }

    handleMovement() {
        // Safety check for controls
        if (!this.controls) {
            console.warn('⚠️ Controls not initialized');
            return;
        }
        
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
        
        // Safety check for controls
        if (!this.controls) {
            return;
        }
        
        const costume = this.getDragonCostume();
        
        // In legendary mode, kick and punch shoot fireballs
        if (costume.isLegendary && costume.fireballEnabled) {
            // Kick shoots fireball
            if (this.controls.isKick() && !this.previousInputs.kick) {
                this.shootFireball();
            }
            
            // Punch shoots fireball
            if (this.controls.isPunch() && !this.previousInputs.punch) {
                this.shootFireball();
            }
        } 
        // Dragon costume with projectile - kick for elemental, punch for laser eyes
        else if (costume.projectileEnabled) {
            // If presentBomb power-up is active, shoot presents instead of elemental
            if (this.powerUps.presentBomb) {
                // Kick shoots wrapped present
                if (this.controls.isKick() && !this.previousInputs.kick && this.specialAbilityCooldowns.presentBomb <= 0) {
                    this.shootPresentBomb();
                }
            } else {
                // Kick shoots elemental dragon projectile
                if (this.controls.isKick() && !this.previousInputs.kick) {
                    this.shootDragonProjectile();
                }
            }
            
            // Punch shoots laser eyes
            if (this.controls.isPunch() && !this.previousInputs.punch) {
                this.shootLaserEyes();
            }
        } else {
            // Normal mode - regular attacks (default gi)
            // Kick attack
            if (this.controls.isKick() && !this.previousInputs.kick) {
                this.performKick();
            }
            
            // Punch attack
            if (this.controls.isPunch() && !this.previousInputs.punch) {
                this.performPunch();
            }
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
        
        // Present bomb (replaces elemental attack when active - kick to shoot)
        if (this.powerUps.presentBomb && this.specialAbilityCooldowns.presentBomb <= 0) {
            if (this.controls.isKick() && !this.previousInputs.kick) {
                this.shootPresentBomb();
            }
        }
    }

    handleTeleport() {
        // Safety check for controls
        if (!this.controls) {
            return;
        }
        
        // Check if player is wearing Earth Dragon costume
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'earth') {
            return; // Only Earth Dragon can teleport
        }
        
        // Check for teleport key press (edge detection - only on press, not hold)
        if (this.controls.isTeleport() && !this.previousInputs.teleport) {
            this.performTeleport();
        }
    }

    performTeleport() {
        // Check cooldown
        if (this.teleportCooldown > 0) {
            console.log('🌍 Teleport on cooldown!');
            return;
        }
        
        // Set cooldown
        this.teleportCooldown = this.teleportCooldownTime;
        
        // Calculate teleport destination
        const startX = this.sprite.x;
        const startY = this.sprite.y;
        const direction = this.facingRight ? 1 : -1;
        let targetX = startX + (this.teleportDistance * direction);
        
        // Clamp to world bounds
        const worldWidth = this.scene.levelWidth || 3000;
        targetX = Math.max(40, Math.min(worldWidth - 40, targetX));
        
        // Create disappear effect at start position
        this.createTeleportDisappearEffect(startX, startY);
        
        // Teleport the player
        this.sprite.x = targetX;
        
        // Reset velocity on teleport for clean landing
        this.body.setVelocityX(0);
        
        // Create appear effect at destination
        this.createTeleportAppearEffect(targetX, startY);
        
        console.log(`🌍 Earth Dragon teleported from ${startX} to ${targetX}!`);
    }

    createTeleportDisappearEffect(x, y) {
        const costume = this.getDragonCostume();
        
        // Create earth/rock particles bursting outward
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const colors = [0x8b4513, 0x654321, 0x228b22]; // Earth colors
            const particle = this.scene.add.circle(
                x + Math.cos(angle) * 10,
                y + Math.sin(angle) * 10,
                6 + Math.random() * 4,
                colors[Math.floor(Math.random() * colors.length)],
                0.9
            );
            particle.setDepth(100);
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 60,
                y: y + Math.sin(angle) * 60,
                alpha: 0,
                scale: 0,
                duration: 400,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
        
        // Create dust cloud at origin
        const dustCloud = this.scene.add.circle(x, y, 30, 0xa0522d, 0.6);
        dustCloud.setDepth(99);
        
        this.scene.tweens.add({
            targets: dustCloud,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => dustCloud.destroy()
        });
        
        // Screen shake for dramatic effect
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(100, 0.01);
        }
    }

    createTeleportAppearEffect(x, y) {
        const costume = this.getDragonCostume();
        
        // Create earth/rock particles converging inward
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const colors = [0x8b4513, 0x654321, 0x228b22]; // Earth colors
            const startRadius = 60;
            const particle = this.scene.add.circle(
                x + Math.cos(angle) * startRadius,
                y + Math.sin(angle) * startRadius,
                6 + Math.random() * 4,
                colors[Math.floor(Math.random() * colors.length)],
                0.9
            );
            particle.setDepth(100);
            
            this.scene.tweens.add({
                targets: particle,
                x: x,
                y: y,
                alpha: 0,
                scale: 0.5,
                duration: 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
        
        // Create ground burst effect
        const groundBurst = this.scene.add.circle(x, y + 30, 10, 0x654321, 0.8);
        groundBurst.setDepth(98);
        
        this.scene.tweens.add({
            targets: groundBurst,
            scaleX: 4,
            scaleY: 1,
            alpha: 0,
            duration: 400,
            onComplete: () => groundBurst.destroy()
        });
        
        // Create rising dust particles
        for (let i = 0; i < 6; i++) {
            const dust = this.scene.add.circle(
                x + (Math.random() - 0.5) * 40,
                y + 20,
                4 + Math.random() * 4,
                0xa0522d,
                0.6
            );
            dust.setDepth(97);
            
            this.scene.tweens.add({
                targets: dust,
                y: y - 40 - Math.random() * 30,
                alpha: 0,
                duration: 500 + Math.random() * 200,
                delay: i * 30,
                onComplete: () => dust.destroy()
            });
        }
        
        // Flash effect
        const flash = this.scene.add.circle(x, y, 40, 0x228b22, 0.5);
        flash.setDepth(101);
        
        this.scene.tweens.add({
            targets: flash,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });
    }

    handleTeleport() {
        // Safety check for controls
        if (!this.controls) {
            return;
        }
        
        // Check if player is wearing Earth Dragon costume
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'earth') {
            return; // Only Earth Dragon can teleport
        }
        
        // Check for teleport key press (edge detection - only on press, not hold)
        if (this.controls.isTeleport() && !this.previousInputs.teleport) {
            this.performTeleport();
        }
    }

    performTeleport() {
        // Check cooldown
        if (this.teleportCooldown > 0) {
            console.log('🌍 Teleport on cooldown!');
            return;
        }
        
        // Set cooldown
        this.teleportCooldown = this.teleportCooldownTime;
        
        // Calculate teleport destination
        const startX = this.sprite.x;
        const startY = this.sprite.y;
        const direction = this.facingRight ? 1 : -1;
        let targetX = startX + (this.teleportDistance * direction);
        
        // Clamp to world bounds
        const worldWidth = this.scene.levelWidth || 3000;
        targetX = Math.max(40, Math.min(worldWidth - 40, targetX));
        
        // Create disappear effect at start position
        this.createTeleportDisappearEffect(startX, startY);
        
        // Teleport the player
        this.sprite.x = targetX;
        
        // Reset velocity on teleport for clean landing
        this.body.setVelocityX(0);
        
        // Create appear effect at destination
        this.createTeleportAppearEffect(targetX, startY);
        
        console.log(`🌍 Earth Dragon teleported from ${startX} to ${targetX}!`);
    }

    createTeleportDisappearEffect(x, y) {
        const costume = this.getDragonCostume();
        
        // Create earth/rock particles bursting outward
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const colors = [0x8b4513, 0x654321, 0x228b22]; // Earth colors
            const particle = this.scene.add.circle(
                x + Math.cos(angle) * 10,
                y + Math.sin(angle) * 10,
                6 + Math.random() * 4,
                colors[Math.floor(Math.random() * colors.length)],
                0.9
            );
            particle.setDepth(100);
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 60,
                y: y + Math.sin(angle) * 60,
                alpha: 0,
                scale: 0,
                duration: 400,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
        
        // Create dust cloud at origin
        const dustCloud = this.scene.add.circle(x, y, 30, 0xa0522d, 0.6);
        dustCloud.setDepth(99);
        
        this.scene.tweens.add({
            targets: dustCloud,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => dustCloud.destroy()
        });
        
        // Screen shake for dramatic effect
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(100, 0.01);
        }
    }

    createTeleportAppearEffect(x, y) {
        const costume = this.getDragonCostume();
        
        // Create earth/rock particles converging inward
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const colors = [0x8b4513, 0x654321, 0x228b22]; // Earth colors
            const startRadius = 60;
            const particle = this.scene.add.circle(
                x + Math.cos(angle) * startRadius,
                y + Math.sin(angle) * startRadius,
                6 + Math.random() * 4,
                colors[Math.floor(Math.random() * colors.length)],
                0.9
            );
            particle.setDepth(100);
            
            this.scene.tweens.add({
                targets: particle,
                x: x,
                y: y,
                alpha: 0,
                scale: 0.5,
                duration: 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
        
        // Create ground burst effect
        const groundBurst = this.scene.add.circle(x, y + 30, 10, 0x654321, 0.8);
        groundBurst.setDepth(98);
        
        this.scene.tweens.add({
            targets: groundBurst,
            scaleX: 4,
            scaleY: 1,
            alpha: 0,
            duration: 400,
            onComplete: () => groundBurst.destroy()
        });
        
        // Create rising dust particles
        for (let i = 0; i < 6; i++) {
            const dust = this.scene.add.circle(
                x + (Math.random() - 0.5) * 40,
                y + 20,
                4 + Math.random() * 4,
                0xa0522d,
                0.6
            );
            dust.setDepth(97);
            
            this.scene.tweens.add({
                targets: dust,
                y: y - 40 - Math.random() * 30,
                alpha: 0,
                duration: 500 + Math.random() * 200,
                delay: i * 30,
                onComplete: () => dust.destroy()
            });
        }
        
        // Flash effect
        const flash = this.scene.add.circle(x, y, 40, 0x228b22, 0.5);
        flash.setDepth(101);
        
        this.scene.tweens.add({
            targets: flash,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });
    }

    tryJump() {
        const canCoyoteJump = (Date.now() - this.lastGroundTime) < this.coyoteTime;
        
        // Check if in legendary mode for jump boost
        const costume = this.getDragonCostume();
        const jumpMultiplier = costume.isLegendary ? 1.3 : 1.0; // 30% higher jump for legendary
        
        // Regular jump (when grounded or within coyote time)
        if ((this.isGrounded || canCoyoteJump) && this.jumpCooldown <= 0) {
            this.body.setVelocityY(-this.jumpPower * jumpMultiplier);
            this.isGrounded = false;
            this.jumpCooldown = 100; // Prevent multi-jumping
            this.hasDoubleJumped = false; // Reset double jump when doing regular jump
            this.createJumpEffect();
            
            console.log('Player jumped!' + (costume.isLegendary ? ' (LEGENDARY BOOST)' : ''));
        }
        // Double jump (when in air and haven't used double jump yet)
        else if (!this.isGrounded && !this.hasDoubleJumped && this.canDoubleJump && this.jumpCooldown <= 0) {
            this.body.setVelocityY(-this.doubleJumpPower * jumpMultiplier);
            this.hasDoubleJumped = true;
            this.jumpCooldown = 100; // Prevent multi-jumping
            this.createDoubleJumpEffect();
            
            console.log('Player double jumped!' + (costume.isLegendary ? ' (LEGENDARY BOOST)' : ''));
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

    shootFireball() {
        const costume = this.getDragonCostume();
        
        // No cooldown for now - commented out
        // // Check if fireball cooldown is active
        // if (this.fireballCooldownTime > 0) {
        //     console.log('🔥 Fireball on cooldown!');
        //     return;
        // }
        // 
        // // Check if we've reached the shot limit
        // if (this.fireballShotCount >= this.fireballMaxShots) {
        //     this.fireballCooldownTime = this.fireballGlobalCooldown;
        //     console.log('🔥 Fireball limit reached! Entering cooldown...');
        //     return;
        // }
        
        // Increment shot count (for color cycling)
        this.fireballShotCount++;
        
        // Set brief attack cooldown
        this.attackCooldown = 300;
        
        // Calculate fireball starting position and velocity
        const startX = this.sprite.x + (this.facingRight ? 40 : -40); // Adjusted for smaller size
        const startY = this.sprite.y + 10; // Start slightly lower
        const velocityX = this.facingRight ? 600 : -600; // Jump speed (600)
        const velocityY = 200; // Downward angle
        
        // Create fireball projectile with rainbow colors
        const fireballSize = 20; // Large fireball
        const colorIndex = this.fireballShotCount % costume.fireballColors.length;
        const fireballColor = costume.fireballColors[colorIndex];
        
        const fireball = this.scene.add.circle(startX, startY, fireballSize, fireballColor, 0.9);
        fireball.setDepth(100);
        
        // Add physics to fireball
        this.scene.physics.add.existing(fireball);
        fireball.body.setVelocityX(velocityX);
        fireball.body.setVelocityY(velocityY); // Set downward velocity
        fireball.body.setAllowGravity(false); // Use manual velocity instead
        fireball.body.setBounce(0.7); // Bounce 70% of velocity
        
        // Add glow effect
        const glow = this.scene.add.circle(startX, startY, fireballSize * 1.5, fireballColor, 0.3);
        glow.setDepth(99);
        this.scene.physics.add.existing(glow);
        glow.body.setVelocityX(velocityX);
        glow.body.setVelocityY(velocityY); // Match fireball velocity
        glow.body.setAllowGravity(false);
        glow.body.setBounce(0.7);
        
        // Store fireball data
        this.fireballs.push({
            sprite: fireball,
            glow: glow,
            damage: costume.fireballDamageMultiplier * 20, // 5x base damage (20)
            traveled: 0,
            maxDistance: this.scene.levelWidth || 3000, // Travel across the map
            type: 'legendary',
            effect: 'legendary',
            color: fireballColor,
            secondaryColor: 0xffffff
        });
        
        // Add collider with platforms for bouncing
        if (this.scene.platforms) {
            this.scene.physics.add.collider(fireball, this.scene.platforms);
            this.scene.physics.add.collider(glow, this.scene.platforms);
        }
        
        // Create shooting effect at player
        this.createFireballShootEffect();
        
        console.log(`🔥 Fireball shot! (${this.fireballShotCount}/${this.fireballMaxShots})`);
    }

    shootDragonProjectile() {
        const costume = this.getDragonCostume();
        
        if (!costume.projectileEnabled) {
            return;
        }
        
        // Set brief attack cooldown
        this.attackCooldown = 350;
        
        // Calculate projectile starting position and velocity
        const startX = this.sprite.x + (this.facingRight ? 30 : -30);
        const startY = this.sprite.y;
        const velocityX = this.facingRight ? costume.projectileSpeed : -costume.projectileSpeed;
        
        // Create projectile based on dragon type
        let projectile;
        let glow;
        
        switch (costume.projectileType) {
            case 'fireball':
                projectile = this.createFireballProjectile(startX, startY, costume);
                break;
            case 'ice':
                projectile = this.createIceProjectile(startX, startY, costume);
                break;
            case 'lightning':
                projectile = this.createLightningProjectile(startX, startY, costume);
                break;
            case 'smoke':
                projectile = this.createSmokeProjectile(startX, startY, costume);
                break;
            case 'earthquake':
                projectile = this.createEarthquakeProjectile(startX, startY, costume);
                break;
            case 'banana':
                projectile = this.createBananaProjectile(startX, startY, costume);
                break;
            case 'present':
                // Present Dragon uses the present bomb attack directly
                this.shootPresentBomb();
                return; // Exit early - shootPresentBomb handles everything
            default:
                projectile = this.scene.add.circle(startX, startY, costume.projectileSize, costume.projectileColor, 0.9);
        }
        
        projectile.setDepth(100);
        
        // Add physics to projectile
        this.scene.physics.add.existing(projectile);
        projectile.body.setVelocityX(velocityX);
        projectile.body.setAllowGravity(false);
        
        // Create glow effect
        glow = this.scene.add.circle(startX, startY, costume.projectileSize * 1.5, costume.projectileColor, 0.3);
        glow.setDepth(99);
        this.scene.physics.add.existing(glow);
        glow.body.setVelocityX(velocityX);
        glow.body.setAllowGravity(false);
        
        // Store projectile data
        this.fireballs.push({
            sprite: projectile,
            glow: glow,
            damage: costume.projectileDamage,
            traveled: 0,
            maxDistance: this.scene.levelWidth || 3000,
            type: costume.projectileType,
            effect: costume.projectileEffect,
            color: costume.projectileColor,
            secondaryColor: costume.projectileSecondaryColor
        });
        
        // Add collider with platforms for bouncing (if applicable)
        if (this.scene.platforms && costume.projectileType === 'earthquake') {
            this.scene.physics.add.collider(projectile, this.scene.platforms, () => {
                // Earth projectile creates shockwave on platform hit
                this.createEarthquakeShockwave(projectile.x, projectile.y);
            });
        }
        
        // Create shooting effect at player
        this.createDragonShootEffect(costume);
        
        console.log(`🐉 ${costume.name} projectile shot!`);
    }

    shootLaserEyes() {
        const costume = this.getDragonCostume();
        
        // Set brief attack cooldown
        this.attackCooldown = 250; // Faster than elemental
        
        // Laser colors based on dragon type
        const laserColors = {
            'fire': { primary: 0xff0000, secondary: 0xff6600 },
            'ice': { primary: 0x00ffff, secondary: 0xffffff },
            'lightning': { primary: 0xffff00, secondary: 0xffffff },
            'shadow': { primary: 0x9400d3, secondary: 0x000000 },
            'earth': { primary: 0x00ff00, secondary: 0x32cd32 },  // Green laser for earth
            'banana': { primary: 0xFFE135, secondary: 0xD4A017 },  // Yellow banana laser!
            'default': { primary: 0xff0000, secondary: 0xff6600 }
        };
        
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        const colors = laserColors[currentOutfit] || laserColors['default'];
        
        // Calculate laser starting position (from eyes)
        const eyeOffsetY = costume.isLegendary ? -40 : -12;
        const startX = this.sprite.x + (this.facingRight ? 10 : -10);
        const startY = this.sprite.y + eyeOffsetY;
        const laserLength = 600;
        const laserSpeed = 1200; // Very fast!
        
        // Create two laser beams (from both eyes)
        for (let eyeIndex = 0; eyeIndex < 2; eyeIndex++) {
            const eyeX = startX + (eyeIndex === 0 ? -6 : 6) * (this.facingRight ? 1 : -1);
            const eyeY = startY;
            
            // Create laser beam
            const laserWidth = 6;
            const laser = this.scene.add.rectangle(
                eyeX,
                eyeY,
                40, // Initial length, will stretch
                laserWidth,
                colors.primary,
                0.9
            );
            laser.setOrigin(this.facingRight ? 0 : 1, 0.5);
            laser.setDepth(110);
            
            // Add glow effect
            const laserGlow = this.scene.add.rectangle(
                eyeX,
                eyeY,
                40,
                laserWidth * 2,
                colors.secondary,
                0.4
            );
            laserGlow.setOrigin(this.facingRight ? 0 : 1, 0.5);
            laserGlow.setDepth(109);
            
            // Add physics
            this.scene.physics.add.existing(laser);
            laser.body.setVelocityX(this.facingRight ? laserSpeed : -laserSpeed);
            laser.body.setAllowGravity(false);
            
            this.scene.physics.add.existing(laserGlow);
            laserGlow.body.setVelocityX(this.facingRight ? laserSpeed : -laserSpeed);
            laserGlow.body.setAllowGravity(false);
            
            // Store laser data
            this.fireballs.push({
                sprite: laser,
                glow: laserGlow,
                damage: 18, // Good damage
                traveled: 0,
                maxDistance: laserLength,
                type: 'laser',
                effect: 'pierce', // Lasers pierce through
                color: colors.primary,
                secondaryColor: colors.secondary
            });
            
            // Stretch animation for laser appearance
            this.scene.tweens.add({
                targets: [laser, laserGlow],
                scaleX: 3,
                duration: 100,
                ease: 'Power2'
            });
        }
        
        // Create eye glow effect at player
        this.createLaserEyeEffect(startX, startY, colors);
        
        console.log(`👁️ ${costume.name} laser eyes!`);
    }

    createLaserEyeEffect(x, y, colors) {
        // Eye flash effect
        for (let i = 0; i < 2; i++) {
            const eyeX = x + (i === 0 ? -6 : 6) * (this.facingRight ? 1 : -1);
            
            // Bright flash at eyes
            const flash = this.scene.add.circle(eyeX, y, 8, colors.primary, 1);
            flash.setDepth(115);
            
            this.scene.tweens.add({
                targets: flash,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 200,
                onComplete: () => flash.destroy()
            });
            
            // Outer glow
            const glow = this.scene.add.circle(eyeX, y, 12, colors.secondary, 0.5);
            glow.setDepth(114);
            
            this.scene.tweens.add({
                targets: glow,
                scaleX: 3,
                scaleY: 3,
                alpha: 0,
                duration: 300,
                onComplete: () => glow.destroy()
            });
        }
        
        // Small screen flash for dramatic effect
        const screenFlash = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            colors.primary,
            0.15
        );
        screenFlash.setScrollFactor(0);
        screenFlash.setDepth(200);
        
        this.scene.tweens.add({
            targets: screenFlash,
            alpha: 0,
            duration: 100,
            onComplete: () => screenFlash.destroy()
        });
    }

    createFireballProjectile(x, y, costume) {
        const projectile = this.scene.add.circle(x, y, costume.projectileSize, costume.projectileColor, 0.9);
        projectile.setStrokeStyle(2, costume.projectileSecondaryColor);
        return projectile;
    }

    createIceProjectile(x, y, costume) {
        // Ice shard - diamond shape using polygon
        const size = costume.projectileSize;
        const projectile = this.scene.add.polygon(x, y, [
            0, -size,      // top
            size * 0.6, 0, // right
            0, size * 0.8, // bottom
            -size * 0.6, 0 // left
        ], costume.projectileColor, 0.9);
        projectile.setStrokeStyle(2, costume.projectileSecondaryColor);
        
        // Add sparkle effect
        this.scene.tweens.add({
            targets: projectile,
            alpha: 0.6,
            duration: 100,
            yoyo: true,
            repeat: -1
        });
        
        return projectile;
    }

    createLightningProjectile(x, y, costume) {
        // Lightning bolt - zigzag shape
        const size = costume.projectileSize;
        const projectile = this.scene.add.polygon(x, y, [
            -size * 0.3, -size * 0.5,
            size * 0.2, -size * 0.2,
            0, 0,
            size * 0.3, size * 0.3,
            -size * 0.1, size * 0.5,
            size * 0.1, size * 0.2
        ], costume.projectileColor, 0.95);
        projectile.setStrokeStyle(3, costume.projectileSecondaryColor);
        
        // Add electric flicker effect
        this.scene.tweens.add({
            targets: projectile,
            scaleX: 1.2,
            scaleY: 0.8,
            duration: 50,
            yoyo: true,
            repeat: -1
        });
        
        return projectile;
    }

    createSmokeProjectile(x, y, costume) {
        // Smoke cloud - expanding circle
        const projectile = this.scene.add.circle(x, y, costume.projectileSize, costume.projectileColor, 0.7);
        
        // Smoke expands as it travels
        this.scene.tweens.add({
            targets: projectile,
            scaleX: 2,
            scaleY: 2,
            alpha: 0.4,
            duration: 1500
        });
        
        return projectile;
    }

    createEarthquakeProjectile(x, y, costume) {
        // Boulder/rock - rough circle with earth colors
        const size = costume.projectileSize;
        const projectile = this.scene.add.polygon(x, y, [
            -size * 0.4, -size * 0.5,
            size * 0.3, -size * 0.6,
            size * 0.6, -size * 0.1,
            size * 0.4, size * 0.5,
            -size * 0.2, size * 0.6,
            -size * 0.6, size * 0.2
        ], costume.projectileColor, 0.95);
        projectile.setStrokeStyle(3, costume.projectileSecondaryColor);
        
        // Add rotation for rolling effect
        this.scene.tweens.add({
            targets: projectile,
            rotation: this.facingRight ? Math.PI * 4 : -Math.PI * 4,
            duration: 2000
        });
        
        return projectile;
    }

    createBananaProjectile(x, y, costume) {
        // 🍌 BANANA PROJECTILE - curved banana shape that spins!
        const size = costume.projectileSize;
        
        // Create a container for the banana
        const container = this.scene.add.container(x, y);
        
        // Main banana body - curved ellipse
        const bananaBody = this.scene.add.ellipse(0, 0, size * 1.4, size * 0.5, 0xFFE135);
        bananaBody.setStrokeStyle(2, 0xD4A017);
        
        // Banana tips (brown ends)
        const tipLeft = this.scene.add.ellipse(-size * 0.6, 0, size * 0.25, size * 0.2, 0x8B4513);
        const tipRight = this.scene.add.ellipse(size * 0.6, 0, size * 0.25, size * 0.2, 0x5C4033);
        
        // Highlight on banana
        const highlight = this.scene.add.ellipse(0, -size * 0.1, size * 0.8, size * 0.15, 0xFFFF88, 0.6);
        
        // Add parts to container
        container.add([bananaBody, tipLeft, tipRight, highlight]);
        
        // Initial curve rotation
        container.setRotation(this.facingRight ? -0.3 : 0.3);
        
        // Add spinning animation - bananas spin when thrown!
        this.scene.tweens.add({
            targets: container,
            rotation: this.facingRight ? Math.PI * 6 : -Math.PI * 6,
            duration: 1500,
            ease: 'Linear'
        });
        
        // Add banana trail particles
        this.createBananaTrail(container);
        
        console.log('🍌 Banana projectile created!');
        
        return container;
    }
    
    createBananaTrail(bananaContainer) {
        // Create yellow sparkle trail behind the banana
        const trailTimer = this.scene.time.addEvent({
            delay: 80,
            callback: () => {
                if (!bananaContainer || !bananaContainer.active) {
                    trailTimer.destroy();
                    return;
                }
                
                // Small banana peel particles
                const particle = this.scene.add.ellipse(
                    bananaContainer.x + (Math.random() - 0.5) * 10,
                    bananaContainer.y + (Math.random() - 0.5) * 5,
                    8, 4,
                    0xFFE135,
                    0.7
                );
                particle.setDepth(95);
                
                this.scene.tweens.add({
                    targets: particle,
                    alpha: 0,
                    scaleX: 0.3,
                    scaleY: 0.3,
                    y: particle.y + 20,
                    duration: 400,
                    onComplete: () => particle.destroy()
                });
            },
            repeat: 15 // Trail for about 1.2 seconds
        });
    }

    createEarthquakeShockwave(x, y) {
        // Screen shake effect
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(300, 0.02);
        }
        
        // Create ground crack effect
        for (let i = 0; i < 5; i++) {
            const crack = this.scene.add.rectangle(
                x + (Math.random() - 0.5) * 60,
                y + 10,
                4 + Math.random() * 8,
                20 + Math.random() * 30,
                0x654321,
                0.8
            );
            crack.setDepth(40);
            
            this.scene.tweens.add({
                targets: crack,
                scaleY: 0,
                alpha: 0,
                duration: 800,
                delay: i * 50,
                onComplete: () => crack.destroy()
            });
        }
        
        // Create dust cloud
        for (let i = 0; i < 8; i++) {
            const dust = this.scene.add.circle(
                x + (Math.random() - 0.5) * 40,
                y,
                8 + Math.random() * 12,
                0xa0522d,
                0.6
            );
            dust.setDepth(45);
            
            this.scene.tweens.add({
                targets: dust,
                y: dust.y - 40 - Math.random() * 30,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 600 + Math.random() * 300,
                onComplete: () => dust.destroy()
            });
        }
    }

    createDragonShootEffect(costume) {
        const effectX = this.sprite.x + (this.facingRight ? 30 : -30);
        const effectY = this.sprite.y;
        
        // Create shooting flash with dragon colors
        for (let i = 0; i < 3; i++) {
            const flashColor = i === 0 ? costume.projectileColor : costume.projectileSecondaryColor;
            const flash = this.scene.add.circle(effectX, effectY, 12 + i * 4, flashColor, 0.7 - i * 0.2);
            flash.setDepth(99);
            
            this.scene.tweens.add({
                targets: flash,
                scaleX: 1.8,
                scaleY: 1.8,
                alpha: 0,
                duration: 180,
                delay: i * 25,
                onComplete: () => flash.destroy()
            });
        }
    }

    updateFireballs(delta) {
        // Update each projectile (fireballs and dragon projectiles)
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            const projectile = this.fireballs[i];
            
            // Check if projectile was marked for destruction
            if (projectile.shouldDestroy) {
                this.destroyFireball(i);
                continue;
            }
            
            // Skip if sprite or body is already destroyed
            if (!projectile.sprite || projectile.sprite.destroyed || !projectile.sprite.body) {
                this.destroyFireball(i);
                continue;
            }
            
            // Update traveled distance
            const velocity = Math.abs(projectile.sprite.body.velocity.x);
            projectile.traveled += velocity * (delta / 1000);
            
            // Update glow position
            if (projectile.glow && !projectile.glow.destroyed) {
                projectile.glow.x = projectile.sprite.x;
                projectile.glow.y = projectile.sprite.y;
            }
            
            // Check if projectile hit max distance
            if (projectile.traveled >= projectile.maxDistance) {
                this.destroyFireball(i);
                continue;
            }
            
            // Check collision with enemies
            if (this.scene.enemies) {
                this.scene.enemies.children.entries.forEach(enemy => {
                    if (enemy.active && projectile.sprite && !projectile.sprite.destroyed) {
                        const distance = Phaser.Math.Distance.Between(
                            projectile.sprite.x, projectile.sprite.y,
                            enemy.x, enemy.y
                        );
                        
                        // Smoke has larger hit radius
                        const hitRadius = projectile.type === 'smoke' ? 50 : 30;
                        
                        if (distance < hitRadius) {
                            // Hit enemy!
                            if (enemy.getData && enemy.getData('enemy')) {
                                const enemyObj = enemy.getData('enemy');
                                enemyObj.takeDamage(projectile.damage);
                                
                                // Apply knockback to enemy
                                this.applyProjectileKnockback(projectile, enemy);
                                
                                // Apply special effects based on projectile type
                                this.applyProjectileEffect(projectile, enemy, enemyObj);
                            }
                            
                            // Create explosion based on projectile type
                            this.createProjectileExplosion(projectile);
                            
                            // Lightning can chain to nearby enemies
                            if (projectile.effect === 'chain') {
                                this.chainLightning(projectile, enemy);
                            }
                            
                            // Mark projectile for destruction (unless it's smoke which passes through)
                            if (projectile.type !== 'smoke') {
                                projectile.shouldDestroy = true;
                            }
                        }
                    }
                });
            }
            
            // Destroy projectile if marked (after forEach completes)
            if (projectile.shouldDestroy) {
                            this.destroyFireball(i);
                continue;
            }
            
            // Check collision with bananas (deflect them!)
            this.checkProjectileBananaCollision(projectile, i);
            
            // Add trailing particle effect based on projectile type
            if (projectile.sprite && !projectile.sprite.destroyed && Math.random() < 0.3) {
                this.createProjectileTrail(projectile);
            }
        }
    }

    checkProjectileBananaCollision(projectile, projectileIndex) {
        if (!projectile || !projectile.sprite || projectile.sprite.destroyed) return;
        if (!projectile.sprite.body) return; // Body might be destroyed
        
        // Check if scene has bananas (from BananaManager or standalone)
        const bananas = [];
        
        // Check for BananaManager bananas
        if (this.scene.bananaManager && this.scene.bananaManager.bananas) {
            bananas.push(...this.scene.bananaManager.bananas);
        }
        
        // Check for standalone bananas in physics groups
        if (this.scene.children && this.scene.children.list) {
            this.scene.children.list.forEach(child => {
                if (child.getData && child.getData('banana')) {
                    const bananaObj = child.getData('banana');
                    if (bananaObj && !bananaObj.destroyed) {
                        bananas.push(bananaObj);
                        }
                    }
                });
            }
            
        bananas.forEach(banana => {
            if (!banana || banana.destroyed || !banana.sprite || banana.sprite.destroyed) return;
            if (!projectile.sprite || projectile.sprite.destroyed) return;
            
            const distance = Phaser.Math.Distance.Between(
                projectile.sprite.x, projectile.sprite.y,
                banana.sprite.x, banana.sprite.y
            );
            
            if (distance < 35) {
                // Deflect the banana!
                console.log(`🍌💥 Banana deflected by ${projectile.type} projectile!`);
                
                // Apply strong knockback to banana - check body exists
                const velocityX = projectile.sprite.body ? projectile.sprite.body.velocity.x : (this.facingRight ? 1 : -1);
                const knockbackDirection = velocityX > 0 ? 1 : -1;
                const knockbackStrength = {
                    'fireball': { x: 400, y: -250 },
                    'ice': { x: 350, y: -200 },
                    'lightning': { x: 500, y: -300 },
                    'smoke': { x: 200, y: -150 },
                    'earthquake': { x: 600, y: -400 },
                    'legendary': { x: 700, y: -500 },
                    'laser': { x: 300, y: -200 }
                };
                
                const kb = knockbackStrength[projectile.type] || { x: 350, y: -200 };
                
                if (banana.sprite.body) {
                    banana.sprite.body.setVelocity(knockbackDirection * kb.x, kb.y);
                }
                
                // Mark banana as deflected if it has that property
                if (banana.isDeflected !== undefined) {
                    banana.isDeflected = true;
                }
                
                // Create deflection effect
                this.createBananaDeflectEffect(banana.sprite.x, banana.sprite.y, projectile.type);
                
                // Create projectile explosion
                this.createProjectileExplosion(projectile);
                
                // Mark projectile for destruction (unless smoke) - don't destroy in forEach!
                if (projectile.type !== 'smoke') {
                    projectile.shouldDestroy = true;
                }
            }
        });
    }

    createBananaDeflectEffect(x, y, projectileType) {
        const colors = {
            'fireball': 0xff4500,
            'ice': 0x87ceeb,
            'lightning': 0xffd700,
            'smoke': 0x4b0082,
            'earthquake': 0x8b4513,
            'legendary': 0xffd700,
            'laser': 0xff0000
        };
        
        const color = colors[projectileType] || 0xffff00;
        
        // Banana emoji burst
        const emoji = this.scene.add.text(x, y, '🍌💥', {
            fontSize: '24px'
        }).setOrigin(0.5).setDepth(110);
        
        this.scene.tweens.add({
            targets: emoji,
            y: y - 50,
            alpha: 0,
            scale: 1.5,
            duration: 600,
            onComplete: () => emoji.destroy()
        });
        
        // Color burst based on element
        for (let i = 0; i < 6; i++) {
            const particle = this.scene.add.circle(
                x + (Math.random() - 0.5) * 30,
                y + (Math.random() - 0.5) * 30,
                5 + Math.random() * 5,
                color,
                0.8
            );
            particle.setDepth(105);
            
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + (Math.random() - 0.5) * 60,
                y: particle.y - 30 - Math.random() * 30,
                alpha: 0,
                scale: 0,
                duration: 400,
                delay: i * 30,
                onComplete: () => particle.destroy()
            });
        }
    }

    applyProjectileKnockback(projectile, target) {
        if (!target || !target.body) return;
        if (!projectile || !projectile.sprite) return;
        
        // Calculate knockback direction (away from projectile) - safely check body
        const velocityX = projectile.sprite.body ? projectile.sprite.body.velocity.x : (this.facingRight ? 1 : -1);
        const knockbackDirection = velocityX > 0 ? 1 : -1;
        
        // Different knockback strengths based on projectile type
        const knockbackStrength = {
            'fireball': { x: 250, y: -150 },
            'ice': { x: 200, y: -100 },
            'lightning': { x: 350, y: -200 },  // Lightning has strong knockback
            'smoke': { x: 100, y: -50 },       // Smoke has weak knockback
            'earthquake': { x: 400, y: -300 }, // Earth has massive knockback
            'legendary': { x: 500, y: -350 },  // Legendary has ultimate knockback
            'laser': { x: 150, y: -80 }        // Laser has quick push
        };
        
        const kb = knockbackStrength[projectile.type] || { x: 200, y: -100 };
        
        target.body.setVelocity(knockbackDirection * kb.x, kb.y);
        
        console.log(`💥 Knockback applied: ${projectile.type} -> ${kb.x}x, ${kb.y}y`);
    }

    applyProjectileEffect(projectile, enemySprite, enemyObj) {
        switch (projectile.effect) {
            case 'burn':
                // Fire - add burning effect (damage over time visual)
                this.createBurnEffect(enemySprite.x, enemySprite.y);
                break;
                
            case 'freeze':
                // Ice - slow enemy movement
                if (enemySprite.body) {
                    const originalVelocity = enemySprite.body.velocity.x;
                    enemySprite.body.setVelocityX(originalVelocity * 0.3);
                    // Add ice visual - use setFillStyle for rectangles
                    const originalColor = enemySprite.fillColor;
                    enemySprite.setFillStyle(0x87ceeb);
                    // Create ice crystals effect around enemy
                    for (let i = 0; i < 4; i++) {
                        const crystal = this.scene.add.star(
                            enemySprite.x + (Math.random() - 0.5) * 30,
                            enemySprite.y + (Math.random() - 0.5) * 40,
                            6, 3, 6, 0xffffff, 0.8
                        );
                        crystal.setDepth(60);
                        this.scene.tweens.add({
                            targets: crystal,
                            alpha: 0,
                            scale: 0,
                            duration: 2000,
                            onComplete: () => crystal.destroy()
                        });
                    }
                    this.scene.time.delayedCall(2000, () => {
                        if (enemySprite.active) {
                            enemySprite.setFillStyle(originalColor || 0x4a4a4a);
                        }
                    });
                }
                break;
                
            case 'shake':
                // Earth - screen shake and stun
                if (this.scene.cameras && this.scene.cameras.main) {
                    this.scene.cameras.main.shake(200, 0.015);
                }
                // Stun enemy briefly
                if (enemySprite.body) {
                    enemySprite.body.setVelocity(0, -100); // Knock up
                }
                break;
                
            case 'expand':
                // Smoke - confuse/blind effect (visual only)
                this.createSmokeCloudEffect(enemySprite.x, enemySprite.y);
                break;
        }
    }

    createBurnEffect(x, y) {
        for (let i = 0; i < 5; i++) {
            const flame = this.scene.add.circle(
                x + (Math.random() - 0.5) * 20,
                y + (Math.random() - 0.5) * 20,
                5 + Math.random() * 5,
                0xff4500,
                0.8
            );
            flame.setDepth(60);
            
            this.scene.tweens.add({
                targets: flame,
                y: flame.y - 30,
                alpha: 0,
                scale: 0,
                duration: 500 + Math.random() * 300,
                delay: i * 100,
                onComplete: () => flame.destroy()
            });
        }
    }

    createSmokeCloudEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            const smoke = this.scene.add.circle(
                x + (Math.random() - 0.5) * 40,
                y + (Math.random() - 0.5) * 40,
                10 + Math.random() * 15,
                0x2f1b3c,
                0.5
            );
            smoke.setDepth(55);
            
            this.scene.tweens.add({
                targets: smoke,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 1000 + Math.random() * 500,
                onComplete: () => smoke.destroy()
            });
        }
    }

    chainLightning(projectile, hitEnemy) {
        // Find nearby enemies to chain to
        if (!this.scene.enemies) return;
        
        const chainRange = 80;
        const chainDamage = projectile.damage * 0.5;
        let chainsRemaining = 2;
        
        this.scene.enemies.children.entries.forEach(enemy => {
            if (chainsRemaining <= 0) return;
            if (!enemy.active || enemy === hitEnemy) return;
            
            const distance = Phaser.Math.Distance.Between(
                hitEnemy.x, hitEnemy.y,
                enemy.x, enemy.y
            );
            
            if (distance < chainRange) {
                chainsRemaining--;
                
                // Deal chain damage
                if (enemy.getData && enemy.getData('enemy')) {
                    enemy.getData('enemy').takeDamage(chainDamage);
                }
                
                // Create lightning arc visual
                this.createLightningArc(hitEnemy.x, hitEnemy.y, enemy.x, enemy.y);
            }
        });
    }

    createLightningArc(x1, y1, x2, y2) {
        const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 20;
        const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 20;
        
        // Draw lightning segments
        const points = [
            { x: x1, y: y1 },
            { x: midX, y: midY },
            { x: x2, y: y2 }
        ];
        
        points.forEach((point, idx) => {
            if (idx === 0) return;
            const prevPoint = points[idx - 1];
            
            const bolt = this.scene.add.line(
                0, 0,
                prevPoint.x, prevPoint.y,
                point.x, point.y,
                0xffff00
            );
            bolt.setLineWidth(3);
            bolt.setDepth(70);
            
            this.scene.tweens.add({
                targets: bolt,
                alpha: 0,
                duration: 200,
                onComplete: () => bolt.destroy()
            });
        });
    }

    createProjectileExplosion(projectile) {
        const x = projectile.sprite.x;
        const y = projectile.sprite.y;
        const color = projectile.color || 0xff4500;
        const secondaryColor = projectile.secondaryColor || color;
        
        // Create explosion rings
        for (let i = 0; i < 3; i++) {
            const ringColor = i % 2 === 0 ? color : secondaryColor;
            const explosion = this.scene.add.circle(x, y, 10, ringColor, 0.8);
            explosion.setDepth(101);
            
            this.scene.tweens.add({
                targets: explosion,
                scaleX: 2 + i,
                scaleY: 2 + i,
                alpha: 0,
                duration: 350,
                delay: i * 40,
                onComplete: () => explosion.destroy()
            });
        }
        
        // Create particle burst
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const particleColor = i % 2 === 0 ? color : secondaryColor;
            const particle = this.scene.add.circle(
                x + Math.cos(angle) * 8,
                y + Math.sin(angle) * 8,
                5,
                particleColor,
                0.9
            );
            particle.setDepth(100);
                
                this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 40,
                y: y + Math.sin(angle) * 40,
                    alpha: 0,
                    scale: 0,
                duration: 400,
                onComplete: () => particle.destroy()
                });
            }
        }

    createProjectileTrail(projectile) {
        const color = projectile.color || 0xff4500;
        const type = projectile.type || 'fireball';
        
        let trailEffect;
        
        switch (type) {
            case 'ice':
                // Sparkly ice trail
                trailEffect = this.scene.add.star(
                    projectile.sprite.x + (Math.random() - 0.5) * 10,
                    projectile.sprite.y + (Math.random() - 0.5) * 10,
                    6, 2, 4,
                    0xffffff,
                    0.8
                );
                break;
                
            case 'lightning':
                // Electric sparks
                trailEffect = this.scene.add.circle(
                    projectile.sprite.x + (Math.random() - 0.5) * 15,
                    projectile.sprite.y + (Math.random() - 0.5) * 15,
                    2 + Math.random() * 3,
                    0xffff00,
                    0.9
                );
                break;
                
            case 'smoke':
                // Dark smoke wisps
                trailEffect = this.scene.add.circle(
                    projectile.sprite.x + (Math.random() - 0.5) * 20,
                    projectile.sprite.y + (Math.random() - 0.5) * 20,
                    8 + Math.random() * 8,
                    0x2f1b3c,
                    0.4
                );
                break;
                
            case 'earthquake':
                // Dust/rock particles
                trailEffect = this.scene.add.rectangle(
                    projectile.sprite.x + (Math.random() - 0.5) * 15,
                    projectile.sprite.y + Math.random() * 10,
                    4 + Math.random() * 4,
                    4 + Math.random() * 4,
                    0x654321,
                    0.7
                );
                break;
                
            case 'legendary':
                // Rainbow trail for legendary
                const legendaryColors = [0xff4500, 0x87ceeb, 0xffd700, 0x4b0082, 0x8b4513];
                const randColor = legendaryColors[Math.floor(Math.random() * legendaryColors.length)];
                trailEffect = this.scene.add.star(
                    projectile.sprite.x + (Math.random() - 0.5) * 15,
                    projectile.sprite.y + (Math.random() - 0.5) * 15,
                    5, 3, 6,
                    randColor,
                    0.8
                );
                break;
            
            case 'laser':
                // Bright beam trail
                trailEffect = this.scene.add.rectangle(
                    projectile.sprite.x + (Math.random() - 0.5) * 10,
                    projectile.sprite.y + (Math.random() - 0.5) * 4,
                    8 + Math.random() * 8,
                    2,
                    color,
                    0.7
                );
                break;
                
            default:
                // Default fire trail
                trailEffect = this.scene.add.circle(
                    projectile.sprite.x + (Math.random() - 0.5) * 10,
                    projectile.sprite.y + (Math.random() - 0.5) * 10,
                    4,
                    color,
                    0.6
                );
        }
        
        trailEffect.setDepth(98);
        
        this.scene.tweens.add({
            targets: trailEffect,
            alpha: 0,
            scale: 0,
            duration: 300,
            onComplete: () => trailEffect.destroy()
        });
    }

    destroyFireball(index) {
        // Safety check - ensure index is valid and fireball exists
        if (index < 0 || index >= this.fireballs.length) return;
        
        const fireball = this.fireballs[index];
        if (!fireball) return;
        
        if (fireball.sprite && !fireball.sprite.destroyed) {
            fireball.sprite.destroy();
        }
        
        if (fireball.glow && !fireball.glow.destroyed) {
            fireball.glow.destroy();
        }
        
        this.fireballs.splice(index, 1);
    }

    createFireballExplosion(x, y) {
        const costume = this.getDragonCostume();
        
        // Create multiple explosion rings with rainbow colors
        for (let i = 0; i < 3; i++) {
            const explosionColor = costume.fireballColors[i % costume.fireballColors.length];
            const explosion = this.scene.add.circle(x, y, 10, explosionColor, 0.8);
            explosion.setDepth(101);
            
            this.scene.tweens.add({
                targets: explosion,
                scaleX: 3 + i,
                scaleY: 3 + i,
                alpha: 0,
                duration: 400,
                delay: i * 50,
                onComplete: () => explosion.destroy()
            });
        }
        
        // Create particle burst
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const particleColor = costume.fireballColors[i % costume.fireballColors.length];
            const particle = this.scene.add.circle(
                x + Math.cos(angle) * 10,
                y + Math.sin(angle) * 10,
                6,
                particleColor,
                0.9
            );
            particle.setDepth(100);
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 50,
                y: y + Math.sin(angle) * 50,
                alpha: 0,
                scale: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
        
        console.log('💥 Fireball explosion at', x, y);
    }

    createFireballShootEffect() {
        const costume = this.getDragonCostume();
        const effectX = this.sprite.x + (this.facingRight ? 40 : -40);
        const effectY = this.sprite.y;
        
        // Create shooting flash with rainbow colors
        for (let i = 0; i < 3; i++) {
            const flashColor = costume.fireballColors[i % costume.fireballColors.length];
            const flash = this.scene.add.circle(effectX, effectY, 15 + i * 5, flashColor, 0.7 - i * 0.2);
            flash.setDepth(99);
            
            this.scene.tweens.add({
                targets: flash,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 200,
                delay: i * 30,
                onComplete: () => flash.destroy()
            });
        }
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
        const isLegendary = costume.isLegendary;
        
        if (isLegendary) {
            // Legendary mode - sprite is a container, can't use setFillStyle
            // Visual elements (eyes, belt) are already part of the container
            // No need to update positions since they're relative to container
            
            // Squash and stretch for movement on the container
            if (Math.abs(this.body.velocity.x) > 50) {
                this.sprite.setScale(1.05, 0.95);
            } else {
                this.sprite.setScale(1.0, 1.0);
            }
            
            // Jump/fall animation
            if (!this.isGrounded) {
                if (this.body.velocity.y < 0) {
                    // Jumping up - stretch
                    this.sprite.setScale(0.95, 1.05);
                } else {
                    // Falling down - squash
                    this.sprite.setScale(1.05, 0.95);
                }
            }
        } else {
            // Normal mode - single rectangle sprite
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
        // Safety check for controls
        if (!this.controls) {
            return;
        }
        
        this.previousInputs.jump = this.controls.isJump();
        this.previousInputs.kick = this.controls.isKick();
        this.previousInputs.punch = this.controls.isPunch();
        this.previousInputs.activate = this.controls.isActivate();
        this.previousInputs.teleport = this.controls.isTeleport();
    }

    // Power-up queue methods
    addPowerUpToQueue(powerType) {
        // If queue is full, remove oldest (first) item without activation
        if (this.powerUpQueue.length >= this.maxQueueSize) {
            const removed = this.powerUpQueue.shift();
            console.log(`Power-up queue full! Removed ${removed} without activation`);
            
            // Show feedback to player
            if (this.scene && this.scene.showPowerUpMessage) {
                this.scene.showPowerUpMessage(`${removed} discarded!`, 0xff0000);
            }
        }
        
        // Add new power-up to queue
        this.powerUpQueue.push(powerType);
        console.log(`Power-up ${powerType} added to queue. Queue:`, this.powerUpQueue);
        
        // Update UI to show queue
        if (this.scene && this.scene.updatePowerUpQueueUI) {
            this.scene.updatePowerUpQueueUI(this.powerUpQueue);
        }
    }
    
    handlePowerUpActivation() {
        // Safety check for controls
        if (!this.controls) {
            return;
        }
        
        // Check for activation button press (edge detection - only on press, not hold)
        if (this.controls.isActivate() && !this.previousInputs.activate) {
            this.activateNextPowerUp();
        }
    }
    
    activateNextPowerUp() {
        // Can't activate if already active
        if (this.activePowerUp) {
            console.log('Power-up already active!');
            return;
        }
        
        // Get next power-up from queue
        if (this.powerUpQueue.length === 0) {
            console.log('No power-ups in queue!');
            return;
        }
        
        const powerType = this.powerUpQueue.shift();
        console.log(`Activating power-up: ${powerType}`);
        
        // Activate the power-up
        this.activatePowerUp(powerType, 10000); // 10 seconds duration
        
        // Update UI
        if (this.scene && this.scene.updatePowerUpQueueUI) {
            this.scene.updatePowerUpQueueUI(this.powerUpQueue);
        }
    }
    
    activatePowerUp(powerType, duration = 10000) {
        this.powerUps[powerType] = true;
        this.activePowerUp = powerType;
        
        // Clear existing timer if any
        if (this.activePowerUpTimer) {
            clearTimeout(this.activePowerUpTimer);
        }
        
        // Apply power-up specific effects
        this.applyPowerUpEffects(powerType, true);
        
        // Set timer to deactivate
        this.activePowerUpTimer = setTimeout(() => {
            this.powerUps[powerType] = false;
            this.applyPowerUpEffects(powerType, false);
            this.activePowerUp = null;
            this.activePowerUpTimer = null;
            console.log(`Power-up ${powerType} expired`);
            
            // Update UI
            if (this.scene && this.scene.updateActivePowerUpUI) {
                this.scene.updateActivePowerUpUI(null);
            }
        }, duration);
        
        // Update UI to show active power-up
        if (this.scene && this.scene.updateActivePowerUpUI) {
            this.scene.updateActivePowerUpUI(powerType);
        }
        
        console.log(`Power-up activated: ${powerType} for ${duration}ms`);
    }

    applyPowerUpEffects(powerType, activate) {
        const costume = this.getDragonCostume();
        const isLegendary = costume.isLegendary || false;
        
        switch (powerType) {
            case 'speedBoost':
                if (activate) {
                    this.speed *= 1.5;
                    // Only set fill style if not legendary (legendary is a container)
                    if (!isLegendary && this.sprite.setFillStyle) {
                        this.sprite.setFillStyle(0xff69b4);
                    }
                } else {
                    this.speed /= 1.5;
                    this.updateOutfitColor(); // Reset to original outfit color
                }
                break;
                
            case 'invincibility':
                if (activate) {
                    // Only set fill style if not legendary (legendary is a container)
                    if (!isLegendary && this.sprite.setFillStyle) {
                        this.sprite.setFillStyle(0xffd700);
                    }
                    // Add flickering effect (works for both container and rectangle)
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
                    // Only set fill style if not legendary (legendary is a container)
                    if (!isLegendary && this.sprite.setFillStyle) {
                        this.sprite.setFillStyle(0x98fb98);
                    }
                } else {
                    this.updateOutfitColor(); // Reset to original outfit color
                }
                break;
                
            case 'fireBreath':
            case 'ultraBlast':
                if (activate) {
                    // Only set fill style if not legendary (legendary is a container)
                    if (!isLegendary && this.sprite.setFillStyle) {
                        this.sprite.setFillStyle(0xff4500);
                    }
                } else {
                    this.updateOutfitColor(); // Reset to original outfit color
                }
                break;
                
            case 'presentBomb':
                if (activate) {
                    // Festive color change - red and gold theme
                    if (!isLegendary && this.sprite.setFillStyle) {
                        this.sprite.setFillStyle(0xff0000); // Red for present theme
                    }
                    // Show activation message
                    if (this.scene && this.scene.showPowerUpMessage) {
                        this.scene.showPowerUpMessage('🎁 Present Bomb Active!', 0xff0000);
                    }
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

    // Present Bomb power-up attack
    shootPresentBomb() {
        if (this.specialAbilityCooldowns.presentBomb > 0) return;
        
        console.log('🎁 Present Bomb launched!');
        
        // Set cooldown (faster than other special abilities)
        this.specialAbilityCooldowns.presentBomb = 800; // 0.8 seconds between presents
        this.attackCooldown = 400;
        
        // Calculate present starting position and velocity
        const startX = this.sprite.x + (this.facingRight ? 35 : -35);
        const startY = this.sprite.y - 10;
        const velocityX = this.facingRight ? 400 : -400;
        const velocityY = -150; // Arc upward slightly
        
        // Create wrapped present container
        const presentContainer = this.scene.add.container(startX, startY);
        presentContainer.setDepth(100);
        
        // Present box (wrapped gift)
        const presentBox = this.scene.add.rectangle(0, 0, 24, 24, 0xff0000); // Red box
        presentBox.setStrokeStyle(2, 0xffd700); // Gold border
        
        // Ribbon horizontal
        const ribbonH = this.scene.add.rectangle(0, 0, 24, 5, 0xffd700);
        
        // Ribbon vertical
        const ribbonV = this.scene.add.rectangle(0, 0, 5, 24, 0xffd700);
        
        // Bow on top
        const bowLeft = this.scene.add.circle(-4, -14, 5, 0xffd700);
        const bowRight = this.scene.add.circle(4, -14, 5, 0xffd700);
        const bowCenter = this.scene.add.circle(0, -12, 4, 0xff6600);
        
        presentContainer.add([presentBox, ribbonH, ribbonV, bowLeft, bowRight, bowCenter]);
        
        // Add physics to present
        this.scene.physics.add.existing(presentContainer);
        presentContainer.body.setVelocity(velocityX, velocityY);
        presentContainer.body.setGravityY(400); // Affected by gravity
        presentContainer.body.setSize(24, 24);
        presentContainer.body.setOffset(-12, -12);
        presentContainer.body.setBounce(0.3);
        
        // Add spinning animation to present
        this.scene.tweens.add({
            targets: presentContainer,
            rotation: Math.PI * 4,
            duration: 1500,
            ease: 'Linear'
        });
        
        // Store present data
        const presentData = {
            container: presentContainer,
            isPresent: true,
            hasLanded: false,
            bombTimer: null,
            bombSprite: null
        };
        
        this.activePresentBombs.push(presentData);
        
        // Add collider with platforms - when present lands, start bomb transformation
        if (this.scene.platforms) {
            this.scene.physics.add.collider(presentContainer, this.scene.platforms, () => {
                if (!presentData.hasLanded) {
                    presentData.hasLanded = true;
                    this.transformPresentToBomb(presentData);
                }
            });
        }
        
        // Also trigger bomb if it hits an enemy directly
        if (this.scene.enemies) {
            this.scene.physics.add.overlap(presentContainer, this.scene.enemies, (present, enemy) => {
                if (!presentData.hasLanded && presentData.isPresent) {
                    presentData.hasLanded = true;
                    this.transformPresentToBomb(presentData, true); // Immediate explosion
                }
            });
        }
        
        // Create shooting effect at player
        this.createPresentShootEffect();
        
        // Fallback: if present doesn't land after 3 seconds, transform anyway
        this.scene.time.delayedCall(3000, () => {
            if (!presentData.hasLanded && presentData.container && presentData.container.active) {
                presentData.hasLanded = true;
                this.transformPresentToBomb(presentData);
            }
        });
    }
    
    transformPresentToBomb(presentData, immediate = false) {
        if (!presentData.container || !presentData.container.active) return;
        
        console.log('🎁➡️💣 Present opening into bomb!');
        
        const container = presentData.container;
        const x = container.x;
        const y = container.y;
        
        // Stop the container's physics
        if (container.body) {
            container.body.setVelocity(0, 0);
            container.body.setGravityY(0);
        }
        
        // Create "opening" effect - present bursts open
        const burstColors = [0xff0000, 0xffd700, 0x00ff00, 0x00ffff, 0xff00ff];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particle = this.scene.add.star(
                x + Math.cos(angle) * 5,
                y + Math.sin(angle) * 5,
                5, 3, 6,
                burstColors[i % burstColors.length],
                0.9
            );
            particle.setDepth(101);
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 40,
                y: y + Math.sin(angle) * 40,
                alpha: 0,
                scaleX: 0.3,
                scaleY: 0.3,
                duration: 400,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
        
        // Hide/remove present graphics
        container.removeAll(true);
        
        // Create the bomb that appears from the present
        const bombContainer = this.scene.add.container(x, y);
        bombContainer.setDepth(100);
        
        // Bomb body (round black bomb)
        const bombBody = this.scene.add.circle(0, 0, 15, 0x1a1a1a);
        bombBody.setStrokeStyle(2, 0x333333);
        
        // Bomb highlight
        const highlight = this.scene.add.circle(-5, -5, 4, 0x555555, 0.6);
        
        // Fuse spark at top
        const fuseBase = this.scene.add.rectangle(0, -15, 4, 8, 0x8b4513);
        
        // Sparking fuse
        const spark = this.scene.add.circle(0, -20, 5, 0xff6600);
        spark.setDepth(102);
        
        bombContainer.add([bombBody, highlight, fuseBase, spark]);
        
        presentData.bombSprite = bombContainer;
        presentData.isPresent = false;
        
        // Animate the spark/fuse
        this.scene.tweens.add({
            targets: spark,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: { from: 1, to: 0.5 },
            duration: 150,
            yoyo: true,
            repeat: immediate ? 2 : 6, // Fewer flashes for immediate explosion
            onUpdate: () => {
                // Create spark particles
                if (Math.random() > 0.5) {
                    const sparkParticle = this.scene.add.circle(
                        x + (Math.random() - 0.5) * 10,
                        y - 20 + (Math.random() - 0.5) * 10,
                        2,
                        Math.random() > 0.5 ? 0xff6600 : 0xffff00,
                        0.9
                    );
                    sparkParticle.setDepth(103);
                    
                    this.scene.tweens.add({
                        targets: sparkParticle,
                        y: sparkParticle.y - 15,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => sparkParticle.destroy()
                    });
                }
            }
        });
        
        // Set explosion timer (1 second, or immediate if hit enemy)
        const explosionDelay = immediate ? 200 : 1000;
        presentData.bombTimer = this.scene.time.delayedCall(explosionDelay, () => {
            this.explodeBomb(presentData);
        });
        
        // Clean up original container
        container.destroy();
    }
    
    explodeBomb(presentData) {
        if (!presentData.bombSprite || !presentData.bombSprite.active) return;
        
        console.log('💥 BOOM! Present bomb explodes!');
        
        const x = presentData.bombSprite.x;
        const y = presentData.bombSprite.y;
        const explosionRadius = 80;
        const explosionDamage = 60;
        
        // Destroy bomb sprite
        presentData.bombSprite.destroy();
        
        // Create epic explosion effect
        // Main explosion flash
        const mainFlash = this.scene.add.circle(x, y, 20, 0xffffff, 1);
        mainFlash.setDepth(150);
        
        this.scene.tweens.add({
            targets: mainFlash,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 150,
            ease: 'Power2',
            onComplete: () => mainFlash.destroy()
        });
        
        // Fire ring 1
        const fireRing1 = this.scene.add.circle(x, y, 30, 0xff6600, 0.8);
        fireRing1.setDepth(149);
        
        this.scene.tweens.add({
            targets: fireRing1,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 400,
            ease: 'Power1',
            onComplete: () => fireRing1.destroy()
        });
        
        // Fire ring 2 (delayed)
        const fireRing2 = this.scene.add.circle(x, y, 20, 0xff0000, 0.7);
        fireRing2.setDepth(148);
        
        this.scene.tweens.add({
            targets: fireRing2,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 500,
            delay: 50,
            ease: 'Power1',
            onComplete: () => fireRing2.destroy()
        });
        
        // Smoke clouds
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const distance = 20 + Math.random() * 20;
            const smokeCloud = this.scene.add.circle(
                x + Math.cos(angle) * distance,
                y + Math.sin(angle) * distance,
                15 + Math.random() * 10,
                0x555555,
                0.7
            );
            smokeCloud.setDepth(145);
            
            this.scene.tweens.add({
                targets: smokeCloud,
                x: smokeCloud.x + Math.cos(angle) * 40,
                y: smokeCloud.y + Math.sin(angle) * 40 - 30,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 600 + Math.random() * 200,
                ease: 'Power1',
                onComplete: () => smokeCloud.destroy()
            });
        }
        
        // Debris particles
        const debrisColors = [0xff6600, 0xff0000, 0xffff00, 0xff3300, 0xffa500];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
            const speed = 60 + Math.random() * 40;
            const debris = this.scene.add.rectangle(
                x,
                y,
                4 + Math.random() * 4,
                4 + Math.random() * 4,
                debrisColors[Math.floor(Math.random() * debrisColors.length)],
                0.9
            );
            debris.setDepth(146);
            debris.setRotation(Math.random() * Math.PI * 2);
            
            this.scene.tweens.add({
                targets: debris,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                rotation: debris.rotation + Math.PI * 2,
                alpha: 0,
                duration: 500 + Math.random() * 300,
                ease: 'Power2',
                onComplete: () => debris.destroy()
            });
        }
        
        // Screen shake for impact
        this.scene.cameras.main.shake(200, 0.015);
        
        // Damage enemies in explosion radius
        if (this.scene.enemies) {
            this.scene.enemies.children.entries.forEach(enemy => {
                if (enemy.active) {
                    const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
                    
                    if (distance < explosionRadius) {
                        if (enemy.getData && enemy.getData('enemy')) {
                            // Damage falloff based on distance
                            const damageFalloff = 1 - (distance / explosionRadius) * 0.5;
                            const actualDamage = Math.round(explosionDamage * damageFalloff);
                            enemy.getData('enemy').takeDamage(actualDamage);
                            
                            // Knockback effect
                            const knockbackAngle = Phaser.Math.Angle.Between(x, y, enemy.x, enemy.y);
                            const knockbackForce = (1 - distance / explosionRadius) * 400;
                            enemy.body.setVelocity(
                                Math.cos(knockbackAngle) * knockbackForce,
                                Math.sin(knockbackAngle) * knockbackForce - 150
                            );
                        }
                    }
                }
            });
        }
        
        // Remove from active list
        const index = this.activePresentBombs.indexOf(presentData);
        if (index > -1) {
            this.activePresentBombs.splice(index, 1);
        }
        
        // Spawn a friendly dragon ally from the explosion!
        this.spawnDragonAlly(x, y);
    }
    
    spawnDragonAlly(x, y) {
        console.log('🐉 Friendly Dragon Ally spawned!');
        
        // Create dragon ally container
        const dragonAlly = this.scene.add.container(x, y - 20);
        dragonAlly.setDepth(80);
        
        // Dragon colors (festive theme to match presents)
        const bodyColor = 0x32cd32; // Lime green
        const accentColor = 0xff6600; // Orange
        const wingColor = 0x228b22; // Forest green
        
        // Dragon body
        const body = this.scene.add.ellipse(0, 0, 35, 25, bodyColor);
        body.setStrokeStyle(2, accentColor);
        
        // Dragon head
        const head = this.scene.add.circle(18, -8, 12, bodyColor);
        head.setStrokeStyle(2, accentColor);
        
        // Dragon snout
        const snout = this.scene.add.ellipse(28, -6, 8, 5, accentColor);
        
        // Dragon eyes
        const eye = this.scene.add.circle(22, -12, 4, 0xffffff);
        const pupil = this.scene.add.circle(23, -12, 2, 0x000000);
        
        // Dragon nostrils
        const nostril1 = this.scene.add.circle(30, -8, 1.5, 0x000000);
        const nostril2 = this.scene.add.circle(30, -4, 1.5, 0x000000);
        
        // Dragon horns
        const horn1 = this.scene.add.triangle(14, -22, 0, 12, 4, 0, 8, 12, accentColor);
        const horn2 = this.scene.add.triangle(22, -20, 0, 10, 4, 0, 8, 10, accentColor);
        
        // Dragon wings
        const wing1 = this.scene.add.triangle(-5, -15, 0, 25, -25, 0, -25, 25, wingColor, 0.8);
        const wing2 = this.scene.add.triangle(-5, -10, 0, 20, -20, 0, -20, 20, wingColor, 0.6);
        
        // Dragon tail
        const tail = this.scene.add.polygon(-25, 5, [
            [0, 0],
            [-15, -5],
            [-25, 0],
            [-30, 5],
            [-25, 8],
            [-15, 5],
            [0, 8]
        ], bodyColor);
        tail.setStrokeStyle(1, accentColor);
        
        // Tail spikes
        const spike1 = this.scene.add.triangle(-30, 2, 0, 5, -5, -5, -5, 5, accentColor);
        const spike2 = this.scene.add.triangle(-35, 5, 0, 4, -4, -4, -4, 4, accentColor);
        
        // Dragon legs
        const leg1 = this.scene.add.rectangle(8, 15, 6, 12, bodyColor);
        const leg2 = this.scene.add.rectangle(-5, 15, 6, 12, bodyColor);
        const foot1 = this.scene.add.ellipse(10, 22, 10, 5, accentColor);
        const foot2 = this.scene.add.ellipse(-3, 22, 10, 5, accentColor);
        
        // Add all parts to container
        dragonAlly.add([
            tail, spike1, spike2,
            wing1, wing2,
            leg1, leg2, foot1, foot2,
            body,
            head, snout, eye, pupil, nostril1, nostril2,
            horn1, horn2
        ]);
        
        // Add physics to dragon ally
        this.scene.physics.add.existing(dragonAlly);
        dragonAlly.body.setSize(40, 35);
        dragonAlly.body.setOffset(-20, -15);
        dragonAlly.body.setAllowGravity(false); // Floats in air
        
        // Dragon ally stats
        const allyData = {
            container: dragonAlly,
            health: 50,
            damage: 25,
            attackCooldown: 0,
            attackRange: 150,
            lifetime: 8000, // 8 seconds
            spawnTime: Date.now(),
            facingRight: true,
            targetEnemy: null,
            wing1: wing1,
            wing2: wing2
        };
        
        // Store ally reference
        if (!this.dragonAllies) {
            this.dragonAllies = [];
        }
        this.dragonAllies.push(allyData);
        
        // Spawn animation - pop in with sparkles
        dragonAlly.setScale(0);
        dragonAlly.setAlpha(0);
        
        this.scene.tweens.add({
            targets: dragonAlly,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            duration: 400,
            ease: 'Back.easeOut'
        });
        
        // Create spawn sparkles
        this.createDragonSpawnEffect(x, y);
        
        // Wing flapping animation
        this.scene.tweens.add({
            targets: wing1,
            rotation: -0.3,
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        this.scene.tweens.add({
            targets: wing2,
            rotation: -0.2,
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: 50
        });
        
        // Hovering animation
        this.scene.tweens.add({
            targets: dragonAlly,
            y: dragonAlly.y - 10,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Set up AI update loop
        const updateEvent = this.scene.time.addEvent({
            delay: 100,
            callback: () => this.updateDragonAlly(allyData),
            repeat: -1
        });
        allyData.updateEvent = updateEvent;
        
        // Self-destruct after lifetime
        this.scene.time.delayedCall(allyData.lifetime, () => {
            this.despawnDragonAlly(allyData);
        });
    }
    
    createDragonSpawnEffect(x, y) {
        // Magical spawn sparkles
        const sparkleColors = [0x32cd32, 0xffd700, 0xff6600, 0x00ff00];
        
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            
            const sparkle = this.scene.add.star(
                x,
                y,
                5, 3, 7,
                sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
                0.9
            );
            sparkle.setDepth(85);
            
            this.scene.tweens.add({
                targets: sparkle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                rotation: Math.PI * 2,
                alpha: 0,
                scaleX: 0.3,
                scaleY: 0.3,
                duration: 600,
                ease: 'Power2',
                onComplete: () => sparkle.destroy()
            });
        }
        
        // Central magic circle
        const magicCircle = this.scene.add.circle(x, y, 25, 0x32cd32, 0.5);
        magicCircle.setDepth(79);
        
        this.scene.tweens.add({
            targets: magicCircle,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => magicCircle.destroy()
        });
    }
    
    updateDragonAlly(allyData) {
        if (!allyData.container || !allyData.container.active) return;
        
        const dragon = allyData.container;
        
        // Update cooldown
        if (allyData.attackCooldown > 0) {
            allyData.attackCooldown -= 100;
        }
        
        // Find nearest enemy
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        
        if (this.scene.enemies) {
            this.scene.enemies.children.entries.forEach(enemy => {
                if (enemy.active && enemy.getData('enemy') && enemy.getData('enemy').health > 0) {
                    const distance = Phaser.Math.Distance.Between(
                        dragon.x, dragon.y,
                        enemy.x, enemy.y
                    );
                    
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestEnemy = enemy;
                    }
                }
            });
        }
        
        allyData.targetEnemy = nearestEnemy;
        
        if (nearestEnemy) {
            // Move towards enemy
            const targetX = nearestEnemy.x;
            const targetY = nearestEnemy.y - 50; // Hover above enemy
            
            // Smooth movement towards target
            const moveSpeed = 3;
            const dx = targetX - dragon.x;
            const dy = targetY - dragon.y;
            
            dragon.x += dx * 0.05 * moveSpeed;
            dragon.y += dy * 0.05 * moveSpeed;
            
            // Face the enemy
            if (dx > 0 && !allyData.facingRight) {
                allyData.facingRight = true;
                dragon.setScale(1, 1);
            } else if (dx < 0 && allyData.facingRight) {
                allyData.facingRight = false;
                dragon.setScale(-1, 1); // Flip horizontally
            }
            
            // Attack if in range and cooldown is ready
            if (nearestDistance < allyData.attackRange && allyData.attackCooldown <= 0) {
                this.dragonAllyAttack(allyData, nearestEnemy);
            }
        }
    }
    
    dragonAllyAttack(allyData, enemy) {
        if (!allyData.container || !allyData.container.active) return;
        
        console.log('🐉🔥 Dragon ally attacks!');
        
        // Set cooldown
        allyData.attackCooldown = 1200; // 1.2 seconds between attacks
        
        const dragon = allyData.container;
        const startX = dragon.x + (allyData.facingRight ? 25 : -25);
        const startY = dragon.y;
        
        // Create fireball projectile
        const fireballColors = [0xff6600, 0xff0000, 0xffff00];
        const fireballColor = fireballColors[Math.floor(Math.random() * fireballColors.length)];
        
        const fireball = this.scene.add.circle(startX, startY, 10, fireballColor, 0.9);
        fireball.setDepth(90);
        
        // Fireball glow
        const glow = this.scene.add.circle(startX, startY, 15, fireballColor, 0.4);
        glow.setDepth(89);
        
        // Calculate velocity towards enemy
        const angle = Phaser.Math.Angle.Between(startX, startY, enemy.x, enemy.y);
        const speed = 350;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        
        // Add physics
        this.scene.physics.add.existing(fireball);
        fireball.body.setVelocity(velocityX, velocityY);
        fireball.body.setAllowGravity(false);
        
        this.scene.physics.add.existing(glow);
        glow.body.setVelocity(velocityX, velocityY);
        glow.body.setAllowGravity(false);
        
        // Trail effect
        const trailEvent = this.scene.time.addEvent({
            delay: 50,
            callback: () => {
                if (fireball.active) {
                    const trail = this.scene.add.circle(
                        fireball.x,
                        fireball.y,
                        5 + Math.random() * 3,
                        fireballColor,
                        0.6
                    );
                    trail.setDepth(88);
                    
                    this.scene.tweens.add({
                        targets: trail,
                        scaleX: 0.3,
                        scaleY: 0.3,
                        alpha: 0,
                        duration: 200,
                        onComplete: () => trail.destroy()
                    });
                }
            },
            repeat: 20
        });
        
        // Collision with enemies
        this.scene.physics.add.overlap(fireball, this.scene.enemies, (fb, enemySprite) => {
            const enemyObj = enemySprite.getData('enemy');
            if (enemyObj && enemyObj.health > 0) {
                // Deal damage
                enemyObj.takeDamage(allyData.damage);
                
                // Create hit effect
                this.createDragonAllyHitEffect(fireball.x, fireball.y, fireballColor);
                
                // Destroy fireball
                trailEvent.destroy();
                fireball.destroy();
                glow.destroy();
            }
        });
        
        // Destroy after traveling distance
        this.scene.time.delayedCall(1500, () => {
            if (fireball.active) {
                trailEvent.destroy();
                fireball.destroy();
                glow.destroy();
            }
        });
        
        // Dragon attack animation - quick lunge
        const originalX = dragon.x;
        this.scene.tweens.add({
            targets: dragon,
            x: dragon.x + (allyData.facingRight ? 15 : -15),
            duration: 100,
            yoyo: true,
            ease: 'Power2'
        });
    }
    
    createDragonAllyHitEffect(x, y, color) {
        // Impact flash
        const flash = this.scene.add.circle(x, y, 15, 0xffffff, 0.9);
        flash.setDepth(100);
        
        this.scene.tweens.add({
            targets: flash,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 150,
            onComplete: () => flash.destroy()
        });
        
        // Fire particles
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const particle = this.scene.add.circle(
                x,
                y,
                4 + Math.random() * 3,
                color,
                0.8
            );
            particle.setDepth(99);
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 30,
                y: y + Math.sin(angle) * 30,
                alpha: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }
    }
    
    despawnDragonAlly(allyData) {
        if (!allyData.container || !allyData.container.active) return;
        
        console.log('🐉✨ Dragon ally departing!');
        
        const dragon = allyData.container;
        
        // Stop update loop
        if (allyData.updateEvent) {
            allyData.updateEvent.destroy();
        }
        
        // Farewell animation - fly up and fade
        this.scene.tweens.add({
            targets: dragon,
            y: dragon.y - 100,
            alpha: 0,
            scaleX: 0.5,
            scaleY: 0.5,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                dragon.destroy();
            }
        });
        
        // Farewell sparkles
        const x = dragon.x;
        const y = dragon.y;
        
        for (let i = 0; i < 8; i++) {
            this.scene.time.delayedCall(i * 50, () => {
                const sparkle = this.scene.add.star(
                    x + (Math.random() - 0.5) * 40,
                    y - (i * 10) + (Math.random() - 0.5) * 20,
                    5, 3, 6,
                    0xffd700,
                    0.8
                );
                sparkle.setDepth(85);
                
                this.scene.tweens.add({
                    targets: sparkle,
                    y: sparkle.y - 30,
                    alpha: 0,
                    rotation: Math.PI,
                    duration: 400,
                    onComplete: () => sparkle.destroy()
                });
            });
        }
        
        // Remove from allies list
        const index = this.dragonAllies.indexOf(allyData);
        if (index > -1) {
            this.dragonAllies.splice(index, 1);
        }
    }
    
    createPresentShootEffect() {
        // Create a festive shoot effect
        const x = this.sprite.x + (this.facingRight ? 20 : -20);
        const y = this.sprite.y;
        
        // Confetti burst
        const confettiColors = [0xff0000, 0x00ff00, 0xffd700, 0xff69b4, 0x00ffff];
        for (let i = 0; i < 8; i++) {
            const confetti = this.scene.add.rectangle(
                x,
                y,
                4 + Math.random() * 4,
                4 + Math.random() * 4,
                confettiColors[Math.floor(Math.random() * confettiColors.length)],
                0.9
            );
            confetti.setDepth(90);
            confetti.setRotation(Math.random() * Math.PI * 2);
            
            const angle = (Math.random() - 0.5) * Math.PI;
            const distance = 20 + Math.random() * 20;
            
            this.scene.tweens.add({
                targets: confetti,
                x: x + Math.cos(angle) * distance * (this.facingRight ? 1 : -1),
                y: y + Math.sin(angle) * distance,
                rotation: confetti.rotation + Math.PI * 2,
                alpha: 0,
                duration: 400,
                ease: 'Power1',
                onComplete: () => confetti.destroy()
            });
        }
        
        // Launch poof effect
        const poof = this.scene.add.circle(x, y, 15, 0xffffff, 0.6);
        poof.setDepth(89);
        
        this.scene.tweens.add({
            targets: poof,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => poof.destroy()
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
        const costume = this.getDragonCostume();
        const isLegendary = costume.isLegendary;
        
        if (!isLegendary && this.sprite.setFillStyle) {
            // Only set fill style for non-legendary (rectangle sprite)
            this.sprite.setFillStyle(0xff0000);
        } else {
            // For legendary (container), flash the alpha
            this.sprite.setAlpha(0.5);
        }
        
        setTimeout(() => {
            if (!this.powerUps.invincibility) {
                if (isLegendary) {
                    this.sprite.setAlpha(1);
                } else {
                    this.updateOutfitColor(); // Reset to original outfit color
                }
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
        const costume = this.getDragonCostume();
        const isLegendary = costume.isLegendary;
        
        if (!isLegendary && this.sprite.setFillStyle) {
            // Only set fill style for non-legendary (rectangle sprite)
            this.sprite.setFillStyle(0x00ff00);
        } else {
            // For legendary (container), create a green glow effect
            const glow = this.scene.add.circle(this.sprite.x, this.sprite.y, 60, 0x00ff00, 0.4);
            glow.setDepth(45);
            this.scene.tweens.add({
                targets: glow,
                alpha: 0,
                scale: 1.5,
                duration: 400,
                onComplete: () => glow.destroy()
            });
        }
        
        setTimeout(() => {
            if (!isLegendary) {
                this.updateOutfitColor(); // Reset to original outfit color
            }
        }, 100);
        
        console.log(`Player healed ${amount}. Health: ${this.health}/${this.maxHealth}`);
    }

    die() {
        console.log('Player died!');
        // Reset player health and position instead of restarting entire scene
        this.health = this.maxHealth;
        this.sprite.setPosition(100, this.scene.levelHeight - 200); // Reset to start position
        
        // Check if legendary mode
        const costume = this.getDragonCostume();
        const isLegendary = costume.isLegendary;
        
        if (!isLegendary && this.sprite.setFillStyle) {
            // Change color to red to show damage (for rectangle sprite)
            const originalColor = this.sprite.fillColor;
            this.sprite.setFillStyle(0xff0000); // Red color to show damage
            
            // Restore original color after a moment
            this.scene.time.delayedCall(1000, () => {
                this.sprite.setFillStyle(originalColor);
            });
        } else {
            // For legendary (container), flash red using alpha
            const originalAlpha = this.sprite.alpha;
            this.sprite.setAlpha(0.3);
            
            // Restore original alpha after a moment
            this.scene.time.delayedCall(1000, () => {
                this.sprite.setAlpha(originalAlpha);
            });
        }
        
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
        // Check if we need to switch between legendary and normal mode
        const costume = this.getDragonCostume();
        const wasLegendary = this.isLegendaryMode || false;
        const isLegendary = costume.isLegendary || false;
        
        // If switching between legendary and normal, need to recreate entire sprite
        if (wasLegendary !== isLegendary) {
            console.log('🔄 Switching sprite mode, scene restart required');
            // Store the current outfit change was made
            this.isLegendaryMode = isLegendary;
            // Restart the current scene to recreate player with new sprite type
            if (this.scene && this.scene.scene) {
                const currentScene = this.scene.scene.key;
                this.scene.scene.restart();
            }
            return;
        }
        
        // Normal color update for same mode
        this.isLegendaryMode = isLegendary;
        
        if (!isLegendary) {
            // Update sprite color based on current dragon costume
            this.sprite.setFillStyle(costume.primaryColor);
            
            // Update belt color to match dragon costume
            if (this.belt) {
                this.belt.setFillStyle(costume.beltColor);
            }
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
        // Clean up fireballs
        if (this.fireballs) {
            this.fireballs.forEach((fireball, index) => {
                this.destroyFireball(index);
            });
            this.fireballs = [];
        }
        
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
