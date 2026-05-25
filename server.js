const express = require('express'); // Fixed: lower-case const
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true // Backward compatibility layer for mobile app integrations/older engines
});

// Force the server to tell browsers NEVER to cache files in the public directory
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
}));

app.use(express.json());

let rooms = {};

// Helper function to bundle active, joinable rooms for the lobby view
function getOpenRooms() {
    let openList = [];
    for (const code in rooms) {
        if (!rooms[code].players.mother) {
            openList.push({
                roomCode: code,
                isStaked: rooms[code].isStaked,
                stakeAmount: rooms[code].stakeAmount
            });
        }
    }
    return openList;
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Send the current available rooms list immediately to searching players
    socket.emit('roomsListUpdate', getOpenRooms());

    socket.on('joinRoom', ({ roomCode, isStaked, stakeAmount, opayPhone }) => {
        if (!rooms[roomCode]) {
            // Setup a brand new lobby session room
            rooms[roomCode] = { 
                players: { father: socket.id, mother: null },
                isStaked: isStaked || false,
                stakeAmount: isStaked ? parseInt(stakeAmount) : 0,
                playerWallets: { father: opayPhone || null, mother: null },
                paymentSettled: { father: !isStaked, mother: false }
            };
            
            socket.join(roomCode);
            socket.emit('roleAssigned', { role: 'father' });
            
            // If staking is selected, trigger payment initialization hook layout
            if (rooms[roomCode].isStaked) {
                // Here is where you drop the call to your OPay Merchant function to trigger bills:
                // initializeOpayInvoice(socket, rooms[roomCode].stakeAmount, roomCode);
            }

            io.emit('roomsListUpdate', getOpenRooms());
        } else if (!rooms[roomCode].players.mother) {
            // Join an existing room configuration
            rooms[roomCode].players.mother = socket.id;
            rooms[roomCode].playerWallets.mother = opayPhone || null;
            rooms[roomCode].paymentSettled.mother = !rooms[roomCode].isStaked;

            socket.join(roomCode);
            socket.emit('roleAssigned', { role: 'mother' });
            
            // Start match immediately if non-staked, or wait for webhook logs to turn true
            if (rooms[roomCode].paymentSettled.father && rooms[roomCode].paymentSettled.mother) {
                io.to(roomCode).emit('gameStart');
            } else {
                // If it is a staked match, push payment link setup to Player 2 (Mother)
                if (rooms[roomCode].isStaked) {
                     // initializeOpayInvoice(socket, rooms[roomCode].stakeAmount, roomCode);
                }
            }
            
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

    socket.on('matchEnded', async (data) => {
        const { roomCode, loserRole } = data;
        
        // FIXED: Accessing standard object via brackets instead of .get()
        const room = rooms[roomCode]; 

        if (room) {
            if (room.isStaked) {
                const totalPool = room.stakeAmount * 2; // Total money collected from both players
                
                // Calculate the 1% platform charge
                const platformFee = totalPool * 0.01; 
                
                // Winner gets the remaining 99% of the total pool
                const winnerPayout = totalPool - platformFee;

                const winnerRole = (loserRole === 'father') ? 'mother' : 'father';
                
                // FIXED: Matched room structure paths (room.players[winnerRole])
                const winnerId = room.players[winnerRole]; 
                const winnerWallet = room.playerWallets[winnerRole];

                console.log(`Match Ended in Room ${roomCode}.`);
                console.log(`Total Pool: ₦${totalPool} | 1% Fee Charged: ₦${platformFee} | Winner Payout: ₦${winnerPayout} to wallet: ${winnerWallet}`);

                // 1. Trigger your OPay / Paystack payout API here using 'winnerPayout' and 'winnerWallet'
                // 2. Save 'platformFee' into your revenue database or admin wallet

                // Notify players of the final breakdown
                io.to(roomCode).emit('matchOverResult', {
                    winner: winnerRole,
                    totalPool: totalPool,
                    feeCharged: platformFee,
                    finalPayout: winnerPayout
                });
            }

            // FIXED: Clean up room data from memory after game finishes
            delete rooms[roomCode];
            io.emit('roomsListUpdate', getOpenRooms());
        }
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

// Production environment variable integration setup
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running securely on port ${PORT}`);
});
