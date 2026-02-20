const io = require('socket.io')(process.env.PORT || 3000, { cors: { origin: "*" } });

let players = {};

io.on('connection', (socket) => {
    socket.on('initPlayer', (data) => {
        players[socket.id] = data;
        io.emit('updatePlayers', players);
    });

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            socket.broadcast.emit('updatePlayers', players); // Рассылаем всем
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});
