const express = require('express');
const http = require('http');
const path = require('path');
const THREE = require('three');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

require('./models/db');

app.use(express.json());
app.use(express.static(__dirname));

const userRoutes = require('./routes/userRoutes');
const statsRoutes = require('./routes/statsRoutes');
const rankingsRoutes = require('./routes/rankingsRoutes');
const roomRoutes = require('./routes/roomRoutes');
app.use('/api/auth', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const xyzLimit = 500;
const rooms = {};
const socketToUserId = {};
const socketToRoom = {};
const { updateStats } = require('./controllers/statsController');

const weapons = [
    { id: 1, name: 'Sniper', damage: 100, fireRate: 1000, range: 1000, bulletSpeed: 30, ammo: -1, maxAmmo: -1 },
    { id: 2, name: 'Rocket', damage: 150, fireRate: 2000, range: 500, bulletSpeed: 15, ammo: 5, maxAmmo: 5, explosionRadius: 30 },
    { id: 3, name: 'Melee', damage: 80, fireRate: 333, range: 5, bulletSpeed: 0, ammo: -1, maxAmmo: -1 }
];

function getRoomPlayers(roomId) {
    if (!rooms[roomId]) return [];
    return Object.keys(rooms[roomId].players);
}

function broadcastRoomPlayerList(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    
    const playerList = Object.values(room.players).map(p => ({
        socketId: p.socketId,
        userId: p.userId,
        username: p.username
    }));
    
    io.to(roomId.toString()).emit('roomPlayers', { roomId, players: playerList });
}

io.on('connection', function (socket) {
    const socketid = socket.id;
    socket.emit('init', socketid);
    console.log('Player ' + socketid + ' connected.\n');

    socket.on('auth', function (data) {
        socketToUserId[socketid] = data.userId;
        console.log('Player ' + socketid + ' authenticated as user ' + data.userId + '\n');
    });

    socket.on('joinRoom', function(data) {
        const roomId = data.roomId;
        const username = data.username;
        const userId = socketToUserId[socketid];

        if (!rooms[roomId]) {
            rooms[roomId] = {
                players: {},
                bullets: [],
                status: 'waiting'
            };
        }

        rooms[roomId].players[socketid] = {
            socketId: socketid,
            userId: userId,
            username: username,
            position: { x: 0, y: 25, z: 0 }
        };

        socketToRoom[socketid] = roomId;
        socket.join(roomId.toString());

        console.log('Player ' + socketid + ' joined room ' + roomId + '\n');
        
        broadcastRoomPlayerList(roomId);
        socket.emit('roomJoined', { roomId });
    });

    socket.on('player', function (data) {
        const roomId = socketToRoom[socketid];
        if (!roomId || !rooms[roomId]) return;

        rooms[roomId].players[socketid].position = data[0];
        
        socket.to(roomId.toString()).emit('player', { online: [socketid, data] });
    });

    socket.on('bullet', function (data) {
        const roomId = socketToRoom[socketid];
        if (!roomId || !rooms[roomId]) return;

        console.log('Player ' + socketid + ' fired with weapon ' + (data[2] || 1) + ' in room ' + roomId + '.\n');
        var weaponId = data[2] || 1;
        rooms[roomId].bullets[rooms[roomId].bullets.length] = { 
            'position': data[0], 
            'speed': data[1], 
            'clientOrigin': socketid, 
            'weaponId': weaponId 
        };
        socket.to(roomId.toString()).emit('bullet', data);
    });

    socket.on('meleeHit', function(data) {
        const roomId = socketToRoom[socketid];
        if (!roomId || !rooms[roomId]) return;

        console.log('Player ' + socketid + ' melee hit ' + data.target + ' in room ' + roomId + '.\n');
        
        var killerUserId = socketToUserId[socketid];
        var victimUserId = socketToUserId[data.target];
        
        if (killerUserId) {
            updateStats(killerUserId, 'kill');
            console.log('Updated kill stats for user ' + killerUserId);
        }
        
        if (victimUserId) {
            updateStats(victimUserId, 'death');
            console.log('Updated death stats for user ' + victimUserId);
        }
        
        if (rooms[roomId].players[data.target]) {
            rooms[roomId].players[data.target].position.x = 9999;
        }
        io.to(roomId.toString()).emit('hit', { hit: data.target, by: socketid });
    });

    socket.on('rocketExplode', function(data) {
        const roomId = socketToRoom[socketid];
        if (!roomId || !rooms[roomId]) return;

        console.log('Rocket exploded at position: ', data.position, ' in room ' + roomId);
        
        var explosionPos = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
        var rocketWeapon = weapons[1];
        
        for (var player in rooms[roomId].players) {
            if (player !== socketid) {
                var playerPos = new THREE.Vector3(
                    rooms[roomId].players[player].position.x, 
                    rooms[roomId].players[player].position.y, 
                    rooms[roomId].players[player].position.z
                );
                var distance = explosionPos.distanceTo(playerPos);
                
                if (distance <= rocketWeapon.explosionRadius) {
                    console.log(socketid + " killed " + player + " with rocket explosion in room " + roomId + "!\n");
                    
                    var killerUserId = socketToUserId[socketid];
                    var victimUserId = socketToUserId[player];
                    
                    if (killerUserId) {
                        updateStats(killerUserId, 'kill');
                        console.log('Updated kill stats for user ' + killerUserId);
                    }
                    
                    if (victimUserId) {
                        updateStats(victimUserId, 'death');
                        console.log('Updated death stats for user ' + victimUserId);
                    }
                    
                    rooms[roomId].players[player].position.x = 9999;
                    io.to(roomId.toString()).emit('hit', { hit: player, by: socketid });
                }
            }
        }
        
        socket.to(roomId.toString()).emit('rocketExplode', data);
    });

    socket.on('startGame', function(data) {
        const roomId = data.roomId;
        if (!rooms[roomId]) return;

        rooms[roomId].status = 'playing';
        io.to(roomId.toString()).emit('gameStarted', { roomId });
        console.log('Game started in room ' + roomId + '\n');
    });

    socket.on('disconnect', function () {
        console.log('Player ' + socketid + ' disconnected.\n');
        
        const roomId = socketToRoom[socketid];
        if (roomId && rooms[roomId]) {
            delete rooms[roomId].players[socketid];
            
            if (Object.keys(rooms[roomId].players).length === 0) {
                delete rooms[roomId];
            } else {
                broadcastRoomPlayerList(roomId);
                socket.to(roomId.toString()).emit('player', { 'offline': socketid });
            }
        }
        
        delete socketToUserId[socketid];
        delete socketToRoom[socketid];
    });
});

setInterval(bulletHandler, 1000 / 60);

function bulletHandler() {
    for (var roomId in rooms) {
        var room = rooms[roomId];
        for (var i = 0; i < room.bullets.length; i++) {
            var x = room.bullets[i].position.x;
            var y = room.bullets[i].position.y;
            var z = room.bullets[i].position.z;
            var dx = room.bullets[i].speed.x;
            var dy = room.bullets[i].speed.y;
            var dz = room.bullets[i].speed.z;
            var bulletVector = new THREE.Vector3(x, y, z);
            
            room.bullets[i].position.x = x + dx;
            room.bullets[i].position.y = y + dy;
            room.bullets[i].position.z = z + dz;
            
            var weaponId = room.bullets[i].weaponId || 1;
            var weapon = weapons[weaponId - 1];
            
            for (var player in room.players) {
                if (player != room.bullets[i].clientOrigin) {
                    var playerVector = new THREE.Vector3(
                        room.players[player].position.x, 
                        room.players[player].position.y, 
                        room.players[player].position.z
                    );
                    var distance = bulletVector.distanceTo(playerVector);
                    
                    var hitDistance = 10;
                    if (weapon.name === 'Melee') {
                        hitDistance = weapon.range;
                    }
                    
                    if (distance <= hitDistance) {
                        console.log(room.bullets[i].clientOrigin + " killed " + player + " with " + weapon.name + " in room " + roomId + "!\n");

                        var killerUserId = socketToUserId[room.bullets[i].clientOrigin];
                        var victimUserId = socketToUserId[player];

                        if (killerUserId) {
                            updateStats(killerUserId, 'kill');
                            console.log('Updated kill stats for user ' + killerUserId);
                        }

                        if (victimUserId) {
                            updateStats(victimUserId, 'death');
                            console.log('Updated death stats for user ' + victimUserId);
                        }

                        room.players[player].position.x = 9999;
                        return io.to(roomId).emit('hit', { hit: player, by: room.bullets[i].clientOrigin });
                    }
                }
            }
            
            if ((bulletVector.x >= xyzLimit || bulletVector.x <= -xyzLimit) ||
                (bulletVector.y >= xyzLimit || bulletVector.y <= 0) ||
                (bulletVector.z >= xyzLimit || bulletVector.z <= -xyzLimit)) {
                room.bullets.splice(i, 1);
            }
        }
    }
}

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`\nGame Log:\n`);
    console.log(`Server running on port ${PORT}`);
});
