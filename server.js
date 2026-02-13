const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

let players = [];

io.on('connection', (socket) => {
    // Добавляем игрока в список
    players.push(socket.id);
    console.log(`User connected: ${socket.id}. Total: ${players.length}`);

    // Сразу отправляем всем актуальное кол-во игроков
    io.emit('playerCount', players.length);

    // Назначаем роль: первый — 1, второй — 2
    if (players.length === 1) {
        socket.emit('playerRole', 1);
    } else if (players.length === 2) {
        socket.emit('playerRole', 2);
    }

    // Логика старта игры
    socket.on('startGame', () => {
        io.emit('gameStart');
    });

    // Передача юнитов
    socket.on('spawnUnit', (unitData) => {
        socket.broadcast.emit('spawnUnit', unitData);
    });

    socket.on('disconnect', () => {
        players = players.filter(id => id !== socket.id);
        console.log(`User disconnected. Remaining: ${players.length}`);
        io.emit('playerCount', players.length);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
