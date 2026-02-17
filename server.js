const io = require('socket.io')(process.env.PORT || 3000, {
    cors: { origin: "*" }
});

let waitingPlayer = null;

io.on('connection', (socket) => {
    console.log('New player:', socket.id);

    socket.on('findGame', () => {
        if (waitingPlayer) {
            // Создаем комнату для двоих
            const roomId = waitingPlayer.id + '#' + socket.id;
            socket.join(roomId);
            waitingPlayer.join(roomId);

            // Рассылаем роли (один сверху, другой снизу)
            waitingPlayer.emit('startGame', { role: 1, room: roomId });
            socket.emit('startGame', { role: 2, room: roomId });

            waitingPlayer = null;
        } else {
            waitingPlayer = socket;
            socket.emit('waiting', 'Searching for opponent...');
        }
    });

    socket.on('placeBuilding', (data) => {
        // Пересылаем данные о постройке другому игроку в комнате
        socket.to(data.room).emit('syncBuilding', data);
    });

    socket.on('disconnect', () => {
        if (waitingPlayer === socket) waitingPlayer = null;
    });
});
