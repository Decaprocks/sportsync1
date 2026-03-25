const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/leaderboard - Get player leaderboard (replaces SQL view v_leaderboard)
router.get('/', async (req, res) => {
    try {
        const { sport, limit } = req.query;
        const filter = { role: 'player' };

        if (sport && sport !== 'all') {
            filter.$or = [
                { sport_preference: sport },
                { sport_preference: 'general' }
            ];
        }

        const players = await User.find(filter)
            .select('name skill_rating wins losses draws sport_preference location')
            .sort({ skill_rating: -1 })
            .limit(parseInt(limit) || 50)
            .lean();

        // Build leaderboard with computed fields (replaces v_leaderboard view)
        const leaderboard = players.map((p, index) => {
            const totalMatches = (p.wins || 0) + (p.losses || 0) + (p.draws || 0);
            return {
                rank: index + 1,
                player_id: p._id,
                name: p.name,
                skill_rating: p.skill_rating,
                wins: p.wins || 0,
                losses: p.losses || 0,
                draws: p.draws || 0,
                total_matches: totalMatches,
                win_rate: totalMatches > 0
                    ? (((p.wins || 0) / totalMatches) * 100).toFixed(1)
                    : '0.0',
                sport_preference: p.sport_preference,
                location: p.location
            };
        });

        res.json(leaderboard);
    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

module.exports = router;
