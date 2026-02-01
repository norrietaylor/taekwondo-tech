// Titan enemy with red line indicators and basic AI
class Enemy {
    constructor(scene, x, y, enemyType = 'titan') {
        this.scene = scene;
        this.enemyType = enemyType;
        
        // Create enemy sprite - larger than player to represent titans
        this.sprite = scene.add.rectangle(x, y, 48, 64, 0x4a4a4a);
        this.sprite.setStrokeStyle(3, 0x2c2c2c);
        
        // Physics body
        scene.physics.add.existing(this.sprite);
        this.body = this.sprite.body;
        this.body.setCollideWorldBounds(true);
        this.body.setSize(44, 60);
        
        // Enemy properties
        this.health = 60;
        this.maxHealth = 60;
        this.speed = 80;
        this.damage = 20;
        this.attackRange = 50;
        this.detectionRange = 200;
        this.attackCooldown = 0;
        this.attackDelay = 1500; // ms
        
        // AI state
        this.state = 'patrol'; // patrol, chase, attack, stunned
        this.facingRight = true;
        this.patrolStart = x;
        this.patrolEnd = x + 200;
        this.lastStateChange = 0;
        
        // Visual elements
        this.redLineIndicator = null;
        this.eyes = [];
        this.healthBar = null;
        
        // Create visual elements
        this.createVisualElements();
        
        // Animation properties
        this.walkTimer = 0;
        this.flashTimer = 0;
        this.isFlashing = false;
        
        console.log(`${enemyType} enemy created at:`, x, y);
    }

    createVisualElements() {
        // Red line indicator above head (as specified in requirements)
        this.redLineIndicator = this.scene.add.rectangle(
            this.sprite.x, 
            this.sprite.y - 45, 
            40, 
            3, 
            0xff0000
        );
        
        // Add glowing effect to red line
        this.redLineIndicator.setAlpha(0.8);
        this.scene.tweens.add({
            targets: this.redLineIndicator,
            alpha: 1.0,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Enemy eyes (menacing look)
        const leftEye = this.scene.add.circle(this.sprite.x - 8, this.sprite.y - 12, 3, 0xff4444);
        const rightEye = this.scene.add.circle(this.sprite.x + 8, this.sprite.y - 12, 3, 0xff4444);
        this.eyes = [leftEye, rightEye];
        
        // Health bar (only visible when damaged)
        this.createHealthBar();
    }

    createHealthBar() {
        const barWidth = 40;
        const barHeight = 4;
        
        this.healthBarBg = this.scene.add.rectangle(
            this.sprite.x, 
            this.sprite.y - 35, 
            barWidth, 
            barHeight, 
            0x000000
        );
        
        this.healthBarFill = this.scene.add.rectangle(
            this.sprite.x, 
            this.sprite.y - 35, 
            barWidth, 
            barHeight, 
            0xff0000
        );
        
        // Hide health bar initially
        this.healthBarBg.setVisible(false);
        this.healthBarFill.setVisible(false);
    }

    update(time, delta) {
        if (this.health <= 0) {
            this.die();
            return;
        }
        
        // Update cooldowns
        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        if (this.flashTimer > 0) this.flashTimer -= delta;
        
        // Update AI based on current state
        this.updateAI(time, delta);
        
        // Update visual elements
        this.updateVisuals();
        
        // Update animations
        this.updateAnimations(delta);
    }

    updateAI(time, delta) {
        const player = this.scene.player;
        if (!player) return;
        
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );
        
        // State machine
        switch (this.state) {
            case 'patrol':
                this.patrolBehavior();
                
                // Check if player is in detection range
                if (distanceToPlayer < this.detectionRange) {
                    this.changeState('chase');
                }
                break;
                
            case 'chase':
                this.chaseBehavior(player);
                
                // Check if close enough to attack
                if (distanceToPlayer < this.attackRange && this.attackCooldown <= 0) {
                    this.changeState('attack');
                }
                
                // Stop chasing if player gets too far
                if (distanceToPlayer > this.detectionRange * 1.5) {
                    this.changeState('patrol');
                }
                break;
                
            case 'attack':
                this.attackBehavior(player);
                break;
                
            case 'stunned':
                // Do nothing, just wait for stun to end
                if (time - this.lastStateChange > 1000) {
                    this.changeState('chase');
                }
                break;
        }
    }

    patrolBehavior() {
        // Simple patrol between two points
        if (this.facingRight) {
            this.body.setVelocityX(this.speed * 0.5);
            if (this.sprite.x >= this.patrolEnd) {
                this.facingRight = false;
            }
        } else {
            this.body.setVelocityX(-this.speed * 0.5);
            if (this.sprite.x <= this.patrolStart) {
                this.facingRight = true;
            }
        }
    }

    chaseBehavior(player) {
        // Move towards player
        const direction = player.sprite.x < this.sprite.x ? -1 : 1;
        this.body.setVelocityX(direction * this.speed);
        this.facingRight = direction > 0;
        
        // Jump if player is higher
        if (player.sprite.y < this.sprite.y - 50 && this.body.blocked.down) {
            this.body.setVelocityY(-300);
        }
    }

    attackBehavior(player) {
        // Stop moving and attack
        this.body.setVelocityX(0);
        
        // Perform attack after short delay
        this.performAttack(player);
        this.attackCooldown = this.attackDelay;
        this.changeState('chase');
    }

    performAttack(player) {
        console.log('Titan enemy attacks!');
        
        // Create attack effect
        this.createAttackEffect();
        
        // Check if attack hits player
        const distanceToPlayer = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            player.sprite.x, player.sprite.y
        );
        
        if (distanceToPlayer < this.attackRange) {
            player.takeDamage(this.damage);
            
            // Knockback effect
            const knockbackDirection = player.sprite.x < this.sprite.x ? -1 : 1;
            player.body.setVelocityX(knockbackDirection * 200);
        }
    }

