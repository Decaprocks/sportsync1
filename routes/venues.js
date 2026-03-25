const express = require('express');
const router = express.Router();
const Venue = require('../models/Venue');
const User = require('../models/User');
const Booking = require('../models/Booking');

// GET /api/venues - List all venues
router.get('/', async (req, res) => {
    try {
        const { city, sport } = req.query;
        const filter = { is_active: true };

        if (city) {
            filter.city = { $regex: city, $options: 'i' };
        }

        if (sport) {
            filter['resources.sport_type'] = sport;
        }

        const venues = await Venue.find(filter)
            .populate('owner_id', 'name')
            .sort({ rating: -1 })
            .lean();

        // Add computed fields
        const result = venues.map(v => ({
            ...v,
            venue_id: v._id,
            owner_name: v.owner_id ? v.owner_id.name : 'Unknown',
            owner_id: v.owner_id ? v.owner_id._id : null,
            total_resources: v.resources ? v.resources.length : 0,
            available_resources: v.resources ? v.resources.filter(r => r.is_available).length : 0
        }));

        res.json(result);
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

        const venue = await Venue.create({
            name,
            location,
            city,
            description,
            owner_id: req.session.user.user_id,
            contact_phone,
            opening_time: opening_time || '06:00:00',
            closing_time: closing_time || '22:00:00',
            resources: []
        });

        res.json({ success: true, venue_id: venue._id });
    } catch (err) {
        console.error('Create venue error:', err);
        res.status(500).json({ error: 'Failed to create venue' });
    }
});

// POST /api/venues/:id/resources - Add a resource to a venue
router.post('/:id/resources', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'venue_manager') {
            return res.status(403).json({ error: 'Only venue managers can add resources' });
        }

        const { name, type, sport_type, capacity, price_per_hour } = req.body;

        const venue = await Venue.findOneAndUpdate(
            { _id: req.params.id, owner_id: req.session.user.user_id },
            {
                $push: {
                    resources: { name, type, sport_type, capacity: capacity || 2, price_per_hour: price_per_hour || 0 }
                }
            },
            { new: true }
        );

        if (!venue) return res.status(404).json({ error: 'Venue not found or unauthorized' });

        res.json({ success: true, resources: venue.resources });
    } catch (err) {
        console.error('Add resource error:', err);
        res.status(500).json({ error: 'Failed to add resource' });
    }
});

// GET /api/venues/:id - Get venue details with resources
router.get('/:id', async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id)
            .populate('owner_id', 'name')
            .lean();

        if (!venue) return res.status(404).json({ error: 'Venue not found' });

        const venueData = {
            ...venue,
            venue_id: venue._id,
            owner_name: venue.owner_id ? venue.owner_id.name : 'Unknown',
            owner_id: venue.owner_id ? venue.owner_id._id : null
        };

        // Resources are embedded in the venue document
        const resources = venue.resources || [];

        res.json({ venue: venueData, resources });
    } catch (err) {
        console.error('Venue detail error:', err);
        res.status(500).json({ error: 'Failed to fetch venue' });
    }
});

// GET /api/venues/:id/resources - Get resources for a venue
router.get('/:id/resources', async (req, res) => {
    try {
        const { date } = req.query;
        const venue = await Venue.findById(req.params.id).lean();
        if (!venue) return res.status(404).json({ error: 'Venue not found' });

        let resources = (venue.resources || []).filter(r => r.is_available);

        // Attach bookings for the date if provided
        if (date) {
            for (let r of resources) {
                const bookings = await Booking.find({
                    resource_id: r._id,
                    booking_date: date,
                    status: 'confirmed'
                }).select('start_time end_time status').lean();
                r.bookings = bookings;
            }
        }

        // Add resource_id field for compatibility
        resources = resources.map(r => ({
            ...r,
            resource_id: r._id,
            venue_id: venue._id
        }));

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

        const venues = await Venue.find({ owner_id: req.session.user.user_id }).lean();

        // Compute booking stats for each venue
        const result = await Promise.all(venues.map(async (v) => {
            const totalBookings = await Booking.countDocuments({
                venue_id: v._id,
                status: 'confirmed'
            });
            const revenueAgg = await Booking.aggregate([
                { $match: { venue_id: v._id, status: 'confirmed' } },
                { $group: { _id: null, total: { $sum: '$total_price' } } }
            ]);

            return {
                ...v,
                venue_id: v._id,
                total_resources: v.resources ? v.resources.length : 0,
                total_bookings: totalBookings,
                total_revenue: revenueAgg.length > 0 ? revenueAgg[0].total : 0
            };
        }));

        res.json(result);
    } catch (err) {
        console.error('Manager venues error:', err);
        res.status(500).json({ error: 'Failed to fetch venues' });
    }
});

module.exports = router;
