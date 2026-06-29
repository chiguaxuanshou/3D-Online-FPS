const db = require('../models/db');

const roomStates = {
    WAITING: 'waiting',
    PLAYING: 'playing',
    CLOSED: 'closed'
};

function createRoom(req, res) {
    const { name, max_players } = req.body;
    const ownerId = req.user.userId;

    if (!name) {
        return res.status(400).json({ error: 'Room name is required' });
    }

    const maxPlayers = max_players || 4;

    db.run('INSERT INTO rooms (name, max_players, owner_id, status) VALUES (?, ?, ?, ?)', 
        [name, maxPlayers, ownerId, roomStates.WAITING], 
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to create room' });
            }
            res.status(201).json({ 
                id: this.lastID, 
                name, 
                max_players: maxPlayers, 
                owner_id: ownerId, 
                status: roomStates.WAITING 
            });
        }
    );
}

function getRooms(req, res) {
    db.all('SELECT r.id, r.name, r.max_players, r.owner_id, r.status, r.created_at, u.username as owner_name FROM rooms r JOIN users u ON r.owner_id = u.id WHERE r.status != ?', 
        [roomStates.CLOSED], 
        (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch rooms' });
            }
            res.json({ rooms: rows });
        }
    );
}

function joinRoom(req, res) {
    const roomId = parseInt(req.params.id);
    const userId = req.user.userId;

    db.get('SELECT * FROM rooms WHERE id = ?', [roomId], (err, room) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        if (room.status !== roomStates.WAITING) {
            return res.status(400).json({ error: 'Room is not available' });
        }

        if (room.owner_id === userId) {
            return res.status(400).json({ error: 'You are already the owner of this room' });
        }

        res.json({ 
            message: 'Joined room successfully', 
            room: {
                id: room.id,
                name: room.name,
                max_players: room.max_players,
                owner_id: room.owner_id,
                status: room.status
            }
        });
    });
}

function leaveRoom(req, res) {
    const roomId = parseInt(req.params.id);
    const userId = req.user.userId;

    db.get('SELECT * FROM rooms WHERE id = ?', [roomId], (err, room) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        if (room.status === roomStates.CLOSED) {
            return res.status(400).json({ error: 'Room is already closed' });
        }

        if (room.owner_id === userId) {
            db.run('UPDATE rooms SET status = ? WHERE id = ?', [roomStates.CLOSED, roomId], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to close room' });
                }
                res.json({ message: 'Room closed successfully' });
            });
        } else {
            res.json({ message: 'Left room successfully' });
        }
    });
}

function startGame(req, res) {
    const roomId = parseInt(req.params.id);
    const userId = req.user.userId;

    db.get('SELECT * FROM rooms WHERE id = ?', [roomId], (err, room) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        if (room.owner_id !== userId) {
            return res.status(403).json({ error: 'Only the room owner can start the game' });
        }

        if (room.status !== roomStates.WAITING) {
            return res.status(400).json({ error: 'Room is not in waiting state' });
        }

        db.run('UPDATE rooms SET status = ? WHERE id = ?', [roomStates.PLAYING, roomId], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to start game' });
            }
            res.json({ message: 'Game started successfully', room_id: roomId });
        });
    });
}

module.exports = { createRoom, getRooms, joinRoom, leaveRoom, startGame, roomStates };
