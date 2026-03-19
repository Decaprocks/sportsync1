const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/leaderboard - Get player leaderboard from view
router.get('/', async (req, res) => {
    try {
        const { sport, limit } = req.query;
        let query = 'SELECT * FROM v_leaderboard WHERE 1=1';
        const params = [];

        if (sport && sport !== 'all') {
            query += ' AND (sport_preference = ? OR sport_preference = ?)';
            params.push(sport, 'general');
        }

        query += ` LIMIT ?`;
        params.push(parseInt(limit) || 50);

        const [leaderboard] = await db.query(query, params);
        res.json(leaderboard);
    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

module.exports = router;
