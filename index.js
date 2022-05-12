const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let usersCount = 0;
let selectedPrices = [];

function updateUsersCount() {
  io.emit('users:count', usersCount);
}

function updateSelectedPrices() {
  io.emit('selected:prices', selectedPrices);
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
});

io.on('connection', (socket) => {
  usersCount += 1;
  updateUsersCount();

  socket.on('selected:option', (price) => {
    const selectedPrice = selectedPrices.find((o) => o.id === socket.id);
    if (selectedPrice) {
      selectedPrice.price = price;
    } else {
      selectedPrices.push({ id: socket.id, price });
    }

    updateSelectedPrices();
  });

  socket.on('disconnect', () => {
    usersCount -= 1;
    updateUsersCount();

    selectedPrices = selectedPrices.filter((o) => o.id !== socket.id);
    updateSelectedPrices();
  });
});

server.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('listening on *:3000');
});
