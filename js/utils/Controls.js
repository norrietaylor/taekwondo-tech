// Cross-platform input handling for desktop and mobile
class Controls {
    constructor() {
        this.keys = {};
        this.mobile = {
            joystick: {
                active: false,
                x: 0,
                y: 0,
                centerX: 0,
                centerY: 0,
                radius: 40
            },
            buttons: {
                
                jump: false,
                kick: false,
                punch: false
            }
        };
        
        this.isMobile = this.detectMobile();
        this.setupMobileControls();
        this.bindEvents();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    }

    setupMobileControls() {
        if (this.isMobile) {
            const mobileControls = document.getElementById('mobileControls');
            if (mobileControls) {
                mobileControls.style.display = 'block';
            }
        }
    }

    bindEvents() {
        // Desktop keyboard events
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            // Prevent default for game keys to avoid page scrolling
            const gameKeys = ['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyX', 'KeyZ'];
            if (gameKeys.includes(event.code)) {
                event.preventDefault();
            }
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });

        // Mobile touch controls
        if (this.isMobile) {
            this.setupMobileTouchControls();
        }

        // Handle window focus/blur
        window.addEventListener('blur', () => {
            // Clear all keys when window loses focus
            this.keys = {};
            this.mobile.buttons = { jump: false, kick: false, punch: false };
        });
    }

    setupMobileTouchControls() {
        const joystick = document.getElementById('joystick');
        const joystickKnob = document.getElementById('joystickKnob');
        const jumpBtn = document.getElementById('jumpBtn');
        const kickBtn = document.getElementById('kickBtn');
        const punchBtn = document.getElementById('punchBtn');

        if (!joystick || !joystickKnob) return;

        // Calculate joystick center
        const updateJoystickCenter = () => {
            const rect = joystick.getBoundingClientRect();
            this.mobile.joystick.centerX = rect.left + rect.width / 2;
            this.mobile.joystick.centerY = rect.top + rect.height / 2;
        };

        // Update center on resize
        window.addEventListener('resize', updateJoystickCenter);
        updateJoystickCenter();

        // Joystick touch events
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.mobile.joystick.active = true;
            this.handleJoystickMove(e.touches[0]);
        });

        joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.mobile.joystick.active) {
                this.handleJoystickMove(e.touches[0]);
            }
        });

        joystick.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mobile.joystick.active = false;
            this.mobile.joystick.x = 0;
            this.mobile.joystick.y = 0;
            joystickKnob.style.transform = 'translate(-50%, -50%)';
        });

        // Action button events
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobile.buttons.jump = true;
            });
            jumpBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobile.buttons.jump = false;
            });
        }

        if (kickBtn) {
            kickBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobile.buttons.kick = true;
            });
            kickBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobile.buttons.kick = false;
            });
        }

        if (punchBtn) {
            punchBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.mobile.buttons.punch = true;
            });
            punchBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.mobile.buttons.punch = false;
            });
        }
    }

    handleJoystickMove(touch) {
        const joystickKnob = document.getElementById('joystickKnob');
        if (!joystickKnob) return;

        const deltaX = touch.clientX - this.mobile.joystick.centerX;
        const deltaY = touch.clientY - this.mobile.joystick.centerY;
        
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = this.mobile.joystick.radius;

        if (distance <= maxDistance) {
            this.mobile.joystick.x = deltaX / maxDistance;
            this.mobile.joystick.y = deltaY / maxDistance;
            joystickKnob.style.transform = `translate(${deltaX - 20}px, ${deltaY - 20}px)`;
        } else {
            // Constrain to circle
            const angle = Math.atan2(deltaY, deltaX);
            const constrainedX = Math.cos(angle) * maxDistance;
            const constrainedY = Math.sin(angle) * maxDistance;
            
            this.mobile.joystick.x = constrainedX / maxDistance;
            this.mobile.joystick.y = constrainedY / maxDistance;
            joystickKnob.style.transform = `translate(${constrainedX - 20}px, ${constrainedY - 20}px)`;
        }
    }

    // Input query methods
    isLeft() {
        return this.keys['ArrowLeft'] || this.keys['KeyA'] || 
               (this.isMobile && this.mobile.joystick.x < -0.3);
    }

    isRight() {
        return this.keys['ArrowRight'] || this.keys['KeyD'] || 
               (this.isMobile && this.mobile.joystick.x > 0.3);
    }

    isUp() {
        return this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Space'] ||
               (this.isMobile && this.mobile.buttons.jump);
    }

    isDown() {
        return this.keys['ArrowDown'] || this.keys['KeyS'] ||
               (this.isMobile && this.mobile.joystick.y > 0.3);
    }

    isJump() {
        return this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW'] ||
               (this.isMobile && this.mobile.buttons.jump);
    }

    isKick() {
        return this.keys['KeyX'] || 
               (this.isMobile && this.mobile.buttons.kick);
    }

    isPunch() {
        return this.keys['KeyZ'] || 
               (this.isMobile && this.mobile.buttons.punch);
    }

    isAction() {
        return this.keys['Enter'] || this.keys['Space'];
    }

    // For one-time key presses (not held)
    wasJustPressed(keyMethod) {
        if (!this.lastFrameState) this.lastFrameState = {};
        
        const currentState = this[keyMethod]();
        const wasPressed = currentState && !this.lastFrameState[keyMethod];
        this.lastFrameState[keyMethod] = currentState;
        
        return wasPressed;
    }

    // Get horizontal movement value (-1 to 1)
    getHorizontal() {
        let horizontal = 0;
        
        if (this.isLeft()) horizontal -= 1;
        if (this.isRight()) horizontal += 1;
        
        // For mobile, use joystick value for smoother movement
        if (this.isMobile && this.mobile.joystick.active) {
            horizontal = this.mobile.joystick.x;
        }
        
        return horizontal;
    }

    // Get vertical movement value (-1 to 1)
    getVertical() {
        let vertical = 0;
        
        if (this.isUp()) vertical -= 1;
        if (this.isDown()) vertical += 1;
        
        // For mobile, use joystick value
        if (this.isMobile && this.mobile.joystick.active) {
            vertical = this.mobile.joystick.y;
        }
        
        return vertical;
    }

    // Update method to be called each frame
    update() {
        // Clear one-frame states if needed
        // This could be used for managing single-press events
    }

    // Debug method
    getDebugInfo() {
        return {
            isMobile: this.isMobile,
            keys: Object.keys(this.keys).filter(key => this.keys[key]),
            mobile: this.mobile,
            horizontal: this.getHorizontal(),
            vertical: this.getVertical()
        };
    }
}
