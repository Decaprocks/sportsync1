const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware: Admin check
function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// GET /api/admin/stats - Dashboard statistics
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        const [[users]] = await db.query('SELECT COUNT(*) AS total FROM users');
        const [[players]] = await db.query('SELECT COUNT(*) AS total FROM players');
        const [[venues]] = await db.query('SELECT COUNT(*) AS total FROM venues');
        const [[matches]] = await db.query('SELECT COUNT(*) AS total FROM matches');
        const [[bookings]] = await db.query('SELECT COUNT(*) AS total FROM bookings WHERE status = ?', ['confirmed']);
        const [[revenue]] = await db.query('SELECT COALESCE(SUM(total_price), 0) AS total FROM bookings WHERE status = ?', ['confirmed']);
        const [[activeMatches]] = await db.query('SELECT COUNT(*) AS total FROM matches WHERE status IN (?, ?)', ['scheduled', 'in_progress']);

        res.json({
            total_users: users.total,
            total_players: players.total,
            total_venues: venues.total,
            total_matches: matches.total,
            active_bookings: bookings.total,
            total_revenue: revenue.total,
            active_matches: activeMatches.total
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// GET /api/admin/users - List all users
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const [users] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.role, u.phone, u.created_at,
             p.skill_rating, p.wins, p.losses, p.sport_preference, p.location
      FROM users u
      LEFT JOIN players p ON u.user_id = p.player_id
      ORDER BY u.created_at DESC
    `);
        res.json(users);
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', requireAdmin, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM users WHERE user_id = ? AND role != ?', [req.params.id, 'admin']);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found or cannot delete admin' });
        }
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// GET /api/admin/matches - All matches for oversight
router.get('/matches', requireAdmin, async (req, res) => {
    try {
        const [matches] = await db.query(`
      SELECT m.*, u1.name AS player1_name, u2.name AS player2_name, v.name AS venue_name
      FROM matches m
      JOIN users u1 ON m.player1_id = u1.user_id
      JOIN users u2 ON m.player2_id = u2.user_id
      LEFT JOIN venues v ON m.venue_id = v.venue_id
      ORDER BY m.match_date DESC
      LIMIT 100
    `);
        res.json(matches);
    } catch (err) {
        console.error('Admin matches error:', err);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

module.exports = router;
