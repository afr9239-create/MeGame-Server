const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Настройка CORS, чтобы игра могла подключиться к серверу Render
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

let onlinePlayers = 0;

io.on('connection', (socket) => {
    onlinePlayers++;
    console.log(`Игрок подключился. Всего в сети: ${onlinePlayers}`);

    // Отправляем всем игрокам обновленное количество
    io.emit('playerUpdate', onlinePlayers);

    socket.on('disconnect', () => {
        onlinePlayers--;
        console.log(`Игрок отключился. Осталось: ${onlinePlayers}`);
        io.emit('playerUpdate', onlinePlayers);
    });
});

// Render сам назначит порт через process.env.PORT
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Сервер War Castle запущен на порту ${PORT}`);
});
