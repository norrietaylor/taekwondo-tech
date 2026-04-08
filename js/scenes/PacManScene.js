// Pac-Man Mode - Classic top-down maze game between levels
// Enemies are game costumes, dots are food items, 3 levels to clear

class PacManScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PacManScene' });
    }

    // 21x21 fixed maze layout
    // 0=path(food), 1=wall, 2=power pellet, 3=ghost spawn, 4=player spawn, 5=empty(no food)
    static MAZE = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
        [1,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1],
        [1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1],
        [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
        [1,1,1,1,1,0,1,1,1,5,1,5,1,1,1,0,1,1,1,1,1],
        [5,5,5,5,1,0,1,5,5,5,5,5,5,5,1,0,1,5,5,5,5],
        [1,1,1,1,1,0,1,5,1,1,5,1,1,5,1,0,1,1,1,1,1],
        [5,5,5,5,5,0,5,5,1,3,3,3,1,5,5,0,5,5,5,5,5],
        [1,1,1,1,1,0,1,5,1,1,1,1,1,5,1,0,1,1,1,1,1],
        [5,5,5,5,1,0,1,5,5,5,5,5,5,5,1,0,1,5,5,5,5],
        [1,1,1,1,1,0,1,5,1,1,1,1,1,5,1,0,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
        [1,2,0,1,0,0,0,0,0,0,4,0,0,0,0,0,0,1,0,2,1],
        [1,1,0,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,0,1,1],
        [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];

    static TILE_SIZE = 25;
    static COLS = 21;
    static ROWS = 21;

    static FOOD_COLORS = {
        banana:  { color: 0xFFE135, name: 'Banana',  emoji: '🍌' },
        apple:   { color: 0x32CD32, name: 'Apple',   emoji: '🍎' },
        cherry:  { color: 0xFF0000, name: 'Cherry',  emoji: '🍒' },
        waffle:  { color: 0xD2691E, name: 'Waffle',  emoji: '🧇' },
        pancake: { color: 0xDEB887, name: 'Pancake', emoji: '🥞' },
    };

    static FOOD_KEYS = ['banana', 'apple', 'cherry', 'waffle', 'pancake'];

    static COSTUME_KEYS = [
        'fire', 'ice', 'lightning', 'shadow', 'earth',
        'banana', 'present', 'stone', 'grimlock',
        'bumblebee', 'hotrod', 'elita', 'portalbot'
    ];

    init(data) {
        this.previousLevel = data.previousLevel || 1;
        this.nextGameLevel = data.nextLevel || 2;
        this.pacLevel = 1;          // Current pac-man sub-level (1-3)
        this.maxPacLevels = 2;
        this.lives = 3;
        this.score = 0;
        this.totalFood = 0;
        this.foodEaten = 0;
        this.gameActive = false;
        this.ghostsFrightened = false;
        this.frightenedTimer = null;
        this.ghostsEaten = 0;
    }

    create() {
        // Disable gravity for top-down mode
        this.physics.world.gravity.y = 0;

        // Calculate offsets to center maze
        const mazeW = PacManScene.COLS * PacManScene.TILE_SIZE;
        const mazeH = PacManScene.ROWS * PacManScene.TILE_SIZE;
        this.offsetX = Math.floor((1024 - mazeW) / 2);
        this.offsetY = Math.floor((576 - mazeH) / 2) + 15;

        // Black background for pac-man feel
        this.cameras.main.setBackgroundColor('#000000');

        // Select 4 random costumes for ghosts
        this.selectedCostumes = this.pickGhostCostumes(4);

        // Build the level
        this.buildLevel();

        // Use the game's Controls system (handles preventDefault on arrow keys)
        this.controls = window.gameInstance ? window.gameInstance.controls : null;

        // Fallback: raw DOM key tracking if Controls not available
        this.rawKeys = {};
        this._onKeyDown = (e) => { this.rawKeys[e.code] = true; };
        this._onKeyUp = (e) => { this.rawKeys[e.code] = false; };
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);

        // Mobile swipe support
        this.setupMobileControls();

        // Clean up when scene shuts down
        this.events.once('shutdown', () => {
            window.removeEventListener('keydown', this._onKeyDown);
            window.removeEventListener('keyup', this._onKeyUp);
            this.tweens.killAll();
            this.time.removeAllEvents();
        });

        // Start after countdown
        this.showCountdown();
    }

    buildLevel() {
        // Clear previous level objects
        if (this.wallGraphics) this.wallGraphics.destroy();
        if (this.foodGroup) this.foodGroup.clear(true, true);
        if (this.powerPelletGroup) this.powerPelletGroup.clear(true, true);
        if (this.pacmanContainer) this.pacmanContainer.destroy();
        if (this.ghosts) {
            this.ghosts.forEach(g => {
                if (g.container) g.container.destroy();
            });
        }
        if (this.uiContainer) this.uiContainer.destroy();

        this.foodGroup = this.add.group();
        this.powerPelletGroup = this.add.group();
        this.ghosts = [];
        this.totalFood = 0;
        this.foodEaten = 0;

        this.drawMaze();
        this.placeFood();
        this.createPacMan();
        this.createGhosts();
        this.createUI();
    }

    drawMaze() {
        this.wallGraphics = this.add.graphics();
        const T = PacManScene.TILE_SIZE;
        const maze = PacManScene.MAZE;

        for (let row = 0; row < PacManScene.ROWS; row++) {
            for (let col = 0; col < PacManScene.COLS; col++) {
                if (maze[row][col] === 1) {
                    const x = this.offsetX + col * T;
                    const y = this.offsetY + row * T;

                    // Wall color based on pac-man level
                    const wallColors = [0x2121DE, 0xFF0000, 0x00FF00];
                    const wallColor = wallColors[(this.pacLevel - 1) % wallColors.length];

                    this.wallGraphics.fillStyle(wallColor, 0.9);
                    this.wallGraphics.fillRoundedRect(x + 1, y + 1, T - 2, T - 2, 3);
                    this.wallGraphics.lineStyle(1, wallColor, 0.5);
                    this.wallGraphics.strokeRoundedRect(x + 1, y + 1, T - 2, T - 2, 3);
                }
            }
        }
    }

    placeFood() {
        const T = PacManScene.TILE_SIZE;
        const maze = PacManScene.MAZE;

        for (let row = 0; row < PacManScene.ROWS; row++) {
            for (let col = 0; col < PacManScene.COLS; col++) {
                const cell = maze[row][col];
                const cx = this.offsetX + col * T + T / 2;
                const cy = this.offsetY + row * T + T / 2;

                if (cell === 0) {
                    // Regular food dot
                    const foodKey = PacManScene.FOOD_KEYS[Math.floor(Math.random() * PacManScene.FOOD_KEYS.length)];
                    const foodInfo = PacManScene.FOOD_COLORS[foodKey];
                    const dot = this.add.circle(cx, cy, 3, foodInfo.color);
                    dot.setData('foodType', foodKey);
                    dot.setData('col', col);
                    dot.setData('row', row);
                    this.foodGroup.add(dot);
                    this.totalFood++;
                } else if (cell === 2) {
                    // Power pellet - larger, pulsating
                    const pellet = this.add.circle(cx, cy, 7, 0xFFFFFF);
                    pellet.setData('col', col);
                    pellet.setData('row', row);
                    pellet.setData('isPower', true);
                    this.powerPelletGroup.add(pellet);
                    this.totalFood++;

                    // Pulsate animation
                    this.tweens.add({
                        targets: pellet,
                        scaleX: 0.3,
                        scaleY: 0.3,
                        duration: 300,
                        yoyo: true,
                        repeat: -1
                    });
                }
            }
        }
    }

    createPacMan() {
        const T = PacManScene.TILE_SIZE;
        // Find player spawn (4) in maze
        let startCol = 10, startRow = 15;
        const maze = PacManScene.MAZE;
        for (let r = 0; r < PacManScene.ROWS; r++) {
            for (let c = 0; c < PacManScene.COLS; c++) {
                if (maze[r][c] === 4) { startCol = c; startRow = r; }
            }
        }

        this.pacman = {
            col: startCol,
            row: startRow,
            targetCol: startCol,
            targetRow: startRow,
            x: this.offsetX + startCol * T + T / 2,
            y: this.offsetY + startRow * T + T / 2,
            direction: null,        // current movement direction
            queuedDirection: null,  // buffered input
            speed: 120,             // pixels per second
            mouthOpen: true,
            mouthAngle: 0.25,       // radians for mouth opening
        };

        this.pacmanContainer = this.add.container(this.pacman.x, this.pacman.y);
        this.pacmanGfx = this.add.graphics();
        this.pacmanContainer.add(this.pacmanGfx);
        this.drawPacMan();
    }

    drawPacMan() {
        const g = this.pacmanGfx;
        g.clear();

        const radius = PacManScene.TILE_SIZE / 2 - 2;
        const mouth = this.pacman.mouthAngle;

        // Rotation based on direction
        let rotation = 0;
        if (this.pacman.direction === 'right') rotation = 0;
        else if (this.pacman.direction === 'down') rotation = Math.PI / 2;
        else if (this.pacman.direction === 'left') rotation = Math.PI;
        else if (this.pacman.direction === 'up') rotation = -Math.PI / 2;

        g.fillStyle(0xFFFF00, 1);
        g.beginPath();
        g.arc(0, 0, radius, rotation + mouth, rotation + (Math.PI * 2) - mouth, false);
        g.lineTo(0, 0);
        g.closePath();
        g.fillPath();

        // Eye
        const eyeX = Math.cos(rotation - 0.5) * (radius * 0.4);
        const eyeY = Math.sin(rotation - 0.5) * (radius * 0.4);
        g.fillStyle(0x000000, 1);
        g.fillCircle(eyeX, eyeY, 2);
    }

    createGhosts() {
        const T = PacManScene.TILE_SIZE;
        const maze = PacManScene.MAZE;
        const costumes = window.gameInstance.dragonCostumes;

        // Ghost spawn positions from maze (cell=3)
        const spawnPositions = [];
        for (let r = 0; r < PacManScene.ROWS; r++) {
            for (let c = 0; c < PacManScene.COLS; c++) {
                if (maze[r][c] === 3) spawnPositions.push({ col: c, row: r });
            }
        }

        // Also add a position above ghost house for 4th ghost
        spawnPositions.push({ col: 10, row: 7 });

        const baseSpeed = 25 + (this.previousLevel * 2);
        const levelSpeed = baseSpeed + (this.pacLevel - 1) * 5;

        for (let i = 0; i < 4; i++) {
            const costumeKey = this.selectedCostumes[i];
            const costume = costumes[costumeKey] || costumes['fire'];
            const spawn = spawnPositions[i] || spawnPositions[0];

            const ghost = {
                col: spawn.col,
                row: spawn.row,
                targetCol: spawn.col,
                targetRow: spawn.row,
                x: this.offsetX + spawn.col * T + T / 2,
                y: this.offsetY + spawn.row * T + T / 2,
                direction: 'up',
                speed: levelSpeed + i * 5,
                costumeKey: costumeKey,
                primaryColor: costume.primaryColor,
                secondaryColor: costume.secondaryColor || costume.primaryColor,
                icon: costume.icon || '👻',
                name: costume.name,
                frightened: false,
                eaten: false,
                scatterTarget: this.getScatterTarget(i),
                releaseDelay: i * 3000, // stagger ghost releases
                released: i === 3,      // 4th ghost starts outside
                mode: 'scatter',        // scatter, chase, frightened
                modeTimer: 0,
            };

            ghost.container = this.add.container(ghost.x, ghost.y);
            ghost.gfx = this.add.graphics();
            ghost.container.add(ghost.gfx);

            // Name label
            ghost.label = this.add.text(0, -16, costume.icon, {
                fontSize: '10px'
            }).setOrigin(0.5);
            ghost.container.add(ghost.label);

            this.drawGhost(ghost, false);
            this.ghosts.push(ghost);
        }
    }

    getScatterTarget(index) {
        // Each ghost scatters to a different corner
        const corners = [
            { col: 1, row: 1 },
            { col: 19, row: 1 },
            { col: 1, row: 19 },
            { col: 19, row: 19 }
        ];
        return corners[index % 4];
    }

    drawGhost(ghost, frightened) {
        const g = ghost.gfx;
        g.clear();
        const r = PacManScene.TILE_SIZE / 2 - 2;
        const color = frightened ? 0x0000FF : ghost.primaryColor;

        // Ghost body - rounded top, wavy bottom
        g.fillStyle(color, 1);
        // Top half (semicircle)
        g.beginPath();
        g.arc(0, -2, r, Math.PI, 0, false);
        // Sides down
        g.lineTo(r, r - 2);
        // Wavy bottom
        const waves = 3;
        const waveW = (r * 2) / waves;
        for (let w = 0; w < waves; w++) {
            const wx = r - w * waveW;
            g.lineTo(wx - waveW / 2, r + 2);
            g.lineTo(wx - waveW, r - 2);
        }
        g.closePath();
        g.fillPath();

        // Eyes
        if (ghost.eaten) {
            // Just eyes when eaten
            g.fillStyle(0xFFFFFF, 1);
            g.fillCircle(-4, -4, 3);
            g.fillCircle(4, -4, 3);
            g.fillStyle(0x0000FF, 1);
            g.fillCircle(-3, -4, 1.5);
            g.fillCircle(5, -4, 1.5);
        } else if (frightened) {
            // Frightened face
            g.fillStyle(0xFFFFFF, 1);
            g.fillCircle(-4, -4, 2);
            g.fillCircle(4, -4, 2);
            // Wavy mouth
            g.lineStyle(1, 0xFFFFFF, 1);
            g.beginPath();
            g.moveTo(-5, 3);
            g.lineTo(-3, 1);
            g.lineTo(-1, 3);
            g.lineTo(1, 1);
            g.lineTo(3, 3);
            g.lineTo(5, 1);
            g.strokePath();
        } else {
            // Normal eyes
            g.fillStyle(0xFFFFFF, 1);
            g.fillCircle(-4, -4, 4);
            g.fillCircle(4, -4, 4);
            // Pupils - look toward movement direction
            let px = 0, py = 0;
            if (ghost.direction === 'left') px = -1.5;
            else if (ghost.direction === 'right') px = 1.5;
            else if (ghost.direction === 'up') py = -1.5;
            else if (ghost.direction === 'down') py = 1.5;
            g.fillStyle(0x000022, 1);
            g.fillCircle(-4 + px, -4 + py, 2);
            g.fillCircle(4 + px, -4 + py, 2);
        }
    }

    createUI() {
        this.uiContainer = this.add.container(0, 0);

        // Score
        this.scoreText = this.add.text(20, 8, `SCORE: ${this.score}`, {
            fontSize: '16px', fontFamily: 'monospace', color: '#ffffff'
        });
        this.uiContainer.add(this.scoreText);

        // Level
        this.levelText = this.add.text(512, 8, `PAC-MAN LEVEL ${this.pacLevel}/3`, {
            fontSize: '16px', fontFamily: 'monospace', color: '#ffff00'
        }).setOrigin(0.5, 0);
        this.uiContainer.add(this.levelText);

        // Lives (pac-man icons)
        this.livesText = this.add.text(900, 8, '', {
            fontSize: '14px', fontFamily: 'monospace', color: '#ffff00'
        });
        this.updateLivesDisplay();
        this.uiContainer.add(this.livesText);

        // Food counter at bottom
        this.foodText = this.add.text(512, 565, `FOOD: 0/${this.totalFood}`, {
            fontSize: '12px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5, 1);
        this.uiContainer.add(this.foodText);
    }

    updateLivesDisplay() {
        let livesStr = 'LIVES: ';
        for (let i = 0; i < this.lives; i++) livesStr += '● ';
        this.livesText.setText(livesStr);
    }

    showCountdown() {
        const countdownText = this.add.text(512, 288, 'READY!', {
            fontSize: '32px', fontFamily: 'monospace', color: '#ffff00',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(100);

        this.time.delayedCall(1000, () => {
            countdownText.setText('3');
        });
        this.time.delayedCall(1700, () => {
            countdownText.setText('2');
        });
        this.time.delayedCall(2400, () => {
            countdownText.setText('1');
        });
        this.time.delayedCall(3100, () => {
            countdownText.setText('GO!');
        });
        this.time.delayedCall(3600, () => {
            countdownText.destroy();
            this.gameActive = true;
            this.ghostReleaseTime = this.time.now;
        });
    }

    pickGhostCostumes(count) {
        const available = [...PacManScene.COSTUME_KEYS];
        const picked = [];
        for (let i = 0; i < count && available.length > 0; i++) {
            const idx = Math.floor(Math.random() * available.length);
            picked.push(available.splice(idx, 1)[0]);
        }
        return picked;
    }

    setupMobileControls() {
        let startX = 0, startY = 0;
        this.input.on('pointerdown', (pointer) => {
            startX = pointer.x;
            startY = pointer.y;
        });
        this.input.on('pointerup', (pointer) => {
            const dx = pointer.x - startX;
            const dy = pointer.y - startY;
            const minSwipe = 30;
            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > minSwipe) {
                    this.pacman.queuedDirection = dx > 0 ? 'right' : 'left';
                }
            } else {
                if (Math.abs(dy) > minSwipe) {
                    this.pacman.queuedDirection = dy > 0 ? 'down' : 'up';
                }
            }
        });
    }

    // ---- UPDATE LOOP ----

    update(time, delta) {
        if (!this.gameActive) return;

        const dt = delta / 1000;

        this.handleInput();
        this.updatePacManMovement(dt);
        this.animatePacManMouth(time);
        this.updateGhostMovement(dt, time);
        this.checkFoodCollision();
        this.checkGhostCollision();
    }

    handleInput() {
        const k = this.rawKeys;
        const c = this.controls;

        const left  = k['ArrowLeft']  || k['KeyA'] || (c && c.isLeft());
        const right = k['ArrowRight'] || k['KeyD'] || (c && c.isRight());
        const up    = k['ArrowUp']    || k['KeyW'] || (c && c.isUp());
        const down  = k['ArrowDown']  || k['KeyS'] || (c && c.isDown());

        if (left)       this.pacman.queuedDirection = 'left';
        else if (right)  this.pacman.queuedDirection = 'right';
        else if (up)     this.pacman.queuedDirection = 'up';
        else if (down)   this.pacman.queuedDirection = 'down';
    }

    updatePacManMovement(dt) {
        const T = PacManScene.TILE_SIZE;
        const pac = this.pacman;
        const speed = pac.speed + (this.pacLevel - 1) * 10;

        const targetX = this.offsetX + pac.targetCol * T + T / 2;
        const targetY = this.offsetY + pac.targetRow * T + T / 2;
        const dx = targetX - pac.x;
        const dy = targetY - pac.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const step = speed * dt;

        if (dist > step) {
            // Still moving to target tile
            pac.x += (dx / dist) * step;
            pac.y += (dy / dist) * step;
        } else {
            // Reached target tile
            pac.x = targetX;
            pac.y = targetY;
            pac.col = pac.targetCol;
            pac.row = pac.targetRow;

            // Handle tunnel wrap
            this.handleTunnelWrap(pac);

            // Try queued direction first
            if (pac.queuedDirection && this.canMove(pac.col, pac.row, pac.queuedDirection)) {
                pac.direction = pac.queuedDirection;
                pac.queuedDirection = null;
            }

            // Move in current direction
            if (pac.direction && this.canMove(pac.col, pac.row, pac.direction)) {
                const next = this.getNextTile(pac.col, pac.row, pac.direction);
                pac.targetCol = next.col;
                pac.targetRow = next.row;
            } else {
                // Hit a wall, stop
                pac.direction = null;
            }
        }

        this.pacmanContainer.setPosition(pac.x, pac.y);
    }

    animatePacManMouth(time) {
        // Animate mouth open/close
        if (this.pacman.direction) {
            this.pacman.mouthAngle = 0.08 + Math.abs(Math.sin(time * 0.012)) * 0.35;
        } else {
            this.pacman.mouthAngle = 0.05;
        }
        this.drawPacMan();
    }

    handleTunnelWrap(entity) {
        // Left tunnel
        if (entity.col <= 0 && entity.direction === 'left') {
            entity.col = PacManScene.COLS - 1;
            entity.targetCol = PacManScene.COLS - 1;
            entity.x = this.offsetX + entity.col * PacManScene.TILE_SIZE + PacManScene.TILE_SIZE / 2;
        }
        // Right tunnel
        if (entity.col >= PacManScene.COLS - 1 && entity.direction === 'right') {
            entity.col = 0;
            entity.targetCol = 0;
            entity.x = this.offsetX + PacManScene.TILE_SIZE / 2;
        }
    }

    canMove(col, row, direction) {
        const next = this.getNextTile(col, row, direction);
        return !this.isWall(next.col, next.row);
    }

    getNextTile(col, row, direction) {
        switch (direction) {
            case 'left':  return { col: col - 1, row };
            case 'right': return { col: col + 1, row };
            case 'up':    return { col, row: row - 1 };
            case 'down':  return { col, row: row + 1 };
            default:      return { col, row };
        }
    }

    isWall(col, row) {
        // Tunnel exits are not walls
        if (row === 9 && (col < 0 || col >= PacManScene.COLS)) return false;
        if (col < 0 || col >= PacManScene.COLS || row < 0 || row >= PacManScene.ROWS) return true;
        return PacManScene.MAZE[row][col] === 1;
    }

    getOpposite(direction) {
        const opposites = { left: 'right', right: 'left', up: 'down', down: 'up' };
        return opposites[direction];
    }

    // ---- GHOST AI ----

    updateGhostMovement(dt, time) {
        this.ghosts.forEach((ghost, i) => {
            // Release delay
            if (!ghost.released) {
                const elapsed = time - this.ghostReleaseTime;
                if (elapsed >= ghost.releaseDelay) {
                    ghost.released = true;
                    ghost.col = 10;
                    ghost.row = 7;
                    ghost.targetCol = 10;
                    ghost.targetRow = 7;
                    ghost.x = this.offsetX + 10 * PacManScene.TILE_SIZE + PacManScene.TILE_SIZE / 2;
                    ghost.y = this.offsetY + 7 * PacManScene.TILE_SIZE + PacManScene.TILE_SIZE / 2;
                    ghost.direction = 'up';
                }
                return;
            }

            // Update mode timer (scatter/chase cycle)
            ghost.modeTimer += dt;
            if (!ghost.frightened && !ghost.eaten) {
                if (ghost.mode === 'scatter' && ghost.modeTimer > 7) {
                    ghost.mode = 'chase';
                    ghost.modeTimer = 0;
                } else if (ghost.mode === 'chase' && ghost.modeTimer > 20) {
                    ghost.mode = 'scatter';
                    ghost.modeTimer = 0;
                }
            }

            this.moveGhost(ghost, dt, i);
        });
    }

    moveGhost(ghost, dt, index) {
        const T = PacManScene.TILE_SIZE;
        const speed = ghost.eaten ? ghost.speed * 2 : (ghost.frightened ? ghost.speed * 0.6 : ghost.speed);

        const targetX = this.offsetX + ghost.targetCol * T + T / 2;
        const targetY = this.offsetY + ghost.targetRow * T + T / 2;
        const dx = targetX - ghost.x;
        const dy = targetY - ghost.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const step = speed * dt;

        if (dist > step) {
            ghost.x += (dx / dist) * step;
            ghost.y += (dy / dist) * step;
        } else {
            ghost.x = targetX;
            ghost.y = targetY;
            ghost.col = ghost.targetCol;
            ghost.row = ghost.targetRow;

            this.handleTunnelWrap(ghost);

            // If eaten and returned to ghost house, revive
            if (ghost.eaten && ghost.row === 9 && ghost.col >= 9 && ghost.col <= 11) {
                ghost.eaten = false;
                ghost.frightened = false;
                ghost.mode = 'chase';
                this.drawGhost(ghost, false);
            }

            // Pick next direction using AI
            const nextDir = this.pickGhostDirection(ghost, index);
            if (nextDir && this.canMove(ghost.col, ghost.row, nextDir)) {
                ghost.direction = nextDir;
                const next = this.getNextTile(ghost.col, ghost.row, nextDir);
                ghost.targetCol = next.col;
                ghost.targetRow = next.row;
            }
        }

        ghost.container.setPosition(ghost.x, ghost.y);
    }

    pickGhostDirection(ghost, index) {
        const directions = ['up', 'down', 'left', 'right'];
        const opposite = this.getOpposite(ghost.direction);

        // Get target tile based on mode
        let targetTile;
        if (ghost.eaten) {
            targetTile = { col: 10, row: 9 }; // Return to ghost house
        } else if (ghost.frightened) {
            // Random direction when frightened
            const valid = directions.filter(d =>
                d !== opposite && this.canMove(ghost.col, ghost.row, d)
            );
            return valid.length > 0 ? valid[Math.floor(Math.random() * valid.length)] : ghost.direction;
        } else if (ghost.mode === 'scatter') {
            targetTile = ghost.scatterTarget;
        } else {
            // Chase mode - different behavior per ghost
            targetTile = this.getChaseTarget(ghost, index);
        }

        // Pick direction that minimizes distance to target (can't reverse)
        let bestDir = null;
        let bestDist = Infinity;

        for (const dir of directions) {
            if (dir === opposite) continue;
            if (!this.canMove(ghost.col, ghost.row, dir)) continue;

            const next = this.getNextTile(ghost.col, ghost.row, dir);
            const d = Math.pow(next.col - targetTile.col, 2) + Math.pow(next.row - targetTile.row, 2);
            if (d < bestDist) {
                bestDist = d;
                bestDir = dir;
            }
        }

        // If stuck, allow reverse
        if (!bestDir) {
            if (this.canMove(ghost.col, ghost.row, opposite)) return opposite;
            return null;
        }

        return bestDir;
    }

    getChaseTarget(ghost, index) {
        const pac = this.pacman;
        switch (index) {
            case 0: // Blinky - direct chase
                return { col: pac.col, row: pac.row };
            case 1: // Pinky - target 4 tiles ahead
                const ahead = this.getNextTile(pac.col, pac.row, pac.direction || 'right');
                return {
                    col: Math.max(0, Math.min(PacManScene.COLS - 1, ahead.col + (pac.direction === 'right' ? 3 : pac.direction === 'left' ? -3 : 0))),
                    row: Math.max(0, Math.min(PacManScene.ROWS - 1, ahead.row + (pac.direction === 'down' ? 3 : pac.direction === 'up' ? -3 : 0)))
                };
            case 2: // Inky - flanking
                return {
                    col: PacManScene.COLS - 1 - pac.col,
                    row: pac.row
                };
            case 3: // Clyde - chase if far, scatter if close
                const distToPlayer = Math.abs(ghost.col - pac.col) + Math.abs(ghost.row - pac.row);
                if (distToPlayer > 8) return { col: pac.col, row: pac.row };
                return ghost.scatterTarget;
            default:
                return { col: pac.col, row: pac.row };
        }
    }

    // ---- COLLISIONS ----

    checkFoodCollision() {
        const pac = this.pacman;

        // Check regular food
        this.foodGroup.getChildren().forEach(dot => {
            if (dot.getData('col') === pac.col && dot.getData('row') === pac.row) {
                this.score += 10;
                this.foodEaten++;
                dot.destroy();
                this.updateUI();

                if (this.foodEaten >= this.totalFood) {
                    this.levelComplete();
                }
            }
        });

        // Check power pellets
        this.powerPelletGroup.getChildren().forEach(pellet => {
            if (pellet.getData('col') === pac.col && pellet.getData('row') === pac.row) {
                this.score += 50;
                this.foodEaten++;
                pellet.destroy();
                this.activatePowerPellet();
                this.updateUI();

                if (this.foodEaten >= this.totalFood) {
                    this.levelComplete();
                }
            }
        });
    }

    activatePowerPellet() {
        this.ghostsFrightened = true;
        this.ghostsEaten = 0;

        this.ghosts.forEach(ghost => {
            if (!ghost.eaten) {
                ghost.frightened = true;
                // Reverse direction
                ghost.direction = this.getOpposite(ghost.direction) || ghost.direction;
                const next = this.getNextTile(ghost.col, ghost.row, ghost.direction);
                if (this.canMove(ghost.col, ghost.row, ghost.direction)) {
                    ghost.targetCol = next.col;
                    ghost.targetRow = next.row;
                }
                this.drawGhost(ghost, true);
            }
        });

        // Clear existing timer
        if (this.frightenedTimer) this.frightenedTimer.remove();

        const frightenDuration = Math.max(8000, 15000 - (this.pacLevel - 1) * 2000);
        this.frightenedTimer = this.time.delayedCall(frightenDuration, () => {
            this.endFrightened();
        });
    }

    endFrightened() {
        this.ghostsFrightened = false;
        this.ghosts.forEach(ghost => {
            if (!ghost.eaten) {
                ghost.frightened = false;
                this.drawGhost(ghost, false);
            }
        });
    }

    checkGhostCollision() {
        const pac = this.pacman;

        this.ghosts.forEach(ghost => {
            if (!ghost.released) return;

            const dx = Math.abs(pac.x - ghost.x);
            const dy = Math.abs(pac.y - ghost.y);
            const collisionDist = PacManScene.TILE_SIZE * 0.7;

            if (dx < collisionDist && dy < collisionDist) {
                if (ghost.eaten) return;

                if (ghost.frightened) {
                    // Eat the ghost!
                    this.ghostsEaten++;
                    const points = 200 * Math.pow(2, this.ghostsEaten - 1);
                    this.score += points;
                    ghost.eaten = true;
                    ghost.frightened = false;
                    this.drawGhost(ghost, false);

                    // Show points popup
                    const popup = this.add.text(ghost.x, ghost.y, `${points}`, {
                        fontSize: '14px', fontFamily: 'monospace', color: '#00ffff'
                    }).setOrigin(0.5).setDepth(100);
                    this.tweens.add({
                        targets: popup,
                        y: popup.y - 30,
                        alpha: 0,
                        duration: 800,
                        onComplete: () => popup.destroy()
                    });

                    this.updateUI();
                } else {
                    // Pac-Man dies
                    this.loseLife();
                }
            }
        });
    }

    loseLife() {
        this.gameActive = false;
        this.lives--;

        // Death animation
        this.tweens.add({
            targets: this.pacmanContainer,
            scaleX: 0,
            scaleY: 0,
            angle: 720,
            duration: 800,
            onComplete: () => {
                this.pacmanContainer.setScale(1);
                this.pacmanContainer.setAngle(0);

                if (this.lives <= 0) {
                    this.gameOver();
                } else {
                    this.updateLivesDisplay();
                    this.resetPositions();
                    this.showCountdown();
                }
            }
        });
    }

    resetPositions() {
        const T = PacManScene.TILE_SIZE;
        const maze = PacManScene.MAZE;

        // Reset pac-man
        let startCol = 10, startRow = 15;
        for (let r = 0; r < PacManScene.ROWS; r++) {
            for (let c = 0; c < PacManScene.COLS; c++) {
                if (maze[r][c] === 4) { startCol = c; startRow = r; }
            }
        }
        this.pacman.col = startCol;
        this.pacman.row = startRow;
        this.pacman.targetCol = startCol;
        this.pacman.targetRow = startRow;
        this.pacman.x = this.offsetX + startCol * T + T / 2;
        this.pacman.y = this.offsetY + startRow * T + T / 2;
        this.pacman.direction = null;
        this.pacman.queuedDirection = null;
        this.pacmanContainer.setPosition(this.pacman.x, this.pacman.y);

        // Reset ghosts
        const spawnPositions = [];
        for (let r = 0; r < PacManScene.ROWS; r++) {
            for (let c = 0; c < PacManScene.COLS; c++) {
                if (maze[r][c] === 3) spawnPositions.push({ col: c, row: r });
            }
        }
        spawnPositions.push({ col: 10, row: 7 });

        this.ghosts.forEach((ghost, i) => {
            const spawn = spawnPositions[i] || spawnPositions[0];
            ghost.col = spawn.col;
            ghost.row = spawn.row;
            ghost.targetCol = spawn.col;
            ghost.targetRow = spawn.row;
            ghost.x = this.offsetX + spawn.col * T + T / 2;
            ghost.y = this.offsetY + spawn.row * T + T / 2;
            ghost.direction = 'up';
            ghost.frightened = false;
            ghost.eaten = false;
            ghost.released = i === 3;
            ghost.mode = 'scatter';
            ghost.modeTimer = 0;
            ghost.container.setPosition(ghost.x, ghost.y);
            this.drawGhost(ghost, false);
        });
    }

    updateUI() {
        this.scoreText.setText(`SCORE: ${this.score}`);
        this.foodText.setText(`FOOD: ${this.foodEaten}/${this.totalFood}`);
    }

    // ---- LEVEL TRANSITIONS ----

    levelComplete() {
        this.gameActive = false;

        const msg = this.add.text(512, 288, `LEVEL ${this.pacLevel} CLEAR!`, {
            fontSize: '28px', fontFamily: 'monospace', color: '#ffff00',
            stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(100);

        // Flash maze walls
        this.tweens.add({
            targets: this.wallGraphics,
            alpha: 0.2,
            duration: 200,
            yoyo: true,
            repeat: 5
        });

        this.time.delayedCall(2500, () => {
            msg.destroy();
            if (this.pacLevel >= this.maxPacLevels) {
                // All 3 pac-man levels done - victory!
                this.pacManVictory();
            } else {
                // Next pac-man sub-level
                this.pacLevel++;
                this.buildLevel();
                this.showCountdown();
            }
        });
    }

    pacManVictory() {
        // Unlock pac-man costume
        const gameInst = window.gameInstance;
        if (gameInst && gameInst.dragonCostumes['pacman']) {
            gameInst.dragonCostumes['pacman'].unlocked = true;
            if (!gameInst.gameData.outfits.unlocked.includes('pacman')) {
                gameInst.gameData.outfits.unlocked.push('pacman');
            }
            gameInst.saveGameData();
        }

        this.showResults(true);
    }

    gameOver() {
        this.showResults(false);
    }

    showResults(victory) {
        const overlay = this.add.rectangle(512, 288, 500, 350, 0x000000, 0.85)
            .setDepth(200);

        const titleColor = victory ? '#ffff00' : '#ff4444';
        const titleText = victory ? 'PAC-MAN COMPLETE!' : 'GAME OVER';

        const title = this.add.text(512, 160, titleText, {
            fontSize: '28px', fontFamily: 'monospace', color: titleColor,
            stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5).setDepth(201);

        const stats = [
            `Score: ${this.score}`,
            `Levels Cleared: ${victory ? this.maxPacLevels : this.pacLevel - 1}/${this.maxPacLevels}`,
            `Food Eaten: ${this.foodEaten}`,
        ];

        if (victory) {
            stats.push('');
            stats.push('NEW COSTUME UNLOCKED!');
            stats.push('Pac-Man Dragon');
        }

        const statsText = this.add.text(512, 260, stats.join('\n'), {
            fontSize: '16px', fontFamily: 'monospace', color: '#ffffff',
            align: 'center', lineSpacing: 6
        }).setOrigin(0.5).setDepth(201);

        // Continue button
        const btnBg = this.add.rectangle(512, 380, 250, 40, 0x2121DE)
            .setDepth(201).setInteractive({ useHandCursor: true });
        const btnText = this.add.text(512, 380, 'CONTINUE TO NEXT LEVEL', {
            fontSize: '14px', fontFamily: 'monospace', color: '#ffffff'
        }).setOrigin(0.5).setDepth(201);

        btnBg.on('pointerover', () => btnBg.setFillStyle(0x4444FF));
        btnBg.on('pointerout', () => btnBg.setFillStyle(0x2121DE));
        btnBg.on('pointerdown', () => {
            // Add score to main game
            if (window.gameInstance) {
                window.gameInstance.gameData.score += this.score;
                window.gameInstance.gameData.currentLevel = this.nextGameLevel;
                window.gameInstance.saveGameData();
            }
            this.scene.start('CraftScene');
        });
    }
}
