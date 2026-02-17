const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: {
        origin: "*", // Разрешаем любым адресам подключаться
        methods: ["GET", "POST"]
    }
});

let waitingPlayer = null;
let onlineCount = 0;

io.on('connection', (socket) => {
    onlineCount++;
    console.log(`[SERVER] Новый игрок: ${socket.id}. Всего в сети: ${onlineCount}`);
    
    // Сразу рассылаем всем актуальное число игроков
    io.emit('onlineUpdate', onlineCount);

    socket.on('findGame', () => {
        console.log(`[MATCH] Игрок ${socket.id} ищет игру...`);
        
        if (waitingPlayer && waitingPlayer.id !== socket.id) {
            const roomId = waitingPlayer.id + socket.id;
            
            waitingPlayer.join(roomId);
            socket.join(roomId);

            waitingPlayer.emit('startGame', { role: 1, room: roomId });
            socket.emit('startGame', { role: 2, room: roomId });

            console.log(`[MATCH] Игра создана в комнате: ${roomId}`);
            waitingPlayer = null;
        } else {
            waitingPlayer = socket;
            console.log(`[MATCH] Игрок ждет оппонента...`);
        }
    });

    socket.on('placeBuilding', (data) => {
        socket.to(data.room).emit('syncBuilding', data);
    });

    socket.on('disconnect', () => {
        onlineCount--;
        if (waitingPlayer && waitingPlayer.id === socket.id) waitingPlayer = null;
        io.emit('onlineUpdate', onlineCount);
        console.log(`[SERVER] Игрок ушел. Осталось: ${onlineCount}`);
    });
});

// ВАЖНО: Render сам назначит порт через process.env.PORT
const PORT = process.env.PORT || 3000;
http.listen(PORT, "0.0.0.0", () => {
    console.log(`[OK] Сервер запущен на порту ${PORT}`);
});