    createAttackEffect() {
        const attackX = this.sprite.x + (this.facingRight ? 30 : -30);
        const effect = this.scene.add.circle(attackX, this.sprite.y, 20, 0xff4444, 0.7);
        
        this.scene.tweens.add({
            targets: effect,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => effect.destroy()
        });
    }

    changeState(newState) {
        this.state = newState;
        this.lastStateChange = this.scene.time.now;
        console.log(`Enemy state changed to: ${newState}`);
    }

    takeDamage(amount, damageType = 'combat') {
        this.health = Math.max(0, this.health - amount);
        
        // Show health bar when damaged
        this.healthBarBg.setVisible(true);
        this.healthBarFill.setVisible(true);
        
        // Flash red when taking damage
        this.isFlashing = true;
        this.flashTimer = 200;
        
        // Stun briefly when hit (less for stomps since they usually kill)
        const stunDuration = damageType === 'stomp' ? 100 : 500;
        this.changeState('stunned');
        
        console.log(`Enemy took ${amount} ${damageType} damage. Health: ${this.health}/${this.maxHealth}`);
        
        // Create damage effect
        this.createDamageEffect(damageType);
        
        // Check if this kills the enemy
        if (this.health <= 0) {
            this.die(damageType);
        }
    }

    createDamageEffect(damageType = 'combat') {
        let text, color, fontSize;
        
        if (damageType === 'stomp') {
            text = 'STOMP!';
            color = '#ffff00';
            fontSize = '20px';
        } else {
            text = '-20';
            color = '#ff0000';
            fontSize = '16px';
        }
        
        const damageText = this.scene.add.text(
            this.sprite.x, 
            this.sprite.y - 20, 
            text, 
            {
                fontSize: fontSize,
                fill: color,
                fontWeight: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }
        ).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 40,
            alpha: 0,
            duration: damageType === 'stomp' ? 1000 : 800,
            onComplete: () => damageText.destroy()
        });
    }

    updateVisuals() {
        // Update red line indicator position
        this.redLineIndicator.x = this.sprite.x;
        this.redLineIndicator.y = this.sprite.y - 45;
        
        // Update eyes
        this.eyes[0].x = this.sprite.x + (this.facingRight ? -8 : 8);
        this.eyes[0].y = this.sprite.y - 12;
        this.eyes[1].x = this.sprite.x + (this.facingRight ? 8 : -8);
        this.eyes[1].y = this.sprite.y - 12;
        
        // Update health bar
        this.healthBarBg.x = this.sprite.x;
        this.healthBarBg.y = this.sprite.y - 35;
        this.healthBarFill.x = this.sprite.x;
        this.healthBarFill.y = this.sprite.y - 35;
        
        // Update health bar fill
        const healthPercent = this.health / this.maxHealth;
        this.healthBarFill.scaleX = healthPercent;
        
        // Facing direction visual
        if (this.facingRight) {
            this.sprite.setFillStyle(0x4a4a4a);
        } else {
            this.sprite.setFillStyle(0x3a3a3a);
        }
        
        // Flash effect when damaged
        if (this.isFlashing && this.flashTimer > 0) {
            this.sprite.setFillStyle(0xff6666);
        } else {
            this.isFlashing = false;
            this.sprite.setFillStyle(0x4a4a4a); // Reset to original gray color
        }
    }

    updateAnimations(delta) {
        // Simple walk animation (squash and stretch)
        this.walkTimer += delta;
        
        if (Math.abs(this.body.velocity.x) > 10) {
            // Walking animation
            const walkCycle = Math.sin(this.walkTimer * 0.01) * 0.1;
            this.sprite.setScale(1.0 + walkCycle, 1.0 - walkCycle * 0.5);
        } else {
            // Idle animation
            const idleCycle = Math.sin(this.walkTimer * 0.005) * 0.05;
            this.sprite.setScale(1.0, 1.0 + idleCycle);
        }
    }

    // Called when player attacks this enemy
    onPlayerAttack(attackType) {
        const damage = attackType === 'kick' ? 30 : 20;
        this.takeDamage(damage);
        
        // Different reactions to different attacks
        if (attackType === 'kick') {
            // Stronger knockback from kicks
            this.body.setVelocityX(this.facingRight ? -150 : 150);
        }
    }

    die(deathType = 'combat') {
        console.log(`Enemy defeated by ${deathType}!`);
        
        // Award points to player (stomp points are handled in GameScene)
        if (deathType !== 'stomp') {
            window.gameInstance.addScore(100);
        }
        
        // Different death effects based on death type
        if (deathType === 'stomp') {
            this.createStompDeathEffect();
        } else {
            this.createDeathEffect();
        }
        
        // Remove from scene after effect
        const delayTime = deathType === 'stomp' ? 800 : 500;
        this.scene.time.delayedCall(delayTime, () => {
            this.destroy();
        });
    }

    createStompDeathEffect() {
        // Flatten animation - make the enemy appear squashed
        this.sprite.setScale(1.5, 0.2); // Wide and flat
        this.sprite.setFillStyle(0x996666); // Darker color to show defeated
        
        // Create "poof" effect for stomp death
        const poofColor = 0xdddddd;
        
        // Main poof cloud
        for (let i = 0; i < 6; i++) {
            const poof = this.scene.add.circle(
                this.sprite.x + (Math.random() - 0.5) * 30,
                this.sprite.y - 10,
                8 + Math.random() * 6,
                poofColor,
                0.7
            );
            
            this.scene.tweens.add({
                targets: poof,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 600,
                delay: i * 50,
                ease: 'Power1',
                onComplete: () => poof.destroy()
            });
        }
        
        // Stars effect (cartoon-style)
        for (let i = 0; i < 4; i++) {
            const star = this.scene.add.star(
                this.sprite.x + (Math.random() - 0.5) * 40,
                this.sprite.y - 20 - Math.random() * 20,
                5, // points
                8, // inner radius
                16, // outer radius
                0xffff00, // yellow
                0.8
            );
            
            this.scene.tweens.add({
                targets: star,
                y: star.y - 30,
                rotation: Math.PI * 2,
                alpha: 0,
                duration: 800,
                delay: i * 100,
                ease: 'Power1',
                onComplete: () => star.destroy()
            });
        }
        
        // Fade out the flattened enemy
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 600,
            delay: 200
        });
    }

    createDeathEffect() {
        // Explosion effect (regular combat death)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particle = this.scene.add.circle(
                this.sprite.x + Math.cos(angle) * 20,
                this.sprite.y + Math.sin(angle) * 20,
                6,
                0x666666,
                0.8
            );
            
            this.scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * 50,
                y: particle.y + Math.sin(angle) * 50,
                alpha: 0,
                duration: 800,
                onComplete: () => particle.destroy()
            });
        }
    }

    // Get position for external systems
    getPosition() {
        return { x: this.sprite.x, y: this.sprite.y };
    }

    setPosition(x, y) {
        this.sprite.x = x;
        this.sprite.y = y;
    }

    destroy() {
        // Clean up all visual elements
        if (this.redLineIndicator) this.redLineIndicator.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.healthBarFill) this.healthBarFill.destroy();
        this.eyes.forEach(eye => eye.destroy());
        if (this.electricGlow) this.electricGlow.destroy();
        if (this.shadowAura) this.shadowAura.destroy();
        if (this.sprite) this.sprite.destroy();
    }
}

