const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

let players = {};

io.on('connection', (socket) => {
    console.log('Игрок подключился:', socket.id);

    // Создаем нового игрока в объекте
    players[socket.id] = { x: 0, y: 0, angle: 0, color: 'white', atk: false };

    // Получаем данные от клиента
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id] = data; // Обновляем данные (x, y, угол, атака и т.д.)
        }
    });

    // Рассылаем состояние мира всем игрокам 60 раз в секунду
    setInterval(() => {
        io.emit('update', players);
    }, 1000 / 60);

    socket.on('disconnect', () => {
        delete players[socket.id];
        console.log('Игрок отключился:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
