let express = require('express');
let http = require('http');
let socket = require('socket.io');

let app = express();
app.use(express.static('public'));

let port = process.env.PORT || 3000;
let server = http.createServer(app).listen(port, function() {
  console.log("Listening on port " + port + "...");
});

console.log("Socket server is running...");

let io = socket(server);

io.sockets.on('connection', newConnection);

function newConnection(socket) {
  console.log('New Connection: ' + socket.id);

  socket.on('draw',
    function(data) {
      socket.broadcast.emit('draw', data);
    }
  );
}
