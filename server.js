const http = require("http");
const fs = require("fs");
const path = require('path');
const serveStatic = require('./server/fileServer');
const { Server } = require("socket.io");

const baseDir = path.join(__dirname, 'public');
const httpServer = http.createServer((req, res) => {
    serveStatic(baseDir, req, res);
});

httpServer.listen(8080, () => console.log("Listening on 8080"));

const io = new Server(httpServer, {
    serveClient: true,
});

let gameState = {
    players: [],
    walls: [],
    bombs: [],
    explosions: [], 
};
let users = {};

io.on("connection", handleSocketConnection);

function handleSocketConnection(socket) {
    console.log("New connection:", socket.id);

    socket.emit("userId", { userId: socket.id });

    socket.on('startGame', handlePlayerJoin);
    socket.on("playerMoved", handlePlayerMovement);
    socket.on('placeBomb', () => {
        handlePlaceBomb(socket.id);
    });
    socket.on("playerStop", handlePlayerStop);
    socket.on("isRegistered", handleIsRegistered);
    socket.on("disconnect", handlePlayerDisconnect);
    socket.on('chat message', handleChatMessage);
}

function handlePlayerJoin(playerName) {
    if (gameState.players.length >= 4) return;

    if (gameState.players.length === 0) {
        gameState.walls = createWallsObject();
    }

    const spawnPoints = [
        { x: 69, y: 69 },
        { x: 909, y: 69 },
        { x: 69, y: 909 },
        { x: 909, y: 909 }
    ];

    const availableNumber = assignPlayerNumber(gameState);

    users[this.id] = { 
        name: playerName, 
        connection: this 
    };

    const spawn = spawnPoints[availableNumber - 1];

    gameState.players.push({
        id: this.id,
        name: playerName,
        number: availableNumber,
        xPos: spawn.x,
        yPos: spawn.y,
        bombs: 1,
        flames: 2,
        speed: 2,
        lives: 3,
        isAlive: true,
        direction: "down",
        up: false,
        down: false,
        left: false,
        right: false,
    });

    this.emit("connected", { name: playerName, userId: this.id });
    console.log(`User registered: ${playerName} (ID: ${this.id})`);
}

function handlePlayerMovement(key) {
    const player = gameState.players.find(player => player.id === this.id);

    if (player) {
        switch (key.toLowerCase()) {
            case "w":
                player.up = true;
                break;
            case "a":
                player.left = true;
                break;
            case "s": 
                player.down = true;
                break;
            case "d":
                player.right = true;
                break;
            default:
                break;
        }

        io.emit("playerMoved", { movedPlayer: player });
    }
}

function handlePlayerStop(key) {
    const player = gameState.players.find(player => player.id === this.id);

    if (player) {	
        switch (key.toLowerCase()) {
            case "w":
                player.up = false;	
                break;
            case "a":
                player.left = false;
                break;
            case "s": 
                player.down = false;
                break;
            case "d":
                player.right = false;
                break;
            default:
                break;
        }

        io.emit("stoppedMoving", player);
    }
}
const FRAME_RATE = 250;
const FRAME_DURATION = 1000 / FRAME_RATE;


setInterval(() => {
    movePlayers(); // Update player positions
    explodeBombs(); // Handle bomb explosions
    io.emit("GameState", { gameState });
}, FRAME_DURATION);
function movePlayers() {
    for (const player of gameState.players) {
        const speed = player.speed;
        let dx = 0;
        let dy = 0;

        if (player.up) dy -= speed;
        if (player.down) dy += speed;
        if (player.left) dx -= speed;
        if (player.right) dx += speed;

        if (!checkCollision(player.xPos + dx, player.yPos + dy)) {
            player.xPos += dx;
            player.yPos += dy;
        }

        // Update player direction
        if (player.up) player.direction = 'up';
        else if (player.down) player.direction = 'down';
        else if (player.left) player.direction = 'left';
        else if (player.right) player.direction = 'right';
    }
}
function checkCollision(playerX, playerY) {
    const playerLeft = playerX;
    const playerTop = playerY;
    const playerRight = playerX + 32; 
    const playerBottom = playerY + 32; 

    const gridX1 = Math.floor(playerLeft / 60);
    const gridY1 = Math.floor(playerTop / 60);
    const gridX2 = Math.floor(playerRight / 60); 
    const gridY2 = Math.floor(playerBottom / 60);

    for (let x = gridX1; x <= gridX2; x++) {
        for (let y = gridY1; y <= gridY2; y++) {
            const wallIndex = y * 17 + x;
            if (gameState.walls[wallIndex]?.type !== 'empty') {
                return true; 
            }
        }
    }

    return false; // No collihision
}

function handleIsRegistered() {
    if (!users[this.id]) {
        console.log("Not registered");
        this.emit("notRegistered", { userId: this.id });
    } else {
        this.broadcast.emit("GameState", { gameState });
        const playernumber = gameState.players.find(p => p.id === this.id).number;
        this.emit("GameState", { gameState, playernumber });
    }
}

function handlePlayerDisconnect() {
    if (users[this.id]) {
        console.log(`User disconnected: ${users[this.id].name} (ID: ${this.id})`);
        delete users[this.id];
        gameState.players = gameState.players.filter(player => player.id !== this.id);
        console.log(gameState.players);
        console.log(users);
    } else {
        console.log("Connection closed");
    }

    io.emit("GameState", { gameState });
}

