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

// Храним ID игроков: { socketId: role }
let players = {};

io.on('connection', (socket) => {
    console.log(`Подключился: ${socket.id}`);

    // Назначаем роль
    const activeRoles = Object.values(players);
    let role = 0;
    
    if (!activeRoles.includes(1)) {
        role = 1;
    } else if (!activeRoles.includes(2)) {
        role = 2;
    }

    if (role > 0) {
        players[socket.id] = role;
        socket.emit('playerRole', role);
        console.log(`Назначена роль ${role} для ${socket.id}`);
    }

    // Рассылаем всем количество игроков
    io.emit('playerCount', Object.keys(players).length);

    // СТАРТ ИГРЫ
    socket.on('startGame', () => {
        console.log('Команда СТАРТ получена');
        io.emit('gameStart');
    });

    // САМОЕ ВАЖНОЕ: Передача юнита
    socket.on('spawnUnit', (unitData) => {
        // Сервер берет данные от одного и кидает ВСЕМ ОСТАЛЬНЫМ
        socket.broadcast.emit('spawnUnit', unitData);
        console.log(`Юнит от игрока ${unitData.side} отправлен остальным`);
    });

    // ОТКЛЮЧЕНИЕ
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerCount', Object.keys(players).length);
        console.log(`Игрок отключился. Осталось: ${Object.keys(players).length}`);
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
