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
        
        // Stone Dragon special move (T+S laser-to-boulder blast)
        this.stoneBlastCooldown = 0;
        this.stoneBlastCooldownTime = 3000; // 3 seconds between blasts
        this.stoneLasers = []; // Track active stone lasers
        
        // Dino Grimlock transformation and duck laser
        this.grimlockForm = 'robot'; // 'robot' or 'dinosaur'
        this.grimlockCurrentForm = null; // Track which form's visuals are currently shown
        this.grimlockLastFacingRight = null; // Track facing direction for dino visuals
        this.grimlockTransformCooldown = 0;
        this.grimlockTransformCooldownTime = 1000; // 1 second between transforms
        this.duckLaserCooldown = 0;
        this.duckLaserCooldownTime = 5000; // 5 seconds between duck lasers
        this.duckedEnemies = []; // Track enemies turned into ducks
        this.grimlockVisuals = []; // Visual elements for grimlock forms
        this.grimlockTeeth = []; // Store teeth separately for easier updates
        // Bumblebee transformation and dog laser
        this.bumblebeeForm = 'robot'; // 'robot' or 'car'
        this.bumblebeeVisuals = [];
        this.bumblebeeCurrentForm = null;
        this.bumblebeeLastFacingRight = null;
        this.bumblebeeTransformCooldown = 0;
        this.bumblebeeTransformCooldownTime = 1000;
        this.dogLaserCooldown = 0;
        this.dogLaserCooldownTime = 5000;
        this.doggedEnemies = [];
        // Hot Rod transformation (sports car / robot) - unlocks after level 2
        this.hotrodForm = 'robot';
        this.hotrodVisuals = [];
        this.hotrodCurrentForm = null;
        this.hotrodLastFacingRight = null;
        this.hotrodTransformCooldown = 0;
        this.hotrodTransformCooldownTime = 1000;
        this.hotrodLaughterCooldown = 0;
        this.hotrodLaughterCooldownTime = 6000;
        // Elita transformation (motorcycle / robot) - guns only, no lasers
        this.elitaForm = 'robot';
        this.elitaVisuals = [];
        this.elitaCurrentForm = null;
        this.elitaLastFacingRight = null;
        this.elitaTransformCooldown = 0;
        this.elitaTransformCooldownTime = 1000;
        // BMW Bouncer transformation (race car / robot) — state lives on the
        // shared Transformer instance (see js/entities/Transformer.js +
        // js/entities/transformers/BMWBouncerTransformer.js). The legacy
        // bmwBouncer* fields are intentionally NOT own properties of Player.
        this.bounceSlamCooldown = 0;
        this.bounceSlamCooldownTime = 6000;
        // Active Transformer strategy for the current outfit (or null when the
        // outfit has no registered transformer). Resolved from
        // window.TransformerRegistry; refreshed on outfit change inside update().
        this.transformer = null;
        this._activeTransformerKey = null;
        // VibeCoder ally spawns — array of live VibeSpawn instances.
        // Managed by spawnVibeAlly() and cleaned up on transform-back + scene shutdown.
        this.vibeSpawns = [];
        // Portal Bot transformation (robot / dragon) - shoots portals for teleportation
        this.portalbotForm = 'robot';
        this.portalbotVisuals = [];
        this.portalbotCurrentForm = null;
        this.portalbotLastFacingRight = null;
        this.portalbotTransformCooldown = 0;
        this.portalbotTransformCooldownTime = 1000;
        this.activePortals = []; // Track placed portals on the map
        this.portalMaxActive = 2; // Max portals at once
        this.portalLifetime = 8000; // Portals last 8 seconds
        this.portalTeleportCooldown = 0; // Prevent instant re-teleport
        this.portalTeleportCooldownTime = 500;


        // Visual effects
        this.attackEffect = null;
        this.footstepTimer = 0;
        
        // Create simple visual elements
        this.createVisualElements();
        
        // Input handling
        this.setupInputHandlers();

        // Resolve the registered Transformer (if any) for the active outfit.
        this.syncTransformerForOutfit();

        // Cleanup VibeSpawns on scene shutdown (the scene may restart between levels).
        if (scene && scene.events) {
            scene.events.once('shutdown', () => {
                this.cleanupVibeSpawns();
            });
        }

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
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        
        // Hide wings for Grimlock/Bumblebee/Hot Rod (have their own visuals) or if costume doesn't have them
        if (currentOutfit === 'grimlock' || currentOutfit === 'bumblebee' || currentOutfit === 'hotrod' || currentOutfit === 'elita' || currentOutfit === 'bmwBouncer' || currentOutfit === 'portalbot' || !costume.hasWings) {
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
            teleport: false,
            stoneBlast: false,
            grimlockTransform: false,
            duckLaser: false,
            dogLaser: false,
            vibeCoderTransform: false,
            vibeSpawn1: false,
            vibeSpawn2: false,
            vibeSpawn3: false,
            vibeCharm: false
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
        
        // Update Grimlock visuals if in grimlock costume
        this.updateGrimlockVisualsIfNeeded();
        this.updateBumblebeeVisualsIfNeeded();
        this.updateHotrodVisualsIfNeeded();
        this.updateElitaVisualsIfNeeded();
        // BMW Bouncer visuals are now driven by the Transformer strategy.
        // Resync (handles outfit changes) and tick the active transformer.
        this.syncTransformerForOutfit();
        if (this.transformer && typeof this.transformer.update === 'function') {
            // delta is an arg to Player.update — fall back to 16ms if it isn't
            // available in this scope (defensive; updateVisuals is invoked from
            // the same frame).
            const dt = (typeof delta === 'number') ? delta : 16;
            this.transformer.update(dt);
        }
        this.updatePortalbotVisualsIfNeeded();

        // Tick all live VibeCoder ally spawns.
        this._updateVibeSpawns(delta);


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
        
        // Update stone blast cooldown
        if (this.stoneBlastCooldown > 0) {
            this.stoneBlastCooldown -= delta;
        }
        
        // Update Grimlock transform and duck laser cooldowns
        if (this.grimlockTransformCooldown > 0) {
            this.grimlockTransformCooldown -= delta;
        }
        if (this.duckLaserCooldown > 0) {
            this.duckLaserCooldown -= delta;
        }
        if (this.dogLaserCooldown > 0) {
            this.dogLaserCooldown -= delta;
        }
        if (this.bumblebeeTransformCooldown > 0) {
            this.bumblebeeTransformCooldown -= delta;
        }
        if (this.hotrodTransformCooldown > 0) {
            this.hotrodTransformCooldown -= delta;
        }
        if (this.hotrodLaughterCooldown > 0) {
            this.hotrodLaughterCooldown -= delta;
        }
        if (this.elitaTransformCooldown > 0) {
            this.elitaTransformCooldown -= delta;
        }
        // BMW Bouncer transform cooldown lives inside the Transformer instance now.
        if (this.bounceSlamCooldown > 0) {
            this.bounceSlamCooldown -= delta;
        }
        if (this.portalbotTransformCooldown > 0) {
            this.portalbotTransformCooldown -= delta;
        }

        // Update portal teleport checks
        this.updatePortals(delta);


        // Update ducked enemies (restore them after duration)
        this.updateDuckedEnemies(delta);
        // Update dogged enemies (restore them after duration)
        this.updateDoggedEnemies(delta);
    }

    handleMovement() {
        // Safety check for controls
        if (!this.controls) {
            console.warn('⚠️ Controls not initialized');
            return;
        }

        // Block movement if in a stationary form (e.g., VibeCoder's computer form).
        // R2.4: Computer form must ignore all movement input (horizontal & vertical).
        if (this.transformer
            && this.transformer.config
            && this.transformer.config.stationaryInForm === this.transformer.currentForm()) {
            this.body.setVelocityX(0);
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
        
        // Stone Dragon special move (T+S for laser-to-boulder blast)
        this.handleStoneBlast();
        
        // Dino Grimlock special abilities
        this.handleGrimlockTransform();
        this.handleDuckLaser();
        // Bumblebee special abilities
        this.handleBumblebeeTransform();
        this.handleDogLaser();
        // Hot Rod special abilities (transform + L = sonic laughter)
        this.handleHotrodTransform();
        this.handleHotrodLaughter();
        // Elita special abilities (no lasers, gun = dog bullets)
        this.handleElitaTransform();
        // BMW Bouncer special abilities (transform + L = bounce slam)
        this.handleBmwBouncerTransform();
        this.handleBmwBouncerBounceSlam();
        // Portal Bot special abilities (transform + portal teleport)
        this.handlePortalbotTransform();
        // VibeCoder special abilities (V = toggle robot/computer)
        this.handleVibeCoderTransform();
        // VibeCoder spawn keys (1/2/3 = chicken/duck/doghouse while in computer form)
        this.handleVibeCoderSpawns();
        // VibeCoder charm ability (X = charm nearby enemies while in computer form)
        this.handleVibeCoderCharm();
    }

    handleStoneBlast() {
        // Safety check for controls
        if (!this.controls) {
            return;
        }
        
        // Check if player is wearing Stone Dragon costume
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'stone') {
            return; // Only Stone Dragon can use this move
        }
        
        // Check for T+S key combo (edge detection - only on press)
        if (this.controls.isStoneBlast() && !this.previousInputs.stoneBlast) {
            this.performStoneBlast();
        }
    }

    performStoneBlast() {
        // Check cooldown
        if (this.stoneBlastCooldown > 0) {
            console.log('🪨 Stone Blast on cooldown!', Math.ceil(this.stoneBlastCooldown / 1000), 's remaining');
            return;
        }
        
        console.log('🪨💥 STONE DRAGON LASER-TO-BOULDER BLAST!');
        
        // Set cooldown
        this.stoneBlastCooldown = this.stoneBlastCooldownTime;
        
        // Calculate starting position
        const startX = this.sprite.x + (this.facingRight ? 30 : -30);
        const startY = this.sprite.y - 5;
        const direction = this.facingRight ? 1 : -1;
        
        // Phase 1: Create stone laser beam
        this.createStoneLaserBeam(startX, startY, direction);
        
        // Play visual feedback
        this.createStoneBlastChargeEffect(startX, startY);
        
        // Screen shake for dramatic effect
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(200, 0.015);
        }
    }

    createStoneLaserBeam(startX, startY, direction) {
        const costume = this.getDragonCostume();
        const laserSpeed = 600;
        const laserDistance = 400; // How far laser travels before becoming boulder
        
        // Create the laser beam (elongated stone energy)
        const laserWidth = 80;
        const laserHeight = 12;
        
        const laser = this.scene.add.rectangle(
            startX, 
            startY, 
            laserWidth, 
            laserHeight, 
            0x696969, // Stone gray
            0.9
        );
        laser.setStrokeStyle(2, 0x2f4f4f);
        laser.setDepth(100);
        
        // Add glow effect
        const glow = this.scene.add.rectangle(
            startX, 
            startY, 
            laserWidth + 10, 
            laserHeight + 8, 
            0x808080, 
            0.4
        );
        glow.setDepth(99);
        
        // Add physics
        this.scene.physics.add.existing(laser);
        laser.body.setVelocityX(laserSpeed * direction);
        laser.body.setAllowGravity(false);
        
        this.scene.physics.add.existing(glow);
        glow.body.setVelocityX(laserSpeed * direction);
        glow.body.setAllowGravity(false);
        
        // Track laser position
        const laserData = {
            sprite: laser,
            glow: glow,
            startX: startX,
            direction: direction,
            hasTransformed: false
        };
        
        this.stoneLasers.push(laserData);
        
        // Create trailing particles
        this.createStoneLaserTrail(laser, direction);
        
        // Set up collision with enemies for initial laser damage
        if (this.scene.enemies) {
            const laserOverlap = this.scene.physics.add.overlap(
                laser,
                this.scene.enemies,
                (laserSprite, enemySprite) => {
                    const enemy = enemySprite.getData('enemy');
                    if (enemy && enemy.health > 0) {
                        enemy.takeDamage(costume.laserDamage || 15, 'stoneLaser');
                        this.createStoneLaserHitEffect(laserSprite.x, laserSprite.y);
                    }
                }
            );
        }
        
        // After traveling a distance, transform into boulder
        this.scene.time.delayedCall(laserDistance / laserSpeed * 1000, () => {
            if (!laserData.hasTransformed && laser.active) {
                laserData.hasTransformed = true;
                this.transformLaserToBoulder(laser, glow, direction);
            }
        });
        
        // Safety cleanup after max time
        this.scene.time.delayedCall(3000, () => {
            if (laser.active) laser.destroy();
            if (glow.active) glow.destroy();
        });
    }

    createStoneLaserTrail(laser, direction) {
        // Create particle trail effect
        const trailInterval = this.scene.time.addEvent({
            delay: 50,
            repeat: 15,
            callback: () => {
                if (!laser.active) {
                    trailInterval.remove();
                    return;
                }
                
                const colors = [0x696969, 0x808080, 0x778899, 0x2f4f4f];
                const particle = this.scene.add.circle(
                    laser.x - (direction * 20) + (Math.random() - 0.5) * 10,
                    laser.y + (Math.random() - 0.5) * 8,
                    3 + Math.random() * 4,
                    colors[Math.floor(Math.random() * colors.length)],
                    0.7
                );
                particle.setDepth(98);
                
                this.scene.tweens.add({
                    targets: particle,
                    alpha: 0,
                    scale: 0.3,
                    duration: 300,
                    onComplete: () => particle.destroy()
                });
            }
        });
    }

    transformLaserToBoulder(laser, glow, direction) {
        const x = laser.x;
        const y = laser.y;
        const costume = this.getDragonCostume();
        
        console.log('🪨➡️💥 Laser transforming into BOULDER at', x, y);
        
        // Destroy the laser
        laser.destroy();
        glow.destroy();
        
        // Create transformation flash
        const flash = this.scene.add.circle(x, y, 30, 0xffffff, 0.8);
        flash.setDepth(101);
        this.scene.tweens.add({
            targets: flash,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });
        
        // Create the boulder
        const boulderSize = 40;
        const boulder = this.scene.add.polygon(x, y, [
            -boulderSize * 0.5, -boulderSize * 0.6,
            boulderSize * 0.4, -boulderSize * 0.7,
            boulderSize * 0.7, -boulderSize * 0.1,
            boulderSize * 0.5, boulderSize * 0.6,
            -boulderSize * 0.3, boulderSize * 0.7,
            -boulderSize * 0.7, boulderSize * 0.2
        ], 0x696969, 0.95);
        boulder.setStrokeStyle(4, 0x2f4f4f);
        boulder.setDepth(100);
        
        // Add physics
        this.scene.physics.add.existing(boulder);
        boulder.body.setVelocityX(200 * direction); // Slower than laser
        boulder.body.setVelocityY(50); // Slight drop
        boulder.body.setAllowGravity(true);
        boulder.body.setGravityY(-600); // Reduced gravity for floaty boulder
        
        // Add rolling rotation
        this.scene.tweens.add({
            targets: boulder,
            rotation: direction * Math.PI * 3,
            duration: 1500
        });
        
        // Boulder explodes after a short time or on platform collision
        const explodeBoulder = () => {
            if (boulder.active) {
                this.createBoulderExplosion(boulder.x, boulder.y, costume);
                boulder.destroy();
            }
        };
        
        // Platform collision
        if (this.scene.platforms) {
            this.scene.physics.add.collider(boulder, this.scene.platforms, () => {
                explodeBoulder();
            });
        }
        
        // Explode after 1.5 seconds if no collision
        this.scene.time.delayedCall(1500, explodeBoulder);
        
        // Enemy collision during flight
        if (this.scene.enemies) {
            this.scene.physics.add.overlap(boulder, this.scene.enemies, (boulderSprite, enemySprite) => {
                const enemy = enemySprite.getData('enemy');
                if (enemy && enemy.health > 0) {
                    // Direct hit deals partial damage
                    enemy.takeDamage(25, 'boulder');
                }
            });
        }
    }

    createBoulderExplosion(x, y, costume) {
        console.log('💥🪨 BOULDER EXPLOSION at', x, y);
        
        const explosionRadius = costume?.boulderRadius || 80;
        const explosionDamage = costume?.boulderDamage || 50;
        
        // Create explosion circle
        const explosion = this.scene.add.circle(x, y, 10, 0xff4500, 0.9);
        explosion.setDepth(110);
        
        this.scene.tweens.add({
            targets: explosion,
            scaleX: explosionRadius / 10,
            scaleY: explosionRadius / 10,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => explosion.destroy()
        });
        
        // Create rock debris
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            const distance = 30 + Math.random() * (explosionRadius - 30);
            const colors = [0x696969, 0x808080, 0x654321, 0x2f4f4f];
            
            const debris = this.scene.add.polygon(
                x + Math.cos(angle) * 10,
                y + Math.sin(angle) * 10,
                [
                    -5, -6,
                    4, -5,
                    6, 2,
                    -2, 7,
                    -6, 1
                ],
                colors[Math.floor(Math.random() * colors.length)],
                0.9
            );
            debris.setRotation(Math.random() * Math.PI * 2);
            debris.setDepth(105);
            
            this.scene.tweens.add({
                targets: debris,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance - 20,
                rotation: debris.rotation + Math.PI * 2,
                alpha: 0,
                duration: 500 + Math.random() * 300,
                ease: 'Power2',
                onComplete: () => debris.destroy()
            });
        }
        
        // Create dust cloud
        for (let i = 0; i < 8; i++) {
            const dustX = x + (Math.random() - 0.5) * 60;
            const dustY = y + (Math.random() - 0.5) * 40;
            const dust = this.scene.add.circle(dustX, dustY, 15 + Math.random() * 15, 0xa0522d, 0.5);
            dust.setDepth(104);
            
            this.scene.tweens.add({
                targets: dust,
                scaleX: 2.5,
                scaleY: 2.5,
                alpha: 0,
                y: dustY - 30,
                duration: 600 + Math.random() * 200,
                onComplete: () => dust.destroy()
            });
        }
        
        // Damage enemies in radius
        if (this.scene.enemies) {
            this.scene.enemies.children.entries.forEach(enemySprite => {
                const enemy = enemySprite.getData('enemy');
                if (enemy && enemy.health > 0) {
                    const distance = Phaser.Math.Distance.Between(x, y, enemySprite.x, enemySprite.y);
                    if (distance <= explosionRadius) {
                        // Damage falls off with distance
                        const damageFactor = 1 - (distance / explosionRadius) * 0.5;
                        const damage = Math.floor(explosionDamage * damageFactor);
                        enemy.takeDamage(damage, 'boulderExplosion');
                        
                        // Knockback effect
                        const knockbackAngle = Math.atan2(enemySprite.y - y, enemySprite.x - x);
                        const knockbackForce = 300 * (1 - distance / explosionRadius);
                        if (enemySprite.body) {
                            enemySprite.body.setVelocity(
                                Math.cos(knockbackAngle) * knockbackForce,
                                Math.sin(knockbackAngle) * knockbackForce - 100
                            );
                        }
                    }
                }
            });
        }
        
        // Major screen shake
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(300, 0.03);
        }
    }

    createStoneBlastChargeEffect(x, y) {
        // Create charging particles converging on player
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const startRadius = 50;
            const colors = [0x696969, 0x808080, 0x778899];
            
            const particle = this.scene.add.circle(
                x + Math.cos(angle) * startRadius,
                y + Math.sin(angle) * startRadius,
                5,
                colors[Math.floor(Math.random() * colors.length)],
                0.8
            );
            particle.setDepth(102);
            
            this.scene.tweens.add({
                targets: particle,
                x: x,
                y: y,
                alpha: 0,
                scale: 0.5,
                duration: 200,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
        
        // Flash around player
        const chargeFlash = this.scene.add.circle(x, y, 25, 0x808080, 0.6);
        chargeFlash.setDepth(101);
        
        this.scene.tweens.add({
            targets: chargeFlash,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => chargeFlash.destroy()
        });
    }

    createStoneLaserHitEffect(x, y) {
        // Sparks when laser hits enemy
        for (let i = 0; i < 6; i++) {
            const angle = Math.random() * Math.PI * 2;
            const particle = this.scene.add.circle(
                x,
                y,
                3,
                0x778899,
                0.9
            );
            particle.setDepth(105);
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 25,
                y: y + Math.sin(angle) * 25,
                alpha: 0,
                duration: 200,
                onComplete: () => particle.destroy()
            });
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

    // ============================================
    // DINO GRIMLOCK SPECIAL ABILITIES
    // ============================================
    
    handleGrimlockTransform() {
        // Safety check for controls
        if (!this.controls) {
            return;
        }
        
        // Check if player is wearing Grimlock costume
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'grimlock') {
            return; // Only Grimlock can transform
        }
        
        // Check for transform key press (edge detection - only on press, not hold)
        if (this.controls.isGrimlockTransform() && !this.previousInputs.grimlockTransform) {
            this.performGrimlockTransform();
        }
    }

    performGrimlockTransform() {
        // Check cooldown
        if (this.grimlockTransformCooldown > 0) {
            console.log('🦖🤖 Transform on cooldown!', Math.ceil(this.grimlockTransformCooldown / 1000), 's remaining');
            return;
        }
        
        // Set cooldown
        this.grimlockTransformCooldown = this.grimlockTransformCooldownTime;
        
        const costume = this.getDragonCostume();
        const wasRobot = this.grimlockForm === 'robot';
        
        // Toggle form
        this.grimlockForm = wasRobot ? 'dinosaur' : 'robot';
        
        console.log(`🦖🤖 GRIMLOCK ${wasRobot ? 'TRANSFORM TO DINOSAUR!' : 'RETURN TO ROBOT!'}`);
        
        // Create transformation effect
        this.createGrimlockTransformEffect(wasRobot);
        
        // Apply form-specific stats
        if (this.grimlockForm === 'dinosaur') {
            // Dinosaur form: slower but stronger and bigger
            this.speed = costume.dinoSpeed || 150;
            this.jumpPower = costume.dinoJump || 300;
            this.damageMultiplier = costume.dinoDamage || 1.5;
        } else {
            // Robot form: faster and more agile
            this.speed = costume.robotSpeed || 200;
            this.jumpPower = 600;
            this.damageMultiplier = costume.robotDamage || 1.0;
        }
        
        // Update the visual appearance
        this.updateGrimlockVisuals();
        
        // Screen shake for dramatic effect
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(300, 0.02);
        }
    }
    
    updateGrimlockVisuals() {
        // Remove existing grimlock visuals
        if (this.grimlockVisuals) {
            this.grimlockVisuals.forEach(visual => {
                if (visual && visual.destroy) visual.destroy();
            });
        }
        this.grimlockVisuals = [];
        
        if (this.grimlockForm === 'dinosaur') {
            this.createDinosaurVisuals();
        } else {
            this.createRobotVisuals();
        }
    }
    
    createRobotVisuals() {
        // Create compact robot using a Phaser container for easy positioning
        // Grimlock Robot: Grey body, red accents, yellow details
        
        this.grimlockTeeth = [];
        const px = this.sprite.x;
        const py = this.sprite.y;
        
        // Robot body (main torso) - central piece everything connects to
        this.grimlockChest = this.scene.add.rectangle(px, py, 24, 28, 0x696969);
        this.grimlockChest.setStrokeStyle(2, 0xffd700);
        this.grimlockChest.setDepth(51);
        this.grimlockVisuals.push(this.grimlockChest);
        
        // Robot head (sits directly on top of torso)
        this.grimlockHead = this.scene.add.rectangle(px, py - 20, 18, 14, 0x808080);
        this.grimlockHead.setStrokeStyle(2, 0xff0000);
        this.grimlockHead.setDepth(52);
        this.grimlockVisuals.push(this.grimlockHead);
        
        // Robot visor (on the head)
        this.grimlockVisor = this.scene.add.rectangle(px, py - 20, 14, 4, 0xffd700);
        this.grimlockVisor.setDepth(53);
        this.grimlockVisuals.push(this.grimlockVisor);
        
        // Robot arms (attached to sides of torso)
        this.grimlockLeftArm = this.scene.add.rectangle(px - 16, py - 2, 8, 18, 0x808080);
        this.grimlockLeftArm.setStrokeStyle(1, 0xff0000);
        this.grimlockLeftArm.setDepth(50);
        this.grimlockVisuals.push(this.grimlockLeftArm);
        
        this.grimlockRightArm = this.scene.add.rectangle(px + 16, py - 2, 8, 18, 0x808080);
        this.grimlockRightArm.setStrokeStyle(1, 0xff0000);
        this.grimlockRightArm.setDepth(50);
        this.grimlockVisuals.push(this.grimlockRightArm);
        
        // Robot legs (attached to bottom of torso)
        this.grimlockLeftLeg = this.scene.add.rectangle(px - 7, py + 20, 10, 14, 0x696969);
        this.grimlockLeftLeg.setStrokeStyle(1, 0xffd700);
        this.grimlockLeftLeg.setDepth(50);
        this.grimlockVisuals.push(this.grimlockLeftLeg);
        
        this.grimlockRightLeg = this.scene.add.rectangle(px + 7, py + 20, 10, 14, 0x696969);
        this.grimlockRightLeg.setStrokeStyle(1, 0xffd700);
        this.grimlockRightLeg.setDepth(50);
        this.grimlockVisuals.push(this.grimlockRightLeg);
        
        // Robot feet
        this.grimlockLeftFoot = this.scene.add.rectangle(px - 7, py + 30, 12, 6, 0x808080);
        this.grimlockLeftFoot.setStrokeStyle(1, 0xff0000);
        this.grimlockLeftFoot.setDepth(50);
        this.grimlockVisuals.push(this.grimlockLeftFoot);
        
        this.grimlockRightFoot = this.scene.add.rectangle(px + 7, py + 30, 12, 6, 0x808080);
        this.grimlockRightFoot.setStrokeStyle(1, 0xff0000);
        this.grimlockRightFoot.setDepth(50);
        this.grimlockVisuals.push(this.grimlockRightFoot);
        
        // Hide the base sprite
        if (this.sprite && this.sprite.setAlpha) {
            this.sprite.setAlpha(0);
        }
        
        console.log('🤖 Robot visuals created!');
    }
    
    createDinosaurVisuals() {
        // Create compact T-Rex dinosaur - all parts connected!
        // Grimlock Dino: Grey body, red accents, yellow eye
        
        this.grimlockTeeth = [];
        const px = this.sprite.x;
        const py = this.sprite.y;
        const dir = this.facingRight ? 1 : -1;
        
        // Dinosaur body (horizontal oval - the central piece)
        this.grimlockBody = this.scene.add.ellipse(px, py, 50, 32, 0x696969);
        this.grimlockBody.setStrokeStyle(2, 0xff0000);
        this.grimlockBody.setDepth(51);
        this.grimlockVisuals.push(this.grimlockBody);
        
        // Dinosaur head (attached to front of body)
        this.grimlockHead = this.scene.add.ellipse(px + dir * 28, py - 8, 24, 20, 0x808080);
        this.grimlockHead.setStrokeStyle(2, 0xff0000);
        this.grimlockHead.setDepth(52);
        this.grimlockVisuals.push(this.grimlockHead);
        
        // Snout/Jaw (attached to head)
        this.grimlockSnout = this.scene.add.ellipse(px + dir * 42, py - 4, 16, 12, 0x808080);
        this.grimlockSnout.setStrokeStyle(2, 0xff0000);
        this.grimlockSnout.setDepth(52);
        this.grimlockVisuals.push(this.grimlockSnout);
        
        // Dinosaur eye (on head)
        this.grimlockEye = this.scene.add.circle(px + dir * 26, py - 12, 4, 0xffd700);
        this.grimlockEye.setDepth(53);
        this.grimlockVisuals.push(this.grimlockEye);
        
        // Pupil
        this.grimlockPupil = this.scene.add.circle(px + dir * 27, py - 12, 2, 0x000000);
        this.grimlockPupil.setDepth(54);
        this.grimlockVisuals.push(this.grimlockPupil);
        
        // Dinosaur teeth (pointing DOWN from the snout)
        for (let i = 0; i < 3; i++) {
            const tooth = this.scene.add.triangle(
                px + dir * (38 + i * 5), py + 4,
                0, 0,      // top point
                3, 8,      // bottom right
                -3, 8,     // bottom left - this makes it point DOWN
                0xffffff
            );
            tooth.setAngle(180); // Flip upside down so teeth point down
            tooth.setDepth(53);
            this.grimlockTeeth.push(tooth);
            this.grimlockVisuals.push(tooth);
        }
        
        // Dinosaur tail (attached directly to back of body - closer!)
        this.grimlockTail = this.scene.add.polygon(
            px - dir * 20, py,  // Moved closer to body center
            [
                dir * 5, -5,      // Connect to body
                0, -4,
                -dir * 12, -2,
                -dir * 22, 0,
                -dir * 12, 2,
                0, 4,
                dir * 5, 5         // Connect to body
            ],
            0x808080
        );
        this.grimlockTail.setStrokeStyle(2, 0xff0000);
        this.grimlockTail.setDepth(50);
        this.grimlockVisuals.push(this.grimlockTail);
        
        // Dinosaur legs (thick, powerful, attached to bottom of body)
        this.grimlockLeftLeg = this.scene.add.rectangle(px - 8, py + 22, 12, 20, 0x696969);
        this.grimlockLeftLeg.setStrokeStyle(1, 0xffd700);
        this.grimlockLeftLeg.setDepth(50);
        this.grimlockVisuals.push(this.grimlockLeftLeg);
        
        this.grimlockRightLeg = this.scene.add.rectangle(px + 8, py + 22, 12, 20, 0x696969);
        this.grimlockRightLeg.setStrokeStyle(1, 0xffd700);
        this.grimlockRightLeg.setDepth(50);
        this.grimlockVisuals.push(this.grimlockRightLeg);
        
        // Dinosaur feet
        this.grimlockLeftFoot = this.scene.add.ellipse(px - 8, py + 34, 14, 6, 0x808080);
        this.grimlockLeftFoot.setStrokeStyle(1, 0xff0000);
        this.grimlockLeftFoot.setDepth(50);
        this.grimlockVisuals.push(this.grimlockLeftFoot);
        
        this.grimlockRightFoot = this.scene.add.ellipse(px + 8, py + 34, 14, 6, 0x808080);
        this.grimlockRightFoot.setStrokeStyle(1, 0xff0000);
        this.grimlockRightFoot.setDepth(50);
        this.grimlockVisuals.push(this.grimlockRightFoot);
        
        // Small T-Rex arms (iconic tiny arms attached to front of body)
        this.grimlockSmallArm = this.scene.add.ellipse(px + dir * 12, py + 2, 6, 10, 0x808080);
        this.grimlockSmallArm.setStrokeStyle(1, 0xff0000);
        this.grimlockSmallArm.setDepth(52);
        this.grimlockVisuals.push(this.grimlockSmallArm);
        
        // Hide the base sprite
        if (this.sprite && this.sprite.setAlpha) {
            this.sprite.setAlpha(0);
        }
        
        console.log('🦖 Dinosaur visuals created!');
    }
    
    updateGrimlockVisualsPosition() {
        // Update all grimlock visual elements to follow the sprite
        if (!this.grimlockVisuals || this.grimlockVisuals.length === 0) return;
        
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'grimlock') return;
        
        // Destroy and recreate visuals at new position (simpler approach)
        // This handles facing direction changes too
        this.updateGrimlockVisuals();
    }
    
    updateGrimlockVisualsIfNeeded() {
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        
        // Only update if wearing grimlock costume
        if (currentOutfit !== 'grimlock') {
            // Clean up grimlock visuals if we switched away
            if (this.grimlockVisuals && this.grimlockVisuals.length > 0) {
                this.grimlockVisuals.forEach(visual => {
                    if (visual && visual.destroy) visual.destroy();
                });
                this.grimlockVisuals = [];
                this.grimlockCurrentForm = null;
                // Show base sprite again
                if (this.sprite && this.sprite.setAlpha) {
                    this.sprite.setAlpha(1);
                }
            }
            return;
        }
        
        // Check if we need to recreate visuals (first time, form changed, or direction changed for dino)
        const directionChanged = this.grimlockLastFacingRight !== undefined && 
                                 this.grimlockLastFacingRight !== this.facingRight;
        const needsRecreate = !this.grimlockVisuals || 
                             this.grimlockVisuals.length === 0 || 
                             this.grimlockCurrentForm !== this.grimlockForm ||
                             (this.grimlockForm === 'dinosaur' && directionChanged);
        
        if (needsRecreate) {
            this.grimlockCurrentForm = this.grimlockForm;
            this.grimlockLastFacingRight = this.facingRight;
            this.updateGrimlockVisuals();
        }
        
        // Update positions of all grimlock visual elements
        if (this.grimlockVisuals && this.grimlockVisuals.length > 0) {
            const px = this.sprite.x;
            const py = this.sprite.y;
            const dir = this.facingRight ? 1 : -1;
            
            if (this.grimlockForm === 'robot') {
                // Update robot parts positions
                if (this.grimlockChest) {
                    this.grimlockChest.x = px;
                    this.grimlockChest.y = py;
                }
                if (this.grimlockHead) {
                    this.grimlockHead.x = px;
                    this.grimlockHead.y = py - 20;
                }
                if (this.grimlockVisor) {
                    this.grimlockVisor.x = px;
                    this.grimlockVisor.y = py - 20;
                }
                if (this.grimlockLeftArm) {
                    this.grimlockLeftArm.x = px - 16;
                    this.grimlockLeftArm.y = py - 2;
                }
                if (this.grimlockRightArm) {
                    this.grimlockRightArm.x = px + 16;
                    this.grimlockRightArm.y = py - 2;
                }
                if (this.grimlockLeftLeg) {
                    this.grimlockLeftLeg.x = px - 7;
                    this.grimlockLeftLeg.y = py + 20;
                }
                if (this.grimlockRightLeg) {
                    this.grimlockRightLeg.x = px + 7;
                    this.grimlockRightLeg.y = py + 20;
                }
                if (this.grimlockLeftFoot) {
                    this.grimlockLeftFoot.x = px - 7;
                    this.grimlockLeftFoot.y = py + 30;
                }
                if (this.grimlockRightFoot) {
                    this.grimlockRightFoot.x = px + 7;
                    this.grimlockRightFoot.y = py + 30;
                }
            } else {
                // Update dinosaur parts positions
                if (this.grimlockBody) {
                    this.grimlockBody.x = px;
                    this.grimlockBody.y = py;
                }
                if (this.grimlockHead) {
                    this.grimlockHead.x = px + dir * 28;
                    this.grimlockHead.y = py - 8;
                }
                if (this.grimlockSnout) {
                    this.grimlockSnout.x = px + dir * 42;
                    this.grimlockSnout.y = py - 4;
                }
                if (this.grimlockEye) {
                    this.grimlockEye.x = px + dir * 26;
                    this.grimlockEye.y = py - 12;
                }
                if (this.grimlockPupil) {
                    this.grimlockPupil.x = px + dir * 27;
                    this.grimlockPupil.y = py - 12;
                }
                if (this.grimlockTail) {
                    this.grimlockTail.x = px - dir * 20;
                    this.grimlockTail.y = py;
                }
                if (this.grimlockLeftLeg) {
                    this.grimlockLeftLeg.x = px - 8;
                    this.grimlockLeftLeg.y = py + 22;
                }
                if (this.grimlockRightLeg) {
                    this.grimlockRightLeg.x = px + 8;
                    this.grimlockRightLeg.y = py + 22;
                }
                if (this.grimlockLeftFoot) {
                    this.grimlockLeftFoot.x = px - 8;
                    this.grimlockLeftFoot.y = py + 34;
                }
                if (this.grimlockRightFoot) {
                    this.grimlockRightFoot.x = px + 8;
                    this.grimlockRightFoot.y = py + 34;
                }
                if (this.grimlockSmallArm) {
                    this.grimlockSmallArm.x = px + dir * 12;
                    this.grimlockSmallArm.y = py + 2;
                }
                
                // Update teeth positions
                if (this.grimlockTeeth) {
                    for (let i = 0; i < this.grimlockTeeth.length; i++) {
                        const tooth = this.grimlockTeeth[i];
                        if (tooth && tooth.active) {
                            tooth.x = px + dir * (38 + i * 5);
                            tooth.y = py + 4;
                        }
                    }
                }
            }
        }
    }

    createGrimlockTransformEffect(towardsDino) {
        const x = this.sprite.x;
        const y = this.sprite.y;
        const colors = towardsDino 
            ? [0x808080, 0xff0000, 0xffd700] // Robot to Dino: grey, red, yellow
            : [0x696969, 0xcc0000, 0xdaa520]; // Dino to Robot: darker versions
        
        // Create energy ring expanding outward
        const ring = this.scene.add.circle(x, y, 20, colors[0], 0);
        ring.setStrokeStyle(4, colors[1]);
        ring.setDepth(100);
        
        this.scene.tweens.add({
            targets: ring,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 500,
            onComplete: () => ring.destroy()
        });
        
        // Create transformation particles
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particle = this.scene.add.circle(
                x,
                y,
                5 + Math.random() * 5,
                color,
                0.9
            );
            particle.setDepth(101);
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * (60 + Math.random() * 40),
                y: y + Math.sin(angle) * (60 + Math.random() * 40),
                alpha: 0,
                scale: 0,
                duration: 400 + Math.random() * 200,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
        
        // Add transformation text
        const transformText = this.scene.add.text(
            x, y - 50,
            towardsDino ? '🦖 DINO MODE!' : '🤖 ROBOT MODE!',
            {
                fontSize: '20px',
                fill: '#ffd700',
                stroke: '#000000',
                strokeThickness: 4,
                fontWeight: 'bold'
            }
        ).setOrigin(0.5).setDepth(102);
        
        this.scene.tweens.add({
            targets: transformText,
            y: y - 80,
            alpha: 0,
            duration: 1000,
            onComplete: () => transformText.destroy()
        });
        
        // Flash effect with Grimlock colors
        const flash = this.scene.add.rectangle(x, y, 60, 80, colors[2], 0.5);
        flash.setDepth(99);
        
        this.scene.tweens.add({
            targets: flash,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => flash.destroy()
        });
    }

    // ============================================
    // BUMBLEBEE TRANSFORMER (Car / Robot)
    // ============================================

    handleBumblebeeTransform() {
        if (!this.controls) return;
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'bumblebee') return;
        if (this.controls.isGrimlockTransform() && !this.previousInputs.grimlockTransform) {
            this.performBumblebeeTransform();
        }
    }

    performBumblebeeTransform() {
        if (this.bumblebeeTransformCooldown > 0) return;
        this.bumblebeeTransformCooldown = this.bumblebeeTransformCooldownTime;
        const costume = this.getDragonCostume();
        const wasRobot = this.bumblebeeForm === 'robot';
        this.bumblebeeForm = wasRobot ? 'car' : 'robot';
        this.createBumblebeeTransformEffect(wasRobot);
        if (this.bumblebeeForm === 'car') {
            this.speed = costume.carSpeed || 280;
            this.jumpPower = costume.carJump || 350;
            this.damageMultiplier = costume.carDamage || 0.8;
        } else {
            this.speed = costume.robotSpeed || 200;
            this.jumpPower = 600;
            this.damageMultiplier = costume.robotDamage || 1.0;
        }
        this.updateBumblebeeVisuals();
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(300, 0.02);
        }
    }

    updateBumblebeeVisuals() {
        if (this.bumblebeeVisuals && this.bumblebeeVisuals.length > 0) {
            this.bumblebeeVisuals.forEach(v => { if (v && v.destroy) v.destroy(); });
        }
        this.bumblebeeVisuals = [];
        if (this.bumblebeeForm === 'car') {
            this.createBumblebeeCarVisuals();
        } else {
            this.createBumblebeeRobotVisuals();
        }
    }

    createBumblebeeRobotVisuals() {
        const px = this.sprite.x;
        const py = this.sprite.y;
        // Yellow/black robot: chest, head, visor, arms, legs
        const chest = this.scene.add.rectangle(px, py, 24, 28, 0xffd700);
        chest.setStrokeStyle(2, 0x000000);
        chest.setDepth(51);
        this.bumblebeeVisuals.push(chest);
        this.bumblebeeChest = chest;
        const head = this.scene.add.rectangle(px, py - 20, 18, 14, 0xffd700);
        head.setStrokeStyle(2, 0x000000);
        head.setDepth(52);
        this.bumblebeeVisuals.push(head);
        this.bumblebeeHead = head;
        const visor = this.scene.add.rectangle(px, py - 20, 14, 4, 0x333333);
        visor.setDepth(53);
        this.bumblebeeVisuals.push(visor);
        this.bumblebeeVisor = visor;
        const leftArm = this.scene.add.rectangle(px - 16, py - 2, 8, 18, 0xffd700);
        leftArm.setStrokeStyle(1, 0x000000);
        leftArm.setDepth(50);
        this.bumblebeeVisuals.push(leftArm);
        this.bumblebeeLeftArm = leftArm;
        const rightArm = this.scene.add.rectangle(px + 16, py - 2, 8, 18, 0xffd700);
        rightArm.setStrokeStyle(1, 0x000000);
        rightArm.setDepth(50);
        this.bumblebeeVisuals.push(rightArm);
        this.bumblebeeRightArm = rightArm;
        const leftLeg = this.scene.add.rectangle(px - 7, py + 20, 10, 14, 0x333333);
        leftLeg.setStrokeStyle(1, 0xffd700);
        leftLeg.setDepth(50);
        this.bumblebeeVisuals.push(leftLeg);
        this.bumblebeeLeftLeg = leftLeg;
        const rightLeg = this.scene.add.rectangle(px + 7, py + 20, 10, 14, 0x333333);
        rightLeg.setStrokeStyle(1, 0xffd700);
        rightLeg.setDepth(50);
        this.bumblebeeVisuals.push(rightLeg);
        this.bumblebeeRightLeg = rightLeg;
        const leftFoot = this.scene.add.rectangle(px - 7, py + 30, 12, 6, 0x000000);
        leftFoot.setStrokeStyle(1, 0xffd700);
        leftFoot.setDepth(50);
        this.bumblebeeVisuals.push(leftFoot);
        this.bumblebeeLeftFoot = leftFoot;
        const rightFoot = this.scene.add.rectangle(px + 7, py + 30, 12, 6, 0x000000);
        rightFoot.setStrokeStyle(1, 0xffd700);
        rightFoot.setDepth(50);
        this.bumblebeeVisuals.push(rightFoot);
        this.bumblebeeRightFoot = rightFoot;
        if (this.sprite && this.sprite.setAlpha) this.sprite.setAlpha(0);
    }

    createBumblebeeCarVisuals() {
        const px = this.sprite.x;
        const py = this.sprite.y;
        const dir = this.facingRight ? 1 : -1;
        // Compact car: body (rounded rect), wheels, hood
        const body = this.scene.add.ellipse(px, py, 44, 22, 0xffd700);
        body.setStrokeStyle(2, 0x000000);
        body.setDepth(51);
        this.bumblebeeVisuals.push(body);
        this.bumblebeeBody = body;
        const hood = this.scene.add.ellipse(px + dir * 20, py - 2, 16, 12, 0xffcc00);
        hood.setStrokeStyle(2, 0x000000);
        hood.setDepth(52);
        this.bumblebeeVisuals.push(hood);
        this.bumblebeeHood = hood;
        const rear = this.scene.add.ellipse(px - dir * 20, py - 2, 14, 10, 0xffcc00);
        rear.setStrokeStyle(2, 0x000000);
        rear.setDepth(52);
        this.bumblebeeVisuals.push(rear);
        this.bumblebeeRear = rear;
        const wheel1 = this.scene.add.circle(px - dir * 18, py + 10, 8, 0x1a1a1a);
        wheel1.setStrokeStyle(2, 0x333333);
        wheel1.setDepth(50);
        this.bumblebeeVisuals.push(wheel1);
        this.bumblebeeWheel1 = wheel1;
        const wheel2 = this.scene.add.circle(px + dir * 18, py + 10, 8, 0x1a1a1a);
        wheel2.setStrokeStyle(2, 0x333333);
        wheel2.setDepth(50);
        this.bumblebeeVisuals.push(wheel2);
        this.bumblebeeWheel2 = wheel2;
        const stripe = this.scene.add.rectangle(px, py - 6, 36, 4, 0x000000);
        stripe.setDepth(51);
        this.bumblebeeVisuals.push(stripe);
        this.bumblebeeStripe = stripe;
        if (this.sprite && this.sprite.setAlpha) this.sprite.setAlpha(0);
    }

    createBumblebeeTransformEffect(towardsCar) {
        const x = this.sprite.x;
        const y = this.sprite.y;
        const colors = towardsCar ? [0xffd700, 0x000000, 0xffcc00] : [0xffcc00, 0x1a1a1a, 0xffd700];
        const ring = this.scene.add.circle(x, y, 20, colors[0], 0);
        ring.setStrokeStyle(4, colors[1]);
        ring.setDepth(100);
        this.scene.tweens.add({
            targets: ring,
            scaleX: 3, scaleY: 3, alpha: 0,
            duration: 500,
            onComplete: () => ring.destroy()
        });
        const transformText = this.scene.add.text(x, y - 50,
            towardsCar ? '🚗 CAR MODE!' : '🤖 ROBOT MODE!',
            { fontSize: '20px', fill: '#ffd700', stroke: '#000000', strokeThickness: 4, fontWeight: 'bold' }
        ).setOrigin(0.5).setDepth(102);
        this.scene.tweens.add({
            targets: transformText,
            y: y - 80, alpha: 0,
            duration: 1000,
            onComplete: () => transformText.destroy()
        });
    }

    updateBumblebeeVisualsIfNeeded() {
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'bumblebee') {
            if (this.bumblebeeVisuals && this.bumblebeeVisuals.length > 0) {
                this.bumblebeeVisuals.forEach(v => { if (v && v.destroy) v.destroy(); });
                this.bumblebeeVisuals = [];
                this.bumblebeeCurrentForm = null;
                if (this.sprite && this.sprite.setAlpha) this.sprite.setAlpha(1);
            }
            return;
        }
        const directionChanged = this.bumblebeeLastFacingRight !== undefined && this.bumblebeeLastFacingRight !== this.facingRight;
        const needsRecreate = !this.bumblebeeVisuals || this.bumblebeeVisuals.length === 0 ||
            this.bumblebeeCurrentForm !== this.bumblebeeForm ||
            (this.bumblebeeForm === 'car' && directionChanged);
        if (needsRecreate) {
            this.bumblebeeCurrentForm = this.bumblebeeForm;
            this.bumblebeeLastFacingRight = this.facingRight;
            this.updateBumblebeeVisuals();
        }
        const px = this.sprite.x;
        const py = this.sprite.y;
        const dir = this.facingRight ? 1 : -1;
        if (this.bumblebeeVisuals && this.bumblebeeVisuals.length > 0) {
            if (this.bumblebeeForm === 'robot') {
                if (this.bumblebeeChest) { this.bumblebeeChest.x = px; this.bumblebeeChest.y = py; }
                if (this.bumblebeeHead) { this.bumblebeeHead.x = px; this.bumblebeeHead.y = py - 20; }
                if (this.bumblebeeVisor) { this.bumblebeeVisor.x = px; this.bumblebeeVisor.y = py - 20; }
                if (this.bumblebeeLeftArm) { this.bumblebeeLeftArm.x = px - 16; this.bumblebeeLeftArm.y = py - 2; }
                if (this.bumblebeeRightArm) { this.bumblebeeRightArm.x = px + 16; this.bumblebeeRightArm.y = py - 2; }
                if (this.bumblebeeLeftLeg) { this.bumblebeeLeftLeg.x = px - 7; this.bumblebeeLeftLeg.y = py + 20; }
                if (this.bumblebeeRightLeg) { this.bumblebeeRightLeg.x = px + 7; this.bumblebeeRightLeg.y = py + 20; }
                if (this.bumblebeeLeftFoot) { this.bumblebeeLeftFoot.x = px - 7; this.bumblebeeLeftFoot.y = py + 30; }
                if (this.bumblebeeRightFoot) { this.bumblebeeRightFoot.x = px + 7; this.bumblebeeRightFoot.y = py + 30; }
            } else {
                if (this.bumblebeeBody) { this.bumblebeeBody.x = px; this.bumblebeeBody.y = py; }
                if (this.bumblebeeHood) { this.bumblebeeHood.x = px + dir * 20; this.bumblebeeHood.y = py - 2; }
                if (this.bumblebeeRear) { this.bumblebeeRear.x = px - dir * 20; this.bumblebeeRear.y = py - 2; }
                if (this.bumblebeeWheel1) { this.bumblebeeWheel1.x = px - dir * 18; this.bumblebeeWheel1.y = py + 10; }
                if (this.bumblebeeWheel2) { this.bumblebeeWheel2.x = px + dir * 18; this.bumblebeeWheel2.y = py + 10; }
                if (this.bumblebeeStripe) { this.bumblebeeStripe.x = px; this.bumblebeeStripe.y = py - 6; }
            }
        }
    }

    // ============================================
    // HOT ROD TRANSFORMER (Sports Car / Robot) - Unlocks after Level 2
    // ============================================

    handleHotrodTransform() {
        if (!this.controls) return;
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'hotrod') return;
        if (this.controls.isGrimlockTransform() && !this.previousInputs.grimlockTransform) {
            this.performHotrodTransform();
        }
    }

    performHotrodTransform() {
        if (this.hotrodTransformCooldown > 0) return;
        this.hotrodTransformCooldown = this.hotrodTransformCooldownTime;
        const costume = this.getDragonCostume();
        const wasRobot = this.hotrodForm === 'robot';
        this.hotrodForm = wasRobot ? 'car' : 'robot';
        this.createHotrodTransformEffect(wasRobot);
        if (this.hotrodForm === 'car') {
            this.speed = costume.carSpeed || 320;
            this.jumpPower = costume.carJump || 380;
            this.damageMultiplier = costume.carDamage || 0.9;
        } else {
            this.speed = costume.robotSpeed || 210;
            this.jumpPower = costume.robotJump || 420;
            this.damageMultiplier = costume.robotDamage || 1.0;
        }
        this.updateHotrodVisuals();
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(300, 0.02);
        }
    }

    handleHotrodLaughter() {
        if (!this.controls) return;
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'hotrod') return;
        const costume = this.getDragonCostume();
        if (!costume.laughterPowerEnabled) return;
        if (this.controls.isDuckLaser() && !this.previousInputs.duckLaser) {
            this.performHotrodLaughter();
        }
    }

    performHotrodLaughter() {
        if (this.hotrodLaughterCooldown > 0) return;
        const costume = this.getDragonCostume();
        this.hotrodLaughterCooldown = costume.laughterCooldown || this.hotrodLaughterCooldownTime;
        const range = costume.laughterRange || 280;
        const stunDuration = costume.laughterStunDuration || 2500;
        const px = this.sprite.x;
        const py = this.sprite.y;
        if (this.scene.enemies) {
            this.scene.enemies.getChildren().forEach(enemySprite => {
                const enemy = enemySprite.getData ? enemySprite.getData('enemy') : null;
                if (!enemy || enemy.health <= 0) return;
                if (!enemy.sprite) return;
                const dist = Phaser.Math.Distance.Between(px, py, enemy.sprite.x, enemy.sprite.y);
                if (dist > range) return;
                if (typeof enemy.applySonicStun === 'function') {
                    enemy.applySonicStun(stunDuration);
                } else if (typeof enemy.changeState === 'function') {
                    enemy.pendingStunDuration = stunDuration;
                    enemy.changeState('stunned');
                }
            });
        }
        this.createHotrodLaughterEffect();
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(400, 0.03);
        }
    }

    createHotrodLaughterEffect() {
        const x = this.sprite.x;
        const y = this.sprite.y - 20;
        for (let i = 0; i < 3; i++) {
            const ring = this.scene.add.circle(x, y, 30 + i * 25, 0xffd700, 0);
            ring.setStrokeStyle(3, 0xe63946);
            ring.setDepth(100);
            this.scene.tweens.add({
                targets: ring,
                scaleX: 2.5,
                scaleY: 2.5,
                alpha: 0.5,
                duration: 200,
                delay: i * 80,
                yoyo: true,
                hold: 100,
                onComplete: () => ring.destroy()
            });
        }
        const laughText = this.scene.add.text(x, y - 45, 'HA HA HA!',
            { fontSize: '24px', fill: '#ffd700', stroke: '#e63946', strokeThickness: 4, fontWeight: 'bold' }
        ).setOrigin(0.5).setDepth(102);
        this.scene.tweens.add({
            targets: laughText,
            y: y - 70,
            alpha: 0,
            duration: 1200,
            onComplete: () => laughText.destroy()
        });
    }

    updateHotrodVisuals() {
        if (this.hotrodVisuals && this.hotrodVisuals.length > 0) {
            this.hotrodVisuals.forEach(v => { if (v && v.destroy) v.destroy(); });
        }
        this.hotrodVisuals = [];
        if (this.hotrodForm === 'car') {
            this.createHotrodCarVisuals();
        } else {
            this.createHotrodRobotVisuals();
        }
    }

    createHotrodRobotVisuals() {
        const px = this.sprite.x;
        const py = this.sprite.y;
        const red = 0xe63946;
        const silver = 0xc0c0c0;
        const dark = 0x333333;
        const chest = this.scene.add.rectangle(px, py, 24, 28, red);
        chest.setStrokeStyle(2, dark);
        chest.setDepth(51);
        this.hotrodVisuals.push(chest);
        this.hotrodChest = chest;
        const head = this.scene.add.rectangle(px, py - 20, 18, 14, silver);
        head.setStrokeStyle(2, dark);
        head.setDepth(52);
        this.hotrodVisuals.push(head);
        this.hotrodHead = head;
        const visor = this.scene.add.rectangle(px, py - 20, 14, 4, 0x1a1a1a);
        visor.setDepth(53);
        this.hotrodVisuals.push(visor);
        this.hotrodVisor = visor;
        const leftArm = this.scene.add.rectangle(px - 16, py - 2, 8, 18, red);
        leftArm.setStrokeStyle(1, dark);
        leftArm.setDepth(50);
        this.hotrodVisuals.push(leftArm);
        this.hotrodLeftArm = leftArm;
        const rightArm = this.scene.add.rectangle(px + 16, py - 2, 8, 18, red);
        rightArm.setStrokeStyle(1, dark);
        rightArm.setDepth(50);
        this.hotrodVisuals.push(rightArm);
        this.hotrodRightArm = rightArm;
        const leftLeg = this.scene.add.rectangle(px - 7, py + 20, 10, 14, silver);
        leftLeg.setStrokeStyle(1, red);
        leftLeg.setDepth(50);
        this.hotrodVisuals.push(leftLeg);
        this.hotrodLeftLeg = leftLeg;
        const rightLeg = this.scene.add.rectangle(px + 7, py + 20, 10, 14, silver);
        rightLeg.setStrokeStyle(1, red);
        rightLeg.setDepth(50);
        this.hotrodVisuals.push(rightLeg);
        this.hotrodRightLeg = rightLeg;
        const leftFoot = this.scene.add.rectangle(px - 7, py + 30, 12, 6, dark);
        leftFoot.setStrokeStyle(1, red);
        leftFoot.setDepth(50);
        this.hotrodVisuals.push(leftFoot);
        this.hotrodLeftFoot = leftFoot;
        const rightFoot = this.scene.add.rectangle(px + 7, py + 30, 12, 6, dark);
        rightFoot.setStrokeStyle(1, red);
        rightFoot.setDepth(50);
        this.hotrodVisuals.push(rightFoot);
        this.hotrodRightFoot = rightFoot;
        if (this.sprite && this.sprite.setAlpha) this.sprite.setAlpha(0);
    }

    createHotrodCarVisuals() {
        const px = this.sprite.x;
        const py = this.sprite.y;
        const dir = this.facingRight ? 1 : -1;
        const red = 0xe63946;
        const silver = 0xc0c0c0;
        const dark = 0x2d2d2d;
        const body = this.scene.add.ellipse(px, py, 52, 20, red);
        body.setStrokeStyle(2, dark);
        body.setDepth(51);
        this.hotrodVisuals.push(body);
        this.hotrodBody = body;
        const hood = this.scene.add.ellipse(px + dir * 22, py - 4, 18, 12, 0xcc3333);
        hood.setStrokeStyle(1, dark);
        hood.setDepth(52);
        this.hotrodVisuals.push(hood);
        this.hotrodHood = hood;
        const rear = this.scene.add.ellipse(px - dir * 22, py - 2, 14, 10, silver);
        rear.setStrokeStyle(1, dark);
        rear.setDepth(52);
        this.hotrodVisuals.push(rear);
        this.hotrodRear = rear;
        const wheel1 = this.scene.add.circle(px - dir * 20, py + 10, 10, dark);
        wheel1.setStrokeStyle(2, silver);
        wheel1.setDepth(50);
        this.hotrodVisuals.push(wheel1);
        this.hotrodWheel1 = wheel1;
        const wheel2 = this.scene.add.circle(px + dir * 20, py + 10, 10, dark);
        wheel2.setStrokeStyle(2, silver);
        wheel2.setDepth(50);
        this.hotrodVisuals.push(wheel2);
        this.hotrodWheel2 = wheel2;
        const stripe = this.scene.add.rectangle(px, py - 4, 36, 4, silver);
        stripe.setDepth(53);
        this.hotrodVisuals.push(stripe);
        this.hotrodStripe = stripe;
        if (this.sprite && this.sprite.setAlpha) this.sprite.setAlpha(0);
    }

    createHotrodTransformEffect(towardsCar) {
        const x = this.sprite.x;
        const y = this.sprite.y;
        const colors = towardsCar ? [0xe63946, 0x2d2d2d, 0xc0c0c0] : [0xc0c0c0, 0x2d2d2d, 0xe63946];
        const ring = this.scene.add.circle(x, y, 20, colors[0], 0);
        ring.setStrokeStyle(4, colors[1]);
        ring.setDepth(100);
        this.scene.tweens.add({
            targets: ring,
            scaleX: 3, scaleY: 3, alpha: 0,
            duration: 500,
            onComplete: () => ring.destroy()
        });
        const transformText = this.scene.add.text(x, y - 50,
            towardsCar ? '🏎️ CAR MODE!' : '🤖 ROBOT MODE!',
            { fontSize: '20px', fill: '#e63946', stroke: '#1a1a1a', strokeThickness: 4, fontWeight: 'bold' }
        ).setOrigin(0.5).setDepth(102);
        this.scene.tweens.add({
            targets: transformText,
            y: y - 80, alpha: 0,
            duration: 1000,
            onComplete: () => transformText.destroy()
        });
    }

    updateHotrodVisualsIfNeeded() {
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'hotrod') {
            if (this.hotrodVisuals && this.hotrodVisuals.length > 0) {
                this.hotrodVisuals.forEach(v => { if (v && v.destroy) v.destroy(); });
                this.hotrodVisuals = [];
                this.hotrodCurrentForm = null;
                if (this.sprite && this.sprite.setAlpha) this.sprite.setAlpha(1);
            }
            return;
        }
        const directionChanged = this.hotrodLastFacingRight !== undefined && this.hotrodLastFacingRight !== this.facingRight;
        const needsRecreate = !this.hotrodVisuals || this.hotrodVisuals.length === 0 ||
            this.hotrodCurrentForm !== this.hotrodForm ||
            (this.hotrodForm === 'car' && directionChanged);
        if (needsRecreate) {
            this.hotrodCurrentForm = this.hotrodForm;
            this.hotrodLastFacingRight = this.facingRight;
            this.updateHotrodVisuals();
        }
        const px = this.sprite.x;
        const py = this.sprite.y;
        const dir = this.facingRight ? 1 : -1;
        if (this.hotrodVisuals && this.hotrodVisuals.length > 0) {
            if (this.hotrodForm === 'robot') {
                if (this.hotrodChest) { this.hotrodChest.x = px; this.hotrodChest.y = py; }
                if (this.hotrodHead) { this.hotrodHead.x = px; this.hotrodHead.y = py - 20; }
                if (this.hotrodVisor) { this.hotrodVisor.x = px; this.hotrodVisor.y = py - 20; }
                if (this.hotrodLeftArm) { this.hotrodLeftArm.x = px - 16; this.hotrodLeftArm.y = py - 2; }
                if (this.hotrodRightArm) { this.hotrodRightArm.x = px + 16; this.hotrodRightArm.y = py - 2; }
                if (this.hotrodLeftLeg) { this.hotrodLeftLeg.x = px - 7; this.hotrodLeftLeg.y = py + 20; }
                if (this.hotrodRightLeg) { this.hotrodRightLeg.x = px + 7; this.hotrodRightLeg.y = py + 20; }
                if (this.hotrodLeftFoot) { this.hotrodLeftFoot.x = px - 7; this.hotrodLeftFoot.y = py + 30; }
                if (this.hotrodRightFoot) { this.hotrodRightFoot.x = px + 7; this.hotrodRightFoot.y = py + 30; }
            } else {
                if (this.hotrodBody) { this.hotrodBody.x = px; this.hotrodBody.y = py; }
                if (this.hotrodHood) { this.hotrodHood.x = px + dir * 22; this.hotrodHood.y = py - 4; }
                if (this.hotrodRear) { this.hotrodRear.x = px - dir * 22; this.hotrodRear.y = py - 2; }
                if (this.hotrodWheel1) { this.hotrodWheel1.x = px - dir * 20; this.hotrodWheel1.y = py + 10; }
                if (this.hotrodWheel2) { this.hotrodWheel2.x = px + dir * 20; this.hotrodWheel2.y = py + 10; }
                if (this.hotrodStripe) { this.hotrodStripe.x = px; this.hotrodStripe.y = py - 4; }
            }
        }
    }

    // ============================================
    // ELITA TRANSFORMER (Motorcycle / Robot) - Guns shoot dog bullets, no lasers
    // ============================================

    handleElitaTransform() {
        if (!this.controls) return;
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'elita') return;
        if (this.controls.isGrimlockTransform() && !this.previousInputs.grimlockTransform) {
            this.performElitaTransform();
        }
    }

    performElitaTransform() {
        if (this.elitaTransformCooldown > 0) return;
        this.elitaTransformCooldown = this.elitaTransformCooldownTime;
        const costume = this.getDragonCostume();
        const wasRobot = this.elitaForm === 'robot';
        this.elitaForm = wasRobot ? 'bike' : 'robot';
        this.createElitaTransformEffect(wasRobot);
        if (this.elitaForm === 'bike') {
            this.speed = costume.bikeSpeed || 300;
            this.jumpPower = costume.bikeJump || 360;
            this.damageMultiplier = costume.bikeDamage || 0.95;
        } else {
            this.speed = costume.robotSpeed || 205;
            this.jumpPower = costume.robotJump || 430;
            this.damageMultiplier = costume.robotDamage || 1.0;
        }
        this.updateElitaVisuals();
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(300, 0.02);
        }
    }

    updateElitaVisuals() {
        if (this.elitaVisuals && this.elitaVisuals.length > 0) {
            this.elitaVisuals.forEach(v => { if (v && v.destroy) v.destroy(); });
        }
        this.elitaVisuals = [];
        if (this.elitaForm === 'bike') {
            this.createElitaBikeVisuals();
        } else {
            this.createElitaRobotVisuals();
        }
    }

    createElitaRobotVisuals() {
        const px = this.sprite.x;
        const py = this.sprite.y;
        const pink = 0xe91e8c;
        const white = 0xffffff;
        const dark = 0x4a148c;
        const chest = this.scene.add.rectangle(px, py, 24, 28, pink);
        chest.setStrokeStyle(2, dark);
        chest.setDepth(51);
        this.elitaVisuals.push(chest);
        this.elitaChest = chest;
        const head = this.scene.add.rectangle(px, py - 20, 18, 14, white);
        head.setStrokeStyle(2, dark);
        head.setDepth(52);
        this.elitaVisuals.push(head);
        this.elitaHead = head;
        const visor = this.scene.add.rectangle(px, py - 20, 14, 4, 0x2d2d2d);
        visor.setDepth(53);
        this.elitaVisuals.push(visor);
        this.elitaVisor = visor;
        const leftArm = this.scene.add.rectangle(px - 16, py - 2, 8, 18, pink);
        leftArm.setStrokeStyle(1, dark);
        leftArm.setDepth(50);
        this.elitaVisuals.push(leftArm);
        this.elitaLeftArm = leftArm;
        const rightArm = this.scene.add.rectangle(px + 16, py - 2, 8, 18, pink);
        rightArm.setStrokeStyle(1, dark);
        rightArm.setDepth(50);
        this.elitaVisuals.push(rightArm);
        this.elitaRightArm = rightArm;
        const leftLeg = this.scene.add.rectangle(px - 7, py + 20, 10, 14, white);
        leftLeg.setStrokeStyle(1, pink);
        leftLeg.setDepth(50);
        this.elitaVisuals.push(leftLeg);
        this.elitaLeftLeg = leftLeg;
        const rightLeg = this.scene.add.rectangle(px + 7, py + 20, 10, 14, white);
        rightLeg.setStrokeStyle(1, pink);
        rightLeg.setDepth(50);
        this.elitaVisuals.push(rightLeg);
        this.elitaRightLeg = rightLeg;
        const leftFoot = this.scene.add.rectangle(px - 7, py + 30, 12, 6, dark);
        leftFoot.setStrokeStyle(1, pink);
        leftFoot.setDepth(50);
        this.elitaVisuals.push(leftFoot);
        this.elitaLeftFoot = leftFoot;
        const rightFoot = this.scene.add.rectangle(px + 7, py + 30, 12, 6, dark);
        rightFoot.setStrokeStyle(1, pink);
        rightFoot.setDepth(50);
        this.elitaVisuals.push(rightFoot);
        this.elitaRightFoot = rightFoot;
        if (this.sprite && this.sprite.setAlpha) this.sprite.setAlpha(0);
    }

    createElitaBikeVisuals() {
        const px = this.sprite.x;
        const py = this.sprite.y;
        const dir = this.facingRight ? 1 : -1;
        const pink = 0xe91e8c;
        const dark = 0x2d2d2d;
        const body = this.scene.add.rectangle(px, py, 48, 14, pink);
        body.setStrokeStyle(2, dark);
        body.setDepth(51);
        this.elitaVisuals.push(body);
        this.elitaBody = body;
        const seat = this.scene.add.ellipse(px, py - 4, 16, 8, 0xc2185b);
        seat.setStrokeStyle(1, dark);
        seat.setDepth(52);
        this.elitaVisuals.push(seat);
        this.elitaSeat = seat;
        const wheel1 = this.scene.add.circle(px - dir * 22, py + 8, 12, dark);
        wheel1.setStrokeStyle(2, 0x888888);
        wheel1.setDepth(50);
        this.elitaVisuals.push(wheel1);
        this.elitaWheel1 = wheel1;
        const wheel2 = this.scene.add.circle(px + dir * 22, py + 8, 12, dark);
        wheel2.setStrokeStyle(2, 0x888888);
        wheel2.setDepth(50);
        this.elitaVisuals.push(wheel2);
        this.elitaWheel2 = wheel2;
        const stripe = this.scene.add.rectangle(px, py - 2, 32, 3, 0xffffff);
        stripe.setDepth(53);
        this.elitaVisuals.push(stripe);
        this.elitaStripe = stripe;
        if (this.sprite && this.sprite.setAlpha) this.sprite.setAlpha(0);
    }

    createElitaTransformEffect(towardsBike) {
        const x = this.sprite.x;
        const y = this.sprite.y;
        const colors = towardsBike ? [0xe91e8c, 0x4a148c, 0xffffff] : [0xffffff, 0x4a148c, 0xe91e8c];
        const ring = this.scene.add.circle(x, y, 20, colors[0], 0);
        ring.setStrokeStyle(4, colors[1]);
        ring.setDepth(100);
        this.scene.tweens.add({
            targets: ring,
            scaleX: 3, scaleY: 3, alpha: 0,
            duration: 500,
            onComplete: () => ring.destroy()
        });
        const transformText = this.scene.add.text(x, y - 50,
            towardsBike ? '🏍️ BIKE MODE!' : '🤖 ROBOT MODE!',
            { fontSize: '20px', fill: '#e91e8c', stroke: '#4a148c', strokeThickness: 4, fontWeight: 'bold' }
        ).setOrigin(0.5).setDepth(102);
        this.scene.tweens.add({
            targets: transformText,
            y: y - 80, alpha: 0,
            duration: 1000,
            onComplete: () => transformText.destroy()
        });
    }

    updateElitaVisualsIfNeeded() {
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'elita') {
            if (this.elitaVisuals && this.elitaVisuals.length > 0) {
                this.elitaVisuals.forEach(v => { if (v && v.destroy) v.destroy(); });
                this.elitaVisuals = [];
                this.elitaCurrentForm = null;
                if (this.sprite && this.sprite.setAlpha) this.sprite.setAlpha(1);
            }
            return;
        }
        const directionChanged = this.elitaLastFacingRight !== undefined && this.elitaLastFacingRight !== this.facingRight;
        const needsRecreate = !this.elitaVisuals || this.elitaVisuals.length === 0 ||
            this.elitaCurrentForm !== this.elitaForm ||
            (this.elitaForm === 'bike' && directionChanged);
        if (needsRecreate) {
            this.elitaCurrentForm = this.elitaForm;
            this.elitaLastFacingRight = this.facingRight;
            this.updateElitaVisuals();
        }
        const px = this.sprite.x;
        const py = this.sprite.y;
        const dir = this.facingRight ? 1 : -1;
        if (this.elitaVisuals && this.elitaVisuals.length > 0) {
            if (this.elitaForm === 'robot') {
                if (this.elitaChest) { this.elitaChest.x = px; this.elitaChest.y = py; }
                if (this.elitaHead) { this.elitaHead.x = px; this.elitaHead.y = py - 20; }
                if (this.elitaVisor) { this.elitaVisor.x = px; this.elitaVisor.y = py - 20; }
                if (this.elitaLeftArm) { this.elitaLeftArm.x = px - 16; this.elitaLeftArm.y = py - 2; }
                if (this.elitaRightArm) { this.elitaRightArm.x = px + 16; this.elitaRightArm.y = py - 2; }
                if (this.elitaLeftLeg) { this.elitaLeftLeg.x = px - 7; this.elitaLeftLeg.y = py + 20; }
                if (this.elitaRightLeg) { this.elitaRightLeg.x = px + 7; this.elitaRightLeg.y = py + 20; }
                if (this.elitaLeftFoot) { this.elitaLeftFoot.x = px - 7; this.elitaLeftFoot.y = py + 30; }
                if (this.elitaRightFoot) { this.elitaRightFoot.x = px + 7; this.elitaRightFoot.y = py + 30; }
            } else {
                if (this.elitaBody) { this.elitaBody.x = px; this.elitaBody.y = py; }
                if (this.elitaSeat) { this.elitaSeat.x = px; this.elitaSeat.y = py - 4; }
                if (this.elitaWheel1) { this.elitaWheel1.x = px - dir * 22; this.elitaWheel1.y = py + 8; }
                if (this.elitaWheel2) { this.elitaWheel2.x = px + dir * 22; this.elitaWheel2.y = py + 8; }
                if (this.elitaStripe) { this.elitaStripe.x = px; this.elitaStripe.y = py - 2; }
            }
        }
    }

    // ============================================
    // BMW BOUNCER TRANSFORMER (BMW CSL 3.0 M / Robot) - Trampolines + Nets + Bounce Slam
    // ============================================

    // BMW Bouncer transform is now handled by the shared Transformer strategy
    // (see js/entities/transformers/BMWBouncerTransformer.js). This method only
    // routes the transform key into the active Transformer instance — all
    // cooldown, form-state, visual rebuild, and stat-change logic lives in the
    // base + bmwBouncerConfig.
    handleBmwBouncerTransform() {
        if (!this.controls) return;
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'bmwBouncer') return;
        if (!this.transformer) return;
        if (this.controls.isGrimlockTransform() && !this.previousInputs.grimlockTransform) {
            this.transformer.tryToggle();
        }
    }

    // ============================================
    // PORTAL BOT TRANSFORMER (Robot / Dragon)
    // ============================================

    handlePortalbotTransform() {
        if (!this.controls) return;
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'portalbot') return;
        if (this.controls.isGrimlockTransform() && !this.previousInputs.grimlockTransform) {
            this.performPortalbotTransform();
        }
    }

    // ============================================
    // VIBECODER TRANSFORMER (Robot / Computer)
    // ============================================

    // VibeCoder transform is handled by the shared Transformer strategy
    // (see js/entities/transformers/VibeCoderTransformer.js). This method
    // routes the V-key into the active Transformer instance — all cooldown,
    // form-state, visual rebuild, and stat-change logic lives in the base +
    // vibeCoderConfig.
    handleVibeCoderTransform() {
        if (!this.controls) return;
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'vibeCoder') return;
        if (!this.transformer) return;
        const pressed = (typeof this.controls.isVibeCoderTransform === 'function')
            ? this.controls.isVibeCoderTransform()
            : false;
        if (pressed && !this.previousInputs.vibeCoderTransform) {
            this.transformer.tryToggle();
        }
    }

    // VIBECODER SPAWN KEYS (1 = chicken, 2 = duck, 3 = doghouse while in computer form)
    // ==================================================================================
    handleVibeCoderSpawns() {
        if (!this.controls) return;
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'vibeCoder') return;
        if (!this.transformer) return;
        if (this.transformer.currentForm() !== 'computer') return;

        // Edge-detect keys 1/2/3 (Digit1, Digit2, Digit3)
        const k1 = !!(this.controls.keys && this.controls.keys['Digit1']);
        const k2 = !!(this.controls.keys && this.controls.keys['Digit2']);
        const k3 = !!(this.controls.keys && this.controls.keys['Digit3']);

        if (k1 && !this.previousInputs.vibeSpawn1) {
            this.spawnVibeAlly('chicken', this.sprite.x, this.sprite.y);
        }
        if (k2 && !this.previousInputs.vibeSpawn2) {
            this.spawnVibeAlly('duck', this.sprite.x, this.sprite.y);
        }
        if (k3 && !this.previousInputs.vibeSpawn3) {
            this.spawnVibeAlly('doghouse', this.sprite.x, this.sprite.y);
        }
    }

    // VIBECODER CHARM ABILITY (X = hypnotize nearby enemies while in computer form)
    // ============================================================================
    // R4.1 / R4.6: Only triggers in computer form. Cooldown is tracked on the
    // transformer instance (transformer.charmCooldownMs). Uses KeyX (same key as
    // kick; kick is a no-op in computer form so there is no conflict).
    handleVibeCoderCharm() {
        if (!this.controls) return;
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'vibeCoder') return;
        if (!this.transformer) return;
        if (this.transformer.currentForm() !== 'computer') return; // R4.6 — robot form: no charm

        const pressed = !!(this.controls.keys && this.controls.keys['KeyX']);
        if (pressed && !this.previousInputs.vibeCharm) {
            // R4.1 — only trigger if cooldown is expired
            if (typeof this.transformer.charmCooldownMs === 'number' && this.transformer.charmCooldownMs <= 0) {
                if (typeof this.transformer.triggerCharm === 'function') {
                    this.transformer.triggerCharm();
                }
            }
        }
    }

    /**
     * Spawn a VibeSpawn ally of the given type at (x, y).
     * Enforces the 6-ally global cap.
     * Dog-house-emitted dogs also pass through here so the cap is shared.
     *
     * @param {'chicken'|'duck'|'dog'|'doghouse'} type
     * @param {number} x
     * @param {number} y
     * @returns {VibeSpawn|null}
     */
    spawnVibeAlly(type, x, y) {
        // Prune dead spawns first
        this.vibeSpawns = this.vibeSpawns.filter(s => s && s.alive);

        const MAX_SPAWNS = 6;
        if (this.vibeSpawns.length >= MAX_SPAWNS) {
            // Cap reached — silently ignore
            return null;
        }

        const VibeSpawnCtor = (typeof window !== 'undefined' && window.VibeSpawn)
            || (typeof VibeSpawn !== 'undefined' ? VibeSpawn : null);
        if (!VibeSpawnCtor) {
            console.error('spawnVibeAlly: VibeSpawn class not loaded');
            return null;
        }

        let spawn;
        try {
            spawn = new VibeSpawnCtor(this.scene, x, y, type);
        } catch (e) {
            console.error('spawnVibeAlly: failed to create VibeSpawn', type, e);
            return null;
        }

        this.vibeSpawns.push(spawn);
        return spawn;
    }

    /**
     * Despawn all active VibeSpawns.
     * Called on transform back to robot and on scene shutdown.
     */
    cleanupVibeSpawns() {
        if (!this.vibeSpawns) return;
        this.vibeSpawns.forEach(s => {
            if (s && typeof s.despawn === 'function') {
                try { s.despawn(); } catch (e) { /* noop */ }
            }
        });
        this.vibeSpawns = [];
    }

    /**
     * Per-frame tick for all active VibeSpawn instances.
     * Also prunes dead spawns from the array.
     * @param {number} delta
     */
    _updateVibeSpawns(delta) {
        if (!this.vibeSpawns || this.vibeSpawns.length === 0) return;
        const dt = (typeof delta === 'number') ? delta : 16;
        for (let i = this.vibeSpawns.length - 1; i >= 0; i--) {
            const s = this.vibeSpawns[i];
            if (!s || !s.alive) {
                this.vibeSpawns.splice(i, 1);
                continue;
            }
            try { s.update(dt); } catch (e) { /* noop */ }
        }
    }

    performPortalbotTransform() {
        if (this.portalbotTransformCooldown > 0) return;
        this.portalbotTransformCooldown = this.portalbotTransformCooldownTime;
        const costume = this.getDragonCostume();
        const wasRobot = this.portalbotForm === 'robot';
        this.portalbotForm = wasRobot ? 'dragon' : 'robot';
        this.createPortalbotTransformEffect(wasRobot);
        if (this.portalbotForm === 'dragon') {
            this.speed = costume.dragonSpeed || 170;
            this.jumpPower = costume.dragonJump || 350;
            this.damageMultiplier = costume.dragonDamage || 1.4;
        } else {
            this.speed = costume.robotSpeed || 200;
            this.jumpPower = costume.robotJump || 420;
            this.damageMultiplier = costume.robotDamage || 1.0;
        }
        this.updatePortalbotVisuals();
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(300, 0.02);
        }
    }

    // BMW Bouncer visuals are owned by BMWBouncerTransformer (the
    // shared Transformer strategy). The legacy createBmwBouncer*Visuals,
    // updateBmwBouncerVisuals, and createBmwBouncerTransformEffect helpers
    // were intentionally removed here as part of R1.4–R1.6.

    updatePortalbotVisuals() {
        if (this.portalbotVisuals && this.portalbotVisuals.length > 0) {
            this.portalbotVisuals.forEach(v => { if (v && v.destroy) v.destroy(); });
        }
        this.portalbotVisuals = [];
        if (this.portalbotForm === 'dragon') {
            this.createPortalbotDragonVisuals();
        } else {
            this.createPortalbotRobotVisuals();
        }
    }

    createPortalbotRobotVisuals() {
        const px = this.sprite.x;
        const py = this.sprite.y;
        const purple = 0x7b1fa2;
        const cyan = 0x00e5ff;
        const silver = 0xb0bec5;

        // Robot chest (metallic purple)
        const chest = this.scene.add.rectangle(px, py, 24, 28, purple);
        chest.setStrokeStyle(2, cyan);
        chest.setDepth(51);
        this.portalbotVisuals.push(chest);
        this.portalbotChest = chest;

        // Robot head (silver with cyan visor)
        const head = this.scene.add.rectangle(px, py - 20, 18, 14, silver);
        head.setStrokeStyle(2, purple);
        head.setDepth(52);
        this.portalbotVisuals.push(head);
        this.portalbotHead = head;

        // Visor (glowing cyan)
        const visor = this.scene.add.rectangle(px, py - 20, 14, 4, cyan);
        visor.setDepth(53);
        this.portalbotVisuals.push(visor);
        this.portalbotVisor = visor;

        // Portal core on chest (small swirl indicator)
        const core = this.scene.add.circle(px, py, 5, cyan, 0.8);
        core.setDepth(53);
        this.portalbotVisuals.push(core);
        this.portalbotCore = core;

        // Arms (silver with purple accents)
        const leftArm = this.scene.add.rectangle(px - 16, py - 2, 8, 18, silver);
        leftArm.setStrokeStyle(1, purple);
        leftArm.setDepth(50);
        this.portalbotVisuals.push(leftArm);
        this.portalbotLeftArm = leftArm;

        const rightArm = this.scene.add.rectangle(px + 16, py - 2, 8, 18, silver);
        rightArm.setStrokeStyle(1, purple);
        rightArm.setDepth(50);
        this.portalbotVisuals.push(rightArm);
        this.portalbotRightArm = rightArm;

        // Legs
        const leftLeg = this.scene.add.rectangle(px - 7, py + 20, 10, 14, 0x4a148c);
        leftLeg.setStrokeStyle(1, cyan);
        leftLeg.setDepth(50);
        this.portalbotVisuals.push(leftLeg);
        this.portalbotLeftLeg = leftLeg;

        const rightLeg = this.scene.add.rectangle(px + 7, py + 20, 10, 14, 0x4a148c);
        rightLeg.setStrokeStyle(1, cyan);
        rightLeg.setDepth(50);
        this.portalbotVisuals.push(rightLeg);
        this.portalbotRightLeg = rightLeg;

        // Feet
        const leftFoot = this.scene.add.rectangle(px - 7, py + 30, 12, 6, purple);
        leftFoot.setStrokeStyle(1, cyan);
        leftFoot.setDepth(50);
        this.portalbotVisuals.push(leftFoot);
        this.portalbotLeftFoot = leftFoot;

        const rightFoot = this.scene.add.rectangle(px + 7, py + 30, 12, 6, purple);
        rightFoot.setStrokeStyle(1, cyan);
        rightFoot.setDepth(50);
        this.portalbotVisuals.push(rightFoot);
        this.portalbotRightFoot = rightFoot;

        if (this.sprite && this.sprite.setAlpha) this.sprite.setAlpha(0);
    }

    createPortalbotDragonVisuals() {
        const px = this.sprite.x;
        const py = this.sprite.y;
        const dir = this.facingRight ? 1 : -1;
        const purple = 0x7b1fa2;
        const cyan = 0x00e5ff;
        const magenta = 0xe040fb;

        // Dragon body (large, purple scaled)
        const body = this.scene.add.ellipse(px, py, 36, 24, purple, 0.9);
        body.setStrokeStyle(2, cyan);
        body.setDepth(51);
        this.portalbotVisuals.push(body);
        this.portalbotBody = body;

        // Dragon head (elongated snout facing direction)
        const head = this.scene.add.ellipse(px + dir * 20, py - 10, 22, 16, purple, 0.95);
        head.setStrokeStyle(2, magenta);
        head.setDepth(52);
        this.portalbotVisuals.push(head);
        this.portalbotDragonHead = head;

        // Glowing portal eye
        const eye = this.scene.add.circle(px + dir * 24, py - 14, 4, cyan, 1);
        eye.setDepth(53);
        this.portalbotVisuals.push(eye);
        this.portalbotEye = eye;

        // Snout
        const snout = this.scene.add.ellipse(px + dir * 32, py - 8, 12, 8, 0x6a1b9a, 0.9);
        snout.setStrokeStyle(1, cyan);
        snout.setDepth(52);
        this.portalbotVisuals.push(snout);
        this.portalbotSnout = snout;

        // Dragon teeth
        for (let i = 0; i < 3; i++) {
            const tooth = this.scene.add.triangle(
                px + dir * (28 + i * 4), py - 3,
                0, 0, 3, 6, -3, 6,
                0xffffff, 0.9
            );
            tooth.setDepth(53);
            this.portalbotVisuals.push(tooth);
        }

        // Tail with portal swirl at the tip
        const tail = this.scene.add.ellipse(px - dir * 24, py + 2, 20, 8, 0x6a1b9a, 0.85);
        tail.setStrokeStyle(1, purple);
        tail.setDepth(50);
        this.portalbotVisuals.push(tail);
        this.portalbotTail = tail;

        // Portal swirl on tail tip
        const tailSwirl = this.scene.add.circle(px - dir * 34, py + 2, 6, cyan, 0.7);
        tailSwirl.setStrokeStyle(2, magenta);
        tailSwirl.setDepth(51);
        this.portalbotVisuals.push(tailSwirl);
        this.portalbotTailSwirl = tailSwirl;

        // Dragon wings (larger, mechanical-portal style)
        const wing1 = this.scene.add.triangle(
            px - dir * 4, py - 18,
            0, 0, -dir * 20, -16, -dir * 8, 8,
            cyan, 0.6
        );
        wing1.setStrokeStyle(2, purple);
        wing1.setDepth(49);
        this.portalbotVisuals.push(wing1);
        this.portalbotWing1 = wing1;

        const wing2 = this.scene.add.triangle(
            px - dir * 8, py - 14,
            0, 0, -dir * 16, -12, -dir * 6, 6,
            magenta, 0.4
        );
        wing2.setStrokeStyle(1, cyan);
        wing2.setDepth(48);
        this.portalbotVisuals.push(wing2);
        this.portalbotWing2 = wing2;

        // Dragon legs (shorter, sturdy)
        const leftLeg = this.scene.add.rectangle(px - 8, py + 16, 8, 12, 0x6a1b9a);
        leftLeg.setStrokeStyle(1, cyan);
        leftLeg.setDepth(50);
        this.portalbotVisuals.push(leftLeg);
        this.portalbotDragonLeftLeg = leftLeg;

        const rightLeg = this.scene.add.rectangle(px + 8, py + 16, 8, 12, 0x6a1b9a);
        rightLeg.setStrokeStyle(1, cyan);
        rightLeg.setDepth(50);
        this.portalbotVisuals.push(rightLeg);
        this.portalbotDragonRightLeg = rightLeg;

        // Claws
        const leftClaw = this.scene.add.triangle(px - 8, py + 24, 0, 0, 5, 5, -5, 5, cyan, 0.8);
        leftClaw.setDepth(50);
        this.portalbotVisuals.push(leftClaw);
        this.portalbotLeftClaw = leftClaw;

        const rightClaw = this.scene.add.triangle(px + 8, py + 24, 0, 0, 5, 5, -5, 5, cyan, 0.8);
        rightClaw.setDepth(50);
        this.portalbotVisuals.push(rightClaw);
        this.portalbotRightClaw = rightClaw;

        if (this.sprite && this.sprite.setAlpha) this.sprite.setAlpha(0);
    }

    createPortalbotTransformEffect(towardsDragon) {
        const x = this.sprite.x;
        const y = this.sprite.y;
        const colors = towardsDragon ? [0x7b1fa2, 0x00e5ff, 0xe040fb] : [0x00e5ff, 0x7b1fa2, 0xb0bec5];

        // Expanding portal ring
        const ring = this.scene.add.circle(x, y, 20, colors[0], 0);
        ring.setStrokeStyle(4, colors[1]);
        ring.setDepth(100);
        this.scene.tweens.add({
            targets: ring,
            scaleX: 3, scaleY: 3, alpha: 0,
            duration: 500,
            onComplete: () => ring.destroy()
        });

        // Swirl particles
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const particle = this.scene.add.circle(x, y, 4, colors[i % 3], 0.9);
            particle.setDepth(101);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 50,
                y: y + Math.sin(angle) * 50,
                alpha: 0,
                duration: 500,
                delay: i * 50,
                onComplete: () => particle.destroy()
            });
        }

        const transformText = this.scene.add.text(x, y - 50,
            towardsDragon ? '🐉 DRAGON MODE!' : '🤖 ROBOT MODE!',
            { fontSize: '20px', fill: '#00e5ff', stroke: '#7b1fa2', strokeThickness: 4, fontWeight: 'bold' }
        ).setOrigin(0.5).setDepth(102);
        this.scene.tweens.add({
            targets: transformText,
            y: y - 80, alpha: 0,
            duration: 1000,
            onComplete: () => transformText.destroy()
        });
    }

    // BMW Bouncer per-frame visual refresh is owned by the Transformer
    // strategy (Transformer.update -> rebuildVisualsIfNeeded + onUpdate hook).
    // The legacy updateBmwBouncerVisualsIfNeeded helper was intentionally
    // removed here as part of R1.4–R1.6.

    updatePortalbotVisualsIfNeeded() {
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'portalbot') {
            if (this.portalbotVisuals && this.portalbotVisuals.length > 0) {
                this.portalbotVisuals.forEach(v => { if (v && v.destroy) v.destroy(); });
                this.portalbotVisuals = [];
                this.portalbotCurrentForm = null;
                if (this.sprite && this.sprite.setAlpha) this.sprite.setAlpha(1);
            }
            return;
        }
        const directionChanged = this.portalbotLastFacingRight !== undefined && this.portalbotLastFacingRight !== this.facingRight;
        const needsRecreate = !this.portalbotVisuals || this.portalbotVisuals.length === 0 ||
            this.portalbotCurrentForm !== this.portalbotForm ||
            (this.portalbotForm === 'dragon' && directionChanged);
        if (needsRecreate) {
            this.portalbotCurrentForm = this.portalbotForm;
            this.portalbotLastFacingRight = this.facingRight;
            this.updatePortalbotVisuals();
        }
        const px = this.sprite.x;
        const py = this.sprite.y;
        const dir = this.facingRight ? 1 : -1;
        if (this.portalbotVisuals && this.portalbotVisuals.length > 0) {
            if (this.portalbotForm === 'robot') {
                if (this.portalbotChest) { this.portalbotChest.x = px; this.portalbotChest.y = py; }
                if (this.portalbotHead) { this.portalbotHead.x = px; this.portalbotHead.y = py - 20; }
                if (this.portalbotVisor) { this.portalbotVisor.x = px; this.portalbotVisor.y = py - 20; }
                if (this.portalbotCore) { this.portalbotCore.x = px; this.portalbotCore.y = py; }
                if (this.portalbotLeftArm) { this.portalbotLeftArm.x = px - 16; this.portalbotLeftArm.y = py - 2; }
                if (this.portalbotRightArm) { this.portalbotRightArm.x = px + 16; this.portalbotRightArm.y = py - 2; }
                if (this.portalbotLeftLeg) { this.portalbotLeftLeg.x = px - 7; this.portalbotLeftLeg.y = py + 20; }
                if (this.portalbotRightLeg) { this.portalbotRightLeg.x = px + 7; this.portalbotRightLeg.y = py + 20; }
                if (this.portalbotLeftFoot) { this.portalbotLeftFoot.x = px - 7; this.portalbotLeftFoot.y = py + 30; }
                if (this.portalbotRightFoot) { this.portalbotRightFoot.x = px + 7; this.portalbotRightFoot.y = py + 30; }
            } else {
                // Dragon form position updates
                if (this.portalbotBody) { this.portalbotBody.x = px; this.portalbotBody.y = py; }
                if (this.portalbotDragonHead) { this.portalbotDragonHead.x = px + dir * 20; this.portalbotDragonHead.y = py - 10; }
                if (this.portalbotEye) { this.portalbotEye.x = px + dir * 24; this.portalbotEye.y = py - 14; }
                if (this.portalbotSnout) { this.portalbotSnout.x = px + dir * 32; this.portalbotSnout.y = py - 8; }
                if (this.portalbotTail) { this.portalbotTail.x = px - dir * 24; this.portalbotTail.y = py + 2; }
                if (this.portalbotTailSwirl) { this.portalbotTailSwirl.x = px - dir * 34; this.portalbotTailSwirl.y = py + 2; }
                if (this.portalbotWing1) { this.portalbotWing1.x = px - dir * 4; this.portalbotWing1.y = py - 18; }
                if (this.portalbotWing2) { this.portalbotWing2.x = px - dir * 8; this.portalbotWing2.y = py - 14; }
                if (this.portalbotDragonLeftLeg) { this.portalbotDragonLeftLeg.x = px - 8; this.portalbotDragonLeftLeg.y = py + 16; }
                if (this.portalbotDragonRightLeg) { this.portalbotDragonRightLeg.x = px + 8; this.portalbotDragonRightLeg.y = py + 16; }
                if (this.portalbotLeftClaw) { this.portalbotLeftClaw.x = px - 8; this.portalbotLeftClaw.y = py + 24; }
                if (this.portalbotRightClaw) { this.portalbotRightClaw.x = px + 8; this.portalbotRightClaw.y = py + 24; }
            }
        }
    }

    handleBmwBouncerBounceSlam() {
        if (!this.controls) return;
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'bmwBouncer') return;
        const costume = this.getDragonCostume();
        if (!costume.bounceSlamEnabled) return;
        // Only in robot form - car mode uses nets. Form lives on the
        // Transformer instance now.
        const form = this.transformer && typeof this.transformer.currentForm === 'function'
            ? this.transformer.currentForm()
            : 'robot';
        if (form !== 'robot') return;
        if (this.controls.isDuckLaser() && !this.previousInputs.duckLaser) {
            this.performBmwBouncerBounceSlam();
        }
    }

    performBmwBouncerBounceSlam() {
        if (this.bounceSlamCooldown > 0) return;
        const costume = this.getDragonCostume();
        this.bounceSlamCooldown = costume.bounceSlamCooldown || this.bounceSlamCooldownTime;
        const range = costume.bounceSlamRange || 220;
        const damage = costume.bounceSlamDamage || 35;
        const launch = costume.bounceSlamLaunchVelocity || 550;
        const px = this.sprite.x;
        const py = this.sprite.y;
        // Cue: player leaps up slightly
        if (this.body && this.body.setVelocityY) {
            this.body.setVelocityY(-300);
        }
        // Giant trampoline visual
        const tramp = this.scene.add.ellipse(px, py + 32, range, 28, 0xe22400, 0.85);
        tramp.setStrokeStyle(4, 0x0066b2);
        tramp.setDepth(99);
        const springs = this.scene.add.ellipse(px, py + 32, range * 0.85, 18, 0x6e27c5, 0.7);
        springs.setDepth(100);
        this.scene.tweens.add({
            targets: [tramp, springs],
            scaleY: 0.4,
            alpha: 0,
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => { tramp.destroy(); springs.destroy(); }
        });
        // AoE damage + upward launch
        if (this.scene.enemies) {
            this.scene.enemies.getChildren().forEach(enemySprite => {
                const enemy = enemySprite.getData ? enemySprite.getData('enemy') : null;
                if (!enemy || enemy.health <= 0 || !enemy.sprite) return;
                const dist = Phaser.Math.Distance.Between(px, py, enemy.sprite.x, enemy.sprite.y);
                if (dist > range / 2) return;
                if (typeof enemy.takeDamage === 'function') {
                    enemy.takeDamage(damage, 'bounceSlam');
                }
                if (enemy.sprite.body && enemy.sprite.body.setVelocityY) {
                    enemy.sprite.body.setVelocityY(-launch);
                }
            });
        }
        const slamText = this.scene.add.text(px, py - 50, 'BOUNCE SLAM!',
            { fontSize: '22px', fill: '#ffffff', stroke: '#e22400', strokeThickness: 4, fontWeight: 'bold' }
        ).setOrigin(0.5).setDepth(102);
        this.scene.tweens.add({
            targets: slamText,
            y: py - 90, alpha: 0,
            duration: 1000,
            onComplete: () => slamText.destroy()
        });
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(350, 0.025);
        }
    }

    createBmwBouncerTrampolineProjectile(startX, startY, costume) {
        const red = costume.projectileColor || 0xe22400;
        const blue = costume.projectileSecondaryColor || 0x0066b2;
        const size = costume.projectileSize || 18;
        const pad = this.scene.add.ellipse(startX, startY, size * 2.2, size * 0.9, red, 0.95);
        pad.setStrokeStyle(2, blue);
        return pad;
    }

    createBmwBouncerNetProjectile(startX, startY, costume) {
        const white = costume.carProjectileColor || 0xffffff;
        const blue = costume.carProjectileSecondaryColor || 0x0066b2;
        const size = costume.projectileSize || 18;
        const net = this.scene.add.circle(startX, startY, size, white, 0.5);
        net.setStrokeStyle(3, blue);
        return net;
    }

    handleDuckLaser() {
        // Safety check for controls
        if (!this.controls) {
            return;
        }

        // Check if player is wearing Grimlock costume
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'grimlock') {
            return; // Only Grimlock can use duck laser
        }
        
        // Check for duck laser key press (edge detection)
        if (this.controls.isDuckLaser() && !this.previousInputs.duckLaser) {
            this.performDuckLaser();
        }
    }

    handleDogLaser() {
        if (!this.controls) return;
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (currentOutfit !== 'bumblebee') return;
        const costume = this.getDragonCostume();
        if (!costume.dogLaserEnabled) return;
        if (this.controls.isDuckLaser() && !this.previousInputs.dogLaser) {
            this.performDogLaser();
        }
    }

    performDuckLaser() {
        // Check cooldown
        if (this.duckLaserCooldown > 0) {
            console.log('🦆 Duck Laser on cooldown!', Math.ceil(this.duckLaserCooldown / 1000), 's remaining');
            return;
        }
        
        console.log('🦆⚡ GRIMLOCK DUCK LASER! Transforming bad titans into ducks!');
        
        // Set cooldown
        this.duckLaserCooldown = this.duckLaserCooldownTime;
        
        // Calculate laser starting position
        const startX = this.sprite.x + (this.facingRight ? 30 : -30);
        const startY = this.sprite.y;
        const direction = this.facingRight ? 1 : -1;
        
        // Create the duck laser beam
        this.createDuckLaserBeam(startX, startY, direction);
        
        // Screen shake
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(200, 0.015);
        }
    }

    createDuckLaserBeam(startX, startY, direction) {
        const laserSpeed = 700;
        const laserDistance = 600;
        
        // Create the laser beam (rainbow-colored for duck transformation)
        const laserWidth = 100;
        const laserHeight = 16;
        
        const laser = this.scene.add.rectangle(
            startX, 
            startY, 
            laserWidth, 
            laserHeight, 
            0xffd700, // Yellow base
            0.9
        );
        laser.setStrokeStyle(3, 0xff4500); // Orange stroke
        laser.setDepth(100);
        
        // Add duck emoji glow
        const duckEmoji = this.scene.add.text(
            startX + (direction * 50),
            startY,
            '🦆',
            { fontSize: '24px' }
        ).setOrigin(0.5).setDepth(101);
        
        // Add trailing rainbow effect
        const rainbow = this.scene.add.rectangle(
            startX - (direction * 20),
            startY,
            60,
            laserHeight,
            0xff69b4, // Pink
            0.6
        );
        rainbow.setDepth(99);
        
        // Add physics to the laser
        this.scene.physics.add.existing(laser, false);
        laser.body.setVelocityX(laserSpeed * direction);
        laser.body.setAllowGravity(false);
        
        // Store reference for cleanup
        laser.setData('startX', startX);
        laser.setData('maxDistance', laserDistance);
        laser.setData('direction', direction);
        laser.setData('duckEmoji', duckEmoji);
        laser.setData('rainbow', rainbow);
        
        // Update emoji position with laser
        const updateEvent = this.scene.time.addEvent({
            delay: 16,
            callback: () => {
                if (laser.active) {
                    duckEmoji.x = laser.x + (direction * 50);
                    duckEmoji.y = laser.y;
                    rainbow.x = laser.x - (direction * 40);
                    rainbow.y = laser.y;
                    
                    // Check if traveled max distance
                    const traveled = Math.abs(laser.x - startX);
                    if (traveled >= laserDistance) {
                        this.destroyDuckLaser(laser);
                        updateEvent.destroy();
                    }
                }
            },
            loop: true
        });
        
        // Add collision with enemies to transform them into ducks
        if (this.scene.enemies) {
            this.scene.physics.add.overlap(
                laser,
                this.scene.enemies,
                (laserSprite, enemySprite) => {
                    const enemy = enemySprite.getData('enemy');
                    if (enemy && enemy.health > 0 && !enemy.isDucked && !enemy.isDogged) {
                        this.transformToDuck(enemy, enemySprite);
                    }
                }
            );
        }
        
        // Auto-destroy after 2 seconds if still active
        this.scene.time.delayedCall(2000, () => {
            if (laser.active) {
                this.destroyDuckLaser(laser);
                updateEvent.destroy();
            }
        });
    }

    destroyDuckLaser(laser) {
        const duckEmoji = laser.getData('duckEmoji');
        const rainbow = laser.getData('rainbow');
        
        if (duckEmoji && duckEmoji.active) {
            duckEmoji.destroy();
        }
        if (rainbow && rainbow.active) {
            rainbow.destroy();
        }
        if (laser.active) {
            laser.destroy();
        }
    }

    transformToDuck(enemy, enemySprite) {
        console.log('🦆 Enemy transformed into a duck!');
        
        // Store original state
        const originalData = {
            enemy: enemy,
            sprite: enemySprite,
            originalScale: enemySprite.scaleX,
            originalColor: enemySprite.fillColor,
            originalSpeed: enemy.speed,
            originalDamage: enemy.damage,
            transformTime: Date.now()
        };
        
        // Mark as ducked
        enemy.isDucked = true;
        enemy.canAttack = false;
        enemy.speed = 30; // Ducks waddle slowly
        enemy.damage = 0; // Ducks can't attack
        
        // Create duck visual effect
        const duckX = enemySprite.x;
        const duckY = enemySprite.y;
        
        // Hide original enemy sprite
        enemySprite.setAlpha(0);
        
        // Create duck emoji sprite
        const duck = this.scene.add.text(
            duckX, duckY,
            '🦆',
            { fontSize: '40px' }
        ).setOrigin(0.5).setDepth(enemySprite.depth);
        
        // Add wobble animation
        this.scene.tweens.add({
            targets: duck,
            angle: { from: -10, to: 10 },
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Store duck reference
        enemy.duckSprite = duck;
        
        // Add transformation burst effect
        for (let i = 0; i < 8; i++) {
            const feather = this.scene.add.text(
                duckX, duckY,
                '🪶',
                { fontSize: '16px' }
            ).setOrigin(0.5).setDepth(100);
            
            const angle = (Math.PI * 2 * i) / 8;
            this.scene.tweens.add({
                targets: feather,
                x: duckX + Math.cos(angle) * 50,
                y: duckY + Math.sin(angle) * 50,
                alpha: 0,
                duration: 500,
                onComplete: () => feather.destroy()
            });
        }
        
        // Add "QUACK!" text
        const quackText = this.scene.add.text(
            duckX, duckY - 40,
            'QUACK! 🦆',
            {
                fontSize: '18px',
                fill: '#ffd700',
                stroke: '#000000',
                strokeThickness: 3
            }
        ).setOrigin(0.5).setDepth(102);
        
        this.scene.tweens.add({
            targets: quackText,
            y: duckY - 70,
            alpha: 0,
            duration: 1000,
            onComplete: () => quackText.destroy()
        });
        
        // Track ducked enemy for restoration
        this.duckedEnemies.push({
            ...originalData,
            duckSprite: duck,
            restoreTime: Date.now() + 8000 // Restore after 8 seconds
        });
    }

    updateDuckedEnemies(delta) {
        const now = Date.now();
        
        // Check each ducked enemy for restoration
        for (let i = this.duckedEnemies.length - 1; i >= 0; i--) {
            const ducked = this.duckedEnemies[i];
            
            if (now >= ducked.restoreTime) {
                this.restoreFromDuck(ducked);
                this.duckedEnemies.splice(i, 1);
            } else {
                // Update duck position to follow enemy body
                if (ducked.duckSprite && ducked.duckSprite.active && ducked.sprite && ducked.sprite.active) {
                    ducked.duckSprite.x = ducked.sprite.x;
                    ducked.duckSprite.y = ducked.sprite.y;
                }
            }
        }
    }

    restoreFromDuck(ducked) {
        console.log('🦆➡️👹 Duck transforming back to titan!');
        
        const { enemy, sprite, duckSprite, originalSpeed, originalDamage } = ducked;
        
        if (!enemy || !sprite || !sprite.active) {
            // Enemy was destroyed while ducked
            if (duckSprite && duckSprite.active) {
                duckSprite.destroy();
            }
            return;
        }
        
        // Restore enemy properties
        enemy.isDucked = false;
        enemy.canAttack = true;
        enemy.speed = originalSpeed;
        enemy.damage = originalDamage;
        
        // Show original sprite
        sprite.setAlpha(1);
        
        // Destroy duck sprite
        if (duckSprite && duckSprite.active) {
            duckSprite.destroy();
        }
        enemy.duckSprite = null;
        
        // Create restoration effect
        const poof = this.scene.add.text(
            sprite.x, sprite.y,
            '💨',
            { fontSize: '32px' }
        ).setOrigin(0.5).setDepth(100);
        
        this.scene.tweens.add({
            targets: poof,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => poof.destroy()
        });
        
        // Warning text
        const warningText = this.scene.add.text(
            sprite.x, sprite.y - 40,
            '😠 Back to normal!',
            {
                fontSize: '14px',
                fill: '#ff4444',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5).setDepth(102);
        
        this.scene.tweens.add({
            targets: warningText,
            y: sprite.y - 60,
            alpha: 0,
            duration: 800,
            onComplete: () => warningText.destroy()
        });
    }

    performDogLaser() {
        if (this.dogLaserCooldown > 0) return;
        const costume = this.getDragonCostume();
        this.dogLaserCooldown = costume.dogLaserCooldown || this.dogLaserCooldownTime;
        const startX = this.sprite.x + (this.facingRight ? 30 : -30);
        const startY = this.sprite.y;
        const direction = this.facingRight ? 1 : -1;
        this.createDogLaserBeam(startX, startY, direction);
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(200, 0.015);
        }
    }

    createDogLaserBeam(startX, startY, direction) {
        const laserSpeed = 700;
        const laserDistance = 600;
        const laserWidth = 100;
        const laserHeight = 16;
        const laser = this.scene.add.rectangle(
            startX, startY, laserWidth, laserHeight,
            0xffd700, 0.9
        );
        laser.setStrokeStyle(3, 0x000000);
        laser.setDepth(100);
        const dogEmoji = this.scene.add.text(
            startX + (direction * 50), startY, '🐕',
            { fontSize: '24px' }
        ).setOrigin(0.5).setDepth(101);
        const stripe = this.scene.add.rectangle(
            startX - (direction * 20), startY, 60, laserHeight, 0x333333, 0.6
        );
        stripe.setDepth(99);
        this.scene.physics.add.existing(laser, false);
        laser.body.setVelocityX(laserSpeed * direction);
        laser.body.setAllowGravity(false);
        laser.setData('startX', startX);
        laser.setData('maxDistance', laserDistance);
        laser.setData('direction', direction);
        laser.setData('dogEmoji', dogEmoji);
        laser.setData('stripe', stripe);
        const updateEvent = this.scene.time.addEvent({
            delay: 16,
            callback: () => {
                if (laser.active) {
                    dogEmoji.x = laser.x + (direction * 50);
                    dogEmoji.y = laser.y;
                    stripe.x = laser.x - (direction * 40);
                    stripe.y = laser.y;
                    const traveled = Math.abs(laser.x - startX);
                    if (traveled >= laserDistance) {
                        this.destroyDogLaser(laser);
                        updateEvent.destroy();
                    }
                }
            },
            loop: true
        });
        if (this.scene.enemies) {
            this.scene.physics.add.overlap(laser, this.scene.enemies, (laserSprite, enemySprite) => {
                const enemy = enemySprite.getData('enemy');
                if (enemy && enemy.health > 0 && !enemy.isDucked && !enemy.isDogged) {
                    this.transformToDog(enemy, enemySprite);
                }
            });
        }
        this.scene.time.delayedCall(2000, () => {
            if (laser.active) {
                this.destroyDogLaser(laser);
                updateEvent.destroy();
            }
        });
    }

    destroyDogLaser(laser) {
        const dogEmoji = laser.getData('dogEmoji');
        const stripe = laser.getData('stripe');
        if (dogEmoji && dogEmoji.active) dogEmoji.destroy();
        if (stripe && stripe.active) stripe.destroy();
        if (laser.active) laser.destroy();
    }

    transformToDog(enemy, enemySprite) {
        const costume = this.getDragonCostume();
        const duration = costume.dogDuration || 8000;
        const originalData = {
            enemy: enemy,
            sprite: enemySprite,
            originalSpeed: enemy.speed,
            originalDamage: enemy.damage,
            transformTime: Date.now()
        };
        enemy.isDogged = true;
        enemy.canAttack = false;
        enemy.speed = 35;
        enemy.damage = 0;
        const dogX = enemySprite.x;
        const dogY = enemySprite.y;
        enemySprite.setAlpha(0);
        const dog = this.scene.add.text(dogX, dogY, '🐕', { fontSize: '40px' })
            .setOrigin(0.5).setDepth(enemySprite.depth);
        this.scene.tweens.add({
            targets: dog,
            angle: { from: -8, to: 8 },
            duration: 250,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        enemy.dogSprite = dog;
        for (let i = 0; i < 8; i++) {
            const spark = this.scene.add.text(dogX, dogY, '✨', { fontSize: '14px' }).setOrigin(0.5).setDepth(100);
            const angle = (Math.PI * 2 * i) / 8;
            this.scene.tweens.add({
                targets: spark,
                x: dogX + Math.cos(angle) * 45,
                y: dogY + Math.sin(angle) * 45,
                alpha: 0,
                duration: 400,
                onComplete: () => spark.destroy()
            });
        }
        const woofText = this.scene.add.text(dogX, dogY - 40, 'WOOF! 🐕', {
            fontSize: '18px', fill: '#ffd700', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(102);
        this.scene.tweens.add({
            targets: woofText,
            y: dogY - 70,
            alpha: 0,
            duration: 1000,
            onComplete: () => woofText.destroy()
        });
        this.doggedEnemies.push({
            ...originalData,
            dogSprite: dog,
            restoreTime: Date.now() + duration
        });
    }

    updateDoggedEnemies(delta) {
        const now = Date.now();
        for (let i = this.doggedEnemies.length - 1; i >= 0; i--) {
            const dogged = this.doggedEnemies[i];
            if (now >= dogged.restoreTime) {
                this.restoreFromDog(dogged);
                this.doggedEnemies.splice(i, 1);
            } else {
                if (dogged.dogSprite && dogged.dogSprite.active && dogged.sprite && dogged.sprite.active) {
                    dogged.dogSprite.x = dogged.sprite.x;
                    dogged.dogSprite.y = dogged.sprite.y;
                }
            }
        }
    }

    restoreFromDog(dogged) {
        const { enemy, sprite, dogSprite, originalSpeed, originalDamage } = dogged;
        if (!enemy || !sprite || !sprite.active) {
            if (dogSprite && dogSprite.active) dogSprite.destroy();
            return;
        }
        enemy.isDogged = false;
        enemy.canAttack = true;
        enemy.speed = originalSpeed;
        enemy.damage = originalDamage;
        sprite.setAlpha(1);
        if (dogSprite && dogSprite.active) dogSprite.destroy();
        enemy.dogSprite = null;
        const poof = this.scene.add.text(sprite.x, sprite.y, '💨', { fontSize: '32px' }).setOrigin(0.5).setDepth(100);
        this.scene.tweens.add({
            targets: poof,
            scaleX: 2, scaleY: 2, alpha: 0,
            duration: 300,
            onComplete: () => poof.destroy()
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

        // BMW Bouncer swaps projectile type based on current form
        let projectileType = costume.projectileType;
        let projectileDamage = costume.projectileDamage;
        let projectileEffect = costume.projectileEffect;
        let projectileColor = costume.projectileColor;
        let projectileSecondaryColor = costume.projectileSecondaryColor;
        const bmwBouncerForm = (costume.isBmwBouncer && this.transformer && typeof this.transformer.currentForm === 'function')
            ? this.transformer.currentForm()
            : null;
        if (costume.isBmwBouncer && bmwBouncerForm === 'car') {
            projectileType = costume.carProjectileType || 'captureNet';
            projectileDamage = costume.carProjectileDamage || projectileDamage;
            projectileEffect = 'netCapture';
            projectileColor = costume.carProjectileColor || 0xffffff;
            projectileSecondaryColor = costume.carProjectileSecondaryColor || 0x0066b2;
        }

        // Create projectile based on dragon type
        let projectile;
        let glow;

        switch (projectileType) {
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
            case 'stone':
                projectile = this.createStoneProjectile(startX, startY, costume);
                break;
            case 'present':
                // Present Dragon uses the present bomb attack directly
                this.shootPresentBomb();
                return; // Exit early - shootPresentBomb handles everything
            case 'grimlockBreath':
                // Grimlock's combined fire AND lightning breath!
                projectile = this.createGrimlockBreathProjectile(startX, startY, costume);
                break;
            case 'bumblebeeStinger':
                // Bumblebee stinger blast - yellow/black
                projectile = this.scene.add.circle(startX, startY, costume.projectileSize, costume.projectileColor, 0.95);
                projectile.setStrokeStyle(2, costume.projectileSecondaryColor || 0x000000);
                break;
            case 'elitaDogBullet':
                // Elita's gun - dog bullets (brown/tan)
                projectile = this.scene.add.ellipse(startX, startY, costume.projectileSize * 1.2, costume.projectileSize, costume.projectileColor, 0.95);
                projectile.setStrokeStyle(2, costume.projectileSecondaryColor || 0x5d4037);
                break;
            case 'trampolinePad':
                // BMW Bouncer robot mode - deployable trampoline pad
                projectile = this.createBmwBouncerTrampolineProjectile(startX, startY, costume);
                break;
            case 'captureNet':
                // BMW Bouncer car mode - expanding capture net
                projectile = this.createBmwBouncerNetProjectile(startX, startY, costume);
                break;
            case 'portal':
                // Portal Bot - swirling portal orb (purple/cyan)
                projectile = this.createPortalProjectile(startX, startY, costume);
                break;
            default:
                projectile = this.scene.add.circle(startX, startY, costume.projectileSize, projectileColor, 0.9);
        }
        
        projectile.setDepth(100);

        // Add physics to projectile
        this.scene.physics.add.existing(projectile);
        projectile.body.setVelocityX(velocityX);
        projectile.body.setAllowGravity(false);

        // Trampoline pads arc downward with gravity for a "deployable" feel
        if (projectileType === 'trampolinePad') {
            projectile.body.setAllowGravity(true);
            projectile.body.setVelocityY(-120);
        }

        // Create glow effect
        glow = this.scene.add.circle(startX, startY, costume.projectileSize * 1.5, projectileColor, 0.3);
        glow.setDepth(99);
        this.scene.physics.add.existing(glow);
        glow.body.setVelocityX(velocityX);
        glow.body.setAllowGravity(false);

        // Expand capture nets during flight for a capture-like growth
        if (projectileType === 'captureNet') {
            this.scene.tweens.add({
                targets: [projectile, glow],
                scale: 1.8,
                duration: 400,
                ease: 'Cubic.easeOut'
            });
        }

        // Store projectile data
        this.fireballs.push({
            sprite: projectile,
            glow: glow,
            damage: projectileDamage,
            traveled: 0,
            maxDistance: projectileType === 'portal' ? 400 : (this.scene.levelWidth || 3000),
            type: projectileType,
            effect: projectileEffect,
            color: projectileColor,
            secondaryColor: projectileSecondaryColor,
            netRadius: projectileType === 'captureNet' ? (costume.carProjectileRadius || 70) : 0,
            launchVelocity: projectileType === 'trampolinePad' ? 450 : 0
        });

        // Add collider with platforms for bouncing (if applicable)
        if (this.scene.platforms && projectileType === 'earthquake') {
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

    createStoneProjectile(x, y, costume) {
        // 🪨 STONE PROJECTILE - jagged rock shard that shatters on impact!
        const size = costume.projectileSize;
        
        // Create a rocky polygon shape
        const projectile = this.scene.add.polygon(x, y, [
            -size * 0.4, -size * 0.6,
            size * 0.2, -size * 0.7,
            size * 0.6, -size * 0.2,
            size * 0.5, size * 0.4,
            0, size * 0.6,
            -size * 0.5, size * 0.3,
            -size * 0.6, -size * 0.1
        ], costume.projectileColor, 0.95);
        projectile.setStrokeStyle(2, costume.projectileSecondaryColor);
        
        // Add slight rotation for visual interest
        projectile.setRotation(this.facingRight ? -0.2 : 0.2);
        
        // Add spinning animation
        this.scene.tweens.add({
            targets: projectile,
            rotation: this.facingRight ? Math.PI * 3 : -Math.PI * 3,
            duration: 1200,
            ease: 'Linear'
        });
        
        // Add stone trail particles
        this.createStoneTrail(projectile);
        
        console.log('🪨 Stone projectile created!');
        
        return projectile;
    }
    
    createStoneTrail(stoneProjectile) {
        // Create rocky debris trail behind the stone
        const trailTimer = this.scene.time.addEvent({
            delay: 60,
            callback: () => {
                if (!stoneProjectile || !stoneProjectile.active) {
                    trailTimer.destroy();
                    return;
                }
                
                // Small rock particles
                const colors = [0x696969, 0x808080, 0x778899, 0x2f4f4f];
                const particle = this.scene.add.polygon(
                    stoneProjectile.x + (Math.random() - 0.5) * 10,
                    stoneProjectile.y + (Math.random() - 0.5) * 10,
                    [
                        -3, -4,
                        2, -3,
                        4, 1,
                        0, 4,
                        -3, 2
                    ],
                    colors[Math.floor(Math.random() * colors.length)],
                    0.7
                );
                particle.setRotation(Math.random() * Math.PI * 2);
                particle.setDepth(95);
                
                this.scene.tweens.add({
                    targets: particle,
                    alpha: 0,
                    scaleX: 0.3,
                    scaleY: 0.3,
                    y: particle.y + 15,
                    duration: 350,
                    onComplete: () => particle.destroy()
                });
            },
            repeat: 12 // Trail for about 0.7 seconds
        });
    }

    createGrimlockBreathProjectile(x, y, costume) {
        // 🦖🔥⚡ GRIMLOCK BREATH - Combined fire AND lightning!
        const size = costume.projectileSize;
        
        // Create a container for the dual-element projectile
        const container = this.scene.add.container(x, y);
        
        // Fire core (orange/red fireball)
        const fireCore = this.scene.add.circle(0, 0, size * 0.6, 0xff4500, 0.9);
        fireCore.setStrokeStyle(2, 0xff0000);
        
        // Lightning ring around the fire
        const lightningRing = this.scene.add.circle(0, 0, size * 0.8, 0xffd700, 0.6);
        lightningRing.setStrokeStyle(3, 0xffff00);
        
        // Outer glow combining both elements
        const outerGlow = this.scene.add.circle(0, 0, size, 0xff8c00, 0.3);
        
        container.add([outerGlow, lightningRing, fireCore]);
        
        // Add lightning bolt sprites around the fireball
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 * i) / 4;
            const bolt = this.scene.add.text(
                Math.cos(angle) * size * 0.9,
                Math.sin(angle) * size * 0.9,
                '⚡',
                { fontSize: '14px' }
            ).setOrigin(0.5);
            container.add(bolt);
            
            // Rotate bolts
            this.scene.tweens.add({
                targets: bolt,
                angle: 360,
                duration: 500,
                repeat: -1,
                ease: 'Linear'
            });
        }
        
        // Add pulsing animation
        this.scene.tweens.add({
            targets: [fireCore, lightningRing],
            scaleX: { from: 0.9, to: 1.1 },
            scaleY: { from: 0.9, to: 1.1 },
            duration: 150,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Add rotation animation
        this.scene.tweens.add({
            targets: container,
            angle: this.facingRight ? 360 : -360,
            duration: 600,
            repeat: -1,
            ease: 'Linear'
        });
        
        // Create trailing fire and lightning effect
        this.createGrimlockBreathTrail(container);
        
        console.log('🦖🔥⚡ GRIMLOCK BREATH! Fire AND Lightning!');
        
        return container;
    }
    
    createGrimlockBreathTrail(breathProjectile) {
        // Create combined fire + lightning trail
        const trailTimer = this.scene.time.addEvent({
            delay: 50,
            callback: () => {
                if (!breathProjectile || !breathProjectile.active) {
                    trailTimer.destroy();
                    return;
                }
                
                // Alternate between fire and lightning particles
                const isFireParticle = Math.random() > 0.5;
                
                if (isFireParticle) {
                    // Fire particle (orange/red)
                    const fireParticle = this.scene.add.circle(
                        breathProjectile.x + (Math.random() - 0.5) * 10,
                        breathProjectile.y + (Math.random() - 0.5) * 10,
                        4 + Math.random() * 4,
                        Math.random() > 0.5 ? 0xff4500 : 0xff6347,
                        0.8
                    );
                    fireParticle.setDepth(95);
                    
                    this.scene.tweens.add({
                        targets: fireParticle,
                        alpha: 0,
                        scaleX: 0.3,
                        scaleY: 0.3,
                        y: fireParticle.y - 10,
                        duration: 300,
                        onComplete: () => fireParticle.destroy()
                    });
                } else {
                    // Lightning particle (yellow/gold)
                    const lightningParticle = this.scene.add.text(
                        breathProjectile.x + (Math.random() - 0.5) * 15,
                        breathProjectile.y + (Math.random() - 0.5) * 15,
                        '⚡',
                        { fontSize: '12px' }
                    ).setOrigin(0.5).setDepth(95);
                    
                    this.scene.tweens.add({
                        targets: lightningParticle,
                        alpha: 0,
                        scaleX: 0.5,
                        scaleY: 0.5,
                        duration: 250,
                        onComplete: () => lightningParticle.destroy()
                    });
                }
            },
            repeat: 15 // Trail for about 0.75 seconds
        });
    }

    createPortalProjectile(x, y, costume) {
        // 🌀🤖 PORTAL BOT - Swirling portal orb that becomes a walkable portal
        const size = costume.projectileSize;
        const container = this.scene.add.container(x, y);

        // Outer swirl ring (cyan)
        const outerRing = this.scene.add.circle(0, 0, size, 0x00e5ff, 0.4);
        outerRing.setStrokeStyle(3, 0x7b1fa2);

        // Inner core (purple)
        const innerCore = this.scene.add.circle(0, 0, size * 0.5, 0x7b1fa2, 0.8);
        innerCore.setStrokeStyle(2, 0x00e5ff);

        // Spinning swirl dots
        const dots = [];
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 * i) / 4;
            const dot = this.scene.add.circle(
                Math.cos(angle) * size * 0.7,
                Math.sin(angle) * size * 0.7,
                3, 0x00e5ff, 0.9
            );
            dots.push(dot);
            container.add(dot);
        }

        container.add([outerRing, innerCore]);

        // Spin animation
        this.scene.tweens.add({
            targets: container,
            angle: 360,
            duration: 600,
            repeat: -1,
            ease: 'Linear'
        });

        // Pulse the core
        this.scene.tweens.add({
            targets: innerCore,
            scaleX: { from: 0.8, to: 1.2 },
            scaleY: { from: 0.8, to: 1.2 },
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Mark this projectile as a portal type so updateFireballs can handle placement
        container.isPortalProjectile = true;

        console.log('🌀 Portal orb launched!');
        return container;
    }

    placePortal(x, y) {
        // Remove oldest portal if at max
        if (this.activePortals.length >= this.portalMaxActive) {
            const oldest = this.activePortals.shift();
            if (oldest.visuals) {
                oldest.visuals.forEach(v => { if (v && v.destroy) v.destroy(); });
            }
            if (oldest.collider && oldest.collider.destroy) oldest.collider.destroy();
        }

        // Create the stationary portal on the ground
        const portalHeight = 60;
        const portalWidth = 36;

        // Portal oval frame
        const frame = this.scene.add.ellipse(x, y - portalHeight / 2, portalWidth, portalHeight, 0x7b1fa2, 0.3);
        frame.setStrokeStyle(3, 0x00e5ff);
        frame.setDepth(45);

        // Inner swirl
        const inner = this.scene.add.ellipse(x, y - portalHeight / 2, portalWidth * 0.7, portalHeight * 0.7, 0x00e5ff, 0.5);
        inner.setStrokeStyle(2, 0xe040fb);
        inner.setDepth(46);

        // Portal icon
        const icon = this.scene.add.text(x, y - portalHeight / 2, '🌀', { fontSize: '24px' })
            .setOrigin(0.5).setDepth(47);

        // Swirl animation on inner
        this.scene.tweens.add({
            targets: inner,
            angle: 360,
            duration: 2000,
            repeat: -1,
            ease: 'Linear'
        });

        // Pulse the frame
        this.scene.tweens.add({
            targets: frame,
            scaleX: { from: 0.95, to: 1.05 },
            scaleY: { from: 0.95, to: 1.05 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Create invisible collider zone for the player to walk into
        const collider = this.scene.add.rectangle(x, y - portalHeight / 2, portalWidth, portalHeight, 0x000000, 0);
        collider.setDepth(0);
        this.scene.physics.add.existing(collider, true); // static body

        const portalData = {
            x: x,
            y: y - portalHeight / 2,
            visuals: [frame, inner, icon],
            collider: collider,
            createdAt: this.scene.time.now,
            lifetime: this.portalLifetime
        };

        this.activePortals.push(portalData);

        // Auto-destroy after lifetime
        this.scene.time.delayedCall(this.portalLifetime, () => {
            this.destroyPortal(portalData);
        });

        console.log(`🌀 Portal placed at (${Math.round(x)}, ${Math.round(y)})! Active portals: ${this.activePortals.length}`);
    }

    destroyPortal(portalData) {
        // Fade out and destroy
        if (portalData.visuals) {
            portalData.visuals.forEach(v => {
                if (v && !v.destroyed) {
                    this.scene.tweens.add({
                        targets: v,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => { if (v && v.destroy) v.destroy(); }
                    });
                }
            });
        }
        if (portalData.collider && !portalData.collider.destroyed) {
            this.scene.time.delayedCall(300, () => {
                if (portalData.collider && portalData.collider.destroy) portalData.collider.destroy();
            });
        }
        // Remove from active list
        const idx = this.activePortals.indexOf(portalData);
        if (idx > -1) this.activePortals.splice(idx, 1);
    }

    updatePortals(delta) {
        // Decrease teleport cooldown
        if (this.portalTeleportCooldown > 0) {
            this.portalTeleportCooldown -= delta;
        }

        // Check if player overlaps any active portal
        if (this.portalTeleportCooldown > 0 || this.activePortals.length < 2) return;

        const playerX = this.sprite.x;
        const playerY = this.sprite.y;

        for (let i = 0; i < this.activePortals.length; i++) {
            const portal = this.activePortals[i];
            if (!portal || !portal.collider || portal.collider.destroyed) continue;

            const dist = Phaser.Math.Distance.Between(playerX, playerY, portal.x, portal.y);
            if (dist < 30) {
                // Find the OTHER portal to teleport to
                const destIndex = (i === 0) ? this.activePortals.length - 1 : 0;
                const dest = this.activePortals[destIndex];
                if (!dest || !dest.collider || dest.collider.destroyed) continue;

                // Teleport!
                this.sprite.x = dest.x;
                this.sprite.y = dest.y;
                if (this.sprite.body) {
                    this.sprite.body.reset(dest.x, dest.y);
                }
                this.portalTeleportCooldown = this.portalTeleportCooldownTime;

                // Visual teleport effect at both ends
                this.createPortalTeleportEffect(portal.x, portal.y);
                this.createPortalTeleportEffect(dest.x, dest.y);

                // Screen flash
                if (this.scene.cameras && this.scene.cameras.main) {
                    this.scene.cameras.main.flash(200, 0, 229, 255, false); // cyan flash
                }

                console.log(`🌀 TELEPORTED from portal ${i} to portal ${destIndex}!`);
                break;
            }
        }
    }

    createPortalTeleportEffect(x, y) {
        // Expanding rings at teleport point
        for (let i = 0; i < 3; i++) {
            const ring = this.scene.add.circle(x, y, 10, 0x00e5ff, 0);
            ring.setStrokeStyle(3, i % 2 === 0 ? 0x7b1fa2 : 0x00e5ff);
            ring.setDepth(100);
            this.scene.tweens.add({
                targets: ring,
                scaleX: 2 + i,
                scaleY: 2 + i,
                alpha: { from: 0.8, to: 0 },
                duration: 400,
                delay: i * 100,
                onComplete: () => ring.destroy()
            });
        }
        // Particles burst
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const particle = this.scene.add.circle(x, y, 4, i % 2 === 0 ? 0x7b1fa2 : 0x00e5ff, 0.9);
            particle.setDepth(101);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 40,
                y: y + Math.sin(angle) * 40,
                alpha: 0,
                duration: 350,
                onComplete: () => particle.destroy()
            });
        }
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
                // Portal projectiles place a portal where they land
                if (projectile.type === 'portal') {
                    this.placePortal(projectile.sprite.x, projectile.sprite.y);
                }
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

                            // Portal projectiles place a portal where they hit an enemy
                            if (projectile.type === 'portal') {
                                this.placePortal(projectile.sprite.x, projectile.sprite.y);
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

            case 'bounce':
                // BMW Bouncer trampoline - launch enemy upward
                if (enemySprite.body && enemySprite.body.setVelocityY) {
                    const launch = projectile.launchVelocity || 450;
                    enemySprite.body.setVelocityY(-launch);
                }
                this.createBounceRingEffect(enemySprite.x, enemySprite.y);
                break;

            case 'netCapture':
                // BMW Bouncer capture net - damage nearby enemies in radius
                this.applyCaptureNetAoE(projectile, enemySprite, enemyObj);
                break;
        }
    }

    createBounceRingEffect(x, y) {
        const ring = this.scene.add.ellipse(x, y + 10, 60, 16, 0xe22400, 0.7);
        ring.setStrokeStyle(3, 0x0066b2);
        ring.setDepth(100);
        this.scene.tweens.add({
            targets: ring,
            scaleX: 2.2,
            scaleY: 1.4,
            alpha: 0,
            duration: 500,
            onComplete: () => ring.destroy()
        });
    }

    applyCaptureNetAoE(projectile, hitEnemySprite, hitEnemyObj) {
        const radius = projectile.netRadius || 70;
        const aoeDamage = Math.round(projectile.damage * 0.7);
        // Expanding net visual
        const netRing = this.scene.add.circle(hitEnemySprite.x, hitEnemySprite.y, 10, 0xffffff, 0.35);
        netRing.setStrokeStyle(4, 0x0066b2);
        netRing.setDepth(100);
        this.scene.tweens.add({
            targets: netRing,
            radius: radius,
            scaleX: radius / 10,
            scaleY: radius / 10,
            alpha: 0,
            duration: 450,
            onComplete: () => netRing.destroy()
        });
        if (!this.scene.enemies) return;
        this.scene.enemies.children.entries.forEach(other => {
            if (!other.active || other === hitEnemySprite) return;
            const dist = Phaser.Math.Distance.Between(hitEnemySprite.x, hitEnemySprite.y, other.x, other.y);
            if (dist > radius) return;
            if (other.getData && other.getData('enemy')) {
                const enemyObj = other.getData('enemy');
                if (enemyObj && enemyObj.health > 0) {
                    enemyObj.takeDamage(aoeDamage);
                    if (other.body && other.body.setVelocityX) {
                        const dir = other.x < hitEnemySprite.x ? -1 : 1;
                        other.body.setVelocityX(dir * 180);
                    }
                }
            }
        });
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
        this.previousInputs.stoneBlast = this.controls.isStoneBlast();
        this.previousInputs.grimlockTransform = this.controls.isGrimlockTransform();
        this.previousInputs.duckLaser = this.controls.isDuckLaser();
        this.previousInputs.dogLaser = this.controls.isDuckLaser();
        this.previousInputs.vibeCoderTransform = (typeof this.controls.isVibeCoderTransform === 'function')
            ? this.controls.isVibeCoderTransform()
            : false;
        this.previousInputs.vibeSpawn1 = !!(this.controls.keys && this.controls.keys['Digit1']);
        this.previousInputs.vibeSpawn2 = !!(this.controls.keys && this.controls.keys['Digit2']);
        this.previousInputs.vibeSpawn3 = !!(this.controls.keys && this.controls.keys['Digit3']);
        this.previousInputs.vibeCharm  = !!(this.controls.keys && this.controls.keys['KeyX']);
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

    /**
     * Resolve and (re)bind the Transformer strategy that matches the active
     * outfit. If the outfit has changed since last sync, the previous
     * transformer is destroyed and a fresh one is built from
     * window.TransformerRegistry.
     *
     * Returns the active Transformer instance (or null when the active outfit
     * has no registered transformer).
     */
    syncTransformerForOutfit() {
        const currentOutfit = window.gameInstance?.gameData?.outfits?.current || 'default';
        if (this._activeTransformerKey === currentOutfit) {
            return this.transformer;
        }
        // Outfit changed — discard the old transformer and rebuild.
        if (this.transformer && typeof this.transformer.destroy === 'function') {
            try { this.transformer.destroy(); } catch (e) { /* noop */ }
        }
        this.transformer = null;
        this._activeTransformerKey = currentOutfit;
        const registry = (typeof window !== 'undefined') ? window.TransformerRegistry : null;
        const factory = registry ? registry[currentOutfit] : null;
        if (typeof factory === 'function') {
            try {
                this.transformer = factory(this);
            } catch (e) {
                console.error('Failed to instantiate transformer for outfit', currentOutfit, e);
                this.transformer = null;
            }
        }
        // Restore the underlying sprite alpha when we move OUT of a transformer
        // costume (e.g. swapping back to default). Per-form alpha hides happen
        // inside the transformer's buildVisuals.
        if (!this.transformer && this.sprite && this.sprite.setAlpha) {
            this.sprite.setAlpha(1);
        }
        return this.transformer;
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
        
        // Clean up Grimlock visuals
        if (this.grimlockVisuals) {
            this.grimlockVisuals.forEach(visual => {
                if (visual && visual.destroy) visual.destroy();
            });
            this.grimlockVisuals = [];
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
