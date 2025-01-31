const http = require("http")
const fs = require("fs")
const path = require('path');
const serveStatic = require('./server/fileServer');
const { Server } = require("socket.io");
let gameState = {
    players: {},
    bombs: [],
    powerups: [],
    walls: createWalls()
};
//this takes the absoulte path of the current directory and append it to public , to send the base path
//for all the static file
const baseDir = path.join(__dirname, 'public');
let users = {};

const httpServer = http.createServer((req, res) => {
    serveStatic(baseDir, req, res)
});

httpServer.listen(8080, () => console.log("listening on 8080"))

const io = new Server(httpServer, {
    serveClient: true,
  });;


io.on("connection", (socket) => {
    console.log("New connection");
    socket.emit("userId", { userId: socket.id });
    socket.on('startGame', (playerName) => {
        users[socket.id] = {
            name: playerName,
            connection: socket
        };
        socket.emit("connected", {name: playerName,userId: socket.id})
        console.log(`User registered: ${playerName} (ID: ${socket.id})`);
    });

    socket.on("isregistered", () => {
        if (socket) {
            console.log(users);
            if (!users[socket.id]) {
                console.log("Not registered");
                socket.emit("notRegistered", { userId: socket.id });
            }
        }
    })
    socket.on("disconnect", () => {
        if (users[socket.id]) {
            console.log(`User disconnected: ${users[socket.id].name} (ID: ${socket.id})`);
            delete users[socket.id];
        } else {
            console.log("Connection closed");
        }
    });
//this sets an event listener for "chat message event"
    socket.on('chat message' ,(msg) => {
        socket.broadcast.emit('chat message', msg); //brodcast it to everyone but sender
    })

    // Handle incoming audio stream
    socket.on('audioStream', (audioData) => {
        socket.broadcast.emit('audioStream', audioData);
    });


 });