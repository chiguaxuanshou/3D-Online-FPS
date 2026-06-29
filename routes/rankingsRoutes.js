const express = require('express');
const router = express.Router();
const rankingsController = require('../controllers/rankingsController');

router.get('/kills', rankingsController.getKillsRanking);
router.get('/winrate', rankingsController.getWinrateRanking);
router.get('/level', rankingsController.getLevelRanking);

module.exports = router;