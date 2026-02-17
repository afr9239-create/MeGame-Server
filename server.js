const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});
const path = require('path');

// Раздаем игру прямо с этого сервера
app.use(express.static(__dirname));

let waitingPlayer = null;
let onlineCount = 0;

io.on('connection', (socket) => {
    onlineCount++;
    console.log(`[SERVER] Игрок подключен: ${socket.id}. Всего: ${onlineCount}`);
    io.emit('onlineUpdate', onlineCount);

    socket.on('findGame', () => {
        // Если кто-то уже ждет, соединяем их
        if (waitingPlayer && waitingPlayer.id !== socket.id) {
            const roomId = waitingPlayer.id + socket.id;
            
            waitingPlayer.join(roomId);
            socket.join(roomId);

            // Игрок 1 (внизу), Игрок 2 (сверху)
            waitingPlayer.emit('startGame', { role: 1, room: roomId });
            socket.emit('startGame', { role: 2, room: roomId });

            console.log(`[MATCH] Матч начался в комнате: ${roomId}`);
            waitingPlayer = null;
        } else {
            waitingPlayer = socket;
            console.log(`[MATCH] Игрок ${socket.id} ждет противника...`);
        }
    });

    // Передача постройки здания врагу
    socket.on('placeBuilding', (data) => {
        socket.to(data.room).emit('syncBuilding', data);
    });

    socket.on('disconnect', () => {
        onlineCount--;
        if (waitingPlayer && waitingPlayer.id === socket.id) waitingPlayer = null;
        io.emit('onlineUpdate', onlineCount);
        console.log(`[SERVER] Игрок отключен. Осталось: ${onlineCount}`);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
    console.log(`[OK] Мозг War Castle запущен на порту ${PORT}`);
});
