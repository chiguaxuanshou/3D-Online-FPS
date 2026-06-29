const db = require('../models/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');

function register(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to hash password' });
        }

        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: 'Failed to create user' });
            }

            const token = generateToken(this.lastID, username);
            res.status(201).json({ 
                message: 'User created successfully', 
                userId: this.lastID,
                token 
            });
        });
    });
}

function login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to compare passwords' });
            }

            if (!result) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const token = generateToken(user.id, user.username);
            res.json({ 
                message: 'Login successful', 
                userId: user.id,
                username: user.username,
                token 
            });
        });
    });
}

function getUser(req, res) {
    res.json({ userId: req.user.userId, username: req.user.username });
}

module.exports = { register, login, getUser };