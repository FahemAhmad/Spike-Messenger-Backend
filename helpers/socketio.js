const socketIO = require('socket.io');

function initSocketIO(server) {
  const io = socketIO(server);

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('message', (message) => {
      console.log('Received message:', message);
      // Do something with the message, e.g. broadcast it to other users
      socket.broadcast.emit('message', message);
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });
}

module.exports = initSocketIO;
