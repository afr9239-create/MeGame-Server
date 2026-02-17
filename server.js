const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

// ГЛАВНОЕ ИСПРАВЛЕНИЕ: Путь к файлам
const publicPath = path.join(__dirname, '');
app.use(express.static(publicPath));

// Явно говорим серверу отдавать index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

let waitingPlayer = null;
let onlineCount = 0;

io.on('connection', (socket) => {
    onlineCount++;
    console.log(`Игрок зашел: ${socket.id}`);
    io.emit('onlineUpdate', onlineCount);

    socket.on('findGame', () => {
        if (waitingPlayer && waitingPlayer.id !== socket.id) {
            const roomId = waitingPlayer.id + socket.id;
            waitingPlayer.join(roomId);
            socket.join(roomId);
            waitingPlayer.emit('startGame', { role: 1, room: roomId });
            socket.emit('startGame', { role: 2, room: roomId });
            waitingPlayer = null;
        } else {
            waitingPlayer = socket;
        }
    });

    socket.on('placeBuilding', (data) => {
        socket.to(data.room).emit('syncBuilding', data);
    });

    socket.on('disconnect', () => {
        onlineCount--;
        if (waitingPlayer && waitingPlayer.id === socket.id) waitingPlayer = null;
        io.emit('onlineUpdate', onlineCount);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер работает на порту ${PORT}`);
});
