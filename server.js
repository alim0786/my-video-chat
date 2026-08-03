const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, 'public')));

let waitingUser = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Auto match trigger jab user connect ho
  socket.on('find-partner', () => {
    if (waitingUser && waitingUser.id !== socket.id) {
      const partnerSocket = waitingUser;
      waitingUser = null;

      socket.emit('partner-found', { partnerId: partnerSocket.id, createOffer: true });
      partnerSocket.emit('partner-found', { partnerId: socket.id, createOffer: false });
    } else {
      waitingUser = socket;
      socket.emit('waiting', 'Searching Partner...');
    }
  });

  socket.on('offer', (data) => {
    io.to(data.target).emit('offer', { signal: data.signal, from: socket.id });
  });

  socket.on('answer', (data) => {
    io.to(data.target).emit('answer', { signal: data.signal, from: socket.id });
  });

  socket.on('ice-candidate', (data) => {
    io.to(data.target).emit('ice-candidate', { candidate: data.candidate, from: socket.id });
  });

  socket.on('send-message', (data) => {
    io.to(data.target).emit('receive-message', { text: data.text });
  });

  socket.on('skip-partner', (data) => {
    if (data.target) {
      io.to(data.target).emit('partner-disconnected');
    }
    socket.emit('find-partner');
  });

  socket.on('disconnect', () => {
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }
    socket.broadcast.emit('partner-disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
