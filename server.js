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
    gameStarted: false, 

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
    if (gameState.players.length >= 4 || gameState.gameStarted) {
        this.emit("full",gameState.players)
        return
    };

    if (gameState.players.length === 0) {
        gameState.walls = createWallsObject();
        gameState.bombs = []
        gameState.explosions =[]

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
        bombsPlaced:0,
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
    if (gameState.players.length === 2 && !gameState.gameStarted) {
        startGameCountdown();
    }
}
function startGameCountdown() {
    let countdown = 20; 
    io.emit("countdown", countdown);

    countdownTimer = setInterval(() => {
        countdown--;
        io.emit("countdown", countdown);

        if (countdown <= 0) {
            clearInterval(countdownTimer);
            gameState.gameStarted = true;
            io.emit("gameStarted"); 
        }
    }, 1000);
}
function handlePlayerMovement(key) {
    const player = gameState.players.find(player => player.id === this.id);

    if (player&&player.isAlive) {
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
        if(player&&!player.isAlive){
            player.up =false;
            player.down =false;
            player.right = false;
            player.left = false;
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
    movePlayers();
    explodeBombs();

    const alivePlayers = gameState.players.filter(player => player.isAlive);
    if (alivePlayers.length <= 1 && gameState.gameStarted) {
        gameState.gameStarted = false;
        io.emit("gameOver", alivePlayers.length === 1 ? alivePlayers[0].name : null);
    } else {
        io.emit("GameState", { gameState });
    }
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

        if (!checkCollision(player.xPos + dx, player.yPos + dy, player.id)) {
            player.xPos += dx;
            player.yPos += dy;

            const gridX = Math.floor(player.xPos / 60);
            const gridY = Math.floor(player.yPos / 60);
            const wallIndex = gridY * 17 + gridX;
            const wall = gameState.walls[wallIndex];
            if (wall?.powerup) {
                applyPowerup(player, wall.powerup);
                wall.powerup = null; 
            }
        }
        if (player.up) player.direction = 'up';
        else if (player.down) player.direction = 'down';
        else if (player.left) player.direction = 'left';
        else if (player.right) player.direction = 'right';
    }
    }

function applyPowerup(player, powerupType) {
    switch (powerupType) {
        case 'bombs':
            player.bombs++;
            break;
        case 'speed':
            player.speed += 0.5;
            break;
        case 'flames':
            player.flames++;
            break;
    }
}

function checkCollision(playerX, playerY, playerId) {
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

    for (const bomb of gameState.bombs) {
        const bombGridX = Math.floor(bomb.x / 60);
        const bombGridY = Math.floor(bomb.y / 60);

        if (gridX1 <= bombGridX && gridX2 >= bombGridX && gridY1 <= bombGridY && gridY2 >= bombGridY) {
            // Ignore the player's own bomb only if it is walkable
            if (bomb.ownerId === playerId && bomb.walkable) {
                continue; // Allow movement while standing on own bomb
            }
            return true; // Collision with bomb
        }
    }

    return false; // No collision
}
function handleIsRegistered() {
    if (!users[this.id]) {
        this.emit("notRegistered", { userId: this.id });
    } else {
        this.broadcast.emit("GameState", { gameState });
        const playernumber = gameState.players.find(p => p.id === this.id).number;
        this.emit("GameState", { gameState, playernumber });
    }
}

function handlePlayerDisconnect() {
    if (users[this.id]) {
        delete users[this.id];
        gameState.players = gameState.players.filter(player => player.id !== this.id);
    } else {
        console.log("Connection closed");
    }

    const alivePlayers = gameState.players.filter(player => player.isAlive);
    if (alivePlayers.length <= 1 && gameState.gameStarted) {
        gameState.gameStarted = false; 
        io.emit("gameOver", alivePlayers.length === 1 ? alivePlayers[0].name : null);
    } else {
        io.emit("GameState", { gameState });
    }
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
    
    if (!player || player.bombsPlaced >= player.bombs||!player.isAlive) return;

    const tileSize = 60;
    const bombX = Math.floor(player.xPos / tileSize) * tileSize;
    const bombY = Math.floor(player.yPos / tileSize) * tileSize;

    // Prevent placing multiple bombs in the same grid cell
    if (gameState.bombs.some(bomb => bomb.x === bombX && bomb.y === bombY)) return;

    const bomb = {
        id: `bomb-${Date.now()}-${Math.random()}`, 
        x: bombX,
        y: bombY,
        ownerId: playerId,
        range: player.flames, 
        placedAt: Date.now(),
        walkable: true, 
    };

    gameState.bombs.push(bomb);
    player.bombsPlaced++; 

    setTimeout(() => {
        const bombIndex = gameState.bombs.findIndex(b => b.id === bomb.id);
        if (bombIndex !== -1) {
            gameState.bombs[bombIndex].walkable = false;
        }
    }, 900);

    io.emit("GameState", { gameState });
}

function explodeBomb(bomb) {
    const tileSize = 60;

    // Helper function to check if a player is in an explosion tile
    function checkPlayerInExplosion(x, y) {
        gameState.players.forEach(player => {
            if (
                player.isAlive &&
                player.xPos >= x &&
                player.xPos < x + tileSize &&
                player.yPos >= y &&
                player.yPos < y + tileSize
            ) {
                player.up =false;
                player.down =false;
                player.right = false;
                player.left = false;
                player.lives--;
                if (player.lives <= 0) {
                    player.isAlive = false; // Game Over for this player
                    player.direction = "death"
                    setTimeout(() => {
                        player.direction = "death"
                    }, 400); // Respawn after 1.7 seconds
                    setTimeout(() => {
                        gameState.players = gameState.players.filter(p => p.id !== player.id);
                    }, 1700); // Respawn after 1.7 seconds
                } else {
                    player.isAlive = false; 
                    player.direction = "death"
                    setTimeout(() => {
                        player.direction = "death"
                    }, 400); // Respawn after 1.7 seconds
                    setTimeout(() => {
                        respawnPlayer(player);
                    }, 1700); // Respawn after 1.7 seconds
                }
            }
        });
    }

    // Explode in all directions
    function explodeDirection(dx, dy, config) {
        for (let i = 1; i <= config.range; i++) {
            const x = bomb.x + dx * tileSize * i;
            const y = bomb.y + dy * tileSize * i;

            if (x < 0 || x >= 17 * tileSize || y < 0 || y >= 17 * tileSize) break;

            const wallIndex = (y / tileSize) * 17 + (x / tileSize);
            const wall = gameState.walls[wallIndex];

            if (wall.type === 'wall') {
                break; // Stop at unbreakable walls
            } else if (wall.type === 'block') {
                wall.type = 'empty';
                wall.isBurned = true; // Mark the wall as burned
                setTimeout(() => {
                    if (Math.random() < 0.6) {
                        wall.powerup = ['bombs', 'speed', 'flames'][Math.floor(Math.random() * 3)];
                    }
                    wall.isBurned = false;
                    io.emit("GameState", { gameState });
                }, 1000);
                break; // Stop at breakable walls
            }

            gameState.explosions.push({
                id: `explosion-${Date.now()}-${Math.random()}`,
                x,
                y,
                type: i === config.range ? config.farExplosion : config.nearExplosion,
                placedAt: Date.now(),
                bombId: bomb.id,
            });

            checkPlayerInExplosion(x, y);
        }
    }

    gameState.explosions.push({
        id: `explosion-${Date.now()}-${Math.random()}`,
        x: bomb.x,
        y: bomb.y,
        type: '../images/explosion/ceterexp.gif',
        placedAt: Date.now(),
        bombId: bomb.id,
    });

    checkPlayerInExplosion(bomb.x, bomb.y);

    explodeDirection(0, -1, { range: bomb.range, nearExplosion: '../images/explosion/up1.gif', farExplosion: '../images/explosion/up2.gif' });
    explodeDirection(0, 1, { range: bomb.range, nearExplosion: '../images/explosion/down1.gif', farExplosion: '../images/explosion/down2.gif' });
    explodeDirection(-1, 0, { range: bomb.range, nearExplosion: '../images/explosion/left1.gif', farExplosion: '../images/explosion/left2.gif' });
    explodeDirection(1, 0, { range: bomb.range, nearExplosion: '../images/explosion/right1.gif', farExplosion: '../images/explosion/right2.gif' });

    setTimeout(() => {
        gameState.explosions = gameState.explosions.filter(e => e.bombId !== bomb.id);
        io.emit("GameState", { gameState });
    }, 1000);
}
const BOMB_LIFETIME = 1600; 
function explodeBombs() {
    const now = Date.now();
    gameState.bombs = gameState.bombs.filter(bomb => {
        if (now - bomb.placedAt < BOMB_LIFETIME) return true; 

        explodeBomb(bomb);

        const player = gameState.players.find(p => p.id === bomb.ownerId);
        if (player) player.bombsPlaced--;

        return false; 
    });
}

function respawnPlayer(player) {
    const spawnPoints = [
        { x: 69, y: 69 },
        { x: 909, y: 69 },
        { x: 69, y: 909 },
        { x: 909, y: 909 }
    ];
    const spawn = spawnPoints[player.number - 1];
    player.xPos = spawn.x;
    player.yPos = spawn.y;
    player.isAlive = true;
    player.direction = "down";
}