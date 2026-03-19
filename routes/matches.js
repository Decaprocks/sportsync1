const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/matches - Create a new match
router.post('/', async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: 'Login required' });

        const { player2_id, sport, venue_id, booking_id, match_date } = req.body;
        const player1_id = req.session.user.user_id;

        // Insert match (triggers trg_check_eligibility BEFORE INSERT)
        const [result] = await db.query(
            'INSERT INTO matches (player1_id, player2_id, sport, venue_id, booking_id, match_date) VALUES (?,?,?,?,?,?)',
            [player1_id, player2_id, sport, venue_id || null, booking_id || null, match_date]
        );

        res.json({ success: true, match_id: result.insertId });
    } catch (err) {
        console.error('Create match error:', err);
        // Handle eligibility trigger errors
        if (err.sqlMessage && err.sqlMessage.includes('ELIGIBILITY ERROR')) {
            return res.status(403).json({ error: err.sqlMessage });
        }
        res.status(500).json({ error: 'Failed to create match: ' + (err.sqlMessage || err.message) });
    }
});

// GET /api/matches - List matches with optional filters
router.get('/', async (req, res) => {
    try {
        const { sport, status, player_id } = req.query;
        let query = `
      SELECT m.*, u1.name AS player1_name, u2.name AS player2_name,
             p1.skill_rating AS player1_rating, p2.skill_rating AS player2_rating,
             v.name AS venue_name
      FROM matches m
      JOIN users u1 ON m.player1_id = u1.user_id
      JOIN users u2 ON m.player2_id = u2.user_id
      JOIN players p1 ON m.player1_id = p1.player_id
      JOIN players p2 ON m.player2_id = p2.player_id
      LEFT JOIN venues v ON m.venue_id = v.venue_id
      WHERE 1=1
    `;
        const params = [];

        if (sport && sport !== 'all') {
            query += ' AND m.sport = ?';
            params.push(sport);
        }
        if (status) {
            query += ' AND m.status = ?';
            params.push(status);
        }
        if (player_id) {
            query += ' AND (m.player1_id = ? OR m.player2_id = ?)';
            params.push(player_id, player_id);
        }

        query += ' ORDER BY m.match_date DESC, m.created_at DESC LIMIT 50';

        const [matches] = await db.query(query, params);
        res.json(matches);
    } catch (err) {
        console.error('Matches list error:', err);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

// PUT /api/matches/:id/result - Record match result (fires ELO trigger)
router.put('/:id/result', async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: 'Login required' });

        const { result, score } = req.body;

        // Update match result - triggers trg_update_elo_after_result
        const [updateResult] = await db.query(
            'UPDATE matches SET result = ?, score = ?, status = ? WHERE match_id = ?',
            [result, score || null, 'completed', req.params.id]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Get updated match with new ratings
        const [match] = await db.query(`
      SELECT m.*, 
             u1.name AS player1_name, p1.skill_rating AS player1_rating,
             u2.name AS player2_name, p2.skill_rating AS player2_rating
      FROM matches m
      JOIN users u1 ON m.player1_id = u1.user_id
      JOIN users u2 ON m.player2_id = u2.user_id
      JOIN players p1 ON m.player1_id = p1.player_id
      JOIN players p2 ON m.player2_id = p2.player_id
      WHERE m.match_id = ?
    `, [req.params.id]);

        // Get ELO changes
        const [eloChanges] = await db.query(
            'SELECT * FROM match_history WHERE match_id = ? ORDER BY player_id',
            [req.params.id]
        );

        res.json({
            success: true,
            match: match[0],
            elo_changes: eloChanges,
            message: 'Match result recorded. ELO ratings updated.'
        });
    } catch (err) {
        console.error('Match result error:', err);
        res.status(500).json({ error: 'Failed to update match result' });
    }
});

// GET /api/matches/:id - Get match details
router.get('/:id', async (req, res) => {
    try {
        const [matches] = await db.query(`
      SELECT m.*, u1.name AS player1_name, u2.name AS player2_name,
             p1.skill_rating AS player1_rating, p2.skill_rating AS player2_rating,
             v.name AS venue_name
      FROM matches m
      JOIN users u1 ON m.player1_id = u1.user_id
      JOIN users u2 ON m.player2_id = u2.user_id
      JOIN players p1 ON m.player1_id = p1.player_id
      JOIN players p2 ON m.player2_id = p2.player_id
      LEFT JOIN venues v ON m.venue_id = v.venue_id
      WHERE m.match_id = ?
    `, [req.params.id]);

        if (matches.length === 0) return res.status(404).json({ error: 'Match not found' });

        const [history] = await db.query('SELECT * FROM match_history WHERE match_id = ?', [req.params.id]);

        res.json({ match: matches[0], elo_history: history });
    } catch (err) {
        console.error('Match detail error:', err);
        res.status(500).json({ error: 'Failed to fetch match' });
    }
});

module.exports = router;
