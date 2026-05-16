const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// Force the server to tell browsers NEVER to cache files in the public directory
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
}));

let rooms = {};

// Helper function to bundle active, joinable rooms
function getOpenRooms() {
    let openList = [];
    for (const code in rooms) {
        // A room is joinable if 'mother' hasn't connected yet
        if (!rooms[code].players.mother) {
            openList.push({
                roomCode: code,
                host: 'Father'
            });
        }
    }
    return openList;
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Send the current available rooms list immediately to looking players
    socket.emit('roomsListUpdate', getOpenRooms());

    socket.on('joinRoom', ({ roomCode }) => {
        if (!rooms[roomCode]) {
            // Create room
            rooms[roomCode] = { players: { father: socket.id, mother: null } };
            socket.join(roomCode);
            socket.emit('roleAssigned', { role: 'father' });
            // Broadcast new room availability to everyone in lobby
            io.emit('roomsListUpdate', getOpenRooms());
        } else if (!rooms[roomCode].players.mother) {
            // Join room
            rooms[roomCode].players.mother = socket.id;
            socket.join(roomCode);
            socket.emit('roleAssigned', { role: 'mother' });
            
            io.to(roomCode).emit('gameStart');
            // Remove room from lobby list since it's now full
            io.emit('roomsListUpdate', getOpenRooms());
        } else {
            socket.emit('roomFull');
        }
    });

    socket.on('playerMove', ({ roomCode, fromR, fromC, toR, toC, moveDetails }) => {
        socket.to(roomCode).emit('opponentMove', { fromR, fromC, toR, toC, moveDetails });
    });

    socket.on('playerPromote', ({ roomCode, r, c, type }) => {
        socket.to(roomCode).emit('opponentPromote', { r, c, type });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const roomCode in rooms) {
            if (rooms[roomCode].players.father === socket.id || rooms[roomCode].players.mother === socket.id) {
                io.to(roomCode).emit('playerDisconnected');
                delete rooms[roomCode];
            }
        }
        io.emit('roomsListUpdate', getOpenRooms());
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
