const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let onlineCount = 0;
let waitingPlayer = null;

io.on('connection', (socket) => {
    onlineCount++;
    console.log('Новое подключение. Всего:', onlineCount);
    
    // Рассылаем всем новое число игроков
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
        onlineCount = Math.max(0, onlineCount - 1);
        if (waitingPlayer && waitingPlayer.id === socket.id) waitingPlayer = null;
        io.emit('onlineUpdate', onlineCount);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
