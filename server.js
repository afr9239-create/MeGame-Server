const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Раздаем статические файлы из корня
app.use(express.static(__dirname));

io.on('connection', (socket) => {
    socket.on('joinRoom', (roomName) => {
        socket.join(roomName);
        socket.currentRoom = roomName;

        const room = io.sockets.adapter.rooms.get(roomName);
        const numClients = room ? room.size : 0;

        // Игрок 1 получает сторону 1, Игрок 2 сторону 2
        socket.emit('playerRole', numClients);
        io.to(roomName).emit('playerCount', numClients);
    });

    socket.on('spawnUnit', (data) => {
        // Пересылаем данные только игрокам в той же комнате
        socket.to(socket.currentRoom).emit('spawnUnit', data);
    });

    socket.on('startGame', () => {
        io.to(socket.currentRoom).emit('gameStart');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
