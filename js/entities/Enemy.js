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

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        
        // Show health bar when damaged
        this.healthBarBg.setVisible(true);
        this.healthBarFill.setVisible(true);
        
        // Flash red when taking damage
        this.isFlashing = true;
        this.flashTimer = 200;
        
        // Stun briefly when hit
        this.changeState('stunned');
        
        console.log(`Enemy took ${amount} damage. Health: ${this.health}/${this.maxHealth}`);
        
        // Create damage effect
        this.createDamageEffect();
    }

    createDamageEffect() {
        const damageText = this.scene.add.text(
            this.sprite.x, 
            this.sprite.y - 20, 
            '-20', 
            {
                fontSize: '16px',
                fill: '#ff0000',
                fontWeight: 'bold'
            }
        ).setOrigin(0.5);
        
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30,
            alpha: 0,
            duration: 800,
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

    die() {
        console.log('Enemy defeated!');
        
        // Award points to player
        window.gameInstance.addScore(100);
        
        // Death effect
        this.createDeathEffect();
        
        // Remove from scene after effect
        this.scene.time.delayedCall(500, () => {
            this.destroy();
        });
    }

    createDeathEffect() {
        // Explosion effect
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
    }
};
