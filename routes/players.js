const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Match = require('../models/Match');

// GET /api/players - List all players with optional filters
router.get('/', async (req, res) => {
    try {
        const { sport, location, min_rating, max_rating } = req.query;
        const filter = { role: 'player' };

        if (sport && sport !== 'all') {
            filter.$or = [
                { sport_preference: sport },
                { sport_preference: 'general' }
            ];
        }
        if (location) {
            filter.location = { $regex: location, $options: 'i' };
        }
        if (min_rating) {
            filter.skill_rating = { ...filter.skill_rating, $gte: parseInt(min_rating) };
        }
        if (max_rating) {
            filter.skill_rating = { ...filter.skill_rating, $lte: parseInt(max_rating) };
        }

        const players = await User.find(filter)
            .select('name email skill_rating location sport_preference wins losses draws age gender')
            .sort({ skill_rating: -1 })
            .lean();

        // Add computed fields
        const result = players.map(p => ({
            player_id: p._id,
            name: p.name,
            email: p.email,
            skill_rating: p.skill_rating,
            location: p.location,
            sport_preference: p.sport_preference,
            wins: p.wins,
            losses: p.losses,
            draws: p.draws,
            age: p.age,
            gender: p.gender,
            total_matches: (p.wins || 0) + (p.losses || 0) + (p.draws || 0)
        }));

        res.json(result);
    } catch (err) {
        console.error('Players list error:', err);
        res.status(500).json({ error: 'Failed to fetch players' });
    }
});

// GET /api/players/nearby - Find nearby players for matchmaking
router.get('/nearby', async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: 'Login required' });

        const { sport, location } = req.query;
        const filter = {
            role: 'player',
            _id: { $ne: req.session.user.user_id }
        };

        if (sport && sport !== 'general') {
            filter.$or = [
                { sport_preference: sport },
                { sport_preference: 'general' }
            ];
        }
        if (location) {
            filter.location = { $regex: location, $options: 'i' };
        }

        const players = await User.find(filter)
            .select('name email skill_rating location sport_preference wins losses draws age gender')
            .sort({ skill_rating: -1 })
            .limit(20)
            .lean();

        const result = players.map(p => ({
            player_id: p._id,
            name: p.name,
            email: p.email,
            skill_rating: p.skill_rating,
            location: p.location,
            sport_preference: p.sport_preference,
            wins: p.wins,
            losses: p.losses,
            draws: p.draws,
            age: p.age,
            gender: p.gender,
            total_matches: (p.wins || 0) + (p.losses || 0) + (p.draws || 0)
        }));

        res.json(result);
    } catch (err) {
        console.error('Nearby players error:', err);
        res.status(500).json({ error: 'Failed to find nearby players' });
    }
});

// GET /api/players/:id - Get player profile
router.get('/:id', async (req, res) => {
    try {
        const player = await User.findOne({ _id: req.params.id, role: 'player' })
            .select('-password_hash')
            .lean();

        if (!player) return res.status(404).json({ error: 'Player not found' });

        // Format player data like the SQL view v_player_summary
        const playerSummary = {
            player_id: player._id,
            name: player.name,
            email: player.email,
            skill_rating: player.skill_rating,
            location: player.location,
            sport_preference: player.sport_preference,
            wins: player.wins,
            losses: player.losses,
            draws: player.draws,
            age: player.age,
            gender: player.gender,
            bio: player.bio,
            total_matches: (player.wins || 0) + (player.losses || 0) + (player.draws || 0),
            win_rate: ((player.wins || 0) + (player.losses || 0) + (player.draws || 0)) > 0
                ? (((player.wins || 0) / ((player.wins || 0) + (player.losses || 0) + (player.draws || 0))) * 100).toFixed(1)
                : 0
        };

        // Get recent matches
        const matches = await Match.find({
            $or: [
                { player1_id: req.params.id },
                { player2_id: req.params.id }
            ]
        })
            .sort({ match_date: -1 })
            .limit(10)
            .lean();

        // Get rating history from embedded elo_history in matches
        const allHistory = [];
        matches.forEach(m => {
            if (m.elo_history) {
                m.elo_history.forEach(h => {
                    if (h.player_id.toString() === req.params.id) {
                        allHistory.push(h);
                    }
                });
            }
        });
        allHistory.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));

        res.json({ player: playerSummary, matches, history: allHistory.slice(0, 10) });
    } catch (err) {
        console.error('Player profile error:', err);
        res.status(500).json({ error: 'Failed to fetch player' });
    }
});

module.exports = router;
