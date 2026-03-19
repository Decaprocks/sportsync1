const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/players - List all players with optional filters
router.get('/', async (req, res) => {
    try {
        const { sport, location, min_rating, max_rating } = req.query;
        let query = `
      SELECT p.player_id, u.name, u.email, p.skill_rating, p.location,
             p.sport_preference, p.wins, p.losses, p.draws, p.age, p.gender,
             (p.wins + p.losses + p.draws) AS total_matches
      FROM players p
      JOIN users u ON p.player_id = u.user_id
      WHERE 1=1
    `;
        const params = [];

        if (sport && sport !== 'all') {
            query += ' AND (p.sport_preference = ? OR p.sport_preference = ?)';
            params.push(sport, 'general');
        }
        if (location) {
            query += ' AND p.location LIKE ?';
            params.push(`%${location}%`);
        }
        if (min_rating) {
            query += ' AND p.skill_rating >= ?';
            params.push(parseInt(min_rating));
        }
        if (max_rating) {
            query += ' AND p.skill_rating <= ?';
            params.push(parseInt(max_rating));
        }

        query += ' ORDER BY p.skill_rating DESC';

        const [players] = await db.query(query, params);
        res.json(players);
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
        const [players] = await db.query('CALL Get_Nearby_Players(?, ?, ?)', [
            location || null,
            sport || 'general',
            req.session.user.user_id
        ]);

        res.json(players[0] || []);
    } catch (err) {
        console.error('Nearby players error:', err);
        res.status(500).json({ error: 'Failed to find nearby players' });
    }
});

// GET /api/players/:id - Get player profile
router.get('/:id', async (req, res) => {
    try {
        const [players] = await db.query('SELECT * FROM v_player_summary WHERE player_id = ?', [req.params.id]);
        if (players.length === 0) return res.status(404).json({ error: 'Player not found' });

        // Get recent matches
        const [matches] = await db.query(`
      SELECT m.*, u1.name AS player1_name, u2.name AS player2_name, v.name AS venue_name
      FROM matches m
      JOIN users u1 ON m.player1_id = u1.user_id
      JOIN users u2 ON m.player2_id = u2.user_id
      LEFT JOIN venues v ON m.venue_id = v.venue_id
      WHERE m.player1_id = ? OR m.player2_id = ?
      ORDER BY m.match_date DESC
      LIMIT 10
    `, [req.params.id, req.params.id]);

        // Get rating history
        const [history] = await db.query(
            'SELECT * FROM match_history WHERE player_id = ? ORDER BY recorded_at DESC LIMIT 10',
            [req.params.id]
        );

        res.json({ player: players[0], matches, history });
    } catch (err) {
        console.error('Player profile error:', err);
        res.status(500).json({ error: 'Failed to fetch player' });
    }
});

module.exports = router;
