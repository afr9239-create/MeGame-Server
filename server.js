const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

let totalConnected = 0;

io.on('connection', (socket) => {
    totalConnected++;
    io.emit('totalOnline', totalConnected);

    socket.on('joinRoom', (roomName) => {
        socket.join(roomName);
        socket.currentRoom = roomName;

        const room = io.sockets.adapter.rooms.get(roomName);
        const numClients = room ? room.size : 0;

        // Передаем роль и общее кол-во игроков в комнате
        socket.emit('playerRole', numClients);
        io.to(roomName).emit('playerCount', numClients);
    });

    socket.on('spawnUnit', (data) => {
        if (socket.currentRoom) {
            socket.to(socket.currentRoom).emit('spawnUnit', data);
        }
    });

    socket.on('startGame', () => {
        if (socket.currentRoom) {
            io.to(socket.currentRoom).emit('gameStart');
        }
    });

    socket.on('disconnect', () => {
        totalConnected--;
        io.emit('totalOnline', totalConnected);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
