const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database successfully');
        initDatabase();
    }
});

function initDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        kills INTEGER DEFAULT 0,
        deaths INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id)
    )`, (err) => {
        if (err) {
            console.error('Error creating stats table:', err.message);
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS weapon_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        weapon_type TEXT NOT NULL,
        usage_count INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, weapon_type)
    )`, (err) => {
        if (err) {
            console.error('Error creating weapon_stats table:', err.message);
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        max_players INTEGER DEFAULT 4,
        owner_id INTEGER NOT NULL,
        status TEXT DEFAULT 'waiting',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    )`, (err) => {
        if (err) {
            console.error('Error creating rooms table:', err.message);
        }
    });
}

module.exports = db;