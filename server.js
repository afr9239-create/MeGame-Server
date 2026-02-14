const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

let totalConnected = 0;
// Храним данные комнат: ХП баз и состояние игры
const roomsData = {};

io.on('connection', (socket) => {
    totalConnected++;
    io.emit('totalOnline', totalConnected);

    socket.on('joinRoom', (roomName) => {
        socket.join(roomName);
        socket.currentRoom = roomName;

        if (!roomsData[roomName]) {
            roomsData[roomName] = {
                hp1: 1000,
                hp2: 1000,
                gameActive: false
            };
        }

        const room = io.sockets.adapter.rooms.get(roomName);
        const numClients = room ? room.size : 0;

        socket.emit('playerRole', numClients);
        io.to(roomName).emit('playerCount', numClients);
    });

    // Когда юнит бьет базу, клиент шлет 'baseDamage'
    socket.on('baseDamage', (data) => {
        const room = roomsData[socket.currentRoom];
        if (room && room.gameActive) {
            // Уменьшаем ХП на сервере
            if (data.targetSide === 1) room.hp1 -= data.damage;
            if (data.targetSide === 2) room.hp2 -= data.damage;

            // Рассылаем актуальное ХП всем
            io.to(socket.currentRoom).emit('updateHP', {
                hp1: room.hp1,
                hp2: room.hp2
            });

            // Проверка победы
            if (room.hp1 <= 0 || room.hp2 <= 0) {
                const winner = room.hp1 <= 0 ? 2 : 1;
                io.to(socket.currentRoom).emit('gameOver', { winner });
                room.gameActive = false;
                // Сброс ХП для нового раунда
                room.hp1 = 1000; room.hp2 = 1000;
            }
        }
    });

    socket.on('spawnUnit', (data) => {
        if (socket.currentRoom) {
            socket.to(socket.currentRoom).emit('spawnUnit', data);
        }
    });

    socket.on('startGame', () => {
        if (socket.currentRoom && roomsData[socket.currentRoom]) {
            roomsData[socket.currentRoom].gameActive = true;
            io.to(socket.currentRoom).emit('gameStart');
        }
    });

    socket.on('disconnect', () => {
        totalConnected--;
        io.emit('totalOnline', totalConnected);
        // Можно добавить удаление данных комнаты, если она пуста
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
