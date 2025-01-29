const fs = require('fs');
const path = require('path');

function serveStatic(baseDir, req, res) {
    //if url http://localhost:3000/images/walls/iron.png , will be req.url /images/walls/iron.png
    let filePath = path.join(baseDir, req.url === '/' ? 'index.html' : req.url);

    //extracts the file extension
    const extension = path.extname(filePath);
  
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
    };
  //'application/octet-stream' is a generic MIME type for binary data when data type is unknown
    const contentType = mimeTypes[extension] || 'application/octet-stream';
  
    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 Not Found</h1>', 'utf-8');
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  }
  //export the function to be used as a module in the server
  module.exports = serveStatic;