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
                { x: 909, y: 69 },
                { x: 69, y: 909 },
                { x: 909, y: 909 }
            ];
            const availableNumber = assignPlayerNumber(gameState);

            let spawn = spawnPoints[availableNumber-1];
            gameState.players.push({
                id: socket.id,
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

            socket.emit("connected", { name: playerName, userId: socket.id });
            console.log(`User registered: ${playerName} (ID: ${socket.id})`);
        }
    });

    socket.on("playerMoved",  (key) => {
        const player = gameState.players.find(player => player.id === socket.id);
        
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
    })

    socket.on("playerStop", (key, obj) => {
        const player = gameState.players.find(player => player.id === socket.id);

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
            
         
            }
            
            io.emit("stoppedMoving", player )
        //  io.emit("GameState", { gameState });
        }
    )

    socket.on("isRegistered", () => {
        console.log(30)
        if (!users[socket.id]) {
            console.log("Not registered");
            socket.emit("notRegistered", { userId: socket.id });
        } else {
            io.emit("GameState", { gameState });
            console.log(22);
            
            // socket.broadcast.emit("GameState", { gameState });
        }
    });

    socket.on("disconnect", () => {
        if (users[socket.id]) {
            console.log(`User disconnected: ${users[socket.id].name} (ID: ${socket.id})`);

            delete users[socket.id];
            
            gameState.players = gameState.players.filter(player => player.id !== socket.id);
            console.log(gameState.players);
            console.log(users);
            io.emit("GameState", { gameState });

        } else {
            console.log("Connection closed");
            io.emit("GameState", { gameState });

        }
    });

    socket.on('chat message', (msg) => {
        socket.broadcast.emit('chat message', msg);
    });

    // socket.on('audioStream', (audioData) => {
    //     console.log('Received audio data');
    //     socket.broadcast.emit('audioStream', audioData);
    // });
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


function assignPlayerNumber(gameState) {
    // Create an array to track used player numbers
    const usedNumbers = gameState.players.map(player => player.number);
  
    // Find the first available number from 1 to 4
    for (let number = 1; number <= 4; number++) {
      if (!usedNumbers.includes(number)) {
        return number; // Return the first available number
      }
    }
  
    // If all numbers are taken, return null or handle as needed
    return null; 
  }
  