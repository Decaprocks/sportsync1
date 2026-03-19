const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/venues - List all venues
router.get('/', async (req, res) => {
    try {
        const { city, sport } = req.query;
        let query = `
      SELECT v.*, u.name AS owner_name,
        (SELECT COUNT(*) FROM resources r WHERE r.venue_id = v.venue_id) AS total_resources,
        (SELECT COUNT(*) FROM resources r WHERE r.venue_id = v.venue_id AND r.is_available = TRUE) AS available_resources
      FROM venues v
      JOIN users u ON v.owner_id = u.user_id
      WHERE v.is_active = TRUE
    `;
        const params = [];

        if (city) {
            query += ' AND v.city LIKE ?';
            params.push(`%${city}%`);
        }

        if (sport) {
            query += ' AND v.venue_id IN (SELECT venue_id FROM resources WHERE sport_type = ?)';
            params.push(sport);
        }

        query += ' ORDER BY v.rating DESC';
        const [venues] = await db.query(query, params);
        res.json(venues);
    } catch (err) {
        console.error('Venues list error:', err);
        res.status(500).json({ error: 'Failed to fetch venues' });
    }
});

// POST /api/venues - Create venue (venue_manager only)
router.post('/', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'venue_manager') {
            return res.status(403).json({ error: 'Only venue managers can create venues' });
        }
        const { name, location, city, description, contact_phone, opening_time, closing_time } = req.body;
        const [result] = await db.query(
            'INSERT INTO venues (name, location, city, description, owner_id, contact_phone, opening_time, closing_time) VALUES (?,?,?,?,?,?,?,?)',
            [name, location, city, description, req.session.user.user_id, contact_phone, opening_time || '06:00:00', closing_time || '22:00:00']
        );
        res.json({ success: true, venue_id: result.insertId });
    } catch (err) {
        console.error('Create venue error:', err);
        res.status(500).json({ error: 'Failed to create venue' });
    }
});

// GET /api/venues/:id - Get venue details with resources
router.get('/:id', async (req, res) => {
    try {
        const [venues] = await db.query('SELECT v.*, u.name AS owner_name FROM venues v JOIN users u ON v.owner_id = u.user_id WHERE v.venue_id = ?', [req.params.id]);
        if (venues.length === 0) return res.status(404).json({ error: 'Venue not found' });

        const [resources] = await db.query('SELECT * FROM resources WHERE venue_id = ?', [req.params.id]);

        res.json({ venue: venues[0], resources });
    } catch (err) {
        console.error('Venue detail error:', err);
        res.status(500).json({ error: 'Failed to fetch venue' });
    }
});

// GET /api/venues/:id/resources - Get resources for a venue
router.get('/:id/resources', async (req, res) => {
    try {
        const { date } = req.query;
        const [resources] = await db.query('SELECT * FROM resources WHERE venue_id = ? AND is_available = TRUE', [req.params.id]);

        // Attach bookings for the date if provided
        if (date) {
            for (let r of resources) {
                const [bookings] = await db.query(
                    'SELECT booking_id, start_time, end_time, status FROM bookings WHERE resource_id = ? AND booking_date = ? AND status = ?',
                    [r.resource_id, date, 'confirmed']
                );
                r.bookings = bookings;
            }
        }

        res.json(resources);
    } catch (err) {
        console.error('Resources error:', err);
        res.status(500).json({ error: 'Failed to fetch resources' });
    }
});

// GET /api/venues/manager/my - Get venues for logged-in manager
router.get('/manager/my', async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: 'Login required' });

        const [venues] = await db.query(`
      SELECT v.*, 
        (SELECT COUNT(*) FROM resources r WHERE r.venue_id = v.venue_id) AS total_resources,
        (SELECT COUNT(*) FROM bookings b JOIN resources r ON b.resource_id = r.resource_id WHERE r.venue_id = v.venue_id AND b.status = 'confirmed') AS total_bookings,
        (SELECT COALESCE(SUM(b.total_price), 0) FROM bookings b JOIN resources r ON b.resource_id = r.resource_id WHERE r.venue_id = v.venue_id AND b.status = 'confirmed') AS total_revenue
      FROM venues v
      WHERE v.owner_id = ?
    `, [req.session.user.user_id]);

        res.json(venues);
    } catch (err) {
        console.error('Manager venues error:', err);
        res.status(500).json({ error: 'Failed to fetch venues' });
    }
});

module.exports = router;
