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

  // Following is server-side code for messages sent between sockets.

  socket.on('draw', (data) => {
      socket.broadcast.emit('draw',data);
    });

  socket.on('drawVideo', (data) => {
      socket.broadcast.emit('drawVideo',data);
    });

  socket.on('end', (data) => {
    socket.broadcast.emit('end', data);
  });

  // User's name is sent to all past connections so that collaborator list can be updated. Connection ID is also sent so that names of past collaborators can be received.
  socket.on('newCollaborator', (data) => {
    socket.broadcast.emit('newCollaborator',{
      name: data.name,
      mode: data.mode,
      id: socket.id
    });
  });

  // Message is only sent to single connection whose ID was sent when connection joined.
  socket.on('oldCollaborator', (data) => {
    io.to(data.id).emit('oldCollaborator',data.name);
  })
}
