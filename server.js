const http = require("http");
const fs = require("fs");
const path = require('path');
const serveStatic = require('./server/fileServer');
const { Server } = require("socket.io");

let gameState = {
    players: [],
    walls: [],
};

const baseDir = path.join(__dirname, 'public');
let users = {};

const httpServer = http.createServer((req, res) => {
    serveStatic(baseDir, req, res);
});

httpServer.listen(8080, () => console.log("Listening on 8080"));

const io = new Server(httpServer, {
    serveClient: true,
});

io.on("connection", (socket) => {
    console.log("New connection:", socket.id);
    socket.emit("userId", { userId: socket.id });

    socket.on('startGame', (playerName) => {
        if (gameState.players.length < 4) {
            if (gameState.players.length === 0) {
                gameState.walls = createWallsObject();
            }

            users[socket.id] = { 
                name: playerName, 
                connection: socket 
            };

            const spawnPoints = [
                { x: 69, y: 69 },
                { x: 69, y: 909 },
                { x: 909, y: 69 },
                { x: 909, y: 909 }
            ];
            
            let spawn = spawnPoints[gameState.players.length];

            gameState.players.push({
                id: socket.id,
                name: playerName,
                number: gameState.players.length + 1,
                x: spawn.x,
                y: spawn.y,
                bombs: 1,
                flames: 2,
                speed: 2,
                lives: 3,
                isAlive: true,
                score: 0
            });

            socket.emit("connected", { name: playerName, userId: socket.id });
            console.log(`User registered: ${playerName} (ID: ${socket.id})`);
        }
    });

    socket.on("isRegistered", () => {
        console.log(users)
        if (!users[socket.id]) {
            console.log("Not registered");
            socket.emit("notRegistered", { userId: socket.id });
        } else {
            socket.emit("GameState", { gameState });
        }
    });

    socket.on("disconnect", () => {
        if (users[socket.id]) {
            console.log(`User disconnected: ${users[socket.id].name} (ID: ${socket.id})`);
            delete users[socket.id];

            gameState.players = gameState.players.filter(player => player.id !== socket.id);
        } else {
            console.log("Connection closed");
        }
    });

    socket.on('chat message', (msg) => {
        socket.broadcast.emit('chat message', msg);
    });

    socket.on('audioStream', (audioData) => {
        socket.broadcast.emit('audioStream', audioData);
    });
});

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
