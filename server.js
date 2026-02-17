const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" } // Разрешаем подключения с любых сайтов
});

let waitingPlayers = []; 
let onlineCount = 0;

io.on('connection', (socket) => {
    onlineCount++;
    console.log('User connected. Total online:', onlineCount);
    
    // Сразу отправляем обновленное количество всем
    io.emit('onlineUpdate', onlineCount);

    socket.on('findGame', () => {
        // Убираем игрока из очереди, если он там уже был (защита от дублей)
        waitingPlayers = waitingPlayers.filter(p => p.id !== socket.id);

        if (waitingPlayers.length > 0) {
            const opponent = waitingPlayers.shift();
            const roomId = opponent.id + socket.id;

            opponent.join(roomId);
            socket.join(roomId);

            console.log('Match Created: ' + roomId);

            // Запускаем игру
            opponent.emit('startGame', { role: 1, room: roomId });
            socket.emit('startGame', { role: 2, room: roomId });
        } else {
            waitingPlayers.push(socket);
            console.log('Player waiting in queue...');
        }
    });

    socket.on('placeBuilding', (data) => {
        // Пересылаем данные только второму игроку в этой комнате
        socket.to(data.room).emit('syncBuilding', data);
    });

    socket.on('disconnect', () => {
        onlineCount--;
        io.emit('onlineUpdate', onlineCount);
        waitingPlayers = waitingPlayers.filter(p => p.id !== socket.id);
        console.log('User disconnected. Online:', onlineCount);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