function handleChatMessage(msg) {
    this.broadcast.emit('chat message', msg);
}

function createWallsObject() {
    let walls = [];
    for (let i = 0; i < 289; i++) {
        let wall = {};
        const x = i % 17;
        const y = Math.floor(i / 17);
        if (x === 0 || x === 16 || y === 0 || y === 16 || (x % 2 === 0 && y % 2 === 0)) {
            wall.type = 'wall';
        } else if (
            !(x <= 1 && y <= 1) &&
            ![19, 35, 31, 32, 49, 239, 253, 256, 257, 269, 270].includes(i) &&
            !(x >= 15 && y >= 15) &&
            Math.random() < 0.5
        ) {
            wall.type = 'block';
            if (Math.random() < 0.6) {
                wall.powerup = true;
                wall.powerName = ['bombs', 'speed', 'flames'][Math.floor(Math.random() * 3)];
            }
        } else {
            wall.type = 'empty';
        }
        walls[i] = wall;
    }
    return walls;
}

function assignPlayerNumber(gameState) {
    const usedNumbers = gameState.players.map(player => player.number);
    for (let number = 1; number <= 4; number++) {
        if (!usedNumbers.includes(number)) {
            return number;
        }
    }
    return null;
}

function handlePlaceBomb(playerId) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player || player.bombsPlaced >= player.bombs) return;

    const tileSize = 60;
    const bombX = Math.floor(player.xPos / tileSize) * tileSize;
    const bombY = Math.floor(player.yPos / tileSize) * tileSize;

    if (gameState.bombs.some(bomb => bomb.x === bombX && bomb.y === bombY)) return;

    const bomb = {
        id: `bomb-${Date.now()}-${Math.random()}`, 
        x: bombX,
        y: bombY,
        ownerId: playerId,
        range: player.flames, 
        placedAt: Date.now(), 
    };

    gameState.bombs.push(bomb);
    player.bombsPlaced++; 

    console.log("Bomb placed:", bomb);

    io.emit("GameState", { gameState });
}

function explodeBomb(bomb) {
    const tileSize = 60;

    const explosionConfig = {
        up: {
            range: bomb.range,
            nearExplosion: '../images/explosion/up1.gif',
            farExplosion: '../images/explosion/up2.gif',
        },
        down: {
            range: bomb.range,
            nearExplosion: '../images/explosion/down1.gif',
            farExplosion: '../images/explosion/down2.gif',
        },
        left: {
            range: bomb.range,
            nearExplosion: '../images/explosion/left1.gif',
            farExplosion: '../images/explosion/left2.gif',
        },
        right: {
            range: bomb.range,
            nearExplosion: '../images/explosion/right1.gif',
            farExplosion: '../images/explosion/right2.gif',
        },
    };

    function explodeDirection(dx, dy, config) {
        for (let i = 1; i <= config.range; i++) {
            const x = bomb.x + dx * tileSize * i;
            const y = bomb.y + dy * tileSize * i;

            if (x < 0 || x >= 17 * tileSize || y < 0 || y >= 17 * tileSize) break;

            const wallIndex = (y / tileSize) * 17 + (x / tileSize);
            const wall = gameState.walls[wallIndex];

            if (wall.type === 'wall') {
                break; 
            } else if (wall.type === 'block') {
                if (wall.powerup) {
                    wall.powerup = null;
                }
                wall.type = 'empty';
                break;
            }

            gameState.players.forEach(player => {
                if (
                    player.isAlive &&
                    player.xPos >= x &&
                    player.xPos < x + tileSize &&
                    player.yPos >= y &&
                    player.yPos < y + tileSize
                ) {
                    player.lives--;
                    if (player.lives <= 0) {
                        player.isAlive = false;
                    }
                }
            });

            // Add explosion to the game state
            const explosionType = i === config.range ? config.farExplosion : config.nearExplosion;
            gameState.explosions.push({
                id: `explosion-${Date.now()}-${Math.random()}`,
                x,
                y,
                type: explosionType,
                placedAt: Date.now(),
            });
        }
    }

    explodeDirection(0, -1, explosionConfig.up);
    explodeDirection(0, 1, explosionConfig.down);
    explodeDirection(-1, 0, explosionConfig.left);
    explodeDirection(1, 0, explosionConfig.right);

    gameState.explosions.push({
        id: `explosion-${Date.now()}-${Math.random()}`,
        x: bomb.x,
        y: bomb.y,
        type: '../images/explosion/ceterexp.gif',
        placedAt: Date.now(),
    });

    // Remove explosions after a short delay (e.g., 1 second)
    setTimeout(() => {
        gameState.explosions = gameState.explosions.filter(e => e.id !== bomb.id);
        io.emit("GameState", { gameState }); // Broadcast updated game state
    }, 1000);
}
const BOMB_LIFETIME = 3000; // Time before a bomb explodes (in milliseconds)
function explodeBombs() {
    const now = Date.now();
    // Filter out bombs that have expired
    gameState.bombs = gameState.bombs.filter(bomb => {
        if (now - bomb.placedAt < BOMB_LIFETIME) return true; // Keep unexploded bombs
        // Explode the bomb
        explodeBomb(bomb);
        // Decrement the player's bombsPlaced counter
        const player = gameState.players.find(p => p.id === bomb.ownerId);
        if (player) player.bombsPlaced--;
        return false; // Remove the bomb from the game state
    });
}