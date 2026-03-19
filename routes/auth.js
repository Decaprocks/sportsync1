const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, phone, age, gender, location, sport_preference, license_no, organization } = req.body;

        // Check if email already exists
        const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Insert into users (superclass)
        const [result] = await db.query(
            'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)',
            [name, email, password_hash, role || 'player', phone || null]
        );

        const userId = result.insertId;

        // Insert into subclass based on role
        if (role === 'venue_manager') {
            await db.query(
                'INSERT INTO venue_managers (manager_id, license_no, organization) VALUES (?, ?, ?)',
                [userId, license_no || null, organization || null]
            );
        } else {
            // Default: player
            await db.query(
                'INSERT INTO players (player_id, age, gender, skill_rating, location, sport_preference) VALUES (?, ?, ?, 1200, ?, ?)',
                [userId, age || 18, gender || 'other', location || '', sport_preference || 'general']
            );
        }

        // Set session
        req.session.user = { user_id: userId, name, email, role: role || 'player' };

        res.json({ success: true, user: req.session.user });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Set session
        req.session.user = {
            user_id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        res.json({ success: true, user: req.session.user });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// GET /api/auth/me - Get current session user
router.get('/me', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ error: 'Not logged in' });
    }
});

module.exports = router;
