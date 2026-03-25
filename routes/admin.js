const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Venue = require('../models/Venue');
const Match = require('../models/Match');
const Booking = require('../models/Booking');

// Middleware: Admin check
function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// GET /api/admin/stats - Dashboard statistics (replaces multiple COUNT queries)
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        const [totalUsers, totalPlayers, totalVenues, totalMatches, activeBookings, activeMatches] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'player' }),
            Venue.countDocuments(),
            Match.countDocuments(),
            Booking.countDocuments({ status: 'confirmed' }),
            Match.countDocuments({ status: { $in: ['scheduled', 'in_progress'] } })
        ]);

        const revenueAgg = await Booking.aggregate([
            { $match: { status: 'confirmed' } },
            { $group: { _id: null, total: { $sum: '$total_price' } } }
        ]);

        res.json({
            total_users: totalUsers,
            total_players: totalPlayers,
            total_venues: totalVenues,
            total_matches: totalMatches,
            active_bookings: activeBookings,
            total_revenue: revenueAgg.length > 0 ? revenueAgg[0].total : 0,
            active_matches: activeMatches
        });
    } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// GET /api/admin/users - List all users
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password_hash')
            .sort({ created_at: -1 })
            .lean();

        const result = users.map(u => ({
            user_id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            phone: u.phone,
            created_at: u.created_at,
            skill_rating: u.skill_rating,
            wins: u.wins,
            losses: u.losses,
            sport_preference: u.sport_preference,
            location: u.location
        }));

        res.json(result);
    } catch (err) {
        console.error('Admin users error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ error: 'Cannot delete admin' });

        await User.deleteOne({ _id: req.params.id });
        res.json({ success: true, message: 'User deleted' });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// GET /api/admin/matches - All matches for oversight
router.get('/matches', requireAdmin, async (req, res) => {
    try {
        const matches = await Match.find()
            .sort({ match_date: -1 })
            .limit(100)
            .lean();

        const result = matches.map(m => ({
            ...m,
            match_id: m._id
        }));

        res.json(result);
    } catch (err) {
        console.error('Admin matches error:', err);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});

module.exports = router;
