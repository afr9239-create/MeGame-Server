const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = {}; // Хранилище данных комнат

io.on('connection', (socket) => {
    console.log('Новое подключение:', socket.id);

    socket.on('joinLobby', ({ roomId, nickname }) => {
        socket.join(roomId);
        
        if (!rooms[roomId]) rooms[roomId] = [];
        
        // Добавляем игрока в список комнаты
        rooms[roomId].push({ id: socket.id, nickname: nickname });

        // Рассылаем всем в комнате обновленный список
        io.to(roomId).emit('updatePlayerList', rooms[roomId]);
    });

    socket.on('startGameRequest', (roomId) => {
        io.to(roomId).emit('gameStarted');
    });

    socket.on('disconnect', () => {
        // Удаляем игрока из всех комнат при выходе
        for (const roomId in rooms) {
            rooms[roomId] = rooms[roomId].filter(p => p.id !== socket.id);
            io.to(roomId).emit('updatePlayerList', rooms[roomId]);
            if (rooms[roomId].length === 0) delete rooms[roomId];
        }
    });
});

server.listen(process.env.PORT || 3000, () => {
    console.log('Сервер War Castle 2.0 запущен!');
});
