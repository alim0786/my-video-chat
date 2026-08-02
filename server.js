const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server, { cors: { origin: "*" } });

app.use(express.static('public'));

let waitingUser = null;

io.on('connection', (socket) => {
    if (waitingUser) {
        socket.emit('match', { peerId: waitingUser.id, initiator: true });
        waitingUser.emit('match', { peerId: socket.id, initiator: false });
        waitingUser = null;
    } else {
        waitingUser = socket;
    }

    socket.on('signal', (data) => {
        io.to(data.to).emit('signal', { from: socket.id, signal: data.signal });
    });

    socket.on('disconnect', () => {
        if (waitingUser === socket) waitingUser = null;
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
