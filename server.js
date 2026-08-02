const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, { cors: { origin: "*" } });

app.use(express.static('public'));

let waitingUser = null;

io.on('connection', (socket) => {

    function pairUser(s) {
        if (waitingUser && waitingUser.id !== s.id) {
            s.partnerId = waitingUser.id;
            waitingUser.partnerId = s.id;

            s.emit('match', { peerId: waitingUser.id, initiator: true });
            waitingUser.emit('match', { peerId: s.id, initiator: false });

            waitingUser = null;
        } else {
            waitingUser = s;
        }
    }

    pairUser(socket);

    socket.on('find-next', () => {
        // Purane partner ko inform karo ki humne chhor diya
        if (socket.partnerId) {
            io.to(socket.partnerId).emit('partner-disconnected');
            const oldPartner = io.sockets.sockets.get(socket.partnerId);
            if (oldPartner) oldPartner.partnerId = null;
            socket.partnerId = null;
        }

        if (waitingUser === socket) {
            waitingUser = null;
        }

        // Dubara queue me daalo
        pairUser(socket);
    });

    socket.on('signal', (data) => {
        io.to(data.to).emit('signal', { from: socket.id, signal: data.signal });
    });

    socket.on('disconnect', () => {
        if (waitingUser === socket) {
            waitingUser = null;
        }
        if (socket.partnerId) {
            io.to(socket.partnerId).emit('partner-disconnected');
            const oldPartner = io.sockets.sockets.get(socket.partnerId);
            if (oldPartner) oldPartner.partnerId = null;
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
