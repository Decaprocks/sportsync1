const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');

// POST /api/bookings - Book a resource (app-level concurrency check replaces stored procedure)
router.post('/', async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: 'Login required' });

        const { resource_id, venue_id, booking_date, start_time, end_time } = req.body;

        // Get the venue and resource details
        const venue = await Venue.findById(venue_id).lean();
        if (!venue) return res.status(404).json({ error: 'Venue not found' });

        const resource = venue.resources.find(r => r._id.toString() === resource_id);
        if (!resource) return res.status(404).json({ error: 'Resource not found' });
        if (!resource.is_available) return res.status(400).json({ error: 'Resource is not available' });

        // ── Concurrency Check (replaces Book_Resource stored procedure) ──
        // Check for overlapping bookings on the same resource & date
        const overlap = await Booking.findOne({
            resource_id: resource._id,
            booking_date: booking_date,
            status: 'confirmed',
            $or: [
                { start_time: { $lt: end_time }, end_time: { $gt: start_time } }
            ]
        });

        if (overlap) {
            return res.status(409).json({
                error: 'BOOKING ERROR: Time slot already booked. Please choose a different time.'
            });
        }

        // Calculate price
        const startParts = start_time.split(':').map(Number);
        const endParts = end_time.split(':').map(Number);
        const hours = (endParts[0] + endParts[1] / 60) - (startParts[0] + startParts[1] / 60);
        const total_price = Math.max(0, hours * resource.price_per_hour);

        // Create booking with denormalized data
        const booking = await Booking.create({
            venue_id: venue._id,
            resource_id: resource._id,
            resource_name: resource.name,
            sport_type: resource.sport_type,
            resource_type: resource.type,
            venue_name: venue.name,
            venue_city: venue.city,
            venue_location: venue.location,
            player_id: req.session.user.user_id,
            player_name: req.session.user.name,
            booking_date,
            start_time,
            end_time,
            total_price,
            status: 'confirmed'
        });

        res.json({
            success: true,
            booking_id: booking._id,
            message: `Booking confirmed for ${resource.name} at ${venue.name}`
        });
    } catch (err) {
        console.error('Booking error:', err);
        res.status(500).json({ error: 'Booking failed: ' + err.message });
    }
});

// GET /api/bookings/my - Get logged-in user's bookings
router.get('/my', async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: 'Login required' });

        const bookings = await Booking.find({ player_id: req.session.user.user_id })
            .sort({ booking_date: -1, start_time: -1 })
            .lean();

        // Map to match expected frontend fields
        const result = bookings.map(b => ({
            ...b,
            booking_id: b._id
        }));

        res.json(result);
    } catch (err) {
        console.error('My bookings error:', err);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// DELETE /api/bookings/:id - Cancel a booking
router.delete('/:id', async (req, res) => {
    try {
        if (!req.session.user) return res.status(401).json({ error: 'Login required' });

        const result = await Booking.findOneAndUpdate(
            { _id: req.params.id, player_id: req.session.user.user_id },
            { status: 'cancelled' },
            { new: true }
        );

        if (!result) {
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
        const bookings = await Booking.find({ venue_id: req.params.venueId })
            .sort({ booking_date: -1, start_time: -1 })
            .lean();

        const result = bookings.map(b => ({
            ...b,
            booking_id: b._id
        }));

        res.json(result);
    } catch (err) {
        console.error('Venue bookings error:', err);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

module.exports = router;
