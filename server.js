const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*" } });

let onlinePlayers = 0;
let waitingPlayer = null; // Здесь хранится ID того, кто нажал "В БОЙ" первым

io.on('connection', (socket) => {
    onlinePlayers++;
    io.emit('playerUpdate', onlinePlayers);
    console.log('Игрок подключился. Всего:', onlinePlayers);

    // Логика поиска боя
    socket.on('findMatch', () => {
        console.log('Игрок ищет бой:', socket.id);

        if (waitingPlayer && waitingPlayer !== socket.id) {
            // Если кто-то уже ждет, соединяем их
            const opponentId = waitingPlayer;
            waitingPlayer = null;

            // Отправляем ОБОИМ сигнал о начале боя
            io.to(socket.id).emit('matchFound');
            io.to(opponentId).emit('matchFound');
            
            console.log('Бой начался между:', socket.id, 'и', opponentId);
        } else {
            // Если никого нет, этот игрок становится ждущим
            waitingPlayer = socket.id;
            console.log('Игрок ждет соперника...');
        }
    });

    // Пересылка построек
    socket.on('spawnUnit', (data) => {
        socket.broadcast.emit('enemySpawn', data);
    });

    // Пересылка ресурсов (золото, шахты)
    socket.on('syncResources', (data) => {
        socket.broadcast.emit('syncEnemyResources', data);
    });

    socket.on('disconnect', () => {
        onlinePlayers--;
        if (waitingPlayer === socket.id) waitingPlayer = null;
        io.emit('playerUpdate', onlinePlayers);
        console.log('Игрок отключился');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Сервер запущен на порту:', PORT);
});
