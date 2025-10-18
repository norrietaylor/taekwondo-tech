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
            const bodyWidth = spriteSize.width * 0.65;
            const bodyHeight = spriteSize.height * 0.85;
            this.body.setSize(bodyWidth, bodyHeight);
            this.body.setOffset(-bodyWidth/2, -bodyHeight/2 + 2); // Center and lift slightly to prevent jitter
            
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
            punch: false
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
        } else {
            // Normal mode - regular attacks
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
            maxDistance: this.scene.levelWidth || 3000 // Travel across the map
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

    updateFireballs(delta) {
        // Update each fireball
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            const fireball = this.fireballs[i];
            
            // Update traveled distance
            const velocity = Math.abs(fireball.sprite.body.velocity.x);
            fireball.traveled += velocity * (delta / 1000);
            
            // Update glow position
            if (fireball.glow && !fireball.glow.destroyed) {
                fireball.glow.x = fireball.sprite.x;
                fireball.glow.y = fireball.sprite.y;
            }
            
            // Check if fireball hit max distance
            if (fireball.traveled >= fireball.maxDistance) {
                this.destroyFireball(i);
                continue;
            }
            
            // Check collision with enemies
            if (this.scene.enemies) {
                this.scene.enemies.children.entries.forEach(enemy => {
                    if (enemy.active && fireball.sprite && !fireball.sprite.destroyed) {
                        const distance = Phaser.Math.Distance.Between(
                            fireball.sprite.x, fireball.sprite.y,
                            enemy.x, enemy.y
                        );
                        
                        if (distance < 30) {
                            // Hit enemy!
                            if (enemy.getData && enemy.getData('enemy')) {
                                enemy.getData('enemy').takeDamage(fireball.damage);
                            }
                            
                            // Create explosion
                            this.createFireballExplosion(fireball.sprite.x, fireball.sprite.y);
                            
                            // Destroy fireball
                            this.destroyFireball(i);
                        }
                    }
                });
            }
            
            // Add trailing particle effect
            if (fireball.sprite && !fireball.sprite.destroyed && Math.random() < 0.3) {
                const costume = this.getDragonCostume();
                const trailColor = costume.fireballColors[Math.floor(Math.random() * costume.fireballColors.length)];
                const trail = this.scene.add.circle(
                    fireball.sprite.x + (Math.random() - 0.5) * 10,
                    fireball.sprite.y + (Math.random() - 0.5) * 10,
                    5,
                    trailColor,
                    0.6
                );
                trail.setDepth(98);
                
                this.scene.tweens.add({
                    targets: trail,
                    alpha: 0,
                    scale: 0,
                    duration: 300,
                    onComplete: () => trail.destroy()
                });
            }
        }
    }

    destroyFireball(index) {
        const fireball = this.fireballs[index];
        
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
