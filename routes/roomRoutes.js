const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createRoom, getRooms, joinRoom, leaveRoom, startGame } = require('../controllers/roomController');

router.post('/', authenticateToken, createRoom);
router.get('/', getRooms);
router.post('/:id/join', authenticateToken, joinRoom);
router.post('/:id/leave', authenticateToken, leaveRoom);
router.post('/:id/start', authenticateToken, startGame);

module.exports = router;
