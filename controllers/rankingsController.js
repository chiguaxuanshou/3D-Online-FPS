const db = require('../models/db');

function getKillsRanking(req, res) {
    db.all(`
        SELECT u.username, s.kills, s.deaths, s.level
        FROM stats s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.kills DESC
        LIMIT 10
    `, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            success: true,
            data: rows.map((row, index) => ({
                rank: index + 1,
                username: row.username,
                kills: row.kills,
                deaths: row.deaths,
                level: row.level
            }))
        });
    });
}

function getWinrateRanking(req, res) {
    db.all(`
        SELECT u.username, s.kills, s.deaths, s.level,
               CASE WHEN (s.kills + s.deaths) > 0 THEN ROUND(CAST(s.kills AS REAL) / (s.kills + s.deaths) * 100, 2) ELSE 0 END AS winrate
        FROM stats s
        JOIN users u ON s.user_id = u.id
        ORDER BY winrate DESC
        LIMIT 10
    `, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            success: true,
            data: rows.map((row, index) => ({
                rank: index + 1,
                username: row.username,
                kills: row.kills,
                deaths: row.deaths,
                level: row.level,
                winrate: row.winrate
            }))
        });
    });
}

function getLevelRanking(req, res) {
    db.all(`
        SELECT u.username, s.kills, s.deaths, s.level
        FROM stats s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.level DESC
        LIMIT 10
    `, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            success: true,
            data: rows.map((row, index) => ({
                rank: index + 1,
                username: row.username,
                kills: row.kills,
                deaths: row.deaths,
                level: row.level
            }))
        });
    });
}

module.exports = {
    getKillsRanking,
    getWinrateRanking,
    getLevelRanking
};