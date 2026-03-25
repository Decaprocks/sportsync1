const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, phone, age, gender, location, sport_preference, license_no, organization } = req.body;

        // Check if email already exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Build user document based on role
        const userData = {
            name,
            email,
            password_hash,
            role: role || 'player',
            phone: phone || null
        };

        // Add role-specific fields
        if (role === 'venue_manager') {
            userData.license_no = license_no || null;
            userData.organization = organization || null;
        } else {
            // Default: player
            userData.age = age || 18;
            userData.gender = gender || 'other';
            userData.skill_rating = 1200;
            userData.location = location || '';
            userData.sport_preference = sport_preference || 'general';
            userData.wins = 0;
            userData.losses = 0;
            userData.draws = 0;
        }

        const user = await User.create(userData);

        // Set session
        req.session.user = {
            user_id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

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

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Set session
        req.session.user = {
            user_id: user._id,
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
