const express = require('express');
const http = require('http');
const app = express();
const socket = require('socket.io');
const server = http.createServer(app);

app.use(express.static('public'));

let port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log("Listening on port " + port + "...");
});

let io = socket(server);

io.sockets.on('connection', newConnection);

function newConnection(socket) {
  console.log('New Connection: ' + socket.id);

  // server-side code for 'draw'
  socket.on('draw', (data) => {
      socket.broadcast.emit('draw',data);
    });

  socket.on('drawVideo', (data) => {
      socket.broadcast.emit('drawVideo',data);
    });

  socket.on('end', (data) => {
    socket.broadcast.emit('end', data);
  });

  socket.on('newCollaborator', (data) => {
    socket.broadcast.emit('newCollaborator',{
      name: data.name,
      mode: data.mode,
      id: socket.id
    });
  });

  socket.on('oldCollaborator', (data) => {
    io.to(data.id).emit('oldCollaborator',data.name);
  })
}
