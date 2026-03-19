const express = require('express');
const router = express.Router();
const db = require('../config/db');

// POST /api/bookings - Book a resource (uses stored procedure with transaction)
router.post('/', async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: 'Login required' });

        const { resource_id, booking_date, start_time, end_time } = req.body;

        // Call the Book_Resource stored procedure (Transaction + Concurrency Control)
        const [result] = await db.query(
            'CALL Book_Resource(?, ?, ?, ?, ?, @booking_id, @status)',
            [resource_id, req.session.user.user_id, booking_date, start_time, end_time]
        );

        const [[output]] = await db.query('SELECT @booking_id AS booking_id, @status AS status');

        if (output.status && output.status.startsWith('ERROR')) {
            return res.status(409).json({ error: output.status });
        }

        res.json({
            success: true,
            booking_id: output.booking_id,
            message: output.status
        });
    } catch (err) {
        console.error('Booking error:', err);
        // Handle trigger error (double booking)
        if (err.sqlMessage && err.sqlMessage.includes('BOOKING ERROR')) {
            return res.status(409).json({ error: err.sqlMessage });
        }
        res.status(500).json({ error: 'Booking failed: ' + (err.sqlMessage || err.message) });
    }
});

// GET /api/bookings/my - Get logged-in user's bookings
router.get('/my', async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: 'Login required' });

        const [bookings] = await db.query(`
      SELECT b.*, r.name AS resource_name, r.sport_type, r.type AS resource_type,
             v.name AS venue_name, v.city, v.location AS venue_location
      FROM bookings b
      JOIN resources r ON b.resource_id = r.resource_id
      JOIN venues v ON r.venue_id = v.venue_id
      WHERE b.player_id = ?
      ORDER BY b.booking_date DESC, b.start_time DESC
    `, [req.session.user.user_id]);

        res.json(bookings);
    } catch (err) {
        console.error('My bookings error:', err);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// DELETE /api/bookings/:id - Cancel a booking
router.delete('/:id', async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: 'Login required' });

        const [result] = await db.query(
            'UPDATE bookings SET status = ? WHERE booking_id = ? AND player_id = ?',
            ['cancelled', req.params.id, req.session.user.user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Booking not found or unauthorized' });
        }

        res.json({ success: true, message: 'Booking cancelled' });
    } catch (err) {
        console.error('Cancel booking error:', err);
        res.status(500).json({ error: 'Failed to cancel booking' });
    }
});

// GET /api/bookings/venue/:venueId - Get bookings for a venue (for managers)
router.get('/venue/:venueId', async (req, res) => {
    try {
        const [bookings] = await db.query(`
      SELECT b.*, r.name AS resource_name, r.sport_type, u.name AS player_name
      FROM bookings b
      JOIN resources r ON b.resource_id = r.resource_id
      JOIN users u ON b.player_id = u.user_id
      WHERE r.venue_id = ?
      ORDER BY b.booking_date DESC, b.start_time DESC
    `, [req.params.venueId]);

        res.json(bookings);
    } catch (err) {
        console.error('Venue bookings error:', err);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

module.exports = router;
