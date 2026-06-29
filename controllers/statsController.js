const db = require('../models/db');

function getStats(req, res) {
    const userId = req.params.userId;

    db.get('SELECT * FROM stats WHERE user_id = ?', [userId], (err, stats) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!stats) {
            return res.json({
                userId: userId,
                kills: 0,
                deaths: 0,
                level: 1,
                kdRatio: 0,
                winRate: 0
            });
        }

        const kdRatio = stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : stats.kills;
        const winRate = stats.kills + stats.deaths > 0 
            ? ((stats.kills / (stats.kills + stats.deaths)) * 100).toFixed(1) 
            : 0;

        res.json({
            userId: userId,
            kills: stats.kills,
            deaths: stats.deaths,
            level: stats.level,
            kdRatio: parseFloat(kdRatio),
            winRate: parseFloat(winRate)
        });
    });
}

function updateStats(userId, type) {
    db.get('SELECT * FROM stats WHERE user_id = ?', [userId], (err, stats) => {
        if (err) {
            console.error('Error fetching stats:', err.message);
            return;
        }

        if (!stats) {
            if (type === 'kill') {
                const level = Math.floor(1 / 10) + 1;
                db.run('INSERT INTO stats (user_id, kills, deaths, level) VALUES (?, 1, 0, ?)', [userId, level], (err) => {
                    if (err) console.error('Error inserting stats:', err.message);
                });
            } else {
                db.run('INSERT INTO stats (user_id, kills, deaths, level) VALUES (?, 0, 1, 1)', [userId], (err) => {
                    if (err) console.error('Error inserting stats:', err.message);
                });
            }
            return;
        }

        let newKills = stats.kills;
        let newDeaths = stats.deaths;

        if (type === 'kill') {
            newKills++;
        } else if (type === 'death') {
            newDeaths++;
        }

        const newLevel = Math.floor(newKills / 10) + 1;

        db.run(
            'UPDATE stats SET kills = ?, deaths = ?, level = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [newKills, newDeaths, newLevel, userId],
            (err) => {
                if (err) console.error('Error updating stats:', err.message);
            }
        );
    });
}

function updateWeaponStats(userId, weaponType) {
    db.get('SELECT * FROM weapon_stats WHERE user_id = ? AND weapon_type = ?', [userId, weaponType], (err, weaponStat) => {
        if (err) {
            console.error('Error fetching weapon stats:', err.message);
            return;
        }

        if (!weaponStat) {
            db.run('INSERT INTO weapon_stats (user_id, weapon_type, usage_count) VALUES (?, ?, 1)', [userId, weaponType], (err) => {
                if (err) console.error('Error inserting weapon stats:', err.message);
            });
        } else {
            db.run(
                'UPDATE weapon_stats SET usage_count = usage_count + 1 WHERE user_id = ? AND weapon_type = ?',
                [userId, weaponType],
                (err) => {
                    if (err) console.error('Error updating weapon stats:', err.message);
                }
            );
        }
    });
}

module.exports = { getStats, updateStats, updateWeaponStats };