// Factory function for creating different enemy types
window.EnemyFactory = {
    createTitan: function(scene, x, y) {
        return new Enemy(scene, x, y, 'titan');
    },
    
    createIceTitan: function(scene, x, y) {
        const enemy = new Enemy(scene, x, y, 'ice_titan');
        enemy.sprite.setFillStyle(0x87ceeb);
        enemy.speed *= 0.8; // Slower on ice
        return enemy;
    },
    
    createFireTitan: function(scene, x, y) {
        const enemy = new Enemy(scene, x, y, 'fire_titan');
        enemy.sprite.setFillStyle(0xff6347);
        enemy.damage *= 1.5; // More damage
        return enemy;
    },
    
    createPowerTitan: function(scene, x, y) {
        const enemy = new Enemy(scene, x, y, 'power_titan');
        enemy.sprite.setFillStyle(0x9370db);
        enemy.health *= 2; // More health
        enemy.maxHealth *= 2;
        return enemy;
    },
    
    createLightningTitan: function(scene, x, y) {
        const enemy = new Enemy(scene, x, y, 'lightning_titan');
        enemy.sprite.setFillStyle(0x3b82f6);
        enemy.sprite.setStrokeStyle(3, 0xfbbf24);
        enemy.speed *= 1.3; // Faster movement
        enemy.attackDelay *= 0.8; // Faster attacks
        enemy.damage *= 1.2; // More damage
        
        // Add electric glow effect
        const glow = scene.add.circle(x, y, 35, 0xfbbf24, 0.2);
        glow.setDepth(-1);
        scene.tweens.add({
            targets: glow,
            alpha: 0.4,
            duration: 600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Store glow reference to update position
        enemy.electricGlow = glow;
        
        // Override updateVisuals to include glow
        const originalUpdateVisuals = enemy.updateVisuals;
        enemy.updateVisuals = function() {
            originalUpdateVisuals.call(this);
            if (this.electricGlow) {
                this.electricGlow.x = this.sprite.x;
                this.electricGlow.y = this.sprite.y;
            }
        };
        
        return enemy;
    },
    
    createShadowTitan: function(scene, x, y) {
        const enemy = new Enemy(scene, x, y, 'shadow_titan');
        enemy.sprite.setFillStyle(0x1a1a2e);
        enemy.sprite.setStrokeStyle(3, 0x4a5568);
        enemy.health *= 1.8; // More health
        enemy.maxHealth *= 1.8;
        enemy.damage *= 1.4; // More damage
        enemy.detectionRange *= 1.5; // Better detection
        
        // Add shadow aura effect
        const shadow = scene.add.ellipse(x, y, 60, 70, 0x000000, 0.5);
        shadow.setDepth(-1);
        scene.tweens.add({
            targets: shadow,
            alpha: 0.7,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Store shadow reference to update position
        enemy.shadowAura = shadow;
        
        // Override updateVisuals to include shadow
        const originalUpdateVisuals = enemy.updateVisuals;
        enemy.updateVisuals = function() {
            originalUpdateVisuals.call(this);
            if (this.shadowAura) {
                this.shadowAura.x = this.sprite.x;
                this.shadowAura.y = this.sprite.y;
            }
        };
        
        // Make eyes glow purple for shadow titan
        enemy.eyes.forEach(eye => eye.setFillStyle(0x8b5cf6));
        
        return enemy;
    },
    
    createEarthTitan: function(scene, x, y) {
        const enemy = new Enemy(scene, x, y, 'earth_titan');
        enemy.sprite.setFillStyle(0x654321); // Dark brown
        enemy.sprite.setStrokeStyle(4, 0x228b22); // Green vegetation stroke
        enemy.health *= 2.5; // Very tanky
        enemy.maxHealth *= 2.5;
        enemy.damage *= 1.6; // Strong attacks
        enemy.speed *= 0.7; // Slower but powerful
        enemy.attackDelay *= 1.3; // Slower attacks but devastating
        
        // Add rocky texture effect around the titan
        const rockAura = scene.add.polygon(x, y, [
            -35, 0, -25, -30, 0, -40, 25, -30, 35, 0, 25, 30, 0, 40, -25, 30
        ], 0x8b7355, 0.3);
        rockAura.setDepth(-1);
        
        // Add ground rumble effect - shake periodically
        const rumbleInterval = scene.time.addEvent({
            delay: 3000 + Math.random() * 2000,
            callback: () => {
                if (enemy.health > 0 && scene.cameras && scene.cameras.main) {
                    // Only shake if player is nearby
                    const player = scene.player;
                    if (player) {
                        const dist = Phaser.Math.Distance.Between(
                            enemy.sprite.x, enemy.sprite.y,
                            player.sprite.x, player.sprite.y
                        );
                        if (dist < 200) {
                            scene.cameras.main.shake(150, 0.008);
                        }
                    }
                }
            },
            loop: true
        });
        
        // Store references to update and clean up
        enemy.rockAura = rockAura;
        enemy.rumbleInterval = rumbleInterval;
        
        // Override updateVisuals to include rock aura
        const originalUpdateVisuals = enemy.updateVisuals;
        enemy.updateVisuals = function() {
            originalUpdateVisuals.call(this);
            if (this.rockAura) {
                this.rockAura.x = this.sprite.x;
                this.rockAura.y = this.sprite.y;
            }
        };
        
        // Override attack to create ground shake effect
        const originalPerformAttack = enemy.performAttack;
        enemy.performAttack = function(player) {
            console.log('🌍 Earth Titan ground pound!');
            
            // Create ground pound effect
            this.createGroundPoundEffect();
            
            // Check if attack hits player
            const distanceToPlayer = Phaser.Math.Distance.Between(
                this.sprite.x, this.sprite.y,
                player.sprite.x, player.sprite.y
            );
            
            // Larger attack range due to ground pound
            if (distanceToPlayer < this.attackRange * 1.5) {
                player.takeDamage(this.damage);
                
                // Strong knockback and knock up
                const knockbackDirection = player.sprite.x < this.sprite.x ? -1 : 1;
                player.body.setVelocity(knockbackDirection * 300, -200);
            }
            
            // Screen shake for ground pound
            if (scene.cameras && scene.cameras.main) {
                scene.cameras.main.shake(300, 0.025);
            }
        };
        
        // Ground pound effect
        enemy.createGroundPoundEffect = function() {
            const x = this.sprite.x;
            const y = this.sprite.y + 30;
            
            // Create shockwave rings
            for (let i = 0; i < 3; i++) {
                const ring = scene.add.circle(x, y, 20, 0x8b4513, 0.6);
                ring.setDepth(40);
                
                scene.tweens.add({
                    targets: ring,
                    scaleX: 4 + i,
                    scaleY: 1.5 + i * 0.3,
                    alpha: 0,
                    duration: 500,
                    delay: i * 100,
                    onComplete: () => ring.destroy()
                });
            }
            
            // Create flying rocks/debris
            for (let i = 0; i < 8; i++) {
                const rock = scene.add.polygon(
                    x + (Math.random() - 0.5) * 60,
                    y,
                    [0, -8, 6, 0, 3, 8, -3, 8, -6, 0],
                    0x654321,
                    0.9
                );
                rock.setDepth(45);
                
                const targetX = rock.x + (Math.random() - 0.5) * 80;
                const targetY = rock.y - 40 - Math.random() * 60;
                
                scene.tweens.add({
                    targets: rock,
                    x: targetX,
                    y: targetY,
                    rotation: Math.PI * 2 * (Math.random() - 0.5),
                    duration: 400 + Math.random() * 200,
                    ease: 'Power1',
                    onComplete: () => {
                        // Rock falls back down
                        scene.tweens.add({
                            targets: rock,
                            y: rock.y + 100,
                            alpha: 0,
                            duration: 300,
                            onComplete: () => rock.destroy()
                        });
                    }
                });
            }
            
            // Create dust cloud
            for (let i = 0; i < 6; i++) {
                const dust = scene.add.circle(
                    x + (Math.random() - 0.5) * 50,
                    y,
                    10 + Math.random() * 10,
                    0xa0522d,
                    0.5
                );
                dust.setDepth(38);
                
                scene.tweens.add({
                    targets: dust,
                    y: dust.y - 30,
                    scaleX: 2,
                    scaleY: 2,
                    alpha: 0,
                    duration: 600,
                    delay: i * 50,
                    onComplete: () => dust.destroy()
                });
            }
        };
        
        // Override destroy to clean up earth titan parts
        const originalDestroy = enemy.destroy;
        enemy.destroy = function() {
            if (this.rockAura) this.rockAura.destroy();
            if (this.rumbleInterval) this.rumbleInterval.remove();
            originalDestroy.call(this);
        };
        
        // Make eyes glow green for earth titan
        enemy.eyes.forEach(eye => eye.setFillStyle(0x228b22));
        
        // Change red indicator to earth brown
        if (enemy.redLineIndicator) {
            enemy.redLineIndicator.setFillStyle(0x8b4513);
        }
        
        return enemy;
    },
    
    // 🍌 MONKEY TITAN - Throws bananas at the player!
    createMonkeyTitan: function(scene, x, y) {
        const enemy = new Enemy(scene, x, y, 'monkey_titan');
        
        // Brown/tan monkey coloring
        enemy.sprite.setFillStyle(0x8B4513); // Saddle brown
        enemy.sprite.setStrokeStyle(3, 0x5C4033); // Darker brown
        
        // Monkey stats - agile and ranged
        enemy.health = 50;
        enemy.maxHealth = 50;
        enemy.speed = 120; // Faster movement
        enemy.damage = 5; // Low melee damage (prefers throwing)
        enemy.attackRange = 250; // Long range for throwing
        enemy.detectionRange = 350; // Can see player from far
        enemy.attackDelay = 2000; // Time between banana throws
        
        // Banana throwing properties
        enemy.canThrowBanana = true;
        enemy.bananaThrowCooldown = 0;
        enemy.bananaThrowDelay = 2500; // ms between throws
        enemy.bananasThrown = 0;
        enemy.maxBananasPerBurst = 3;
        enemy.burstCooldown = 5000; // Cooldown after throwing max bananas
        
        // Create monkey-specific visual elements
        enemy.createMonkeyVisuals = function() {
            // Monkey ears (circles on sides of head)
            this.leftEar = scene.add.circle(this.sprite.x - 20, this.sprite.y - 20, 8, 0xDEB887);
            this.leftEar.setStrokeStyle(2, 0x8B4513);
            
            this.rightEar = scene.add.circle(this.sprite.x + 20, this.sprite.y - 20, 8, 0xDEB887);
            this.rightEar.setStrokeStyle(2, 0x8B4513);
            
            // Monkey face (lighter belly area simulation)
            this.face = scene.add.ellipse(this.sprite.x, this.sprite.y - 5, 20, 25, 0xDEB887);
            
            // Monkey tail (curved line effect using circles)
            this.tail = scene.add.ellipse(this.sprite.x + 25, this.sprite.y + 20, 30, 8, 0x8B4513);
            this.tail.setRotation(-0.5);
        };
        
        // Call to create visuals
        enemy.createMonkeyVisuals();
        
        // Override updateVisuals to include monkey parts
        const originalUpdateVisuals = enemy.updateVisuals;
        enemy.updateVisuals = function() {
            originalUpdateVisuals.call(this);
            
            // Update ear positions
            if (this.leftEar) {
                this.leftEar.x = this.sprite.x - (this.facingRight ? 18 : -18);
                this.leftEar.y = this.sprite.y - 20;
            }
            if (this.rightEar) {
                this.rightEar.x = this.sprite.x + (this.facingRight ? 18 : -18);
                this.rightEar.y = this.sprite.y - 20;
            }
            if (this.face) {
                this.face.x = this.sprite.x;
                this.face.y = this.sprite.y - 5;
            }
            if (this.tail) {
                this.tail.x = this.sprite.x + (this.facingRight ? -25 : 25);
                this.tail.y = this.sprite.y + 20;
                this.tail.setRotation(this.facingRight ? 0.5 : -0.5);
            }
        };
        
        // Override attack behavior to throw bananas
        const originalAttackBehavior = enemy.attackBehavior;
        enemy.attackBehavior = function(player) {
            // Stop moving while throwing
            this.body.setVelocityX(0);
            
            // Face the player
            this.facingRight = player.sprite.x > this.sprite.x;
            
            // Throw banana!
            this.throwBanana(player);
            
            this.attackCooldown = this.attackDelay;
            this.changeState('chase');
        };
        
        // Banana throwing method
        enemy.throwBanana = function(player) {
            console.log('🐒 Monkey Titan throws a banana!');
            
            // Check if BananaManager exists (banana mode active)
            if (scene.bananaManager) {
                scene.bananaManager.spawnBananaFrom(
                    this.sprite.x,
                    this.sprite.y - 10,
                    player.sprite.x,
                    player.sprite.y
                );
            } else {
                // Create standalone banana if not in banana mode
                if (window.Banana) {
                    const dx = player.sprite.x - this.sprite.x;
                    const dy = player.sprite.y - this.sprite.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const speed = 250;
                    
                    const velocityX = (dx / distance) * speed;
                    const velocityY = (dy / distance) * speed - 80;
                    
                    const banana = new window.Banana(scene, this.sprite.x, this.sprite.y - 10, velocityX, velocityY);
                    
                    // Set up collision with platforms
                    if (scene.platforms) {
                        scene.physics.add.collider(banana.sprite, scene.platforms);
                    }
                    
                    // Set up collision with player
                    if (scene.player) {
                        scene.physics.add.overlap(
                            scene.player.sprite,
                            banana.sprite,
                            (playerSprite, bananaSprite) => {
                                const bananaObj = bananaSprite.getData('banana');
                                if (bananaObj && !bananaObj.destroyed && !bananaObj.isDeflected) {
                                    if (scene.player.isAttacking) {
                                        bananaObj.onDeflect(scene.player, 'kick');
                                    } else {
                                        bananaObj.onPlayerContact(scene.player);
                                    }
                                }
                            }
                        );
                    }
                }
            }
            
            // Create throw animation effect
            this.createThrowEffect();
            
            this.bananasThrown++;
        };
        
        // Throw animation effect
        enemy.createThrowEffect = function() {
            const throwX = this.sprite.x + (this.facingRight ? 20 : -20);
            const throwY = this.sprite.y - 10;
            
            // Arm swing effect
            const arm = scene.add.rectangle(throwX, throwY, 15, 6, 0x8B4513);
            arm.setRotation(this.facingRight ? -0.5 : 0.5);
            
            scene.tweens.add({
                targets: arm,
                rotation: this.facingRight ? 0.5 : -0.5,
                scaleX: 1.2,
                alpha: 0,
                duration: 300,
                onComplete: () => arm.destroy()
            });
            
            // Banana emoji pop effect
            const emoji = scene.add.text(throwX, throwY - 20, '🍌', {
                fontSize: '20px'
            }).setOrigin(0.5);
            
            scene.tweens.add({
                targets: emoji,
                y: throwY - 50,
                alpha: 0,
                duration: 500,
                onComplete: () => emoji.destroy()
            });
        };
        
        // Override destroy to clean up monkey parts
        const originalDestroy = enemy.destroy;
        enemy.destroy = function() {
            if (this.leftEar) this.leftEar.destroy();
            if (this.rightEar) this.rightEar.destroy();
            if (this.face) this.face.destroy();
            if (this.tail) this.tail.destroy();
            originalDestroy.call(this);
        };
        
        // Make eyes yellow like a monkey
        enemy.eyes.forEach(eye => eye.setFillStyle(0xFFD700));
        
        // Change red indicator to banana yellow
        if (enemy.redLineIndicator) {
            enemy.redLineIndicator.setFillStyle(0xFFE135);
        }
        
        console.log('🐒 Monkey Titan created at:', x, y);
        
        return enemy;
    }
};
