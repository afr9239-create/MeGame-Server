// Этот код сам определит, по какому адресу ты открыл игру
const socket = io(window.location.origin, {
    transports: ["polling", "websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity
});

const dot = document.getElementById('dot');
const netText = document.getElementById('net-text');

socket.on('connect', () => {
    console.log("УРА! СОЕДИНЕНИЕ ЕСТЬ!");
    dot.className = 'online'; // В CSS у нас .online
    dot.style.background = '#00ff00';
    netText.innerText = "ONLINE";
});

socket.on('connect_error', (err) => {
    console.log("Ошибка связи:", err.message);
    dot.style.background = 'red';
    netText.innerText = "CONNECTING...";
});

// Проверка: получает ли клиент данные о других игроках
socket.on('onlineUpdate', (c) => {
    document.getElementById('counter').innerText = `ИГРОКОВ В СЕТИ: ${c}`;
});
