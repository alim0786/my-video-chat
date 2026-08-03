const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// CORS enable kiya hai taaki network ka koi issue na aaye
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Static public folder serve karne ke liye
app.use(express.static(path.join(__dirname, 'public')));

let waitingUser = null;

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // Jab user match/connect hone ki request bheje
  socket.on('find-partner', () => {
    if (waitingUser && waitingUser.id !== socket.id) {
      // Doosra user mil gaya - Dono ko connect karo
      const partnerSocket = waitingUser;
      waitingUser = null;

      socket.emit('partner-found', { partnerId: partnerSocket.id, createOffer: true });
      partnerSocket.emit('partner-found', { partnerId: socket.id, createOffer: false });
    } else {
      // Waiting list mein daal do
      waitingUser = socket;
      socket.emit('waiting', 'Searching for a partner...');
    }
  });

  // WebRTC Signaling: Offer pass karna
  socket.on('offer', (data) => {
    io.to(data.target).emit('offer', { signal: data.signal, from: socket.id });
  });

  // WebRTC Signaling: Answer pass karna
  socket.on('answer', (data) => {
    io.to(data.target).emit('answer', { signal: data.signal, from: socket.id });
  });

  // WebRTC Signaling: ICE Candidate pass karna
  socket.on('ice-candidate', (data) => {
    io.to(data.target).emit('ice-candidate', { candidate: data.candidate, from: socket.id });
  });

  // Jab user disconnect ho jaye
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (waitingUser && waitingUser.id === socket.id) {
      waitingUser = null;
    }
    socket.broadcast.emit('user-disconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
