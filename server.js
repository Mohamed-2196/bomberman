const http = require("http")
const fs = require("fs")
const path = require('path');
const serveStatic = require('./server/fileServer');

//this takes the absoulte path of the current directory and append it to public , to send the base path
//for all the static file
const baseDir = path.join(__dirname, 'public');


const httpServer = http.createServer((req, res) => {
    serveStatic(baseDir, req, res)
});

httpServer.listen(8080, () => console.log("listening on 8080"))