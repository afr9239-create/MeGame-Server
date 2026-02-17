const io = require('socket.io')(process.env.PORT || 3000, {
    cors: { origin: "*" }
});

let waitingPlayers = []; // Очередь игроков
let onlineCount = 0;

io.on('connection', (socket) => {
    onlineCount++;
    io.emit('onlineUpdate', onlineCount); // Сообщаем всем об онлайне
    console.log('Player connected. Online:', onlineCount);

    socket.on('findGame', () => {
        // Проверяем, не ищет ли этот игрок уже игру
        if (waitingPlayers.includes(socket)) return;

        if (waitingPlayers.length > 0) {
            const opponent = waitingPlayers.shift();
            const roomId = opponent.id + socket.id;

            opponent.join(roomId);
            socket.join(roomId);

            // Запуск игры для обоих
            opponent.emit('startGame', { role: 1, room: roomId });
            socket.emit('startGame', { role: 2, room: roomId });
            
            console.log('Match found! Room:', roomId);
        } else {
            waitingPlayers.push(socket);
            console.log('Player added to queue');
        }
    });

    socket.on('placeBuilding', (data) => {
        socket.to(data.room).emit('syncBuilding', data);
    });

    socket.on('disconnect', () => {
        onlineCount--;
        io.emit('onlineUpdate', onlineCount);
        waitingPlayers = waitingPlayers.filter(p => p.id !== socket.id);
        console.log('Player disconnected');
    });
});
