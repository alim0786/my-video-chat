const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, {
    cors: { origin: "*" },
    maxHttpBufferSize: 1e7 // 10MB limit to handle Base64 Profile Images safely
});

app.use(express.static('public'));

let waitingUser = null;

io.on('connection', (socket) => {
    // Queue and pair random users
    if (waitingUser && waitingUser.id !== socket.id) {
        socket.partnerId = waitingUser.id;
        waitingUser.partnerId = socket.id;

        socket.emit('match', { peerId: waitingUser.id, initiator: true });
        waitingUser.emit('match', { peerId: socket.id, initiator: false });

        waitingUser = null;
    } else {
        waitingUser = socket;
    }

    // WebRTC Signaling & Chat Forwarding
    socket.on('signal', (data) => {
        if (data && data.to) {
            io.to(data.to).emit('signal', { from: socket.id, signal: data.signal });
        }
    });

    // Handle Disconnection
    socket.on('disconnect', () => {
        if (waitingUser === socket) {
            waitingUser = null;
        }
        if (socket.partnerId) {
            io.to(socket.partnerId).emit('partner-disconnected');
            const partnerSocket = io.sockets.sockets.get(socket.partnerId);
            if (partnerSocket) {
                partnerSocket.partnerId = null;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`NeonChat Server running on port ${PORT}`);
});
