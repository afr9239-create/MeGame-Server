const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let players = {};

io.on('connection', (socket) => {
    if (Object.keys(players).length < 2) {
        const role = Object.keys(players).length === 0 ? 1 : 2;
        players[socket.id] = role;
        socket.emit('init', role);
        console.log('Игрок ' + role + ' вошел');
    }

    socket.on('spawn', (data) => {
        socket.broadcast.emit('enemySpawn', data);
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Сервер запущен'));
