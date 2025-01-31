const http = require("http")
const fs = require("fs")
const path = require('path');
const serveStatic = require('./server/fileServer');
const { Server } = require("socket.io");

//this takes the absoulte path of the current directory and append it to public , to send the base path
//for all the static file
const baseDir = path.join(__dirname, 'public');


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
//this sets an event listener for "chat message event"
    socket.on('chat message' ,(msg) => {
        socket.broadcast.emit('chat message', msg); //brodcast it to everyone but sender
    })

    // Handle incoming audio stream
    socket.on('audioStream', (audioData) => {
        socket.broadcast.emit('audioStream', audioData);
    });
    
    socket.on("disconnect", () => {
        console.log("Connection closed");
    });

 });