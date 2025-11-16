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
                punch: false,
                activate: false
            }
        };
        
        this.isMobile = this.detectMobile();
        
        // Ensure DOM is ready before setting up mobile controls
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupMobileControls();
                this.bindEvents();
            });
        } else {
            this.setupMobileControls();
            this.bindEvents();
        }
    }

    detectMobile() {
        // Check user agent first - this catches tablets and mobile devices regardless of screen size
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Check for touch capability - modern way to detect touch devices
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Check if device has coarse pointer (touch) - CSS media query approach
        const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        
        // iPad in desktop mode detection - has touch but claims to be Macintosh
        const isPadInDesktopMode = isTouchDevice && navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1;
        
        // Fallback for small screens (phones in landscape, small tablets)
        const isSmallScreen = window.innerWidth <= 768;
        
        console.log('Mobile detection details:', {
            isMobileDevice,
            isTouchDevice,
            hasCoarsePointer,
            isPadInDesktopMode,
            isSmallScreen,
            userAgent: navigator.userAgent,
            maxTouchPoints: navigator.maxTouchPoints
        });
        
        // Mobile if: explicit mobile device OR has touch capability OR iPad in desktop mode
        return isMobileDevice || isTouchDevice || hasCoarsePointer || isPadInDesktopMode;
    }

    setupMobileControls() {
        const mobileControls = document.getElementById('mobileControls');
        
        // Check for manual force-enable via URL parameter or localStorage
        const urlParams = new URLSearchParams(window.location.search);
        const forceTouch = urlParams.get('touch') === 'true' || localStorage.getItem('forceMobileControls') === 'true';
        
        if (this.isMobile || forceTouch) {
            if (mobileControls) {
                mobileControls.style.display = 'block';
                console.log('Mobile controls enabled:', {
                    reason: this.isMobile ? 'mobile detected' : 'force enabled',
                    elementFound: true
                });
            } else {
                console.warn('Mobile controls element not found - looking for #mobileControls');
            }
        } else {
            console.log('Mobile not detected - controls will remain hidden');
            console.log('HINT: Add ?touch=true to URL or run localStorage.setItem("forceMobileControls", "true") to force enable');
            
            // Still show controls if we detect touch capability but failed mobile detection
            if (('ontouchstart' in window || navigator.maxTouchPoints > 0) && mobileControls) {
                console.log('Touch capability detected - enabling controls anyway as fallback');
                mobileControls.style.display = 'block';
                this.isMobile = true; // Force mobile mode
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
            this.mobile.buttons = { jump: false, kick: false, punch: false, activate: false };
        });
    }

    setupMobileTouchControls() {
        const joystick = document.getElementById('joystick');
        const joystickKnob = document.getElementById('joystickKnob');
        const jumpBtn = document.getElementById('jumpBtn');
        const kickBtn = document.getElementById('kickBtn');
        const punchBtn = document.getElementById('punchBtn');
        const activateBtn = document.getElementById('activateBtn');

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

        // Joystick touch events with iPad-specific fixes
        joystick.addEventListener('touchstart', (e) => {
            console.log('Joystick touchstart detected:', e.touches.length, 'touches');
            e.preventDefault();
            e.stopPropagation();
            this.mobile.joystick.active = true;
            this.handleJoystickMove(e.touches[0]);
        }, { passive: false });

        joystick.addEventListener('touchmove', (e) => {
            if (this.mobile.joystick.active) {
                console.log('Joystick touchmove active');
                e.preventDefault();
                e.stopPropagation();
                this.handleJoystickMove(e.touches[0]);
            }
        }, { passive: false });

        joystick.addEventListener('touchend', (e) => {
            console.log('Joystick touchend detected');
            e.preventDefault();
            e.stopPropagation();
            this.mobile.joystick.active = false;
            this.mobile.joystick.x = 0;
            this.mobile.joystick.y = 0;
            joystickKnob.style.transform = 'translate(-50%, -50%)';
        }, { passive: false });

        // Fallback pointer events for iPad compatibility
        joystick.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'touch') {
                console.log('Joystick pointerdown fallback activated');
                e.preventDefault();
                this.mobile.joystick.active = true;
                this.handleJoystickMove(e);
            }
        });

        joystick.addEventListener('pointermove', (e) => {
            if (e.pointerType === 'touch' && this.mobile.joystick.active) {
                e.preventDefault();
                this.handleJoystickMove(e);
            }
        });

        joystick.addEventListener('pointerup', (e) => {
            if (e.pointerType === 'touch') {
                console.log('Joystick pointerup fallback activated');
                e.preventDefault();
                this.mobile.joystick.active = false;
                this.mobile.joystick.x = 0;
                this.mobile.joystick.y = 0;
                joystickKnob.style.transform = 'translate(-50%, -50%)';
            }
        });

        // Action button events with iPad-specific fixes
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', (e) => {
                console.log('Jump button touchstart');
                e.preventDefault();
                e.stopPropagation();
                this.mobile.buttons.jump = true;
            }, { passive: false });
            jumpBtn.addEventListener('touchend', (e) => {
                console.log('Jump button touchend');
                e.preventDefault();
                e.stopPropagation();
                this.mobile.buttons.jump = false;
            }, { passive: false });
            
            // Pointer event fallbacks
            jumpBtn.addEventListener('pointerdown', (e) => {
                if (e.pointerType === 'touch') {
                    console.log('Jump button pointerdown fallback');
                    e.preventDefault();
                    this.mobile.buttons.jump = true;
                }
            });
            jumpBtn.addEventListener('pointerup', (e) => {
                if (e.pointerType === 'touch') {
                    console.log('Jump button pointerup fallback');
                    e.preventDefault();
                    this.mobile.buttons.jump = false;
                }
            });
        }

        if (kickBtn) {
            kickBtn.addEventListener('touchstart', (e) => {
                console.log('Kick button touchstart');
                e.preventDefault();
                e.stopPropagation();
                this.mobile.buttons.kick = true;
            }, { passive: false });
            kickBtn.addEventListener('touchend', (e) => {
                console.log('Kick button touchend');
                e.preventDefault();
                e.stopPropagation();
                this.mobile.buttons.kick = false;
            }, { passive: false });
            
            // Pointer event fallbacks
            kickBtn.addEventListener('pointerdown', (e) => {
                if (e.pointerType === 'touch') {
                    console.log('Kick button pointerdown fallback');
                    e.preventDefault();
                    this.mobile.buttons.kick = true;
                }
            });
            kickBtn.addEventListener('pointerup', (e) => {
                if (e.pointerType === 'touch') {
                    console.log('Kick button pointerup fallback');
                    e.preventDefault();
                    this.mobile.buttons.kick = false;
                }
            });
        }

        if (punchBtn) {
            punchBtn.addEventListener('touchstart', (e) => {
                console.log('Punch button touchstart');
                e.preventDefault();
                e.stopPropagation();
                this.mobile.buttons.punch = true;
            }, { passive: false });
            punchBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.mobile.buttons.punch = false;
            }, { passive: false });
            
            // Pointer event fallbacks
            punchBtn.addEventListener('pointerdown', (e) => {
                if (e.pointerType === 'touch') {
                    console.log('Punch button pointerdown fallback');
                    e.preventDefault();
                    this.mobile.buttons.punch = true;
                }
            });
            punchBtn.addEventListener('pointerup', (e) => {
                if (e.pointerType === 'touch') {
                    console.log('Punch button pointerup fallback');
                    e.preventDefault();
                    this.mobile.buttons.punch = false;
                }
            });
        }

        if (activateBtn) {
            activateBtn.addEventListener('touchstart', (e) => {
                console.log('Activate button touchstart');
                e.preventDefault();
                e.stopPropagation();
                this.mobile.buttons.activate = true;
            }, { passive: false });
            activateBtn.addEventListener('touchend', (e) => {
                console.log('Activate button touchend');
                e.preventDefault();
                e.stopPropagation();
                this.mobile.buttons.activate = false;
            }, { passive: false });
            
            // Pointer event fallbacks
            activateBtn.addEventListener('pointerdown', (e) => {
                if (e.pointerType === 'touch') {
                    console.log('Activate button pointerdown fallback');
                    e.preventDefault();
                    this.mobile.buttons.activate = true;
                }
            });
            activateBtn.addEventListener('pointerup', (e) => {
                if (e.pointerType === 'touch') {
                    console.log('Activate button pointerup fallback');
                    e.preventDefault();
                    this.mobile.buttons.activate = false;
                }
            });
        }
    }

    handleJoystickMove(touch) {
        const joystickKnob = document.getElementById('joystickKnob');
        if (!joystickKnob) return;

        // Handle both touch events and pointer events
        const clientX = touch.clientX !== undefined ? touch.clientX : touch.pageX;
        const clientY = touch.clientY !== undefined ? touch.clientY : touch.pageY;

        const deltaX = clientX - this.mobile.joystick.centerX;
        const deltaY = clientY - this.mobile.joystick.centerY;
        
        console.log('Joystick move:', { clientX, clientY, centerX: this.mobile.joystick.centerX, centerY: this.mobile.joystick.centerY, deltaX, deltaY });
        
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
        
        console.log('Joystick result:', { x: this.mobile.joystick.x, y: this.mobile.joystick.y, distance });
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

    isActivate() {
        return this.keys['KeyE'] || this.keys['KeyQ'] || 
               (this.isMobile && this.mobile.buttons.activate);
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
